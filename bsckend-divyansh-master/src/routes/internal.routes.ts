import { Router } from 'express';

import { InternalController } from '../controllers/internal.controller';
import { InternalAuthMiddleware } from '../middlewares';

const router = Router();

router.post(
  '/signup',
  InternalAuthMiddleware.verifyInternalSecret,
  InternalController.signup,
);

router.post(
  '/migrate/agent-mappings',
  InternalAuthMiddleware.verifyInternalSecret,
  InternalController.migrateAgentMappings,
);

export default router;
