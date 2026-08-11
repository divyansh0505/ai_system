import type { Types } from 'mongoose';

import { config } from '../../config';
import {
  OrganizationConfigRepository,
  SessionRepository,
  UserRepository,
} from '../db/mongo/repository';
import type { Session } from '../db/mongo/models/types';
import { INPUT_TYPE } from '../db/mongo/models/types';
import logger from '../utils/logger';
import { ApolloService } from './apollo.service';
import { ApolloConverter } from './converters/apollo.converter';
import { UserConverter } from './converters/user.converter';
import { HubspotService } from './hubspot.service';
import { LiveKitService } from './livekit.service';
import { EncryptionService } from '../utils/encryption';
import type { ServiceError } from './types';
import type {
  UserEnrichmentResponse,
  EnrichedUserDataDto,
} from './types/user_enrichment.types';

const ENRICHMENT_TTL_MS = config.enrichment.ttlDays * 24 * 60 * 60 * 1000;

export class UserEnrichmentService {
  static async enrichUser(
    user_email: string,
    session_id: string,
    hubspotutk?: string,
  ): Promise<UserEnrichmentResponse | ServiceError> {
    logger.info('USER_ENRICHMENT_STARTED', {
      email: user_email,
      session_id,
      hubspotutk,
    });

    const session = await SessionRepository.get({ _id: session_id });
    if (!session) {
      logger.warn('USER_ENRICHMENT_SESSION_NOT_FOUND', {
        session_id,
        email: user_email,
      });
      return { code: 404, message: 'Session not found' };
    }

    const existing_user = await UserRepository.get({ email: user_email });

    let user_id: string;

    if (existing_user) {
      logger.info('USER_ENRICHMENT_USER_EXISTS', {
        user_id: existing_user._id,
        email: user_email,
        session_id,
      });

      const updated_session = await SessionRepository.update(
        { _id: session_id },
        { user_id: existing_user._id as Session['user_id'], hubspotutk },
      );

      if (!updated_session) {
        logger.error('FAILED_TO_UPDATE_SESSION_WITH_USER', {
          session_id,
          user_id: existing_user._id,
        });
        return { code: 500, message: 'Failed to update session with user' };
      }

      const current_time = new Date();
      if (
        existing_user.enrichment_ttl &&
        existing_user.enrichment_ttl > current_time
      ) {
        logger.info('USER_ENRICHMENT_TTL_NOT_EXPIRED', {
          user_id: existing_user._id,
          email: user_email,
          enrichment_ttl: existing_user.enrichment_ttl.toISOString(),
        });

        if (session.external_room_name) {
          const enriched_data =
            UserConverter.toEnrichedUserDataDto(existing_user);
          await this.pushEnrichedDataToLiveKit(
            session.external_room_name,
            session_id,
            enriched_data,
          );
        }

        return {
          user_id: (existing_user._id as Types.ObjectId).toString(),
          message: 'User already enriched, TTL not expired',
        };
      }

      user_id = (existing_user._id as Types.ObjectId).toString();
    } else {
      logger.info('USER_ENRICHMENT_CREATING_USER', {
        email: user_email,
        session_id,
      });

      const new_user = await UserRepository.create({
        email: user_email,
        is_anonymous: false,
      });

      if (!new_user) {
        logger.error('FAILED_TO_CREATE_USER', { email: user_email });
        return { code: 500, message: 'Failed to create user' };
      }

      user_id = (new_user._id as Types.ObjectId).toString();

      const updated_session = await SessionRepository.update(
        { _id: session_id },
        { user_id: new_user._id as Session['user_id'], hubspotutk },
      );

      if (!updated_session) {
        logger.error('FAILED_TO_UPDATE_SESSION_WITH_USER', {
          session_id,
          user_id: new_user._id,
        });
        return { code: 500, message: 'Failed to update session with user' };
      }

      logger.info('USER_ENRICHMENT_USER_CREATED', {
        user_id,
        email: user_email,
        session_id,
      });
    }

    const enrichment_result = await this.updateUserWithEnrichment(
      user_id,
      user_email,
    );

    if (typeof enrichment_result === 'object' && 'code' in enrichment_result) {
      return enrichment_result;
    }

    if (session.external_room_name) {
      logger.info('PUSHING_ENRICHED_DATA_TO_LIVEKIT', {
        room_name: session.external_room_name,
        session_id,
        user_id,
      });
      await this.pushEnrichedDataToLiveKit(
        session.external_room_name,
        session_id,
        enrichment_result,
      );
    }

    // Submit HubSpot form if configured (creates contact in HubSpot)
    await this.submitHubspotFormIfConfigured(
      session,
      user_email,
      enrichment_result,
      hubspotutk,
    );

    return {
      user_id,
      message: 'User enriched successfully',
    };
  }

  private static async pushEnrichedDataToLiveKit(
    room_name: string,
    session_id: string,
    enriched_data: EnrichedUserDataDto,
  ): Promise<boolean> {
    logger.info('PUSHING_ENRICHED_DATA_TO_LIVEKIT', {
      room_name,
      session_id,
      data_keys: Object.keys(enriched_data),
    });

    const success = await LiveKitService.updateParticipantMetadata(
      room_name,
      session_id,
      enriched_data,
    );

    if (success) {
      logger.info('ENRICHED_DATA_PUSHED_TO_LIVEKIT_SUCCESS', {
        room_name,
        session_id,
      });
    } else {
      logger.warn('ENRICHED_DATA_PUSHED_TO_LIVEKIT_FAILED', {
        room_name,
        session_id,
      });
    }

    return success;
  }

