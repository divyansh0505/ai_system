import { v4 as uuidv4 } from 'uuid';

import { config } from '../../config';
import type {
  OrganizationConfig,
  Session,
  User,
} from '../db/mongo/models/types';
import { PUBLIC_DOMAIN } from '../db/mongo/models/types';
import { OrganizationConfigRepository } from '../db/mongo/repository';
import { SqsProducer } from '../utils/aws/sqs';
import { AxiosUtils } from '../utils/axios';
import { EncryptionService } from '../utils/encryption';
import logger from '../utils/logger';
import type { ServiceError } from './types';
import type {
  HubspotContactProperties,
  HubspotContactResponse,
  HubspotNoteResponse,
  SessionToHubspotData,
} from './types/hubspot.types';
import type { HubspotSyncContact } from '../consumers/types/hubspot_sync.types';

// Email patterns to skip pushing to HubSpot
const HUBSPOT_BLOCKED_EMAIL_PATTERNS = [
  'nodeal',
  'testing',
  'test@',
  'test.',
  'humanisys',
  'interactgen',
];

// List of public domains for HubSpot sync
const PUBLIC_DOMAINS: string[] = Object.values(PUBLIC_DOMAIN);

interface HubspotValidationResult {
  isValid: boolean;
  error?: ServiceError | null;
  accessToken?: string;
}

export interface HubspotPermissionVerificationResult {
  is_valid: boolean;
  missing_scopes: string[];
  present_scopes: string[];
  hub_id?: number;
  hub_domain?: string;
}

interface HubspotAccountInfo {
  portalId: number;
  accountType: string;
  timeZone: string;
  companyCurrency: string;
  additionalCurrencies: string[];
  utcOffset: string;
  utcOffsetMilliseconds: number;
  uiDomain: string;
  dataHostingLocation: string;
}

const REQUIRED_HUBSPOT_SCOPES = [
  'crm.schemas.contacts.read',
  'crm.schemas.contacts.write',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'timeline', // For creating notes/engagements with transcripts
];

// HubSpot Forms API base URL
const HUBSPOT_FORMS_API_URL = 'https://api.hsforms.com';

interface HubspotFormSubmissionResponse {
  inlineMessage?: string;
  redirectUri?: string;
  errors?: Array<{ message: string; errorType: string }>;
}

interface HubspotPropertyDefinition {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  groupName: string;
}

const CUSTOM_PROPERTIES: HubspotPropertyDefinition[] = [
  {
    name: 'utm_campaign',
    label: 'UTM Campaign',
    type: 'string',
    fieldType: 'text',
    groupName: 'contactinformation',
  },
  {
    name: 'utm_source',
    label: 'UTM Source',
    type: 'string',
    fieldType: 'text',
    groupName: 'contactinformation',
  },
  {
    name: 'utm_medium',
    label: 'UTM Medium',
    type: 'string',
    fieldType: 'text',
    groupName: 'contactinformation',
  },
  {
    name: 'utm_term',
    label: 'UTM Term',
    type: 'string',
    fieldType: 'text',
    groupName: 'contactinformation',
  },
  {
    name: 'ip_address',
    label: 'IP Address',
    type: 'string',
    fieldType: 'text',
    groupName: 'contactinformation',
  },
];

export class HubspotService {
  /**
   * Check if an email should be blocked from HubSpot sync.
   * Blocks public/free email domains and testing email patterns.
   */
  static shouldBlockEmail(email: string): {
    blocked: boolean;
    reason?: string;
  } {
    if (!email) {
      return { blocked: true, reason: 'no_email' };
    }

    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];

    // Check for public domains (Gmail, Yahoo, etc.)
    if (domain && PUBLIC_DOMAINS.includes(domain)) {
      return { blocked: true, reason: 'public_domain' };
    }

    // Check for testing/nodeal patterns
    for (const pattern of HUBSPOT_BLOCKED_EMAIL_PATTERNS) {
      if (emailLower.includes(pattern)) {
        return { blocked: true, reason: 'blocked_pattern' };
      }
    }

