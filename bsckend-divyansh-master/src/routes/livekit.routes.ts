import { Router } from 'express';

import { LiveKitController } from '../controllers/livekit.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/token',
  AuthMiddleware.authenticate,
  LiveKitController.generateToken,
);

export default router;
