import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { LiveKitService } from '../services/livekit.service';
import logger from '../utils/logger';

export class LiveKitController {
  static async generateToken(req: Request, res: Response): Promise<void> {
    try {
      const { session_id, project_id, project_type } = req.body;
      const organization_id = req.headers.organization as string;

      if (!session_id) {
        MuttonResponder.respond(res, 400, null, 'session_id is required');
        return;
      }

      if (!organization_id) {
        MuttonResponder.respond(
          res,
          400,
          null,
          'organization_id is required in headers',
        );
        return;
      }

      const result = await LiveKitService.generateTokenAndDispatchAgent(
        organization_id,
        session_id,
        project_id,
        project_type,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('LIVEKIT_TOKEN_GENERATION_FAILED', {
          organization_id,
          session_id,
          code: result.code,
          message: result.message,
        });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      logger.info('LIVEKIT_TOKEN_GENERATED', {
        organization_id,
        session_id,
        room_name: result.room_name,
      });

      MuttonResponder.respond(res, 200, result);
    } catch (error) {
      logger.error('ERROR_LIVEKIT_TOKEN_GENERATION', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }
}
