import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { OrganizationVoiceService } from '../services/organization_voice.service';
import logger from '../utils/logger';

export class OrganizationVoiceController {
  static async createCustomVoice(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { name, description, language, baseVoiceId } = req.body;
      const audioClip = req.file;

      const result = await OrganizationVoiceService.createCustomVoice(
        organization_id,
        { name, description, language, baseVoiceId },
        audioClip,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('CREATE_CUSTOM_VOICE_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
      return;
    } catch (error) {
      logger.error('ERROR_CREATE_CUSTOM_VOICE', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getVoices(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const result =
        await OrganizationVoiceService.getOrganizationVoices(organization_id);

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_VOICES_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, { voices: result });
      return;
    } catch (error) {
      logger.error('ERROR_GET_VOICES', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async updateVoice(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { voice_id } = req.params;
      const { name, description, is_active } = req.body;

      const result = await OrganizationVoiceService.updateVoice(
        organization_id,
        voice_id,
        { name, description, is_active },
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('UPDATE_VOICE_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_UPDATE_VOICE', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
