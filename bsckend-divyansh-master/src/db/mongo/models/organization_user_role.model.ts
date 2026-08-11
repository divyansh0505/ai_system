import mongoose, { Schema } from 'mongoose';

import type { OrganizationUserRole } from './types';

const organization_user_role_schema = new Schema<OrganizationUserRole>(
  {
    organization_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization_user',
      required: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: 'role',
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationUserRoleModel = mongoose.model<OrganizationUserRole>(
  'organization_user_role',
  organization_user_role_schema,
);