    return { blocked: false };
  }

  /**
   * Submit a form to HubSpot Forms API.
   * This tracks the submission as a form conversion in HubSpot analytics.
   */
  static async submitForm(
    portalId: string,
    formId: string,
    contactProperties: HubspotContactProperties,
    hubspotutk?: string,
    pageUri?: string,
  ): Promise<HubspotFormSubmissionResponse | ServiceError> {
    const formFields = Object.entries(contactProperties)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => ({ name, value: String(value) }));

    const submissionData: Record<string, unknown> = {
      fields: formFields,
      context: {
        pageUri: pageUri || '',
        pageName: 'Session Form Submission',
      },
    };

    // Include hutk if available for visitor tracking
    if (hubspotutk) {
      (submissionData.context as Record<string, unknown>).hutk = hubspotutk;
    }

    logger.info('HUBSPOT_FORM_SUBMISSION_STARTING', {
      portal_id: portalId,
      form_id: formId,
      email: contactProperties.email,
      has_hutk: !!hubspotutk,
    });

    const result =
      await AxiosUtils.makeCallToApi<HubspotFormSubmissionResponse>(
        `${HUBSPOT_FORMS_API_URL}/submissions/v3/integration/submit/${portalId}/${formId}`,
        'POST',
        { 'Content-Type': 'application/json' },
        submissionData,
      );

    if (typeof result === 'object' && result !== null && 'code' in result) {
      logger.error('HUBSPOT_FORM_SUBMISSION_FAILED', {
        portal_id: portalId,
        form_id: formId,
        email: contactProperties.email,
        error_code: (result as ServiceError).code,
        error_message: (result as ServiceError).message,
      });
      return result as ServiceError;
    }

    logger.info('HUBSPOT_FORM_SUBMISSION_SUCCESS', {
      portal_id: portalId,
      form_id: formId,
      email: contactProperties.email,
    });

    return result;
  }

  /**
   * Get portal ID from access token by verifying it.
   * Returns the portal ID or null if verification fails.
   */
  static async getPortalId(accessToken: string): Promise<string | null> {
    const result = await this.verifyAccessTokenPermissions(accessToken);

    if (typeof result === 'object' && 'code' in result) {
      return null;
    }

    return result.hub_id?.toString() || null;
  }

  /**
   * Verifies a HubSpot Private App token by fetching account info.
   */
  static async verifyAccessTokenPermissions(
    accessToken: string,
  ): Promise<HubspotPermissionVerificationResult | ServiceError> {
    logger.info('HUBSPOT_VERIFYING_ACCESS_TOKEN_PERMISSIONS');

    const accountInfo = await AxiosUtils.makeCallToApi<HubspotAccountInfo>(
      `${config.hubspot.apiUrl}/account-info/v3/details`,
      'GET',
      this.getAuthHeaders(accessToken),
    );

    if (typeof accountInfo === 'object' && 'code' in accountInfo) {
      logger.error('HUBSPOT_ACCESS_TOKEN_VERIFICATION_FAILED', {
        error_code: accountInfo.code,
        error_message: accountInfo.message,
      });
      return accountInfo;
    }

    logger.info('HUBSPOT_ACCESS_TOKEN_VERIFICATION_COMPLETE', {
      hub_id: accountInfo.portalId,
      hub_domain: accountInfo.uiDomain,
    });

    return {
      is_valid: true,
      missing_scopes: [],
      present_scopes: REQUIRED_HUBSPOT_SCOPES,
      hub_id: accountInfo.portalId,
      hub_domain: accountInfo.uiDomain,
    };
  }

  static async ensureCustomPropertiesExist(
    accessToken: string,
  ): Promise<ServiceError | null> {
    const existingProperties = await this.getExistingProperties(accessToken);

    if (
      typeof existingProperties === 'object' &&
      existingProperties !== null &&
      'code' in existingProperties
    ) {
      return existingProperties;
    }

    const existingPropertyNames = new Set(
      existingProperties.map((property) => property.name),
    );

    const missingProperties = CUSTOM_PROPERTIES.filter(
      (property) => !existingPropertyNames.has(property.name),
    );

    if (missingProperties.length === 0) {
      logger.debug('HUBSPOT_ALL_CUSTOM_PROPERTIES_EXIST');
      return null;
    }

    logger.info('HUBSPOT_CREATING_MISSING_PROPERTIES', {
      missing_count: missingProperties.length,
      missing_properties: missingProperties.map((p) => p.name),
    });

    for (const property of missingProperties) {
      const createResult = await this.createProperty(accessToken, property);

      if (
        typeof createResult === 'object' &&
        createResult !== null &&
        'code' in createResult
      ) {
        logger.error('HUBSPOT_PROPERTY_CREATION_FAILED', {
          property_name: property.name,
          error_code: createResult.code,
          error_message: createResult.message,
        });
        return createResult;
      }

      logger.info('HUBSPOT_PROPERTY_CREATED', { property_name: property.name });
    }

    return null;
  }

  private static async getExistingProperties(
    accessToken: string,
  ): Promise<{ name: string }[] | ServiceError> {
    const result = await AxiosUtils.makeCallToApi<{
      results: { name: string }[];
    }>(
      `${config.hubspot.apiUrl}/crm/v3/properties/contacts`,
      'GET',
      this.getAuthHeaders(accessToken),
    );

    if (typeof result === 'object' && result !== null && 'code' in result) {
      logger.error('HUBSPOT_GET_PROPERTIES_FAILED', {
        error_code: result.code,
        error_message: result.message,
      });
      return result;
    }

    return result.results;
  }

  private static async createProperty(
    accessToken: string,
    property: HubspotPropertyDefinition,
  ): Promise<{ name: string } | ServiceError> {
    return AxiosUtils.makeCallToApi<{ name: string }>(
      `${config.hubspot.apiUrl}/crm/v3/properties/contacts`,
      'POST',
      this.getAuthHeaders(accessToken),
      property,
    );
  }

  static async createOrUpdateContact(
    accessToken: string,
    contactProperties: HubspotContactProperties,
  ): Promise<HubspotContactResponse | ServiceError> {
    const contactEmail = contactProperties.email;

    const existingContact = await this.searchContactByEmail(
      accessToken,
      contactEmail,
    );

    if (
      typeof existingContact === 'object' &&
      existingContact !== null &&
      'code' in existingContact
    ) {
      return existingContact;
    }

    if (existingContact) {
      logger.info('HUBSPOT_CONTACT_EXISTS_UPDATING', {
        contact_email: contactEmail,
        contact_id: existingContact.id,
      });
      return this.updateContact(
        accessToken,
        existingContact.id,
        contactEmail,
        contactProperties,
      );
    }

    logger.info('HUBSPOT_CONTACT_NOT_FOUND_CREATING', {
      contact_email: contactEmail,
    });
    return this.createContact(accessToken, contactProperties);
  }

  static buildContactPropertiesFromSession(
    sessionData: SessionToHubspotData,
  ): HubspotContactProperties {
    const contactProperties: HubspotContactProperties = {
      email: sessionData.email,
    };

    if (sessionData.firstname)
      contactProperties.firstname = sessionData.firstname;
    if (sessionData.lastname) contactProperties.lastname = sessionData.lastname;
    if (sessionData.company) contactProperties.company = sessionData.company;
    if (sessionData.phone) contactProperties.phone = sessionData.phone;
    if (sessionData.website) contactProperties.website = sessionData.website;
    if (sessionData.jobtitle) contactProperties.jobtitle = sessionData.jobtitle;
    if (sessionData.city) contactProperties.city = sessionData.city;
    if (sessionData.country) contactProperties.country = sessionData.country;
    if (sessionData.ip_address)
      contactProperties.ip_address = sessionData.ip_address;
    if (sessionData.utm_campaign)
      contactProperties.utm_campaign = sessionData.utm_campaign;
    if (sessionData.utm_source)
      contactProperties.utm_source = sessionData.utm_source;
    if (sessionData.utm_medium)
      contactProperties.utm_medium = sessionData.utm_medium;
    if (sessionData.utm_term) contactProperties.utm_term = sessionData.utm_term;

    logger.debug('HUBSPOT_CONTACT_PROPERTIES_BUILT', {
      contact_email: sessionData.email,
      properties_count: Object.keys(contactProperties).length,
    });

    return contactProperties;
  }

  static extractDataFromSession(
    session: Session,
    user: User | null,
  ): SessionToHubspotData | null {
    const userEmail = user?.email;

    if (!userEmail) {
      logger.debug('HUBSPOT_SESSION_MISSING_EMAIL', {
        session_id: session._id.toString(),
        has_user: !!user,
      });
      return null;
    }

    logger.debug('HUBSPOT_SESSION_DATA_EXTRACTED', {
      session_id: session._id.toString(),
      user_email: userEmail,
      has_transcript_summary: !!session.transcript_summary,
      has_intent: !!session.intent,
    });

    return {
      email: userEmail,
      firstname: user?.first_name,
      lastname: user?.last_name,
      company: user?.company_name,
      phone: user?.phone_number,
      website: user?.company_website,
      jobtitle: user?.designation,
      city: session.visitor_city ?? undefined,
      country: session.visitor_country ?? undefined,
      ip_address: session.visitor_ip ?? undefined,
      utm_campaign: session.visitor_utm_campaign ?? undefined,
      utm_source: session.visitor_utm_source ?? undefined,
      utm_medium: session.visitor_utm_medium ?? undefined,
      utm_term: session.visitor_utm_term ?? undefined,
      transcript_summary: session.transcript_summary ?? undefined,
      is_icp: session.is_icp ?? undefined,
      intent: session.intent ?? undefined,
    };
  }

  static async pushSessionToHubspot(
    organizationId: string,
    session: Session,
    user: User | null,
    accessToken?: string,
  ): Promise<HubspotContactResponse | ServiceError | null> {
    const sessionId = session._id.toString();

    logger.info('HUBSPOT_SESSION_SYNC_INITIATED', {
      session_id: sessionId,
      organization_id: organizationId,
      has_user: !!user,
    });

    let decryptedAccessToken: string;

    // Use provided token or fetch from config
    if (accessToken) {
      decryptedAccessToken = accessToken;
    } else {
      const organizationConfig = await OrganizationConfigRepository.get({
        organization_id: organizationId,
      });

      const configValidation = HubspotValidator.validateOrganizationConfig(
        organizationConfig,
        organizationId,
        sessionId,
      );

      if (!configValidation.isValid) {
        return configValidation.error ?? null;
      }

      try {
        decryptedAccessToken = EncryptionService.decrypt(
          configValidation.accessToken!,
        );
      } catch (decryptionError) {
        logger.error('HUBSPOT_ACCESS_TOKEN_DECRYPTION_FAILED', {
          organization_id: organizationId,
          session_id: sessionId,
          error_message: (decryptionError as Error).message,
        });
        return {
          code: 500,
          message: 'Failed to decrypt HubSpot access token',
        };
      }
    }

    const sessionData = this.extractDataFromSession(session, user);

    const sessionValidation = HubspotValidator.validateSessionData(
      sessionData?.email,
      sessionId,
      organizationId,
    );

    if (!sessionValidation.isValid) {
      return sessionValidation.error ?? null;
    }

    const contactProperties = this.buildContactPropertiesFromSession(
      sessionData!,
    );

    const syncResult = await this.createOrUpdateContact(
      decryptedAccessToken,
      contactProperties,
    );

    if (
      typeof syncResult === 'object' &&
      syncResult !== null &&
      'code' in syncResult
    ) {
      logger.error('HUBSPOT_SESSION_SYNC_FAILED', {
        session_id: sessionId,
        organization_id: organizationId,
        contact_email: sessionData!.email,
        error_code: syncResult.code,
        error_message: syncResult.message,
      });
      return syncResult;
    }

    logger.info('HUBSPOT_SESSION_SYNC_COMPLETED', {
      session_id: sessionId,
      organization_id: organizationId,
      contact_email: sessionData!.email,
      contact_id: syncResult.id,
    });

    return syncResult;
  }

  private static getAuthHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  static async searchContactByEmail(
    accessToken: string,
    contactEmail: string,
  ): Promise<HubspotContactResponse | null | ServiceError> {
    const searchResult = await AxiosUtils.makeCallToApi<{
      results: HubspotContactResponse[];
    }>(
      `${config.hubspot.apiUrl}/crm/v3/objects/contacts/search`,
      'POST',
      this.getAuthHeaders(accessToken),
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: contactEmail,
              },
            ],
          },
        ],
      },
    );

    if (
      typeof searchResult === 'object' &&
      searchResult !== null &&
      'code' in searchResult
    ) {
      logger.error('HUBSPOT_CONTACT_SEARCH_FAILED', {
        contact_email: contactEmail,
        error_code: searchResult.code,
        error_message: searchResult.message,
      });
      return searchResult as ServiceError;
    }

    const results = searchResult as { results: HubspotContactResponse[] };

    if (results.results.length === 0) {
      return null;
    }

    return results.results[0];
  }

  /**
   * Batch search for multiple emails in a single API call.
   * Returns a Set of emails that already exist in Hubspot.
   */
  static async batchSearchContactsByEmails(
    accessToken: string,
    emails: string[],
  ): Promise<Set<string> | ServiceError> {
    // Filter out null, undefined, and empty emails
    const validEmails = emails.filter(
      (email): email is string =>
        typeof email === 'string' && email.trim().length > 0,
    );

    const invalidCount = emails.length - validEmails.length;
    if (invalidCount > 0) {
      logger.warn('HUBSPOT_BATCH_SEARCH_FILTERED_INVALID_EMAILS', {
        total_emails: emails.length,
        valid_emails: validEmails.length,
        invalid_emails: invalidCount,
      });
    }

    if (validEmails.length === 0) {
      return new Set();
    }

    // Hubspot allows up to 5 filter groups per search
    const MAX_FILTER_GROUPS = 5;
    const existingEmails = new Set<string>();

    for (let i = 0; i < validEmails.length; i += MAX_FILTER_GROUPS) {
      const batch = validEmails.slice(i, i + MAX_FILTER_GROUPS);

      const filterGroups = batch.map((email) => ({
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          },
        ],
      }));

      const searchResult = await AxiosUtils.makeCallToApi<{
        results: HubspotContactResponse[];
      }>(
        `${config.hubspot.apiUrl}/crm/v3/objects/contacts/search`,
        'POST',
        this.getAuthHeaders(accessToken),
        {
          filterGroups,
          properties: ['email'],
          limit: MAX_FILTER_GROUPS,
        },
      );

      if (
        typeof searchResult === 'object' &&
        searchResult !== null &&
        'code' in searchResult
      ) {
        logger.error('HUBSPOT_BATCH_CONTACT_SEARCH_FAILED', {
          batch_size: batch.length,
          error_code: searchResult.code,
          error_message: searchResult.message,
        });
        return searchResult as ServiceError;
      }

      const results = searchResult as { results: HubspotContactResponse[] };

      for (const contact of results.results) {
        if (contact.properties?.email) {
          existingEmails.add(contact.properties.email.toLowerCase());
        }
      }

      // Add delay between batches to avoid rate limiting (HubSpot has secondly limits)
      const hasMoreBatches = i + MAX_FILTER_GROUPS < validEmails.length;
      if (hasMoreBatches) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    logger.info('HUBSPOT_BATCH_SEARCH_COMPLETED', {
      searched_emails: validEmails.length,
      existing_contacts: existingEmails.size,
    });

    return existingEmails;
  }

  private static async createContact(
    accessToken: string,
    contactProperties: HubspotContactProperties,
  ): Promise<HubspotContactResponse | ServiceError> {
    const createResult = await AxiosUtils.makeCallToApi<HubspotContactResponse>(
      `${config.hubspot.apiUrl}/crm/v3/objects/contacts`,
      'POST',
      this.getAuthHeaders(accessToken),
      { properties: contactProperties },
    );

    if (
      typeof createResult === 'object' &&
      createResult !== null &&
      'code' in createResult
    ) {
      logger.error('HUBSPOT_CONTACT_CREATION_FAILED', {
        contact_email: contactProperties.email,
        error_code: createResult.code,
        error_message: createResult.message,
      });
      return createResult;
    }

    logger.info('HUBSPOT_CONTACT_CREATED_SUCCESSFULLY', {
      contact_id: createResult.id,
      contact_email: contactProperties.email,
    });

    return createResult;
  }

  private static async updateContact(
    accessToken: string,
    contactId: string,
    contactEmail: string,
    contactProperties: HubspotContactProperties,
  ): Promise<HubspotContactResponse | ServiceError> {
    const updateResult = await AxiosUtils.makeCallToApi<HubspotContactResponse>(
      `${config.hubspot.apiUrl}/crm/v3/objects/contacts/${contactId}`,
      'PATCH',
      this.getAuthHeaders(accessToken),
      { properties: contactProperties },
    );

    if (
      typeof updateResult === 'object' &&
      updateResult !== null &&
      'code' in updateResult
    ) {
      logger.error('HUBSPOT_CONTACT_UPDATE_FAILED', {
        contact_email: contactEmail,
        contact_id: contactId,
        error_code: updateResult.code,
        error_message: updateResult.message,
      });
      return updateResult;
    }

    logger.info('HUBSPOT_CONTACT_UPDATED_SUCCESSFULLY', {
      contact_id: contactId,
      contact_email: contactEmail,
    });

    return updateResult;
  }

  /**
   * Create a note and associate it with a contact using the Engagements API.
   * Used to store conversation transcripts on contact records.
   * Requires 'timeline' scope.
   */
  static async createNote(
    accessToken: string,
    contactId: string,
    noteBody: string,
    timestamp?: string,
  ): Promise<HubspotNoteResponse | ServiceError> {
    const timestampMs = timestamp ? new Date(timestamp).getTime() : Date.now();

    const engagementRequest = {
      engagement: {
        active: true,
        type: 'NOTE',
        timestamp: timestampMs,
      },
      associations: {
        contactIds: [parseInt(contactId, 10)],
        companyIds: [],
        dealIds: [],
        ownerIds: [],
      },
      metadata: {
        body: noteBody,
      },
    };

    logger.info('HUBSPOT_NOTE_CREATING', {
      contact_id: contactId,
      note_length: noteBody.length,
    });

    const result = await AxiosUtils.makeCallToApi<{
      engagement: { id: number };
    }>(
      `${config.hubspot.apiUrl}/engagements/v1/engagements`,
      'POST',
      this.getAuthHeaders(accessToken),
      engagementRequest,
    );

    if (typeof result === 'object' && result !== null && 'code' in result) {
      logger.error('HUBSPOT_NOTE_CREATION_FAILED', {
        contact_id: contactId,
        error_code: (result as ServiceError).code,
        error_message: (result as ServiceError).message,
      });
      return result as ServiceError;
    }

    logger.info('HUBSPOT_NOTE_CREATED_SUCCESSFULLY', {
      contact_id: contactId,
      note_id: result.engagement.id,
    });

    // Map to expected response format
    return {
      id: result.engagement.id.toString(),
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: timestamp,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    };
  }

  /**
   * Queue contacts for async processing via SQS.
   * Each contact is queued as a separate message for simple one-by-one processing.
   * Consumer decrypts access token from the message.
   */
  static async queueContactsForSync(
    organizationId: string,
    contacts: HubspotSyncContact[],
    encryptedAccessToken: string,
  ): Promise<boolean> {
    if (contacts.length === 0) {
      logger.debug('HUBSPOT_QUEUE_SYNC_NO_CONTACTS', {
        organization_id: organizationId,
      });
      return true;
    }

    logger.info('HUBSPOT_QUEUE_SYNC_STARTING', {
      organization_id: organizationId,
      contacts_count: contacts.length,
    });

    let successCount = 0;
    let failCount = 0;

    // Queue each contact as a separate message
    for (const contact of contacts) {
      const messageId = uuidv4();

      const success = await SqsProducer.send(
        config.aws.sqs.hubspotSyncQueueUrl,
        {
          id: messageId,
          message: {
            data: {
              organizationId,
              contact,
              encryptedAccessToken,
            },
          },
        },
      );

      if (success) {
        successCount++;
      } else {
        failCount++;
        logger.error('HUBSPOT_SYNC_QUEUE_FAILED', {
          organization_id: organizationId,
          email: contact.email,
        });
      }
    }

    logger.info('HUBSPOT_QUEUE_SYNC_COMPLETED', {
      organization_id: organizationId,
      queued: successCount,
      failed: failCount,
    });

    return failCount === 0;
  }

  /**
   * Format session transcript into a plain text note body for HubSpot.
   * Returns null if no transcript available.
   */
  static formatTranscriptAsNote(session: Session): string | null {
    if (!session.transcript || session.transcript.length === 0) {
      return null;
    }

    const lines: string[] = [];

    const istDate = session.created_at.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    lines.push('Session Transcript');
    lines.push(`Date: ${istDate} IST`);

    if (session.duration) {
      const minutes = Math.floor(session.duration / 60);
      const seconds = session.duration % 60;
      lines.push(`Duration: ${minutes}m ${seconds}s`);
    }

    if (session.transcript_summary) {
      lines.push(`Summary: ${session.transcript_summary}`);
    }

    if (session.is_icp !== undefined) {
      lines.push(`ICP: ${session.is_icp}`);
    }

    if (session.intent) {
      lines.push(`Intent: ${session.intent}`);
    }

    lines.push('');
    lines.push('Conversation:');

    for (const entry of session.transcript) {
      const speaker = entry.message_by === 'BOT' ? 'Bot' : 'User';
      lines.push(`${speaker}: ${entry.message}`);
    }

    return lines.join('\n');
  }

  /**
   * Queue a single session for async HubSpot sync.
   * Extracts contact data and sends to queue.
   */
  static async queueSessionForSync(
    organizationId: string,
    session: Session,
    user: User | null,
    encryptedAccessToken: string,
    hubspotFormId?: string,
  ): Promise<boolean> {
    const sessionData = this.extractDataFromSession(session, user);

    if (!sessionData?.email) {
      logger.debug('HUBSPOT_QUEUE_SESSION_NO_EMAIL', {
        session_id: session._id.toString(),
        organization_id: organizationId,
      });
      return true; // Not an error, just skip
    }

    // Check if email should be blocked before queuing
    const emailCheck = this.shouldBlockEmail(sessionData.email);
    if (emailCheck.blocked) {
      logger.info('HUBSPOT_QUEUE_SESSION_EMAIL_BLOCKED', {
        session_id: session._id.toString(),
        organization_id: organizationId,
        email: sessionData.email,
        reason: emailCheck.reason,
      });
      return true; // Not an error, just skip
    }

    const contactProperties =
      this.buildContactPropertiesFromSession(sessionData);
    const noteBody = this.formatTranscriptAsNote(session);
    const messageId = uuidv4();

    const success = await SqsProducer.send(config.aws.sqs.hubspotSyncQueueUrl, {
      id: messageId,
      message: {
        data: {
          organizationId,
          contact: {
            email: sessionData.email,
            properties: contactProperties,
          },
          encryptedAccessToken,
          // Form submission fields
          hubspotFormId: hubspotFormId || undefined,
          hubspotutk: session.hubspotutk || undefined,
          pageUri: session.visitor_current_url || undefined,
          // Note fields for transcript
          noteBody: noteBody || undefined,
          noteTimestamp: session.created_at.toISOString(),
        },
      },
    });

    if (success) {
      logger.info('HUBSPOT_SESSION_SYNC_QUEUED', {
        organization_id: organizationId,
        session_id: session._id.toString(),
        email: sessionData.email,
        has_form_id: !!hubspotFormId,
        has_note: !!noteBody,
      });
    }

    return success;
  }
}

class HubspotValidator {
  static validateOrganizationConfig(
    organizationConfig: OrganizationConfig | null,
    organizationId: string,
    sessionId: string,
  ): HubspotValidationResult {
    if (!organizationConfig?.hubspot?.hubspot_access_token) {
      logger.debug('HUBSPOT_ACCESS_TOKEN_MISSING', {
        organization_id: organizationId,
        session_id: sessionId,
      });
      return {
        isValid: false,
        error: null,
      };
    }

    return {
      isValid: true,
      accessToken: organizationConfig.hubspot.hubspot_access_token,
    };
  }

  static validateSessionData(
    userEmail: string | undefined,
    sessionId: string,
    organizationId: string,
  ): HubspotValidationResult {
    if (!userEmail) {
      logger.warn('HUBSPOT_SESSION_SYNC_SKIPPED_NO_EMAIL', {
        session_id: sessionId,
        organization_id: organizationId,
      });
      return {
        isValid: false,
        error: null,
      };
    }

    return {
      isValid: true,
    };
  }
}
