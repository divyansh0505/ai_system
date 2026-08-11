import { config } from '../../config';
import { SessionRepository } from '../db/mongo/repository/session.repository';
import { SqsConsumer, SqsProducer } from '../utils/aws/sqs';
import { GoogleSheets } from '../utils/google/sheets';
import logger from '../utils/logger';
import { PosthogToSessionVisitorConverter } from './converters/posthog_visitor.converter';
import { SheetDataType } from './converters/sheets_data.converter';
import {
  PosthogEventType,
  type PosthogMessage,
} from './types/session_analytics.types';

export class PosthogAnalyticsConsumer {
  static start(): void {
    logger.info('POSTHOG_ANALYTICS_CONSUMER_STARTING', {
      queue_url: config.aws.sqs.posthogAnalyticsQueueUrl,
    });

    SqsConsumer.listen(
      config.aws.sqs.posthogAnalyticsQueueUrl,
      this.handleMessage.bind(this),
    );

    logger.info('POSTHOG_ANALYTICS_CONSUMER_STARTED');
  }

  static async handleMessage(
    message: Record<string, unknown>,
  ): Promise<boolean | Error> {
    const posthogMessage = message as unknown as PosthogMessage;
    const event = posthogMessage.event;

    logger.info('POSTHOG_ANALYTICS_MESSAGE_RECEIVED', {
      event_name: event.event,
      event_uuid: event.uuid,
      distinct_id: event.distinct_id,
    });

    try {
      const result = await this.processPosthogEvent(posthogMessage);

      if (result) {
        logger.info('POSTHOG_ANALYTICS_PROCESSED_SUCCESSFULLY', {
          event_uuid: event.uuid,
          session_id: event.properties.session_id,
        });
        return true;
      }

      logger.warn('POSTHOG_ANALYTICS_SESSION_NOT_FOUND', {
        event_uuid: event.uuid,
        session_id: event.properties.session_id,
      });
      return true;
    } catch (error) {
      logger.error('POSTHOG_ANALYTICS_PROCESSING_ERROR', {
        event_uuid: event.uuid,
        error_message: (error as Error).message,
      });

      await this.sendToDlq(
        event.uuid || event.properties.session_id || 'unknown',
        message,
        'POSTHOG_ANALYTICS_PROCESSING_ERROR',
      );

      return error as Error;
    }
  }

  private static async processPosthogEvent(
    posthogMessage: PosthogMessage,
  ): Promise<boolean> {
    const event = posthogMessage.event;
    const eventName = event.event;
    const relevantEvents = [
      PosthogEventType.SESSION_STARTED,
      PosthogEventType.SESSION_ENDED,
    ];

    if (!relevantEvents.includes(eventName as PosthogEventType)) {
      logger.debug('POSTHOG_ANALYTICS_IGNORING_EVENT', {
        event_name: eventName,
        event_uuid: event.uuid,
      });
      return true;
    }

    const sessionId = event.properties.session_id;

    if (!sessionId) {
      logger.warn('POSTHOG_ANALYTICS_NO_SESSION_ID', {
        event_name: eventName,
        event_uuid: event.uuid,
      });
      return false;
    }

    const visitorData = PosthogToSessionVisitorConverter.convert(
      event.properties,
    );

    const updatedSession = await SessionRepository.update(
      { _id: sessionId },
      visitorData,
    );

    if (updatedSession) {
      if (config.feature_flags.google_sheets) {
        await GoogleSheets.appendSessionToSheets(
          sessionId,
          SheetDataType.SPRINTO,
        );
      } else {
        logger.info('GOOGLE_SHEETS_DISABLED', { session_id: sessionId });
      }

      logger.info('SESSION_UPDATED_WITH_VISITOR_DATA', {
        session_id: sessionId,
      });
    } else {
      logger.warn('SESSION_NOT_FOUND_FOR_VISITOR_UPDATE', {
        session_id: sessionId,
      });
    }

    return updatedSession !== null;
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
      config.aws.sqs.posthogAnalyticsDlqUrl,
      dlqPayload,
    );

    if (success) {
      logger.info('POSTHOG_ANALYTICS_MESSAGE_SENT_TO_DLQ', { id, reason });
    } else {
      logger.error('POSTHOG_ANALYTICS_DLQ_SEND_ERROR', { id });
    }
  }
}
