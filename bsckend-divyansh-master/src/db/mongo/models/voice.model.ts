import mongoose, { Schema } from 'mongoose';

import type { Voice } from './types';
import { VOICE_PROVIDER, GENDER } from './types';

const voice_schema = new Schema<Voice>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    gender: { type: String, enum: Object.values(GENDER), default: null },
    provider: {
      type: String,
      enum: Object.values(VOICE_PROVIDER),
      required: true,
    },
    external_id: { type: String, required: true },
    playback_url: { type: String, default: null },
    is_custom_generated: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const VoiceModel = mongoose.model<Voice>('voice', voice_schema);
