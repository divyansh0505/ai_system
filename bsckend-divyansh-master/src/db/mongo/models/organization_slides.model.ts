import mongoose, { Schema } from 'mongoose';
import { SLIDES_CONVERSION_STATUS } from './types';
import type { OrganizationSlides } from './types';

const organization_slides_schema = new Schema<OrganizationSlides>(
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
    version: { type: Number, required: true },
    knowledge_base: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    slides: {
      type: [
        {
          _id: false,
          topic: { type: String, default: null },
          layout_description: { type: String, default: null },
          content_fields: { type: [String], default: [] },
          narration: { type: String, default: null },
          image_url: { type: String, default: null },
        },
      ],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    is_draft: {
      type: Boolean,
      default: true,
    },
    is_publicly_visible: {
      type: Boolean,
      default: false,
    },
    conversion_status: {
      type: String,
      enum: Object.values(SLIDES_CONVERSION_STATUS),
      default: SLIDES_CONVERSION_STATUS.PENDING,
    },
    conversion_error: {
      type: String,
      default: null,
    },
    source_s3_key: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const OrganizationSlidesModel = mongoose.model<OrganizationSlides>(
  'organization_slides',
  organization_slides_schema,
);
