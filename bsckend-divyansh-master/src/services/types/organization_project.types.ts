import type { Types } from 'mongoose';
import type { ORGANIZATION_PROJECT_TYPE } from '../../db/mongo/models/types';

// ============ Request ============

export interface CheckProjectAccessRequest {
  user_email: string;
  project_id: string;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
}

// ============ Repository DTOs ============

export interface CreateOrganizationProjectDto {
  _id?: Types.ObjectId;
  title?: string;
  description?: string;
  avatar_id?: Types.ObjectId;
  voice_id?: Types.ObjectId;
  organization_id: Types.ObjectId;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  deployed_organization_project_type_id?: Types.ObjectId;
  project_context?: string;
}

export interface UpdateOrganizationProjectDto {
  title?: string;
  description?: string;
  avatar_id?: Types.ObjectId;
  voice_id?: Types.ObjectId;
  deployed_organization_project_type_id?: Types.ObjectId;
  organization_project_type?: ORGANIZATION_PROJECT_TYPE;
  deployed_slide_version?: Types.ObjectId;
  project_context?: string;
  is_generation_running?: boolean;
}

export interface OrganizationProjectFilterDto {
  _id?: string | Types.ObjectId;
  organization_id?: string | Types.ObjectId;
  title?: string;
}
