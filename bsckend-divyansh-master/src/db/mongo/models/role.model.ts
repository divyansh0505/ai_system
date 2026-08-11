import mongoose, { Schema } from 'mongoose';

import type { Role } from './types';

const role_schema = new Schema<Role>(
  {
    name: { type: String, required: true },
    description: { type: String },
    permissions: {
      type: [Schema.Types.ObjectId],
      ref: 'permission',
      default: [],
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const RoleModel = mongoose.model<Role>('role', role_schema);
