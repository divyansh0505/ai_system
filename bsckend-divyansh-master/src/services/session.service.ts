import type { Types } from 'mongoose';

import {
  OrganizationRepository,
  SessionRepository,
} from '../db/mongo/repository';
import logger from '../utils/logger';
import type { ServiceError } from './types';
import type { CreateSessionResponse } from './types/session.types';

export class SessionService {
  static async createSession(
    organization_id: string,
    duration?: number | null,
  ): Promise<CreateSessionResponse | ServiceError> {
    logger.info('CREATING_SESSION', { organization_id });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.error('ORGANIZATION_NOT_FOUND', { organization_id });
      return {
        code: 404,
        message: `Organization with ID ${organization_id} not found`,
      };
    }

    const session = await SessionRepository.create({
      organization_id: organization._id as Types.ObjectId,
      is_active: false,
      duration: duration ?? undefined,
    });

    if (!session) {
      logger.error('SESSION_CREATION_FAILED', { organization_id });
      return { code: 500, message: 'Failed to create session' };
    }

    const session_id = (session._id as Types.ObjectId).toString();

    logger.info('SESSION_CREATED', {
      session_id,
      is_active: false,
    });

    return {
      success: true,
      session_id,
    };
  }
}
