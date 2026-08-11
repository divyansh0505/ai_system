import { Types } from 'mongoose';

import {
  OrganizationRepository,
  OrganizationConfigRepository,
  OrganizationPagesRepository,
  OrganizationAvatarRepository,
  OrganizationVoiceRepository,
  AvatarRepository,
  VoiceRepository,
  SessionRepository,
  UserRepository,
} from '../db/mongo/repository';
import type {
  Organization,
  OrganizationConfig,
  OrganizationPages,
  Avatar,
  Voice,
} from '../db/mongo/models/types';
import { EncryptionService } from '../utils/encryption';
import {
  HubspotService,
  type HubspotPermissionVerificationResult,
} from './hubspot.service';
import type { HubspotTokenStatusResponse } from './types/hubspot.types';
import logger from '../utils/logger';
import type { ServiceError } from './types';

export interface GetOrganizationResponse {
  organization: Organization;
  config: OrganizationConfig | null;
  pages: OrganizationPages[];
  avatars: Avatar[];
  voices: Voice[];
}

export interface UpdateHubspotTokenResponse {
  success: boolean;
  sessions_pushed?: number;
}

export class OrganizationService {
  static async getFullOrganization(
    organization_id: string,
  ): Promise<GetOrganizationResponse | ServiceError> {
    logger.info('GET_FULL_ORGANIZATION', { organization_id });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    const [
      organizationConfig,
      organizationPages,
      organizationAvatarRelationships,
      organizationVoiceRelationships,
    ] = await Promise.all([
      OrganizationConfigRepository.get({
        _id: organization.organization_config_id,
      }),
      OrganizationPagesRepository.getMany({}),
      OrganizationAvatarRepository.getMany({
        organization_id: organization_id,
        is_active: true,
      }),
      OrganizationVoiceRepository.getMany({
        organization_id: organization_id,
        is_active: true,
      }),
    ]);

    const allowedAvatarIds = organizationAvatarRelationships.map(
      (organizationAvatarRelationship) =>
        (organizationAvatarRelationship.avatar_id as Types.ObjectId).toString(),
    );
    const allowedVoiceIds = organizationVoiceRelationships.map(
      (organizationVoiceRelationship) =>
        (organizationVoiceRelationship.voice_id as Types.ObjectId).toString(),
    );

    const [organizationAvatars, organizationVoices] = await Promise.all([
      allowedAvatarIds.length > 0
        ? AvatarRepository.getMany({
            _id: { $in: allowedAvatarIds },
            is_active: true,
          })
        : Promise.resolve([]),
      allowedVoiceIds.length > 0
        ? VoiceRepository.getMany({
            _id: { $in: allowedVoiceIds },
            is_active: true,
          })
        : Promise.resolve([]),
    ]);

    logger.info('GET_FULL_ORGANIZATION_SUCCESS', {
      organization_id,
      avatarsCount: organizationAvatars.length,
      voicesCount: organizationVoices.length,
      pagesCount: organizationPages.length,
    });

    return {
      organization,
      config: organizationConfig,
      pages: organizationPages,
      avatars: organizationAvatars,
      voices: organizationVoices,
    };
  }

