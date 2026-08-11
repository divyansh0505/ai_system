import mongoose, { Schema } from 'mongoose';

import type { Organization } from './types';

const organization_schema = new Schema<Organization>(
  {
    name: { type: String, required: true },
    url: { type: String, default: null },
    domain: { type: String, default: null },
    organization_config_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization_config',
      required: true,
    },
    is_active: { type: Boolean, default: true },
    is_interactnow_demo: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationModel = mongoose.model<Organization>(
  'organization',
  organization_schema,
);
