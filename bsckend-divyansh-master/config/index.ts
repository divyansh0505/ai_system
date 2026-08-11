import { AVATAR_PROVIDER, VOICE_PROVIDER } from '../src/db/mongo/models/types';

export { PROMPT_CONFIG } from './prompt.config';

export enum ServerEnvironment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export const config = {
  env: (process.env.SERVER_ENV as ServerEnvironment) || ServerEnvironment.LOCAL,
  server: {
    port: process.env.PORT || 8000,
  },
  database: {
    mongo: {
      uri: (process.env.MONGO_URI as string) || '',
    },
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET as string,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET as string,
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY as string,
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY as string,
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '300', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '3600', 10),
    algorithm: (process.env.JWT_ALGORITHM || 'HS256') as
      | 'HS256'
      | 'HS384'
      | 'HS512',
  },
  internal: {
    chicken: {
      secret: (process.env.INTERNAL_CHICKEN_SECRET as string) || '',
      header: 'internal-chicken-secret',
    },
  },
  apollo: {
    apiUrl:
      (process.env.APOLLO_API_URL as string) || 'https://api.apollo.io/v1',
    apiKey: (process.env.APOLLO_API_KEY as string) || '',
  },
  enrichment: {
    ttlDays: parseInt(process.env.ENRICHMENT_TTL_DAYS || '90', 10),
  },
  livekit: {
    url: (process.env.LIVEKIT_URL as string) || '',
    apiKey: (process.env.LIVEKIT_API_KEY as string) || '',
    apiSecret: (process.env.LIVEKIT_API_SECRET as string) || '',
  },
  aws: {
    accessKeyId: (process.env.AWS_ACCESS_KEY_ID as string) || '',
    secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY as string) || '',
    region: (process.env.AWS_REGION as string) || 'us-east-1',
    sqs: {
      livekitSessionAnalyticsQueueUrl:
        (process.env.LIVEKIT_SESSION_ANALYTICS_QUEUE_URL as string) || '',
      livekitSessionAnalyticsDlqUrl:
        (process.env.LIVEKIT_SESSION_ANALYTICS_DLQ_URL as string) || '',
      posthogAnalyticsQueueUrl:
        (process.env.POSTHOG_ANALYTICS_QUEUE_URL as string) || '',
      posthogAnalyticsDlqUrl:
        (process.env.POSTHOG_ANALYTICS_DLQ_URL as string) || '',
      hubspotSyncQueueUrl:
        (process.env.HUBSPOT_SYNC_QUEUE_URL as string) || '',
      hubspotSyncDlqUrl: (process.env.HUBSPOT_SYNC_DLQ_URL as string) || '',
      slidesConversionQueueUrl:
        (process.env.SLIDES_CONVERSION_QUEUE_URL as string) || '',
      slidesConversionDlqUrl:
        (process.env.SLIDES_CONVERSION_DLQ_URL as string) || '',
    },
    s3: {
      organizationSlides: {
        bucket: (process.env.AWS_S3_ORGANIZATION_SLIDES_BUCKET as string) || '',
        region:
          (process.env.AWS_S3_ORGANIZATION_SLIDES_REGION as string) ||
          'us-east-1',
      },
      voices: {
        bucket:
          (process.env.AWS_S3_VOICES_BUCKET as string) ||
          'prod.assets.interactlabs.ai',
        region: (process.env.AWS_S3_VOICES_REGION as string) || 'us-east-1',
      },
    },
    ses: {
      region: process.env.SES_REGION as string,
      senderEmail: process.env.SES_SENDER_EMAIL as string,
    },
  },
  azure_openai: {
    base_url: (process.env.AZURE_OPENAI_BASE_URL as string) || '',
    api_key: (process.env.AZURE_OPENAI_API_KEY as string) || '',
    api_version:
      (process.env.AZURE_OPENAI_API_VERSION as string) || '2024-02-01',
    model: (process.env.AZURE_OPENAI_MODEL as string) || 'gpt-4o-mini',
  },
  openai: {
    api_key: (process.env.OPENAI_API_KEY as string) || '',
    base_url:
      (process.env.CUSTOM_OPENAI_BASE_URL as string) ||
      'https://api.openai.com/v1',
    model: (process.env.OPENAI_MODEL as string) || 'gpt-4o-mini',
  },
  gemini: {
    api_key: (process.env.GEMINI_API_KEY as string) || '',
    base_url:
      (process.env.GEMINI_BASE_URL as string) ||
      'https://aiplatform.googleapis.com/v1/publishers/google/models',
    model: (process.env.GEMINI_MODEL as string) || 'gemini-2.5-flash',
  },
  google_sheets: {
    spreadsheet_id: (process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string) || '',
    credentials: process.env.GOOGLE_SHEETS_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS as string)
      : null,
  },
  upload: {
    powerpointMaxFileSize: process.env.UPLOAD_POWERPOINT_MAX_FILE_SIZE
      ? parseInt(process.env.UPLOAD_POWERPOINT_MAX_FILE_SIZE, 10)
      : 50 * 1024 * 1024,
    imageMaxFileSize: process.env.UPLOAD_IMAGE_MAX_FILE_SIZE
      ? parseInt(process.env.UPLOAD_IMAGE_MAX_FILE_SIZE, 10)
      : 10 * 1024 * 1024,
    audioMaxFileSize: process.env.UPLOAD_AUDIO_MAX_FILE_SIZE
      ? parseInt(process.env.UPLOAD_AUDIO_MAX_FILE_SIZE, 10)
      : 10 * 1024 * 1024,
  },
  feature_flags: {
    consumers: {
      livekit_session_analytics:
        process.env.FEATURE_FLAG_LIVEKIT_CONSUMER === 'true',
      posthog_analytics: process.env.FEATURE_FLAG_POSTHOG_CONSUMER === 'true',
      hubspot_sync: process.env.FEATURE_FLAG_HUBSPOT_CONSUMER === 'true',
      slides_conversion:
        process.env.FEATURE_FLAG_SLIDES_CONVERSION_CONSUMER === 'true',
    },
    google_sheets: process.env.FEATURE_FLAG_GOOGLE_SHEETS === 'true',
  },
  dahi: {
    baseUrl:
      (process.env.DAHI_BASE_URL as string) ||
      'https://c150953455bb.ngrok-free.app',
    secret: (process.env.DAHI_SECRET as string) || 'your_internal_secret_here',
  },
  interact: {
    baseUrl:
      (process.env.INTERACT_BASE_URL as string) || 'http://localhost:3000',
  },
  adminDashboard: {
    baseUrl:
      (process.env.ADMIN_DASHBOARD_BASE_URL as string) ||
      'https://admin.interactlabs.ai',
  },
  customAvatar: {
    defaultProvider:
      (process.env.CUSTOM_AVATAR_DEFAULT_PROVIDER as AVATAR_PROVIDER) ||
      AVATAR_PROVIDER.ANAM,
    anam: {
      apiKey: (process.env.ANAM_API_KEY as string) || '',
      baseUrl:
        (process.env.ANAM_BASE_URL as string) || 'https://api.anam.ai/v1',
    },
  },
  customVoice: {
    defaultProvider:
      (process.env.CUSTOM_VOICE_DEFAULT_PROVIDER as VOICE_PROVIDER) ||
      VOICE_PROVIDER.CARTESIA,
    cartesia: {
      apiKey: (process.env.CARTESIA_API_KEY as string) || '',
      baseUrl:
        (process.env.CARTESIA_BASE_URL as string) || 'https://api.cartesia.ai',
      version: (process.env.CARTESIA_VERSION as string) || '2025-04-16',
    },
  },
  defaults: {
    default_project_thumbnail:
      (process.env.DEFAULT_PROJECT_THUMBNAIL_URL as string) ||
      'https://upload.wikimedia.org/wikipedia/commons/b/bb/Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg',
    avatar: {
      external_id: 'e9a3d7ee-9c33-462a-b490-f977cb6df6f7',
      provider: AVATAR_PROVIDER.ANAM,
    },
    voice: {
      external_id: '6d914c39-6b08-4010-9cd3-93c3755a21a7',
      provider: VOICE_PROVIDER.CARTESIA,
    },
  },
  encryption: {
    key: (process.env.ENCRYPTION_KEY as string) || '',
    algorithm: 'aes-256-gcm' as const,
    initializationVectorLength: 16,
    authenticationTagLength: 16,
  },
  hubspot: {
    apiUrl: 'https://api.hubapi.com',
  },
};
