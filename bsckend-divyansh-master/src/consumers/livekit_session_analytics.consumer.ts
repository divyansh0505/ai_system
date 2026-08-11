import { config } from '../../config';
import { OrganizationConfigRepository } from '../db/mongo/repository';
import { SessionRepository } from '../db/mongo/repository/session.repository';
import { UserRepository } from '../db/mongo/repository/user.repository';
import { HubspotService } from '../services/hubspot.service';
import { SqsConsumer, SqsProducer } from '../utils/aws/sqs';
import { GoogleSheets } from '../utils/google/sheets';
import { analyzeTranscript } from '../utils/llm';
import logger from '../utils/logger';
import { SessionAnalyticsConverter } from './converters/session_analytics.converter';
import { SheetDataType } from './converters/sheets_data.converter';
import type {
  SessionAnalyticsData,
  SessionAnalyticsMessage,
} from './types/session_analytics.types';

export class LivekitSessionAnalyticsConsumer {
  static start(): void {
    logger.info('LIVEKIT_SESSION_ANALYTICS_CONSUMER_STARTING', {
      queue_url: config.aws.sqs.livekitSessionAnalyticsQueueUrl,
    });

    SqsConsumer.listen(
      config.aws.sqs.livekitSessionAnalyticsQueueUrl,
      this.handleMessage.bind(this),
    );

    logger.info('LIVEKIT_SESSION_ANALYTICS_CONSUMER_STARTED');
  }

