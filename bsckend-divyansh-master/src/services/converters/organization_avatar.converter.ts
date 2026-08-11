import type { Types } from 'mongoose';

import type { Avatar, OrganizationAvatar } from '../../db/mongo/models/types';
import type { OrganizationAvatarItem } from '../types/organization_avatar.types';

export class OrganizationAvatarConverter {
  static toAvatarItem(
    organizationAvatar: OrganizationAvatar,
  ): OrganizationAvatarItem | null {
    const avatar = organizationAvatar.avatar_id as unknown as Avatar;

    if (!avatar || !avatar.is_active) {
      return null;
    }

    return {
      avatar_id: (avatar._id as Types.ObjectId).toString(),
      name: avatar.name,
      description: avatar.description,
      display_image: avatar.display_image,
      gender: avatar.gender,
      provider: avatar.provider,
      external_id: avatar.external_id,
      is_custom_generated: avatar.is_custom_generated,
    };
  }

  static toOrganizationAvatarItems(
    organizationAvatars: OrganizationAvatar[],
  ): OrganizationAvatarItem[] {
    return organizationAvatars
      .map((orgAvatar) => this.toAvatarItem(orgAvatar))
      .filter((item): item is OrganizationAvatarItem => item !== null);
  }
}
