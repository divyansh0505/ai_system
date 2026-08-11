import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { WebhookService } from '../services/webhook.service';
import logger from '../utils/logger';
import type {
  SessionAnalyticsWebhookRequest,
  PostHogWebhookRequest,
} from '../services/types/webhook.types';

export class WebhookController {
  static async handleSessionAnalyticsWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const request = req.body as SessionAnalyticsWebhookRequest;

      logger.info('SESSION_ANALYTICS_WEBHOOK_RECEIVED', {
        agent: request.agent,
        organization_id: request.data.organization_id,
        session_id: request.data.session_id,
        room_name: request.data.room_name,
      });

      const result = await WebhookService.processSessionAnalyticsWebhook(
        req.body as Record<string, unknown>,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('SESSION_ANALYTICS_WEBHOOK_FAILED', {
          error: result.message,
        });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
    } catch (error) {
      logger.error('ERROR_SESSION_ANALYTICS_WEBHOOK', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }

  static async handlePosthogWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const request = req.body as PostHogWebhookRequest;

      logger.info('POSTHOG_WEBHOOK_RECEIVED', {
        event_name: request.event.event,
        event_uuid: request.event.uuid,
        distinct_id: request.event.distinct_id,
        project_id: request.project?.id,
      });

      const result = await WebhookService.processPosthogWebhook(
        req.body as Record<string, unknown>,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('POSTHOG_WEBHOOK_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
    } catch (error) {
      logger.error('ERROR_POSTHOG_WEBHOOK', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }
}
