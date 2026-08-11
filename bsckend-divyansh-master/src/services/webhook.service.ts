import { config } from '../../config';
import logger from '../utils/logger';
import { SqsProducer } from '../utils/aws/sqs';
import type { ServiceError } from './types';
import type { WebhookResponse } from './types/webhook.types';

export class WebhookService {
  static async processSessionAnalyticsWebhook(
    webhook_data: Record<string, unknown>,
  ): Promise<WebhookResponse | ServiceError> {
    const data = webhook_data.data as Record<string, unknown> | undefined;

    logger.info('PROCESSING_SESSION_ANALYTICS_WEBHOOK', {
      agent: webhook_data.agent,
      session_id: data?.session_id,
      organization_id: data?.organization_id,
      room_name: data?.room_name,
    });

    const sqs_payload = {
      id: (data?.session_id as string) || 'unknown',
      message: webhook_data,
    };

    const success = await SqsProducer.send(
      config.aws.sqs.livekitSessionAnalyticsQueueUrl,
      sqs_payload,
    );

    if (success) {
      logger.info('SESSION_ANALYTICS_WEBHOOK_QUEUED_SUCCESSFULLY', {
        agent: webhook_data.agent,
        session_id: data?.session_id,
        organization_id: data?.organization_id,
      });

      return {
        success: true,
        message: 'Session analytics webhook event queued successfully',
        queued: true,
      };
    }

    logger.error('SESSION_ANALYTICS_WEBHOOK_QUEUE_FAILED', {
      agent: webhook_data.agent,
      session_id: data?.session_id,
      organization_id: data?.organization_id,
    });

    await this.sendToDlq(
      config.aws.sqs.livekitSessionAnalyticsDlqUrl,
      sqs_payload,
      'SESSION_ANALYTICS_WEBHOOK_QUEUE_FAILED',
    );

    return { code: 500, message: 'Failed to queue webhook event to SQS' };
  }

  static async processPosthogWebhook(
    webhook_data: Record<string, unknown>,
  ): Promise<WebhookResponse | ServiceError> {
    const event = webhook_data.event as Record<string, unknown> | undefined;

    logger.info('PROCESSING_POSTHOG_WEBHOOK', {
      event_name: event?.event,
      event_uuid: event?.uuid,
      distinct_id: event?.distinct_id,
    });

    const sqs_payload = {
      id: (event?.uuid as string) || 'unknown',
      message: webhook_data,
    };

    const success = await SqsProducer.send(
      config.aws.sqs.posthogAnalyticsQueueUrl,
      sqs_payload,
    );

    if (success) {
      logger.info('POSTHOG_WEBHOOK_QUEUED_SUCCESSFULLY', {
        event_name: event?.event,
        event_uuid: event?.uuid,
        distinct_id: event?.distinct_id,
      });

      return {
        success: true,
        message: 'PostHog webhook event queued successfully',
        queued: true,
      };
    }

    logger.error('POSTHOG_WEBHOOK_QUEUE_FAILED', {
      event_name: event?.event,
      event_uuid: event?.uuid,
    });

    await this.sendToDlq(
      config.aws.sqs.posthogAnalyticsDlqUrl,
      sqs_payload,
      'POSTHOG_WEBHOOK_QUEUE_FAILED',
    );

    return {
      code: 500,
      message: 'Failed to queue PostHog webhook event to SQS',
    };
  }

  private static async sendToDlq(
    queue_url: string,
    payload: { id: string; message: unknown },
    reason: string,
  ): Promise<void> {
    const dlq_payload = {
      id: payload.id,
      message: { original: payload.message, dlq_reason: reason },
    };

    const success = await SqsProducer.send(queue_url, dlq_payload);

    if (success) {
      logger.info('WEBHOOK_MESSAGE_SENT_TO_DLQ', {
        id: payload.id,
        reason,
        queue_url,
      });
    } else {
      logger.error('WEBHOOK_DLQ_SEND_ERROR', {
        id: payload.id,
        queue_url,
      });
    }
  }
}
