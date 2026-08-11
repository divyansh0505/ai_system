import type { Request, Response, NextFunction } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

import { OrganizationUserRepository } from '../db/mongo/repository/organization_user.repository';
import { OrganizationUserRoleRepository } from '../db/mongo/repository/organization_user_role.repository';
import { MuttonResponder } from '../controllers/mutton.response';
import type { OrganizationUser } from '../db/mongo/models/types';
import logger from '../utils/logger';
import { JWT } from '../services/jwt.service';
import type { ServiceError } from '../services/types';

export class DashboardAuthMiddleware {
  static async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        logger.warn('DASHBOARD_TOKEN_MISSING', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        MuttonResponder.respond(
          res,
          401,
          null,
          "Dashboard authentication required. Missing 'Authorization' header.",
        );
        return;
      }

      const decoded = JWT.verifyDashboardToken(token);

      // Verify it's a dashboard token
      if (!decoded.is_dashboard) {
        logger.warn('NOT_DASHBOARD_TOKEN', { userId: decoded.user_id });
        MuttonResponder.respond(
          res,
          401,
          null,
          'Invalid token. Dashboard access token required.',
        );
        return;
      }

      const userId = decoded.user_id;
      const email = decoded.email;

      if (!userId || !email) {
        logger.warn('INVALID_TOKEN_PAYLOAD', { payload: decoded });
        MuttonResponder.respond(
          res,
          401,
          null,
          'Invalid token payload. Missing user information.',
        );
        return;
      }

      logger.debug('DASHBOARD_TOKEN_DECODED', { userId, email });

      const verificationResult =
        await DashboardAuthMiddleware.verifyUserAndOrg(userId);
      if (
        typeof verificationResult === 'object' &&
        'code' in verificationResult
      ) {
        logger.warn('DASHBOARD_VERIFICATION_FAILED', {
          userId,
          error_message: verificationResult.message,
        });
        MuttonResponder.respond(
          res,
          verificationResult.code,
          null,
          verificationResult.message,
        );
        return;
      }

      // Store auth context in headers
      req.headers.user = userId;
      req.headers.email = email;
      req.headers.organization = verificationResult.organization_id;
      req.headers.role = verificationResult.role_id;

      logger.info('DASHBOARD_AUTH_VERIFIED', {
        userId,
        email,
        organizationId: verificationResult.organization_id,
      });

      next();
    } catch (error) {
      logger.error('DASHBOARD_AUTH_ERROR', {
        error_message: (error as Error).message,
      });
      if (error instanceof TokenExpiredError) {
        MuttonResponder.respond(
          res,
          498,
          null,
          'Token has expired. Please login again.',
        );
        return;
      }
      MuttonResponder.respond(
        res,
        401,
        null,
        'Invalid token. Please login again.',
      );
    }
  }

  private static async verifyUserAndOrg(
    userId: string,
  ): Promise<ServiceError | { organization_id: string; role_id: string }> {
    // Verify user exists and is active
    const user: OrganizationUser | null = await OrganizationUserRepository.get({
      _id: userId,
    });

    if (!user) {
      logger.error('UNAUTHORIZED_USER_NOT_FOUND', {
        userId,
        error_message: 'USER_NOT_FOUND',
      });
      return {
        code: 401,
        message: 'User not found. Please login again.',
      };
    }

    if (!user.is_active) {
      logger.warn('UNAUTHORIZED_USER_INACTIVE', {
        userId: user._id,
        email: user.email,
      });
      return {
        code: 403,
        message: 'User account is inactive. Please contact support.',
      };
    }

    // Fetch user's organization role
    const userRole = await OrganizationUserRoleRepository.get({
      organization_user_id: userId,
      is_active: true,
    });

    if (!userRole) {
      logger.warn('UNAUTHORIZED_NO_ORGANIZATION', { userId });
      return {
        code: 403,
        message:
          'No organization access found. Please contact your administrator.',
      };
    }

    return {
      organization_id: String(userRole.organization_id),
      role_id: String(userRole.role_id),
    };
  }
}
