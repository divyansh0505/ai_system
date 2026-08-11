import mongoose, { Schema } from 'mongoose';

import type { Avatar } from './types';
import { AVATAR_PROVIDER, GENDER } from './types';

const avatar_schema = new Schema<Avatar>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    display_image: { type: String, default: null },
    gender: { type: String, enum: Object.values(GENDER), default: null },
    provider: {
      type: String,
      enum: Object.values(AVATAR_PROVIDER),
      required: true,
    },
    external_id: { type: String, required: true },
    is_custom_generated: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const AvatarModel = mongoose.model<Avatar>('avatar', avatar_schema);
