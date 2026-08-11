import mongoose, { Schema } from 'mongoose';

import type { OrganizationUser } from './types';

const organization_user_schema = new Schema<OrganizationUser>(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationUserModel = mongoose.model<OrganizationUser>(
  'organization_user',
  organization_user_schema,
);
