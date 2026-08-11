import mongoose, { Schema } from 'mongoose';

import type { OrganizationSharableLink } from './types';
import { ORGANIZATION_PROJECT_TYPE } from './types';

const organization_sharable_link_schema = new Schema<OrganizationSharableLink>(
  {
    organization_project_type: {
      type: String,
      enum: Object.values(ORGANIZATION_PROJECT_TYPE),
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    organization_project_type_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    organization_project_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization_project',
      required: true,
    },
    is_domain: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    ttl: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationSharableLinkModel =
  mongoose.model<OrganizationSharableLink>(
    'organization_sharable_link',
    organization_sharable_link_schema,
  );
