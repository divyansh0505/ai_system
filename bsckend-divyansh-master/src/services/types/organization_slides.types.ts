import type { Types } from 'mongoose';
import type { SLIDES_CONVERSION_STATUS } from '../../db/mongo/models/types';

// ============ Request ============

export interface CreateOrganizationSlidesRequest {
  title?: string;
  avatar_id?: string;
  voice_id?: string;
  project_context?: string;
  thumbnail?: string;
}

export interface SlideNarrationUpdate {
  image_url: string;
  narration: string;
}

export interface UpdateOrganizationSlidesRequest {
  title?: string;
  description?: string;
  avatar_id?: string;
  voice_id?: string;
  project_context?: string;
  thumbnail?: string;
  is_active?: boolean;
  is_draft?: boolean;
  is_publicly_visible?: boolean;
  narrations?: SlideNarrationUpdate[];
}

// ============ Response ============

export interface SlideItemResponse {
  image_url?: string;
  narration?: string;
}

export interface CreateOrganizationSlidesResponse {
  organization_project_id: string;
  organization_slides_id: string;
  slides: SlideItemResponse[];
}

export interface UpdateOrganizationSlidesResponse {
  organization_project_id: string;
  organization_slides_id?: string;
  organization_flow_id?: string;
  slides_count?: number;
}

// ============ Repository DTOs ============

export interface CreateOrganizationSlidesDto {
  organization_project_id: Types.ObjectId;
  organization_id: Types.ObjectId;
  version: number;
  slides: SlideItemDto[];
  knowledge_base?: string;
  thumbnail?: string;
}

export interface SlideItemDto {
  topic?: string;
  layout_description?: string;
  content_fields?: string[];
  narration?: string;
  image_url?: string;
}

export interface UpdateOrganizationSlidesDto {
  version?: number;
  slides?: SlideItemDto[];
  thumbnail?: string;
  is_draft?: boolean;
  is_active?: boolean;
  is_publicly_visible?: boolean;
  conversion_status?: SLIDES_CONVERSION_STATUS;
  conversion_error?: string | null;
  source_s3_key?: string;
}

export interface OrganizationSlidesFilterDto {
  _id?: string | Types.ObjectId;
  organization_project_id?: string | Types.ObjectId;
  organization_id?: string | Types.ObjectId;
  version?: number;
}
