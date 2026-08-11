import mongoose from 'mongoose';

export enum EXTERNAL_TOKEN_TYPE {
  LIVEKIT = 'livekit',
}

export enum INTENT_LEVEL {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum INPUT_TYPE {
  EXPECTED_TIMELINE = 'expected_timeline',
  PREFERENCES = 'preferences',
}

export enum MESSAGE_BY {
  BOT = 'BOT',
  HUMAN = 'HUMAN',
}

export enum QNA_TYPE {
  QNA = 'qna',
  INTERACTION = 'interaction',
}

export enum CONFIDENCE_LEVEL {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AGENT_TYPE {
  LIVEKIT = 'livekit',
}

export enum AGENT_NAME {
  FAALTU_AGENT = 'faaltu-agent',
}

export enum PUBLIC_DOMAIN {
  GMAIL = 'gmail.com',
  GOOGLEMAIL = 'googlemail.com',
  YAHOO = 'yahoo.com',
  YMAIL = 'ymail.com',
  ROCKETMAIL = 'rocketmail.com',
  OUTLOOK = 'outlook.com',
  HOTMAIL = 'hotmail.com',
  LIVE = 'live.com',
  MSN = 'msn.com',
  ICLOUD = 'icloud.com',
  ME = 'me.com',
  MAC = 'mac.com',
  AOL = 'aol.com',
  PROTONMAIL = 'protonmail.com',
  PROTON_ME = 'proton.me',
  FASTMAIL = 'fastmail.com',
  ZOHO = 'zoho.com',
  ZOHOMAIL = 'zohomail.com',
  GMX = 'gmx.com',
  GMX_NET = 'gmx.net',
  GMX_DE = 'gmx.de',
  WEB_DE = 'web.de',
  MAIL = 'mail.com',
  INBOX = 'inbox.com',
  YANDEX = 'yandex.com',
  YANDEX_RU = 'yandex.ru',
  TUTANOTA = 'tutanota.com',
  TUTA = 'tuta.com',
  COMCAST = 'comcast.net',
  VERIZON = 'verizon.net',
  ATT = 'att.net',
  SBCGLOBAL = 'sbcglobal.net',
  BELLSOUTH = 'bellsouth.net',
}

export enum TOKEN_TYPE {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export enum PERMISSION_ACTION {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum AVATAR_PROVIDER {
  ANAM = 'anam',
}

export enum VOICE_PROVIDER {
  CARTESIA = 'cartesia',
  ELEVENLABS = 'elevenlabs',
}

export enum GENDER {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ORGANIZATION_PROJECT_TYPE {
  SLIDES = 'slides',
  FLOWS = 'flows',
  DEMO = 'demo',
}

export interface UserSocials {
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
}

export interface User extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  company_logo?: string;
  company_website?: string;
  company_description?: string;
  socials?: UserSocials;
  is_anonymous: boolean;
  phone_number?: string;
  designation?: string;
  enrichment_ttl: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserInputItem {
  type: INPUT_TYPE;
  question: string;
  answer: string;
}

export interface DemoInteractions {
  human: number;
  bot: number;
}

export interface QnAItem {
  question: string;
  answer: string;
  type: QNA_TYPE;
  confidence?: CONFIDENCE_LEVEL;
}

export interface TranscriptItem {
  message: string;
  timestamp: string;
  message_by: MESSAGE_BY;
}

export interface SlideViewMetrics {
  visits: number;
  time_spent: number;
}

export interface SlideAnalyticsItem {
  slide_url: string;
  human: SlideViewMetrics;
  ai: SlideViewMetrics;
}

export interface Session extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  user_id?: mongoose.Types.ObjectId;
  organization_project_id?: mongoose.Types.ObjectId;
  is_active: boolean;
  duration?: number;
  external_token?: string;
  external_token_type?: EXTERNAL_TOKEN_TYPE;
  input: UserInputItem[];
  external_user_name?: string;
  external_room_name?: string;
  is_meeting_booked: boolean;
  total_chat_interactions: number;
  total_voice_interactions: number;
  total_demo_interactions: DemoInteractions;
  video_recording?: string;
  voice_recording?: string;
  transcript: TranscriptItem[];
  transcript_summary?: string;
  is_icp?: boolean | string;
  qna_pairs: QnAItem[];
  slide_analytics: SlideAnalyticsItem[];
  visitor_ip?: string;
  visitor_user_agent?: string;
  visitor_country?: string;
  visitor_subdivision?: string;
  visitor_city?: string;
  visitor_latitude?: number;
  visitor_longitude?: number;
  hubspotutk?: string;
  visitor_utm_campaign?: string;
  visitor_utm_source?: string;
  visitor_utm_medium?: string;
  visitor_utm_term?: string;
  visitor_current_url?: string;
  visitor_gclid?: string;
  intent?: INTENT_LEVEL;
  organization_project_type?: ORGANIZATION_PROJECT_TYPE;
  created_at: Date;
  updated_at: Date;
}

export interface Role extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: mongoose.Types.ObjectId[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationUserRole extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_user_id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AgentConfig {
  project_type?: ORGANIZATION_PROJECT_TYPE;
  agent_name?: string;
  is_active?: boolean;
}

export interface HubspotConfig {
  hubspot_access_token: string;
  hubspot_form_id?: string;
  created_at?: Date;
}

export enum FEATURE_NAME {
  HUBSPOT = 'hubspot',
}

export interface FeatureFlag {
  feature_name: FEATURE_NAME;
  is_active: boolean;
}

export interface OrganizationConfigSettings {
  feature_flags?: FeatureFlag[];
}

export interface OrganizationConfig extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_id?: mongoose.Types.ObjectId;
  settings?: OrganizationConfigSettings;
  agents?: AgentConfig[];
  // TODO: Add BFF support for user_inputs
  user_inputs?: string[]; // e.g., ["email", "compliance_interested_in", "timeline"]
  navigation_graph?: string;
  starting_current_node?: string;
  demo_url?: string;
  hubspot?: HubspotConfig;
  created_at: Date;
  updated_at: Date;
}

export interface Organization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  url?: string;
  domain?: string;
  organization_config_id: mongoose.Types.ObjectId;
  is_active: boolean;
  is_interactnow_demo?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  resource: string;
  actions: PERMISSION_ACTION[];
  created_at: Date;
  updated_at: Date;
}

export interface Avatar extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  display_image?: string;
  gender?: GENDER;
  provider: AVATAR_PROVIDER;
  external_id: string;
  is_custom_generated: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Voice extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  gender?: GENDER;
  provider: VOICE_PROVIDER;
  external_id: string;
  playback_url?: string;
  is_custom_generated: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationProject extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  avatar_id?: mongoose.Types.ObjectId;
  voice_id?: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  deployed_organization_project_type_id: mongoose.Types.ObjectId;
  project_context?: string;
  is_generation_running: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SlideItem {
  topic?: string;
  layout_description?: string;
  content_fields?: string[];
  narration?: string;
  image_url?: string;
}

export enum SLIDES_CONVERSION_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface OrganizationSlides extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_project_id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  version: number;
  knowledge_base?: string;
  thumbnail?: string;
  slides: SlideItem[];
  sequence: number;
  is_active: boolean;
  is_publicly_visible: boolean;
  is_draft: boolean;
  conversion_status: SLIDES_CONVERSION_STATUS;
  conversion_error?: string;
  source_s3_key?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationPages extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  display_name: string;
  is_feature_page: boolean;
  graph_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationFlows extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_project_id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  thumbnail?: string;
  topics: mongoose.Types.ObjectId[];
  pages: mongoose.Types.ObjectId[];
  organization_share_link_id?: mongoose.Types.ObjectId;
  is_active: boolean;
  is_publicly_visible: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationSharableLink extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  user_id: mongoose.Types.ObjectId;
  organization_project_type_id: mongoose.Types.ObjectId;
  organization_project_id: mongoose.Types.ObjectId;
  is_active: boolean;
  ttl?: string;
  is_domain: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationAvatar extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  avatar_id: mongoose.Types.ObjectId;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationVoice extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  organization_id: mongoose.Types.ObjectId;
  voice_id: mongoose.Types.ObjectId;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export enum OTP_PURPOSE {
  SIGNUP_OTP = 'signup_otp',
  PASSWORD_RESET = 'password_reset',
}

export interface OtpSession extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  otp_expires_at: Date;
  is_verified: boolean;
  is_used: boolean;
  session_type: OTP_PURPOSE;
  created_at: Date;
  updated_at: Date;
}

export interface RequestLimiter extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  ip: string;
  created_at: Date;
  updated_at: Date;
}
