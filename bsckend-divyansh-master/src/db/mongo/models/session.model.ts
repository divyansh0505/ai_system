import mongoose, { Schema } from 'mongoose';

import type { Session } from './types';
import {
  CONFIDENCE_LEVEL,
  EXTERNAL_TOKEN_TYPE,
  INPUT_TYPE,
  INTENT_LEVEL,
  MESSAGE_BY,
  ORGANIZATION_PROJECT_TYPE,
  QNA_TYPE,
} from './types';

const session_schema = new Schema<Session>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    organization_project_id: {
      type: Schema.Types.ObjectId,
      ref: 'organization_project',
      default: null,
    },
    is_active: { type: Boolean, default: true },
    duration: { type: Number, default: null },
    external_token: { type: String, default: null },
    external_token_type: {
      type: String,
      enum: Object.values(EXTERNAL_TOKEN_TYPE),
      default: null,
    },
    input: [
      {
        type: {
          type: String,
          enum: Object.values(INPUT_TYPE),
          required: true,
        },
        question: { type: String, required: true },
        answer: { type: String, required: true },
        _id: false,
      },
    ],
    external_user_name: { type: String, default: null },
    external_room_name: { type: String, default: null },
    is_meeting_booked: { type: Boolean, default: false },
    total_chat_interactions: { type: Number, default: 0 },
    total_voice_interactions: { type: Number, default: 0 },
    total_demo_interactions: {
      type: {
        human: { type: Number, default: 0 },
        bot: { type: Number, default: 0 },
      },
      default: () => ({ human: 0, bot: 0 }),
      _id: false,
    },
    video_recording: { type: String, default: null },
    voice_recording: { type: String, default: null },
    transcript: [
      {
        message: { type: String, required: true },
        timestamp: { type: String, required: true },
        message_by: {
          type: String,
          enum: Object.values(MESSAGE_BY),
          required: true,
        },
        _id: false,
      },
    ],
    transcript_summary: { type: String, default: null },
    is_icp: { type: Object, default: null },
    qna_pairs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        type: {
          type: String,
          enum: Object.values(QNA_TYPE),
          required: true,
        },
        confidence: {
          type: String,
          enum: Object.values(CONFIDENCE_LEVEL),
          default: null,
        },
        _id: false,
      },
    ],
    slide_analytics: [
      {
        slide_url: { type: String, required: true },
        human: {
          type: {
            visits: { type: Number, default: 0 },
            time_spent: { type: Number, default: 0 },
          },
          default: () => ({ visits: 0, time_spent: 0 }),
          _id: false,
        },
        ai: {
          type: {
            visits: { type: Number, default: 0 },
            time_spent: { type: Number, default: 0 },
          },
          default: () => ({ visits: 0, time_spent: 0 }),
          _id: false,
        },
        _id: false,
      },
    ],
    visitor_ip: { type: String, default: null },
    visitor_user_agent: { type: String, default: null },
    visitor_country: { type: String, default: null },
    visitor_subdivision: { type: String, default: null },
    visitor_city: { type: String, default: null },
    visitor_latitude: { type: Number, default: null },
    visitor_longitude: { type: Number, default: null },
    hubspotutk: { type: String, default: null },
    visitor_utm_campaign: { type: String, default: null },
    visitor_utm_source: { type: String, default: null },
    visitor_utm_medium: { type: String, default: null },
    visitor_utm_term: { type: String, default: null },
    visitor_current_url: { type: String, default: null },
    visitor_gclid: { type: String, default: null },
    intent: {
      type: String,
      enum: Object.values(INTENT_LEVEL),
      default: null,
    },
    organization_project_type: {
      type: String,
      enum: Object.values(ORGANIZATION_PROJECT_TYPE),
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const SessionModel = mongoose.model<Session>('session', session_schema);
