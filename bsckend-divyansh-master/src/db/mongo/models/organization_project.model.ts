import mongoose, { Schema } from 'mongoose';

import { ORGANIZATION_PROJECT_TYPE, type OrganizationProject } from './types';

const organization_project_schema = new Schema<OrganizationProject>(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    avatar_id: {
      type: Schema.Types.ObjectId,
      ref: 'avatar',
      default: null,
    },
    voice_id: {
      type: Schema.Types.ObjectId,
      ref: 'voice',
      default: null,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    organization_project_type: {
      type: String,
      enum: Object.values(ORGANIZATION_PROJECT_TYPE),
    },
    deployed_organization_project_type_id: {
      type: Schema.Types.ObjectId,
    },
    project_context: {
      type: String,
      default: '',
    },
    is_generation_running: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationProjectModel = mongoose.model<OrganizationProject>(
  'organization_project',
  organization_project_schema,
);
