// ============ Request ============

export interface UserEnrichmentRequest {
  user_email: string;
  session_id: string;
}

// ============ Response ============

export interface UserEnrichmentResponse {
  user_id: string | null;
  message: string;
}

// ============ Apollo DTOs ============

export interface ApolloPersonDataDto {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  linkedin_url?: string;
  title?: string;
  email_status?: string;
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  headline?: string;
  email?: string;
  organization_id?: string;
  employment_history?: Record<string, unknown>[];
  state?: string;
  city?: string;
  country?: string;
  organization?: Record<string, unknown>;
}

export interface ApolloEnrichResponse {
  person: ApolloPersonDataDto | null;
  error?: string;
  status_code?: number;
}

// ============ Enriched Data DTO ============

export interface EnrichedUserDataDto {
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  company_description?: string;
  linkedin_url?: string;
  photo_url?: string;
  city?: string;
  country?: string;
}