  static async handleMessage(
    message: Record<string, unknown>,
  ): Promise<boolean | Error> {
    const analyticsMessage = message as unknown as SessionAnalyticsMessage;
    const analyticsData = analyticsMessage.data;

    logger.info('LIVEKIT_SESSION_ANALYTICS_MESSAGE_RECEIVED', {
      session_id: analyticsData.session_id,
      organization_id: analyticsData.organization_id,
      room_name: analyticsData.room_name,
    });

    try {
      if (!analyticsData.session_id) {
        logger.warn('SESSION_ID_MISSING_IN_ANALYTICS', { message });
        await this.sendToDlq(
          analyticsData.room_name || 'unknown',
          message,
          'SESSION_ID_MISSING',
        );
        return true;
      }

      const result = await this.updateSessionAndLog(analyticsData);

      if (result) {
        logger.info('LIVEKIT_SESSION_ANALYTICS_PROCESSED_SUCCESSFULLY', {
          session_id: analyticsData.session_id,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('LIVEKIT_SESSION_ANALYTICS_PROCESSING_ERROR', {
        session_id: analyticsData.session_id,
        error_message: (error as Error).message,
      });

      await this.sendToDlq(
        analyticsData.session_id || analyticsData.room_name || 'unknown',
        message,
        'LIVEKIT_SESSION_ANALYTICS_PROCESSING_ERROR',
      );

      return error as Error;
    }
  }

  private static async updateSessionAndLog(
    analyticsData: SessionAnalyticsData,
  ): Promise<boolean> {
    const sessionId = analyticsData.session_id as string;
    const updateData =
      SessionAnalyticsConverter.toSessionUpdateData(analyticsData);

    // Link user_id to session if available directly or via email lookup
    if (analyticsData.user_id) {
      updateData.user_id = analyticsData.user_id;
    } else if (analyticsData.user_email) {
      const user = await UserRepository.get({
        email: analyticsData.user_email,
      });
      if (user) {
        updateData.user_id = user._id.toString();
      }
    }

    if (analyticsData.transcripts && analyticsData.transcripts.length > 0) {
      const transcriptData = analyticsData.transcripts.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      let userProfile: Record<string, string> | null = null;

      if (updateData.user_id) {
        const user = await UserRepository.get({ _id: updateData.user_id });

        if (user) {
          userProfile = this.buildUserProfile(user);
        }
      }

      const analysis = await analyzeTranscript(transcriptData, userProfile);

      if (analysis.summary) {
        updateData.transcript_summary = analysis.summary;
      }
      updateData.is_icp = analysis.is_icp;
      updateData.qna_pairs = analysis.qna_pairs;

      logger.info('LIVEKIT_SESSION_ANALYTICS_LLM_COMPLETE', {
        session_id: sessionId,
        summary_length: analysis.summary?.length || 0,
        is_icp: analysis.is_icp,
        qna_count: analysis.qna_pairs.length,
      });
    }

    const updatedSession = await SessionRepository.update(
      { _id: sessionId },
      updateData,
    );

    if (!updatedSession) {
      logger.warn('SESSION_UPDATE_FAILED', { session_id: sessionId });
      return false;
    }

    if (config.feature_flags.google_sheets) {
      try {
        await GoogleSheets.appendSessionToSheets(
          sessionId,
          SheetDataType.SPRINTO,
        );
      } catch (sheetsError) {
        logger.error('GOOGLE_SHEETS_SYNC_FAILED', {
          session_id: sessionId,
          error_message: (sheetsError as Error).message,
        });
      }
    }

    await this.syncSessionToHubspot(sessionId);

    logger.info('LIVEKIT_SESSION_ANALYTICS_PROCESSED', {
      session_id: sessionId,
      user_id: analyticsData.user_id,
      user_email: analyticsData.user_email,
      chat_interactions: analyticsData.interactions.chat,
      voice_interactions: analyticsData.interactions.voice,
      demo_interactions: analyticsData.interactions.demo,
      transcript_count: analyticsData.transcripts.length,
      user_inputs_count: analyticsData.user_inputs.length,
      audio_url_provided: analyticsData.audio_url !== null,
    });

    return true;
  }

  private static buildUserProfile(user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    company_name?: string;
    company_website?: string;
    designation?: string;
    phone_number?: string;
    socials?: { linkedin?: string };
  }): Record<string, string> | null {
    const profile: Record<string, string> = {};

    if (user.first_name) profile.first_name = user.first_name;
    if (user.last_name) profile.last_name = user.last_name;
    if (user.email) profile.email = user.email;
    if (user.company_name) profile.company = user.company_name;
    if (user.company_website) profile.website = user.company_website;
    if (user.designation) profile.job_title = user.designation;
    if (user.phone_number) profile.phone = user.phone_number;
    if (user.socials?.linkedin) profile.linkedin = user.socials.linkedin;

    return Object.keys(profile).length > 0 ? profile : null;
  }

  private static async syncSessionToHubspot(sessionId: string): Promise<void> {
    const session = await SessionRepository.get({ _id: sessionId });

    if (!session) {
      logger.warn('HUBSPOT_SYNC_SESSION_NOT_FOUND', { session_id: sessionId });
      return;
    }

    const organizationId = session.organization_id.toString();

    // Fetch organization config to get encrypted access token
    const orgConfig = await OrganizationConfigRepository.get({
      organization_id: organizationId,
    });

    if (!orgConfig?.hubspot?.hubspot_access_token) {
      logger.debug('HUBSPOT_SYNC_NO_TOKEN_IN_CONFIG', {
        session_id: sessionId,
        organization_id: organizationId,
      });
      return;
    }

    const user = session.user_id
      ? await UserRepository.get({ _id: session.user_id })
      : null;

    // Queue for async processing with encrypted token
    const queued = await HubspotService.queueSessionForSync(
      organizationId,
      session,
      user,
      orgConfig.hubspot.hubspot_access_token,
      orgConfig.hubspot.hubspot_form_id,
    );

    if (!queued) {
      logger.error('HUBSPOT_SYNC_QUEUE_FAILED', {
        session_id: sessionId,
        organization_id: organizationId,
      });
    }
  }

  private static async sendToDlq(
    id: string,
    message: unknown,
    reason: string,
  ): Promise<void> {
    const dlqPayload = {
      id,
      message: { original: message, dlq_reason: reason },
    };

    const success = await SqsProducer.send(
      config.aws.sqs.livekitSessionAnalyticsDlqUrl,
      dlqPayload,
    );

    if (success) {
      logger.info('LIVEKIT_SESSION_ANALYTICS_MESSAGE_SENT_TO_DLQ', {
        id,
        reason,
      });
    } else {
      logger.error('LIVEKIT_SESSION_ANALYTICS_DLQ_SEND_ERROR', { id });
    }
  }
}
