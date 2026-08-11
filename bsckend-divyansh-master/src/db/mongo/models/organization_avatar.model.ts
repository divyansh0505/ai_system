import mongoose, { Schema } from 'mongoose';

import type { OrganizationAvatar } from './types';

const organization_avatar_schema = new Schema<OrganizationAvatar>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    avatar_id: {
      type: Schema.Types.ObjectId,
      ref: 'avatar',
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationAvatarModel = mongoose.model<OrganizationAvatar>(
  'organization_avatar',
  organization_avatar_schema,
);
