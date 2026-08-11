import mongoose, { Schema } from 'mongoose';

import type { OrganizationConfig } from './types';
import { ORGANIZATION_PROJECT_TYPE, FEATURE_NAME } from './types';

const organization_config_schema = new Schema<OrganizationConfig>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
    },
    settings: {
      feature_flags: {
        type: [
          {
            feature_name: {
              type: String,
              enum: Object.values(FEATURE_NAME),
              required: true,
            },
            is_active: { type: Boolean, default: false },
          },
        ],
        _id: false,
        default: [{ feature_name: FEATURE_NAME.HUBSPOT, is_active: false }],
      },
      _id: false,
    },
    agents: [
      {
        project_type: {
          type: String,
          enum: Object.values(ORGANIZATION_PROJECT_TYPE),
        },
        agent_name: { type: String },
        is_active: { type: Boolean, default: true },
        _id: false,
      },
    ],
    // TODO: Add BFF support for user_inputs
    user_inputs: { type: [String], default: [] }, // e.g., ["email", "compliance_interested_in", "timeline"]
    navigation_graph: { type: String, default: null },
    starting_current_node: { type: String, default: null },
    demo_url: { type: String, default: null },
    hubspot: {
      hubspot_access_token: { type: String },
      hubspot_form_id: { type: String, default: null },
      created_at: { type: Date, default: Date.now },
      _id: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationConfigModel = mongoose.model<OrganizationConfig>(
  'organization_config',
  organization_config_schema,
);
