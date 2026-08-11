import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { OrganizationAvatarService } from '../services/organization_avatar.service';
import logger from '../utils/logger';

export class OrganizationAvatarController {
  static async createCustomAvatar(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { displayName } = req.body;
      const imageFile = req.file;

      const result = await OrganizationAvatarService.createCustomAvatar(
        organization_id,
        { display_name: displayName },
        imageFile,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('CREATE_CUSTOM_AVATAR_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
      return;
    } catch (error) {
      logger.error('ERROR_CREATE_CUSTOM_AVATAR', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getAvatars(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const result =
        await OrganizationAvatarService.getOrganizationAvatars(organization_id);

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_AVATARS_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, { avatars: result });
      return;
    } catch (error) {
      logger.error('ERROR_GET_AVATARS', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { avatar_id } = req.params;

      const result = await OrganizationAvatarService.deleteAvatar(
        organization_id,
        avatar_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('DELETE_AVATAR_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_DELETE_AVATAR', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
