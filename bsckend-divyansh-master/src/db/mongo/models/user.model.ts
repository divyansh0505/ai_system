import mongoose, { Schema } from 'mongoose';

import type { User } from './types';

const user_schema = new Schema<User>(
  {
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, default: null },
    company_name: { type: String, default: null },
    company_logo: { type: String, default: null },
    company_website: { type: String, default: null },
    company_description: { type: String, default: null },
    socials: {
      type: {
        linkedin: { type: String, default: null },
        facebook: { type: String, default: null },
        twitter: { type: String, default: null },
        instagram: { type: String, default: null },
        github: { type: String, default: null },
      },
      default: null,
      _id: false,
    },
    is_anonymous: { type: Boolean, default: false },
    phone_number: { type: String, default: null },
    designation: { type: String, default: null },
    enrichment_ttl: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const UserModel = mongoose.model<User>('user', user_schema);
