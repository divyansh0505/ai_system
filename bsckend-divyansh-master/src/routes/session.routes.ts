import { Router } from 'express';

import { SessionController } from '../controllers/session.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/create',
  AuthMiddleware.authenticate,
  SessionController.createSession,
);

export default router;
