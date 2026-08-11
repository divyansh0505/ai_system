import type { Types } from 'mongoose';

// ============ Repository DTOs ============

export interface CreateOrganizationUserDto {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export interface UpdateOrganizationUserDto {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface OrganizationUserFilterDto {
  _id?: string | Types.ObjectId;
  email?: string;
  is_active?: boolean;
}

export interface CreateOrganizationUserRoleDto {
  organization_user_id: Types.ObjectId;
  organization_id: Types.ObjectId;
  role_id: Types.ObjectId;
  is_active: boolean;
}

export interface UpdateOrganizationUserRoleDto {
  role_id?: Types.ObjectId;
  is_active?: boolean;
}

export interface OrganizationUserRoleFilterDto {
  _id?: string | Types.ObjectId;
  organization_user_id?: string | Types.ObjectId;
  organization_id?: string | Types.ObjectId;
  role_id?: string | Types.ObjectId;
  is_active?: boolean;
}
