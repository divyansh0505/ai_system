// ============ Request ============

export interface LiveKitTokenRequest {
  session_id: string;
}

// ============ Response ============

export interface LiveKitTokenResponse {
  token: string;
  room_name: string;
  demo_url?: string | null;
  slides?: string[] | null;
}

// ============ Internal DTOs ============

export interface SlideDto {
  topic: string | null;
  layout_description: string | null;
  content_fields: string[];
  narration: string | null;
  image_url: string | null;
}

export interface AgentMetadataDto {
  organization_id: string;
  organization_config_id: string;
  session_id: string;
  organization_name: string | null;
  navigation_graph: string | null;
  starting_current_node: string | null;
  avatar_id: string | null;
  voice_id: string | null;
  context: string | null;
  project_type: string | null;
  slides: SlideDto[] | null;
}
