import type { Types } from 'mongoose';

// ============ Repository DTOs ============

export interface CreateOrganizationFlowsDto {
  organization_project_id: Types.ObjectId;
  organization_id: Types.ObjectId;
  title?: string;
  description?: string;
  instructions?: string;
  thumbnail?: string;
  topics?: Types.ObjectId[];
  pages?: Types.ObjectId[];
  is_active?: boolean;
}

export interface UpdateOrganizationFlowsDto {
  organization_project_id?: Types.ObjectId;
  title?: string;
  description?: string;
  instructions?: string;
  thumbnail?: string;
  topics?: Types.ObjectId[];
  pages?: Types.ObjectId[];
}
