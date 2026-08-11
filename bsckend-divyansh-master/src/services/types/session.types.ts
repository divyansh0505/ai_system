import type { Types } from 'mongoose';
import type {
  EXTERNAL_TOKEN_TYPE,
  ORGANIZATION_PROJECT_TYPE,
} from '../../db/mongo/models/types';

// ============ Request ============

export interface CreateSessionRequest {
  duration?: number | null;
}

// ============ Response ============

export interface CreateSessionResponse {
  success: boolean;
  session_id: string;
}

// ============ Repository DTOs ============

export interface CreateSessionDto {
  organization_id: Types.ObjectId;
  is_active: boolean;
  duration?: number;
  organization_project_type?: ORGANIZATION_PROJECT_TYPE;
}

export interface UpdateSessionDto {
  user_id?: Types.ObjectId;
  organization_project_id?: Types.ObjectId;
  organization_project_type?: ORGANIZATION_PROJECT_TYPE;
  is_active?: boolean;
  duration?: number;
  external_token?: string;
  external_token_type?: EXTERNAL_TOKEN_TYPE;
  external_user_name?: string;
  external_room_name?: string;
  is_meeting_booked?: boolean;
  total_chat_interactions?: number;
  total_voice_interactions?: number;
  video_recording?: string;
  voice_recording?: string;
  transcript_summary?: string;
  is_icp?: boolean | string;
  visitor_ip?: string;
  visitor_user_agent?: string;
  visitor_country?: string;
  visitor_subdivision?: string;
  visitor_city?: string;
  hubspotutk?: string;
  visitor_utm_campaign?: string;
  visitor_utm_source?: string;
  visitor_utm_medium?: string;
  visitor_utm_term?: string;
  visitor_current_url?: string;
  visitor_gclid?: string;
}

export interface SessionFilterDto {
  _id?: string | Types.ObjectId;
  organization_id?: string | Types.ObjectId;
  user_id?: string | Types.ObjectId;
  is_active?: boolean;
  external_room_name?: string;
}

export interface GetSessionsOptionsDto {
  limit?: number;
  offset?: number;
  sortField?: string;
  sortOrder?: 1 | -1;
}
