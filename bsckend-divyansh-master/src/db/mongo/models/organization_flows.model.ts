import mongoose, { Schema } from 'mongoose';

import { config } from '../../../../config';

import type { OrganizationFlows } from './types';

const organization_flows_schema = new Schema<OrganizationFlows>(
  {
    organization_project_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization_project',
      required: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    thumbnail: {
      type: String,
      default: config.defaults.default_project_thumbnail,
    },
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: 'organization_pages' }],
      default: [],
    }, //feature pages from graph is a topic
    pages: {
      type: [{ type: Schema.Types.ObjectId, ref: 'organization_pages' }],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    is_publicly_visible: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationFlowsModel = mongoose.model<OrganizationFlows>(
  'organization_flows',
  organization_flows_schema,
);
