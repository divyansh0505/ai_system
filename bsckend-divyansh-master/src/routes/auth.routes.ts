import { Router } from 'express';

import { AuthController } from '../controllers';
import { OrganizationProjectMiddleware } from '../middlewares/organization_project.middleware';
import {
  InternalAuthMiddleware,
  RequestLimiterMiddleware,
} from '../middlewares';

const router = Router();

router.post(
  '/generate',
  OrganizationProjectMiddleware.verifyUserAccess,
  AuthController.generateTokens,
);
router.post('/refresh', AuthController.refreshTokens);

router.post(
  '/dashboard/signup',
  InternalAuthMiddleware.verifyInternalSecret,
  AuthController.dashboardSignup,
);
router.post('/dashboard/login', AuthController.dashboardLogin);
router.post('/dashboard/refresh', AuthController.dashboardRefresh);

// OTP-based signup flow
router.post(
  '/otp/generate',
  RequestLimiterMiddleware.verify,
  AuthController.generateOtp,
);
router.post('/otp/verify', AuthController.otpVerify);
router.post('/signup', AuthController.otpSignup);

// Password reset flow
router.post(
  '/forgot/password',
  RequestLimiterMiddleware.verify,
  AuthController.forgotPassword,
);
router.post('/reset/password', AuthController.resetPassword);

export default router;
