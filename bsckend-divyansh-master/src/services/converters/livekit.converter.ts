import type { Types } from 'mongoose';
import type { RoomConfiguration } from '@livekit/protocol';
import { AccessToken, type VideoGrant } from 'livekit-server-sdk';

import { config } from '../../../config';
import logger from '../../utils/logger';
import type {
  SlideItem,
  OrganizationProject,
  OrganizationConfig,
  Avatar,
  Voice,
} from '../../db/mongo/models/types';
import type { SlideDto, AgentMetadataDto } from '../types/livekit.types';

export interface ProjectMetadata {
  avatar_id: string | null;
  voice_id: string | null;
  context: string | null;
}

export interface AgentMetadataParams {
  organization_id: string;
  session_id: string;
  organization_name?: string | null;
  organization_config: OrganizationConfig;
  project_metadata: ProjectMetadata;
  project_type?: string;
  slides: SlideDto[] | null;
}

export interface TokenParams {
  session_id: string;
  room_name: string;
  agent_name: string;
  agent_metadata: AgentMetadataDto;
}

export class LiveKitConverter {
  private static convertSlide(slide: SlideItem): SlideDto {
    return {
      topic: slide.topic || null,
      layout_description: slide.layout_description || null,
      content_fields: slide.content_fields || [],
      narration: slide.narration || null,
      image_url: slide.image_url || null,
    };
  }

  static convertSlides(slides: SlideItem[]): SlideDto[] {
    return slides.map((slide) => this.convertSlide(slide));
  }

  static extractProjectMetadata(project: OrganizationProject): ProjectMetadata {
    // After population, avatar_id and voice_id contain the full documents
    const avatar = project.avatar_id as unknown as Avatar | null;
    const voice = project.voice_id as unknown as Voice | null;

    const metadata = {
      avatar_id: avatar?.external_id ?? config.defaults.avatar.external_id,
      voice_id: voice?.external_id ?? config.defaults.voice.external_id,
      context: project.project_context || null,
    };

    logger.debug('LIVEKIT_PROJECT_METADATA_EXTRACTED', {
      project_id: (project._id as Types.ObjectId).toString(),
      avatar_id: metadata.avatar_id,
      voice_id: metadata.voice_id,
      has_context: !!metadata.context,
    });

    return metadata;
  }

  static buildAgentMetadata(params: AgentMetadataParams): AgentMetadataDto {
    const {
      organization_id,
      session_id,
      organization_name,
      organization_config,
      project_metadata,
      project_type,
      slides,
    } = params;

    const organization_config_id = (
      organization_config._id as Types.ObjectId
    ).toString();

    const metadata: AgentMetadataDto = {
      organization_id,
      organization_config_id,
      session_id,
      organization_name: organization_name || null,
      navigation_graph: organization_config.navigation_graph || null,
      starting_current_node: organization_config.starting_current_node || null,
      avatar_id: project_metadata.avatar_id,
      voice_id: project_metadata.voice_id,
      context: project_metadata.context,
      project_type: project_type || null,
      slides,
    };

    logger.debug('LIVEKIT_AGENT_METADATA_BUILT', {
      organization_id,
      organization_config_id,
      session_id,
      organization_name: metadata.organization_name,
      has_navigation_graph: !!metadata.navigation_graph,
      starting_current_node: metadata.starting_current_node,
      avatar_id: metadata.avatar_id,
      voice_id: metadata.voice_id,
      has_context: !!metadata.context,
      project_type: metadata.project_type,
      slides_count: slides?.length ?? 0,
    });

    return metadata;
  }

  private static buildRoomConfig(
    agent_name: string,
    agent_metadata: AgentMetadataDto,
  ): RoomConfiguration {
    const metadata_json = JSON.stringify(agent_metadata);

    // Use plain object instead of protobuf classes to avoid
    // serializing default values (which causes issues with LiveKit)
    const room_config = {
      agents: [
        {
          agentName: agent_name,
          metadata: metadata_json,
        },
      ],
    } as RoomConfiguration;

    logger.debug('LIVEKIT_ROOM_CONFIG_BUILT', {
      agent_name,
      metadata_length: metadata_json.length,
      agents_count: room_config.agents?.length ?? 0,
    });

    logger.debug('LIVEKIT_AGENT_DISPATCH_CONFIG', {
      agent_name,
      session_id: agent_metadata.session_id,
      organization_id: agent_metadata.organization_id,
      metadata_preview: metadata_json.substring(0, 500),
    });

    return room_config;
  }

  static async buildToken(params: TokenParams): Promise<string> {
    const { session_id, room_name, agent_name, agent_metadata } = params;

    logger.info('LIVEKIT_TOKEN_BUILD_START', {
      session_id,
      room_name,
      agent_name,
      has_api_key: !!config.livekit.apiKey,
      has_api_secret: !!config.livekit.apiSecret,
    });

    const token = new AccessToken(
      config.livekit.apiKey,
      config.livekit.apiSecret,
      {
        identity: session_id,
        name: session_id,
      },
    );

    const video_grant: VideoGrant = {
      roomJoin: true,
      room: room_name,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    token.addGrant(video_grant);

    logger.debug('LIVEKIT_VIDEO_GRANT_ADDED', {
      session_id,
      room_name,
      grant: video_grant,
    });

    const room_config = this.buildRoomConfig(agent_name, agent_metadata);
    token.roomConfig = room_config;

    logger.info('LIVEKIT_TOKEN_ROOM_CONFIG_SET', {
      session_id,
      room_name,
      agent_name,
      has_room_config: !!token.roomConfig,
      agents_in_config: room_config.agents?.length ?? 0,
    });

    const jwt = await token.toJwt();

    // Decode JWT payload for debugging
    const payload_part = jwt.split('.')[1];
    const payload = JSON.parse(Buffer.from(payload_part, 'base64').toString());

    logger.info('LIVEKIT_TOKEN_BUILT_SUCCESSFULLY', {
      session_id,
      room_name,
      agent_name,
      token_length: jwt.length,
    });

    logger.info('LIVEKIT_TOKEN_PAYLOAD', {
      session_id,
      room_name,
      has_room_config: !!payload.roomConfig,
      room_config_agents: payload.roomConfig?.agents?.length ?? 0,
      agent_names:
        payload.roomConfig?.agents?.map(
          (a: { agentName: string }) => a.agentName,
        ) ?? [],
    });

    logger.debug('LIVEKIT_TOKEN_FULL_PAYLOAD', payload);

    return jwt;
  }
}
