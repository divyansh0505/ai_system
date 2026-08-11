import mongoose, { Schema } from 'mongoose';

import type { Permission } from './types';
import { PERMISSION_ACTION } from './types';

const permission_schema = new Schema<Permission>(
  {
    name: { type: String, required: true },
    resource: { type: String, required: true },
    actions: {
      type: [String],
      enum: Object.values(PERMISSION_ACTION),
      default: [PERMISSION_ACTION.READ],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const PermissionModel = mongoose.model<Permission>(
  'permission',
  permission_schema,
);
