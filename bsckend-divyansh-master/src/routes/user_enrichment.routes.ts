import { Router } from 'express';

import { UserEnrichmentController } from '../controllers/user_enrichment.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/enrich',
  AuthMiddleware.authenticate,
  UserEnrichmentController.enrichUser,
);

export default router;
