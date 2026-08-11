import mongoose, { Schema } from 'mongoose';

import type { OrganizationPages } from './types';

const organization_pages_schema = new Schema<OrganizationPages>(
  {
    display_name: { type: String, required: true },
    is_feature_page: { type: Boolean, default: false },
    graph_name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationPagesModel = mongoose.model<OrganizationPages>(
  'organization_pages',
  organization_pages_schema,
);
