import mongoose, { Schema } from 'mongoose';

import type { OtpSession } from './types';
import { OTP_PURPOSE } from './types';

const otp_session_schema = new Schema<OtpSession>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    otp_expires_at: { type: Date, required: true },
    is_verified: { type: Boolean, default: false },
    is_used: { type: Boolean, default: false },
    session_type: {
      type: String,
      enum: Object.values(OTP_PURPOSE),
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OtpSessionModel = mongoose.model<OtpSession>(
  'otp_session',
  otp_session_schema,
);
