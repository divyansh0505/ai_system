import type { Request, Response, NextFunction } from 'express';

import { config } from '../../config';
import { MuttonResponder } from '../controllers/mutton.response';
import logger from '../utils/logger';

export class InternalAuthMiddleware {
  static async verifyInternalSecret(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const internalSecret = req.headers[config.internal.chicken.header] as
        | string
        | undefined;

      if (!internalSecret) {
        logger.warn('INTERNAL_SECRET_MISSING', {
          header: config.internal.chicken.header,
        });
        MuttonResponder.respond(
          res,
          401,
          null,
          `Internal authentication required. Missing '${config.internal.chicken.header}' header.`,
        );
        return;
      }

      const configuredSecret = config.internal.chicken.secret;

      if (!configuredSecret) {
        logger.error('INTERNAL_SECRET_NOT_CONFIGURED');
        MuttonResponder.respond(res, 500, null, 'Server configuration error');
        return;
      }

      if (internalSecret !== configuredSecret) {
        logger.warn('INTERNAL_SECRET_INVALID', {
          providedSecret: internalSecret.slice(0, 10) + '...',
        });
        MuttonResponder.respond(
          res,
          401,
          null,
          'Invalid internal secret. Access denied.',
        );
        return;
      }

      logger.debug('INTERNAL_SECRET_VERIFIED');
      next();
    } catch (error) {
      logger.error('INTERNAL_AUTH_ERROR', {
        error_message: (error as Error).message,
      });
      MuttonResponder.respond(
        res,
        500,
        null,
        'Internal server error during authentication',
      );
    }
  }
}
