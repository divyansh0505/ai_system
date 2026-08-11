import type { AVATAR_PROVIDER, GENDER } from '../../db/mongo/models/types';

export interface OrganizationAvatarItem {
  avatar_id: string;
  name: string;
  description?: string;
  display_image?: string;
  gender?: GENDER;
  provider: AVATAR_PROVIDER;
  external_id: string;
  is_custom_generated: boolean;
}
