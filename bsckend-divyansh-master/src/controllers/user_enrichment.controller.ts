import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { UserEnrichmentService } from '../services/user_enrichment.service';
import logger from '../utils/logger';

export class UserEnrichmentController {
  static async enrichUser(req: Request, res: Response): Promise<void> {
    try {
      const { user_email, session_id, hubspotutk } = req.body;

      if (!user_email || !session_id) {
        MuttonResponder.respond(
          res,
          400,
          null,
          'user_email and session_id are required',
        );
        return;
      }

      const result = await UserEnrichmentService.enrichUser(
        user_email,
        session_id,
        hubspotutk,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('USER_ENRICHMENT_FAILED', {
          email: user_email,
          session_id,
          code: result.code,
          message: result.message,
        });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      logger.info('USER_ENRICHMENT_COMPLETED', {
        email: user_email,
        session_id,
        user_id: result.user_id,
      });

      MuttonResponder.respond(res, 200, result);
    } catch (error) {
      logger.error('ERROR_USER_ENRICHMENT', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }
}