  static async updateHubspotAccessToken(
    organization_id: string,
    hubspot_access_token?: string | null,
    hubspot_form_id?: string | null,
  ): Promise<UpdateHubspotTokenResponse | ServiceError> {
    // Remove entire hubspot config if token is explicitly null
    if (hubspot_access_token === null) {
      logger.info('REMOVE_HUBSPOT_ACCESS_TOKEN', { organization_id });

      const updated_config = await OrganizationConfigRepository.update(
        { organization_id },
        {
          $unset: { hubspot: 1 },
        } as Parameters<typeof OrganizationConfigRepository.update>[1],
      );

      if (!updated_config) {
        logger.error('REMOVE_HUBSPOT_ACCESS_TOKEN_FAILED', {
          organization_id,
          error: 'Organization config not found',
        });
        return { code: 404, message: 'Organization config not found' };
      }

      logger.info('HUBSPOT_ACCESS_TOKEN_REMOVED', { organization_id });
      return { success: true };
    }

    // If only form_id is provided (no token), just update form_id
    if (hubspot_access_token === undefined && hubspot_form_id !== undefined) {
      logger.info('UPDATE_HUBSPOT_FORM_ID', { organization_id });

      const organizationConfig = await OrganizationConfigRepository.get({
        organization_id,
      });

      if (!organizationConfig?.hubspot?.hubspot_access_token) {
        return { code: 400, message: 'HubSpot access token not configured. Please add access token first.' };
      }

      const updated_config = await OrganizationConfigRepository.update(
        { organization_id },
        { 'hubspot.hubspot_form_id': hubspot_form_id || undefined } as Parameters<typeof OrganizationConfigRepository.update>[1],
      );

      if (!updated_config) {
        return { code: 404, message: 'Organization config not found' };
      }

      logger.info('HUBSPOT_FORM_ID_UPDATED', { organization_id, form_id: hubspot_form_id });
      return { success: true };
    }

    // Add/update token (and optionally form_id)
    if (!hubspot_access_token) {
      return { code: 400, message: 'hubspot_access_token is required' };
    }

    logger.info('UPDATE_HUBSPOT_ACCESS_TOKEN', { organization_id });

    // Verify token
    const verificationResult =
      await HubspotService.verifyAccessTokenPermissions(hubspot_access_token);

    if (typeof verificationResult === 'object' && 'code' in verificationResult) {
      logger.error('UPDATE_HUBSPOT_ACCESS_TOKEN_VERIFICATION_FAILED', {
        organization_id,
        error: verificationResult.message,
      });
      return verificationResult;
    }

    const encrypted_token = EncryptionService.encrypt(hubspot_access_token);

    const updated_config = await OrganizationConfigRepository.update(
      { organization_id },
      {
        hubspot: {
          hubspot_access_token: encrypted_token,
          hubspot_form_id: hubspot_form_id || undefined,
          created_at: new Date(),
        },
      },
    );

    if (!updated_config) {
      logger.error('UPDATE_HUBSPOT_ACCESS_TOKEN_FAILED', {
        organization_id,
        error: 'Organization config not found',
      });
      return { code: 404, message: 'Organization config not found' };
    }

    logger.info('HUBSPOT_ACCESS_TOKEN_UPDATED', { organization_id });

    // Ensure custom properties exist in HubSpot before pushing contacts
    const propertiesError = await HubspotService.ensureCustomPropertiesExist(
      hubspot_access_token,
    );

    if (propertiesError) {
      logger.error('HUBSPOT_CUSTOM_PROPERTIES_CREATION_FAILED', {
        organization_id,
        error_code: propertiesError.code,
        error_message: propertiesError.message,
      });
      // Continue anyway - some properties may already exist
    }

    // Push all previous sessions to Hubspot
    const sessions_pushed = await this.pushPreviousSessionsToHubspot(
      organization_id,
      hubspot_access_token,
      encrypted_token,
    );

    return { success: true, sessions_pushed };
  }

