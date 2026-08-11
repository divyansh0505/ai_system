import type { Types } from 'mongoose';
import type { UserSocials } from '../../db/mongo/models/types';

// ============ Repository DTOs ============

export interface CreateUserDto {
  email?: string;
  is_anonymous: boolean;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone_number?: string;
  designation?: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  company_logo?: string;
  company_website?: string;
  socials?: UserSocials;
  is_anonymous?: boolean;
  phone_number?: string;
  designation?: string;
  enrichment_ttl?: Date;
}

export interface UserFilterDto {
  _id?: string | Types.ObjectId;
  email?: string;
  is_anonymous?: boolean;
}
