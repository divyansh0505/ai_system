import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { SessionService } from '../services/session.service';
import logger from '../utils/logger';
import type { CreateSessionRequest } from '../services/types/session.types';

export class SessionController {
  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { duration } = req.body as CreateSessionRequest;

      logger.info('CREATE_SESSION_REQUEST', { organization_id });

      const result = await SessionService.createSession(
        organization_id,
        duration,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('CREATE_SESSION_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
    } catch (error) {
      logger.error('ERROR_CREATE_SESSION', { error: (error as Error).message });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }
}