  private static async pushPreviousSessionsToHubspot(
    organization_id: string,
    hubspot_access_token: string,
    encrypted_access_token: string,
  ): Promise<number> {
    logger.info('PUSHING_PREVIOUS_SESSIONS_TO_HUBSPOT', { organization_id });

    // Simple approach: Get all sessions with users for this organization
    const sessions = await SessionRepository.getMany(
      {
        organization_id: new Types.ObjectId(organization_id),
        user_id: { $ne: null },
      },
      { sortField: 'created_at', sortOrder: -1 },
    );

    logger.info('HUBSPOT_PUSH_STEP_1_SESSIONS', {
      organization_id,
      sessions_count: sessions.length,
    });

    if (sessions.length === 0) {
      logger.info('NO_SESSIONS_TO_PUSH', { organization_id });
      return 0;
    }

    // Get unique user IDs from sessions
    const userIds = [
      ...new Set(sessions.map((s) => s.user_id!.toString())),
    ].map((id) => new Types.ObjectId(id));

    // Fetch users with emails (using $type: 'string' to exclude null values)
    const users = await UserRepository.getMany({
      _id: { $in: userIds },
      email: { $type: 'string', $ne: '' },
    });

    logger.info('HUBSPOT_PUSH_STEP_2_USERS_WITH_EMAILS', {
      organization_id,
      users_count: users.length,
      sample_emails: users.slice(0, 3).map((u) => u.email),
    });

    if (users.length === 0) {
      logger.info('NO_USERS_WITH_EMAILS', { organization_id });
      return 0;
    }

    // Check which emails already exist in HubSpot (with rate limiting built-in)
    const allEmails = users.map((u) => u.email!).filter(Boolean);
    const existingEmailsResult =
      await HubspotService.batchSearchContactsByEmails(
        hubspot_access_token,
        allEmails,
      );

    if (
      typeof existingEmailsResult === 'object' &&
      'code' in existingEmailsResult
    ) {
      logger.error('HUBSPOT_BATCH_SEARCH_FAILED', {
        organization_id,
        error: existingEmailsResult.message,
      });
      return 0;
    }

    const existingEmails = existingEmailsResult;

    logger.info('HUBSPOT_PUSH_STEP_3_EXISTING_IN_HUBSPOT', {
      organization_id,
      existing_count: existingEmails.size,
    });

    // Filter to only new users (not in HubSpot)
    const newUsers = users.filter(
      (u) => u.email && !existingEmails.has(u.email.toLowerCase()),
    );

    if (newUsers.length === 0) {
      logger.info('ALL_USERS_ALREADY_IN_HUBSPOT', { organization_id });
      return 0;
    }

    // Build user map for quick lookup
    const userMap = new Map(newUsers.map((u) => [u._id.toString(), u]));

    // Build session-user pairs (one session per user)
    const userSessionMap = new Map<
      string,
      { user: (typeof newUsers)[0]; session: (typeof sessions)[0] }
    >();
    for (const session of sessions) {
      const userId = session.user_id!.toString();
      const user = userMap.get(userId);
      if (user && !userSessionMap.has(userId)) {
        userSessionMap.set(userId, { user, session });
      }
    }

    const contactsToPush = Array.from(userSessionMap.values());

    logger.info('HUBSPOT_PUSH_STEP_4_NEW_CONTACTS_TO_PUSH', {
      organization_id,
      total_users: users.length,
      existing_skipped: users.length - newUsers.length,
      new_contacts: contactsToPush.length,
    });

    // Build contact data for queue
    const contactsForQueue = contactsToPush
      .map(({ user, session }) => {
        const sessionData = HubspotService.extractDataFromSession(session, user);
        if (!sessionData?.email) return null;

        const properties =
          HubspotService.buildContactPropertiesFromSession(sessionData);

        return {
          email: sessionData.email,
          properties,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Queue all contacts for async processing via SQS
    const queued = await HubspotService.queueContactsForSync(
      organization_id,
      contactsForQueue,
      encrypted_access_token,
    );

    if (queued) {
      logger.info('PREVIOUS_SESSIONS_QUEUED_TO_HUBSPOT', {
        organization_id,
        contacts_queued: contactsForQueue.length,
      });
    } else {
      logger.error('PREVIOUS_SESSIONS_QUEUE_FAILED', {
        organization_id,
        contacts_count: contactsForQueue.length,
      });
    }

    // Return the count of contacts queued (actual push happens async)
    return contactsForQueue.length;
  }

  static async verifyHubspotAccessToken(
    hubspot_access_token: string,
  ): Promise<HubspotPermissionVerificationResult | ServiceError> {
    if (!hubspot_access_token) {
      return { code: 400, message: 'hubspot_access_token is required' };
    }

    logger.info('VERIFY_HUBSPOT_ACCESS_TOKEN');

    const result =
      await HubspotService.verifyAccessTokenPermissions(hubspot_access_token);

    if (typeof result === 'object' && 'code' in result) {
      logger.error('VERIFY_HUBSPOT_ACCESS_TOKEN_FAILED', {
        error: result.message,
      });
      return result;
    }

    return result;
  }

  static async checkHubspotTokenStatus(
    organization_id: string,
  ): Promise<HubspotTokenStatusResponse | ServiceError> {
    logger.info('CHECK_HUBSPOT_TOKEN_STATUS', { organization_id });

    const organizationConfig = await OrganizationConfigRepository.get({
      organization_id,
    });

    if (!organizationConfig) {
      return { code: 404, message: 'Organization config not found' };
    }

    if (!organizationConfig.hubspot?.hubspot_access_token) {
      return { code: 404, message: 'HubSpot access token not configured' };
    }

    const created_at = organizationConfig.hubspot.created_at;

    let decryptedToken: string;
    try {
      decryptedToken = EncryptionService.decrypt(
        organizationConfig.hubspot.hubspot_access_token,
      );
    } catch {
      logger.error('CHECK_HUBSPOT_TOKEN_STATUS_DECRYPTION_FAILED', {
        organization_id,
      });
      return { code: 500, message: 'Failed to decrypt access token' };
    }

    const result =
      await HubspotService.verifyAccessTokenPermissions(decryptedToken);

    const form_id = organizationConfig.hubspot.hubspot_form_id || null;

    if (typeof result === 'object' && 'code' in result) {
      logger.warn('CHECK_HUBSPOT_TOKEN_STATUS_REVOKED', {
        organization_id,
        error: result.message,
      });
      return { is_active: false, created_at, form_id };
    }

    logger.info('CHECK_HUBSPOT_TOKEN_STATUS_ACTIVE', { organization_id });
    return { is_active: true, created_at, form_id };
  }
}
