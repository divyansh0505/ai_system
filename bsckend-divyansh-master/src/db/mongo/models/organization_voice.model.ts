import mongoose, { Schema } from 'mongoose';

import type { OrganizationVoice } from './types';

const organization_voice_schema = new Schema<OrganizationVoice>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    voice_id: {
      type: Schema.Types.ObjectId,
      ref: 'voice',
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationVoiceModel = mongoose.model<OrganizationVoice>(
  'organization_voice',
  organization_voice_schema,
);
