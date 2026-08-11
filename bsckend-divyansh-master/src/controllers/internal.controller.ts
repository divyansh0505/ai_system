import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { AuthService } from '../services/auth.service';
import { MigrationService } from '../services/migration.service';
import logger from '../utils/logger';

export class InternalController {
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.signupOrganization(req.body);

      if (typeof result === 'object' && 'code' in result) {
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
    } catch (error) {
      logger.error('INTERNAL_SIGNUP_ERROR', {
        error_message: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }

  static async migrateAgentMappings(
    _req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const result = await MigrationService.migrateAgentMappingsToOrgConfig();

      if (typeof result === 'object' && 'code' in result) {
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
    } catch (error) {
      logger.error('INTERNAL_MIGRATE_AGENT_MAPPINGS_ERROR', {
        error_message: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
    }
  }
}
