import type { Types } from 'mongoose';
import type { ORGANIZATION_PROJECT_TYPE } from '../../db/mongo/models/types';

// ============ Repository DTOs ============

export interface CreateOrganizationSharableLinkDto {
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  user_id: Types.ObjectId;
  organization_project_type_id: Types.ObjectId;
  organization_project_id: Types.ObjectId;
  is_domain: boolean;
  is_active?: boolean;
  ttl?: string;
}

export interface UpdateOrganizationSharableLinkDto {
  is_active?: boolean;
  is_domain?: boolean;
  ttl?: string | null;
}
