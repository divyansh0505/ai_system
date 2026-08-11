// ============ Session Analytics Types ============

export interface TranscriptEntry {
  role: string;
  content: string;
}

export interface UserInput {
  answer: string;
  timestamp: string;
  question?: string | null;
}

export interface InteractionCounts {
  voice: number;
  chat: number;
  demo: {
    human: number;
    agent: number;
  };
}

export interface SlideViewMetrics {
  visits: number;
  time_spent: number;
}

export interface SlideAnalyticsEntry {
  slide_url: string;
  human: SlideViewMetrics;
  ai: SlideViewMetrics;
}

export interface SessionAnalyticsData {
  organization_id?: string | null;
  session_id?: string | null;
  room_name?: string | null;
  interactions: InteractionCounts;
  transcripts: TranscriptEntry[];
  user_inputs: UserInput[];
  audio_url?: string | null;
  duration?: number | null;
  user_id?: string | null;
  user_email?: string | null;
  hubspotutk?: string | null;
  is_meeting_booked?: boolean | null;
  slide_analytics?: SlideAnalyticsEntry[];
}

export interface SessionAnalyticsMessage {
  agent?: string | null;
  data: SessionAnalyticsData;
}

// ============ PostHog Types ============

export enum PosthogEventType {
  SESSION_ENDED = 'session_ended',
  SESSION_STARTED = 'session_started',
}

export interface PosthogEventProperties {
  session_id?: string;
  $ip?: string;
  $raw_user_agent?: string;
  $geoip_city_name?: string;
  $geoip_country_name?: string;
  $geoip_latitude?: number;
  $geoip_longitude?: number;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_term?: string;
  $current_url?: string;
  gclid?: string;
  $set?: {
    $geoip_region_name?: string;
  };
  [key: string]: unknown;
}

export interface PosthogPersonProperties {
  [key: string]: unknown;
}

export interface PosthogMessage {
  event: {
    event: string;
    properties: PosthogEventProperties;
    uuid?: string;
    distinct_id?: string;
  };
  person: {
    properties: PosthogPersonProperties;
  };
}
