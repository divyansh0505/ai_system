// ============ Session Analytics DTOs ============

export interface DemoInteractionDto {
  human: number;
  agent: number;
}

export interface InteractionsDto {
  voice: number;
  chat: number;
  demo: DemoInteractionDto;
}

export interface TranscriptDto {
  role: string;
  content: string;
}

export interface UserInputDto {
  type: string;
  question: string;
  answer: string;
}

export interface SessionAnalyticsDataDto {
  organization_id: string;
  session_id: string;
  room_name: string;
  interactions: InteractionsDto;
  transcripts: TranscriptDto[];
  user_inputs: UserInputDto[];
  audio_url: string | null;
  duration: number;
  user_id: string;
  user_email: string;
  hubspotutk: string | null;
  is_meeting_booked: boolean;
}

export interface SessionAnalyticsWebhookRequest {
  agent: string;
  data: SessionAnalyticsDataDto;
}

// ============ PostHog DTOs ============

export interface PostHogProjectDto {
  id: number;
  name: string;
  url: string;
}

export interface PostHogEventDto {
  uuid: string;
  event: string;
  distinct_id: string;
  elements_chain: string;
  properties: Record<string, unknown>;
  timestamp: string;
  url: string;
}

export interface PostHogPersonDto {
  id: string;
  properties: Record<string, unknown>;
  name: string;
  url: string;
}

export interface PostHogSourceDto {
  name: string;
  url: string;
}

export interface PostHogWebhookRequest {
  project: PostHogProjectDto | null;
  event: PostHogEventDto;
  person: PostHogPersonDto;
  groups: Record<string, unknown>;
  source: PostHogSourceDto | null;
}

// ============ Response ============

export interface WebhookResponse {
  success: boolean;
  message: string;
  queued: boolean;
}