  private static async submitHubspotFormIfConfigured(
    session: Session,
    email: string,
    enrichedData: EnrichedUserDataDto,
    hubspotutk?: string,
  ): Promise<void> {
    const organizationId = session.organization_id.toString();

    try {
      const orgConfig = await OrganizationConfigRepository.get({
        organization_id: organizationId,
      });

      if (
        !orgConfig?.hubspot?.hubspot_access_token ||
        !orgConfig?.hubspot?.hubspot_form_id
      ) {
        logger.debug('HUBSPOT_FORM_NOT_CONFIGURED', {
          organization_id: organizationId,
          has_token: !!orgConfig?.hubspot?.hubspot_access_token,
          has_form_id: !!orgConfig?.hubspot?.hubspot_form_id,
        });
        return;
      }

      // Check if email should be blocked
      const emailCheck = HubspotService.shouldBlockEmail(email);
      if (emailCheck.blocked) {
        logger.info('HUBSPOT_FORM_EMAIL_BLOCKED', {
          organization_id: organizationId,
          email,
          reason: emailCheck.reason,
        });
        return;
      }

      // Decrypt access token
      const accessToken = EncryptionService.decrypt(
        orgConfig.hubspot.hubspot_access_token,
      );

      // Get portal ID
      const portalId = await HubspotService.getPortalId(accessToken);
      if (!portalId) {
        logger.warn('HUBSPOT_FORM_NO_PORTAL_ID', {
          organization_id: organizationId,
        });
        return;
      }

      // Extract compliances from session input
      const compliances: string[] = [];
      if (session.input && Array.isArray(session.input)) {
        for (const item of session.input) {
          if (item.type === INPUT_TYPE.PREFERENCES) {
            compliances.push(item.answer);
          }
        }
      }

      // Build form properties from enriched data - use N/A for missing required fields
      const formProperties = {
        email,
        firstname: enrichedData.first_name || 'N/A',
        lastname: enrichedData.last_name || 'N/A',
        company: enrichedData.company_name || 'N/A',
        jobtitle: enrichedData.title || 'N/A',
        city: enrichedData.city || 'N/A',
        country: enrichedData.country || 'N/A',
        // UTM and other session data
        utm_campaign: session.visitor_utm_campaign || 'N/A',
        utm_source: session.visitor_utm_source || 'N/A',
        utm_medium: session.visitor_utm_medium || 'N/A',
        utm_term: session.visitor_utm_term || 'N/A',
        ip_address: session.visitor_ip || 'N/A',
        // Compliances field
        compliances_interested_in:
          compliances.length > 0 ? compliances.join(', ') : 'N/A',
      };

      const formResult = await HubspotService.submitForm(
        portalId,
        orgConfig.hubspot.hubspot_form_id,
        formProperties,
        hubspotutk,
        session.visitor_current_url,
      );

      if (typeof formResult === 'object' && 'code' in formResult) {
        logger.error('HUBSPOT_FORM_SUBMISSION_FAILED', {
          organization_id: organizationId,
          email,
          error_code: formResult.code,
          error_message: formResult.message,
        });
        return;
      }

      logger.info('HUBSPOT_FORM_SUBMISSION_SUCCESS', {
        organization_id: organizationId,
        email,
        form_id: orgConfig.hubspot.hubspot_form_id,
      });
    } catch (error) {
      logger.error('HUBSPOT_FORM_SUBMISSION_EXCEPTION', {
        organization_id: organizationId,
        email,
        error: (error as Error).message,
      });
    }
  }

  private static async updateUserWithEnrichment(
    user_id: string,
    email: string,
  ): Promise<EnrichedUserDataDto | ServiceError> {
    const enrichment_response = await ApolloService.enrichUserData(email);

    const ttl_date = new Date(Date.now() + ENRICHMENT_TTL_MS);

    if (enrichment_response.error) {
      logger.warn('USER_ENRICHMENT_APOLLO_ERROR', {
        user_id,
        email,
        error: enrichment_response.error,
        status_code: enrichment_response.status_code,
      });

      const updated_user = await UserRepository.update(
        { _id: user_id },
        { enrichment_ttl: ttl_date },
      );

      if (!updated_user) {
        logger.error('FAILED_TO_UPDATE_USER_TTL', { user_id, email });
        return { code: 500, message: 'Failed to update user TTL' };
      }

      return {
        code: enrichment_response.status_code || 500,
        message: enrichment_response.error,
      };
    }

    const person = enrichment_response.person;

    if (!person) {
      logger.info('USER_ENRICHMENT_NO_DATA_FOUND', { user_id, email });

      const updated_user = await UserRepository.update(
        { _id: user_id },
        { enrichment_ttl: ttl_date },
      );

      if (!updated_user) {
        logger.error('FAILED_TO_UPDATE_USER_TTL', { user_id, email });
        return { code: 500, message: 'Failed to update user TTL' };
      }

      return { email };
    }

    const update_data = UserConverter.toUserUpdateData(person, ttl_date);
    const updated_user = await UserRepository.update(
      { _id: user_id },
      update_data,
    );

    if (!updated_user) {
      logger.error('FAILED_TO_UPDATE_USER_ENRICHMENT', {
        user_id,
        email,
        update_data,
      });
      return { code: 500, message: 'Failed to update user enrichment' };
    }

    logger.info('USER_ENRICHMENT_SUCCESS', {
      user_id,
      email,
      first_name: person.first_name,
      last_name: person.last_name,
      company_name: person.organization?.name,
      has_linkedin: person.linkedin_url !== undefined,
    });

    return ApolloConverter.toEnrichedUserDataDto(email, person);
  }
}
