import { RoomServiceClient } from 'livekit-server-sdk';
import { Types } from 'mongoose';

import { config } from '../../config';
import {
  OrganizationRepository,
  OrganizationConfigRepository,
  SessionRepository,
  OrganizationProjectRepository,
  OrganizationSlidesRepository,
} from '../db/mongo/repository';
import type { EXTERNAL_TOKEN_TYPE } from '../db/mongo/models/types';
import { ORGANIZATION_PROJECT_TYPE } from '../db/mongo/models/types';
import logger from '../utils/logger';
import type { ServiceError } from './types';
import type { LiveKitTokenResponse, SlideDto } from './types/livekit.types';
import {
  LiveKitConverter,
  type ProjectMetadata,
} from './converters/livekit.converter';

export class LiveKitService {
  private static validateCredentials(): ServiceError | null {
    if (
      !config.livekit.url ||
      !config.livekit.apiKey ||
      !config.livekit.apiSecret
    ) {
      logger.error('LIVEKIT_CREDENTIALS_NOT_CONFIGURED', {
        url_configured: !!config.livekit.url,
        api_key_configured: !!config.livekit.apiKey,
        api_secret_configured: !!config.livekit.apiSecret,
      });
      return { code: 500, message: 'LiveKit credentials not configured' };
    }
    return null;
  }

  private static getClient(): RoomServiceClient | null {
    if (this.validateCredentials()) {
      return null;
    }

    return new RoomServiceClient(
      config.livekit.url,
      config.livekit.apiKey,
      config.livekit.apiSecret,
    );
  }

