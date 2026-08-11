import type { Request, Response, NextFunction } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

import { OrganizationRepository } from '../db/mongo/repository/organization.repository';
import { MuttonResponder } from '../controllers/mutton.response';
import logger from '../utils/logger';
import { JWT } from '../services/jwt.service';
import type { ServiceError, AccessTokenPayload } from '../services/types';

export class AuthMiddleware {
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
        logger.warn('UNAUTHORIZED_NO_TOKEN', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        MuttonResponder.respond(res, 401, null, 'Unauthorized');
        return;
      }

      const decoded = JWT.verifyAccessToken(token);

      const verificationResult = await AuthMiddleware.verifyOrg(decoded);
      if (
        typeof verificationResult === 'object' &&
        'code' in verificationResult
      ) {
        logger.warn('UNAUTHORIZED_VERIFICATION_FAILED', {
          organizationId: decoded.organization_id,
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

      req.headers.organization = decoded.organization_id.toString();
      req.headers.organization_config =
        decoded.organization_config_id.toString();
      req.headers.role = decoded.role_id.toString();

      next();
    } catch (error) {
      logger.error('AUTHENTICATION_ERROR', {
        error_message: error,
      });
      if (error instanceof TokenExpiredError) {
        MuttonResponder.respond(res, 498, null, 'Token Expired');
        return;
      }
      MuttonResponder.respond(res, 401, null, 'Unauthorized');
    }
  }

  private static async verifyOrg(
    decoded: AccessTokenPayload,
  ): Promise<ServiceError | boolean> {
    if (!decoded.organization_id) {
      logger.error('UNAUTHORIZED_NO_ORGANIZATION', {
        error_message: 'No organization_id in token',
      });
      return {
        code: 401,
        message: 'Unauthorized: Invalid token',
      };
    }

    const organization = await OrganizationRepository.get({
      _id: decoded.organization_id,
    });

    if (!organization) {
      logger.error('UNAUTHORIZED_ORGANIZATION_NOT_FOUND', {
        organizationId: decoded.organization_id,
        error_message: 'ORGANIZATION_NOT_FOUND',
      });
      return {
        code: 401,
        message: 'Unauthorized: Organization not found',
      };
    }

    if (!organization.is_active) {
      logger.warn('INACTIVE_ORGANIZATION_REQUEST', {
        organizationId: organization._id,
      });
      return {
        code: 403,
        message: 'Organization is inactive',
      };
    }

    return true;
  }
}
