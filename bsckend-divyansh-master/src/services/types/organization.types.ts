import type { Types } from 'mongoose';

// ============ Repository DTOs ============

export interface CreateOrganizationDto {
  name: string;
  url?: string;
  domain?: string;
  organization_config_id: Types.ObjectId;
  is_active: boolean;
  is_interactnow_demo?: boolean;
}

export interface UpdateOrganizationDto {
  name?: string;
  url?: string;
  domain?: string;
  organization_config_id?: Types.ObjectId;
  is_active?: boolean;
  is_interactnow_demo?: boolean;
}

export interface OrganizationFilterDto {
  _id?: string | Types.ObjectId;
  name?: string;
  domain?: string;
  is_active?: boolean;
  is_interactnow_demo?: boolean;
}
