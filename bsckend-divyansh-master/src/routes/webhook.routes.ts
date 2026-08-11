import { Router } from 'express';

import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

//TODO: Add internal auth middleware
router.post(
  '/livekit/session',
  WebhookController.handleSessionAnalyticsWebhook,
);

//TODO: Add internal auth middleware
router.post('/posthog', WebhookController.handlePosthogWebhook);

export default router;
