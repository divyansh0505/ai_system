import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { AuthService } from '../services/auth.service';
import logger from '../utils/logger';
import type {
  TokenGenerateRequest,
  TokenRefreshRequest,
  OrganizationLoginRequest,
  OrganizationSignupRequest,
  GenerateOtpRequest,
  OtpVerifyRequest,
  OtpSignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../services/types/auth.types';

export class AuthController {
  static async generateTokens(req: Request, res: Response): Promise<void> {
    try {
      const tokenRequest = req.body as TokenGenerateRequest;
      const { organization_id } = tokenRequest;

      const tokenData = await AuthService.generateTokens(organization_id);

      if (typeof tokenData === 'object' && 'code' in tokenData) {
        logger.error('GENERATE_TOKENS_FAILED', {
          organization_id,
          code: tokenData.code,
          message: tokenData.message,
        });
        MuttonResponder.respond(res, tokenData.code, null, tokenData.message);
        return;
      }

      MuttonResponder.respond(res, 200, tokenData);
      return;
    } catch (error) {
      logger.error('ERROR_GENERATE_TOKENS', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const refreshRequest = req.body as TokenRefreshRequest;
      const { refresh_token } = refreshRequest;

      const refreshedTokens = await AuthService.refreshTokens(refresh_token);

      if (typeof refreshedTokens === 'object' && 'code' in refreshedTokens) {
        logger.error('REFRESH_TOKENS_FAILED', {
          code: refreshedTokens.code,
          message: refreshedTokens.message,
        });
        MuttonResponder.respond(
          res,
          refreshedTokens.code,
          null,
          refreshedTokens.message,
        );
        return;
      }

      MuttonResponder.respond(res, 200, refreshedTokens);
      return;
    } catch (error) {
      logger.error('ERROR_REFRESH_TOKENS', { error: (error as Error).message });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async dashboardSignup(req: Request, res: Response): Promise<void> {
    try {
      const signupRequest = req.body as OrganizationSignupRequest;

      const signupResult = await AuthService.signupOrganization(signupRequest);

      if (typeof signupResult === 'object' && 'code' in signupResult) {
        logger.error('DASHBOARD_SIGNUP_FAILED', {
          email: signupRequest.email,
          organization_id: signupRequest.organization_id,
          code: signupResult.code,
          message: signupResult.message,
        });
        MuttonResponder.respond(
          res,
          signupResult.code,
          null,
          signupResult.message,
        );
        return;
      }

      MuttonResponder.respond(res, 201, {
        message: 'Organization user account created successfully',
        user_id: signupResult.user_id,
        email: signupResult.email,
      });
      return;
    } catch (error) {
      logger.error('ERROR_DASHBOARD_SIGNUP', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async dashboardLogin(req: Request, res: Response): Promise<void> {
    try {
      const loginRequest = req.body as OrganizationLoginRequest;

      const loginData = await AuthService.loginOrganization(loginRequest);

      if (typeof loginData === 'object' && 'code' in loginData) {
        logger.warn('DASHBOARD_LOGIN_FAILED', {
          email: loginRequest.email,
          code: loginData.code,
          message: loginData.message,
        });
        MuttonResponder.respond(res, loginData.code, null, loginData.message);
        return;
      }

      MuttonResponder.respond(res, 200, loginData);
      return;
    } catch (error) {
      logger.error('ERROR_DASHBOARD_LOGIN', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async dashboardRefresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshRequest = req.body as TokenRefreshRequest;

      const refreshedTokens =
        await AuthService.refreshOrganizationTokens(refreshRequest);

      if (typeof refreshedTokens === 'object' && 'code' in refreshedTokens) {
        logger.error('DASHBOARD_REFRESH_FAILED', {
          code: refreshedTokens.code,
          message: refreshedTokens.message,
        });
        MuttonResponder.respond(
          res,
          refreshedTokens.code,
          null,
          refreshedTokens.message,
        );
        return;
      }

      MuttonResponder.respond(res, 200, refreshedTokens);
      return;
    } catch (error) {
      logger.error('ERROR_DASHBOARD_REFRESH', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async generateOtp(req: Request, res: Response): Promise<void> {
    try {
      const otpRequest = req.body as GenerateOtpRequest;

      const otpData = await AuthService.generateOtp(otpRequest);

      if (typeof otpData === 'object' && 'code' in otpData) {
        logger.warn('OTP_GENERATE_FAILED', {
          email: otpRequest.email,
          code: otpData.code,
          message: otpData.message,
        });
        MuttonResponder.respond(res, otpData.code, null, otpData.message);
        return;
      }

      MuttonResponder.respond(res, 200, otpData);
      return;
    } catch (error) {
      logger.error('ERROR_OTP_GENERATE', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async otpVerify(req: Request, res: Response): Promise<void> {
    try {
      const verifyRequest = req.body as OtpVerifyRequest;

      const verificationData = await AuthService.verifyOtp(verifyRequest);

      if (typeof verificationData === 'object' && 'code' in verificationData) {
        logger.warn('OTP_VERIFY_FAILED', {
          email: verifyRequest.email,
          code: verificationData.code,
          message: verificationData.message,
        });
        MuttonResponder.respond(
          res,
          verificationData.code,
          null,
          verificationData.message,
        );
        return;
      }

      MuttonResponder.respond(res, 200, verificationData);
      return;
    } catch (error) {
      logger.error('ERROR_OTP_VERIFY', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async otpSignup(req: Request, res: Response): Promise<void> {
    try {
      const signupRequest = req.body as OtpSignupRequest;

      const signupData = await AuthService.otpSignup(signupRequest);

      if (typeof signupData === 'object' && 'code' in signupData) {
        logger.warn('OTP_SIGNUP_FAILED', {
          email: signupRequest.email,
          code: signupData.code,
          message: signupData.message,
        });
        MuttonResponder.respond(res, signupData.code, null, signupData.message);
        return;
      }

      MuttonResponder.respond(res, 201, signupData);
      return;
    } catch (error) {
      logger.error('ERROR_OTP_SIGNUP', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const forgotPasswordRequest = req.body as ForgotPasswordRequest;

      const resetRequestData = await AuthService.forgotPassword(
        forgotPasswordRequest,
      );

      if (typeof resetRequestData === 'object' && 'code' in resetRequestData) {
        logger.warn('FORGOT_PASSWORD_FAILED', {
          email: forgotPasswordRequest.email,
          code: resetRequestData.code,
          message: resetRequestData.message,
        });
        MuttonResponder.respond(
          res,
          resetRequestData.code,
          null,
          resetRequestData.message,
        );
        return;
      }

      MuttonResponder.respond(res, 200, resetRequestData);
      return;
    } catch (error) {
      logger.error('ERROR_FORGOT_PASSWORD', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetPasswordRequest = req.body as ResetPasswordRequest;

      const resetResult = await AuthService.resetPassword(resetPasswordRequest);

      if (typeof resetResult === 'object' && 'code' in resetResult) {
        logger.warn('RESET_PASSWORD_FAILED', {
          code: resetResult.code,
          message: resetResult.message,
        });
        MuttonResponder.respond(
          res,
          resetResult.code,
          null,
          resetResult.message,
        );
        return;
      }

      MuttonResponder.respond(res, 200, resetResult);
      return;
    } catch (error) {
      logger.error('ERROR_RESET_PASSWORD', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