  static async generateTokenAndDispatchAgent(
    organization_id: string,
    session_id: string,
    project_id?: string,
    project_type?: string,
  ): Promise<LiveKitTokenResponse | ServiceError> {
    logger.info('LIVEKIT_TOKEN_GENERATION_START', {
      organization_id,
      session_id,
      project_id: project_id ?? null,
      project_type: project_type ?? null,
    });

    const credentials_error = this.validateCredentials();
    if (credentials_error) {
      return credentials_error;
    }

    const session = await SessionRepository.get({ _id: session_id });
    if (!session) {
      logger.error('LIVEKIT_SESSION_NOT_FOUND', { session_id });
      return { code: 404, message: 'Session not found' };
    }

    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });
    if (!organization) {
      logger.error('LIVEKIT_ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    const organization_config_id = (
      organization.organization_config_id as Types.ObjectId
    ).toString();
    const organization_config = await OrganizationConfigRepository.get({
      _id: organization_config_id,
    });

    if (!organization_config) {
      logger.error('LIVEKIT_ORGANIZATION_CONFIG_NOT_FOUND', {
        organization_id,
        organization_config_id,
      });
      return { code: 404, message: 'Organization config not found' };
    }

    if (!organization_config.agents || organization_config.agents.length === 0) {
      logger.error('LIVEKIT_AGENT_CONFIG_NOT_FOUND', {
        organization_id,
        organization_config_id,
      });
      return {
        code: 400,
        message: 'Organization config does not have agent configuration',
      };
    }

    // Get agent name from organization_config.agents based on project_type (or demo if not provided)
    const lookup_project_type = project_type
      ? (project_type as ORGANIZATION_PROJECT_TYPE)
      : ORGANIZATION_PROJECT_TYPE.DEMO;

    logger.info('LIVEKIT_AGENT_MAPPING_LOOKUP', {
      project_type_received: project_type,
      lookup_project_type,
      project_type_enum_slides: ORGANIZATION_PROJECT_TYPE.SLIDES,
    });

    const agent_mapping = organization_config.agents.find(
      (agent) =>
        agent.project_type === lookup_project_type && agent.is_active !== false,
    );

    logger.info('LIVEKIT_AGENT_MAPPING_RESULT', {
      agent_mapping: agent_mapping
        ? {
            project_type: agent_mapping.project_type,
            agent_name: agent_mapping.agent_name,
            is_active: agent_mapping.is_active,
          }
        : null,
    });

    if (!agent_mapping || !agent_mapping.agent_name) {
      logger.error('LIVEKIT_AGENT_MAPPING_NOT_FOUND', {
        project_type: lookup_project_type,
      });
      return {
        code: 400,
        message: `No active agent mapping found for project type: ${lookup_project_type}`,
      };
    }

    const agent_name = agent_mapping.agent_name;
    logger.info('LIVEKIT_AGENT_NAME_FROM_MAPPING', {
      project_type: lookup_project_type,
      agent_name,
    });

    const room_name = `${session_id}_${organization_id}`;

    logger.info('LIVEKIT_AGENT_CONFIG_LOADED', {
      organization_id,
      organization_config_id,
      agent_name,
      project_type: lookup_project_type,
      room_name,
    });

    let project_metadata: ProjectMetadata = {
      avatar_id: null,
      voice_id: null,
      context: null,
    };
    let slides: SlideDto[] | null = null;

    if (project_id) {
      logger.debug('LIVEKIT_LOADING_PROJECT', { project_id, project_type });

      const project = await OrganizationProjectRepository.get(
        {
          _id: project_id,
        },
        ['avatar_id', 'voice_id'],
      );

      if (project) {
        logger.debug('LIVEKIT_PROJECT_FOUND', {
          project_id,
          project_title: project.title,
        });

        project_metadata = LiveKitConverter.extractProjectMetadata(project);

        if (project_type === ORGANIZATION_PROJECT_TYPE.SLIDES) {
          logger.debug('LIVEKIT_LOADING_SLIDES', { project_id });

          const slides_data = await OrganizationSlidesRepository.get({
            organization_project_id: project_id,
          });

          if (slides_data?.slides) {
            slides = LiveKitConverter.convertSlides(slides_data.slides);
            logger.debug('LIVEKIT_SLIDES_LOADED', {
              project_id,
              slides_count: slides.length,
            });
          } else {
            logger.warn('LIVEKIT_NO_SLIDES_FOUND', { project_id });
          }
        }
      } else {
        logger.warn('LIVEKIT_PROJECT_NOT_FOUND', { project_id });
      }
    } else {
      logger.debug('LIVEKIT_NO_PROJECT_ID_PROVIDED', { session_id });
    }

    logger.info('LIVEKIT_BUILDING_AGENT_METADATA', {
      organization_id,
      session_id,
      organization_name: organization.name ?? null,
      project_type: project_type ?? null,
      has_slides: !!slides,
      project_metadata,
    });

    const agent_metadata = LiveKitConverter.buildAgentMetadata({
      organization_id,
      session_id,
      organization_name: organization.name,
      organization_config,
      project_metadata,
      project_type,
      slides,
    });

    logger.info('LIVEKIT_BUILDING_TOKEN', {
      session_id,
      room_name,
      agent_name,
    });

    const jwt_token = await LiveKitConverter.buildToken({
      session_id,
      room_name,
      agent_name,
      agent_metadata,
    });

    logger.info('LIVEKIT_DISPATCHING_AGENT', {
      session_id,
      room_name,
      agent_name,
      token_generated: !!jwt_token,
    });

    const updated_session = await SessionRepository.update(
      { _id: session_id },
      {
        is_active: true,
        external_room_name: room_name,
        external_token: jwt_token,
        external_token_type: 'livekit' as EXTERNAL_TOKEN_TYPE,
        ...(project_id && {
          organization_project_id: new Types.ObjectId(project_id),
        }),
        ...(project_type && {
          organization_project_type: project_type as ORGANIZATION_PROJECT_TYPE,
        }),
      },
    );

    if (!updated_session) {
      logger.error('FAILED_TO_UPDATE_SESSION_WITH_LIVEKIT_TOKEN', {
        session_id,
        room_name,
      });
      return { code: 500, message: 'Failed to update session' };
    }

    logger.info('LIVEKIT_SESSION_UPDATED', {
      session_id,
      room_name,
      is_active: true,
    });

    logger.info('LIVEKIT_TOKEN_GENERATED_SUCCESSFULLY', {
      session_id,
      organization_id,
      room_name,
      agent_name,
      demo_url: organization_config.demo_url ?? '',
      slides_count: slides?.length ?? 0,
    });

    return {
      token: jwt_token,
      room_name,
      demo_url: organization_config.demo_url ?? '',
      slides:
        slides
          ?.map((slide) => slide.image_url)
          .filter((url): url is string => url !== null) || [],
    };
  }

  static async updateParticipantMetadata(
    room_name: string,
    participant_identity: string,
    user_data: object,
  ): Promise<boolean> {
    logger.info('UPDATING_PARTICIPANT_METADATA', {
      room_name,
      participant_identity,
      user_data_keys: Object.keys(user_data),
    });

    const client = this.getClient();
    if (!client) {
      return false;
    }

    const metadata = JSON.stringify(user_data);

    try {
      await client.updateParticipant(room_name, participant_identity, metadata);
    } catch (error) {
      logger.warn('UPDATE_PARTICIPANT_METADATA_FAILED', {
        room_name,
        participant_identity,
        error: (error as Error).message,
      });
      return false;
    }

    logger.info('PARTICIPANT_METADATA_UPDATED_SUCCESSFULLY', {
      room_name,
      participant_identity,
    });

    return true;
  }
}
