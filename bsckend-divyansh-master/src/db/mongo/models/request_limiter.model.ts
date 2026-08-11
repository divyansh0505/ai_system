import mongoose, { Schema } from 'mongoose';

import type { RequestLimiter } from './types';

const request_limiter_schema = new Schema<RequestLimiter>(
  {
    email: { type: String, required: true },
    ip: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const RequestLimiterModel = mongoose.model<RequestLimiter>(
  'request_limiter',
  request_limiter_schema,
);
