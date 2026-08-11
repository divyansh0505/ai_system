// ============ Payload Types ============

export interface AccessTokenPayload {
  organization_id: string;
  organization_config_id: string;
  role_id: string;
}

export interface DashboardTokenPayload {
  user_id: string;
  email: string;
  is_dashboard: boolean;
}

export interface RefreshTokenPayload {
  user_id: string;
}

export interface PasswordResetTokenPayload {
  email: string;
}

export interface DashboardAuthContext {
  user_id: string;
  email: string;
  organization_id: string;
  organization: {
    organization_id: string;
    role_id: string;
    is_active: boolean;
  };
}

// ============ Request ============

export interface TokenGenerateRequest {
  organization_id: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface OrganizationLoginRequest {
  email: string;
  password: string;
}

export interface OrganizationSignupRequest {
  email: string;
  password: string;
  organization_id: string;
  role_id?: string;
  first_name?: string;
  last_name?: string;
}

export interface GenerateOtpRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface OtpSignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ============ Response ============

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
}

export interface OrganizationTokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
}

export interface OrganizationLoginResponse {
  tokens: OrganizationTokenPairResponse;
  user_id: string;
  email: string;
  organization_id: string | null;
}

export interface OrganizationSignupResponse {
  user_id: string;
  email: string;
}

export interface GenerateOtpResponse {
  message: string;
  email: string;
}

export interface OtpVerifyResponse {
  message: string;
  email: string;
  is_verified: boolean;
}

export interface OtpSignupResponse {
  user_id: string;
  email: string;
  organization_id: string;
  tokens: OrganizationTokenPairResponse;
}

export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface InternalSignupRequest {
  email: string;
  password: string;
  role?: string;
  org_name: string;
  org_url?: string;
  org_domain?: string;
}

export interface InternalSignupResponse {
  user_id: string;
  email: string;
  organization_id: string;
  organization_name: string;
}
