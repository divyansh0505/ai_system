// ============ Enums ============

export enum MonthName {
  Jan = 0,
  Feb = 1,
  Mar = 2,
  Apr = 3,
  May = 4,
  Jun = 5,
  Jul = 6,
  Aug = 7,
  Sep = 8,
  Oct = 9,
  Nov = 10,
  Dec = 11,
}

export const MONTH_NAMES: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

// ============ Common DTOs ============

export interface MetricWithChangeDto {
  current: number;
  change: number;
}

export interface PaginationDto {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============ Request ============

export interface StatsRequest {
  current_period_start_date: Date;
  current_period_end_date: Date;
  previous_period_start_date: Date;
  previous_period_end_date: Date;
  region?: string;
}

export interface SessionsListRequest {
  start_date: Date;
  end_date: Date;
  region?: string;
  limit?: number;
  offset?: number;
}

export interface VisitorDataRequest {
  current_period_start_date: Date;
  current_period_end_date: Date;
  previous_period_start_date: Date;
  previous_period_end_date: Date;
  country?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============ Response ============

export interface SessionStatsDto {
  current_period: number;
  change: number;
}

export interface StatsResponse {
  sessions: SessionStatsDto;
  total_pages_visited: MetricWithChangeDto;
  average_session_duration: MetricWithChangeDto;
  active_time_spent: MetricWithChangeDto;
}

export interface TranscriptItemDto {
  message: string;
  timestamp: string | Date | number;
  message_by: string;
}

export interface SessionDataDto {
  session_id: string;
  date: Date;
  email: string | null;
  session_time: number;
  country: string | null;
  city: string | null;
  voice_recording_link: string | null;
  transcripts: TranscriptItemDto[] | null;
}

export interface SessionsListResponse extends PaginationDto {
  data: SessionDataDto[];
}

export type IntentLevel = 'high' | 'medium' | 'low';

export interface VisitorsMetricsDto {
  visits: MetricWithChangeDto;
  emails_captured: number;
  queries_asked: number;
  platform_engagement: number;
}

export interface VisitorInfoDto {
  name: string | null;
  email: string | null;
  is_meeting_booked: boolean;
}

export interface VisitorTableRowDto {
  session_id: string;
  visitor: VisitorInfoDto;
  intent: IntentLevel | null;
  company: string | null;
  session_duration: number;
  source: string | null;
  visited_on: Date;
  pitch_name: string | null;
  thumbnail: string | null;
}

export interface VisitorsTableDataDto extends PaginationDto {
  rows: VisitorTableRowDto[];
}

export interface VisitorsTabResponseDto {
  metrics: VisitorsMetricsDto;
  table: VisitorsTableDataDto;
}

export interface VisitorDataResponse {
  data: VisitorsTabResponseDto;
}

export interface SessionDetailResponse {
  data: SessionDetailData;
}

export interface SessionDetailData {
  session_id: string;
  organization_id: string | null;
  user_id: string | null;
  session_duration: number | null;
  user_preference: string | null;
  is_meeting_booked: boolean;
  total_chat_interactions: number;
  total_voice_interactions: number;
  total_demo_interactions: { human: number; bot: number } | null;
  voice_recording: string | null;
  transcript: Array<{
    message: string;
    timestamp: string;
    message_by: string;
  }> | null;
  transcript_summary: string | null;
  is_icp: boolean | string | null;
  qna_pairs: Array<{
    question: string;
    answer: string;
    type: string;
    confidence?: string | null;
  }> | null;
  visitor_country: string | null;
  visitor_subdivision: string | null;
  visitor_city: string | null;
  visitor_utm_campaign: string | null;
  visitor_utm_source: string | null;
  visitor_utm_medium: string | null;
  visitor_utm_term: string | null;
  visitor_current_url: string | null;
  intent: string | null;
  user: SessionDetailUserData | null;
}

export interface SessionDetailUserData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  company_logo: string | null;
  company_website: string | null;
  socials: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
  } | null;
  designation: string | null;
}

// ============ Project Sessions API ============

export interface ProjectSessionsRequest {
  start_date?: Date;
  end_date?: Date;
  country?: string;
  company?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectSessionsMetricsDto {
  total_visitors: number;
  avg_duration: { minutes: number; seconds: number };
  total_queries_asked: {
    total: number;
    voice_percentage: number;
    chat_percentage: number;
  };
}

export interface ChartDataPointDto {
  date: string;
  visitors: number;
}

export interface ProjectVisitorRowDto {
  session_id: string;
  visitor: VisitorInfoDto;
  intent: IntentLevel | null;
  demo_booked: boolean;
  company: string | null;
  total_duration: number;
  last_visited_on: Date;
}

export interface ProjectSessionsResponse {
  metrics: ProjectSessionsMetricsDto;
  chart: ChartDataPointDto[];
  visitors: {
    rows: ProjectVisitorRowDto[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
