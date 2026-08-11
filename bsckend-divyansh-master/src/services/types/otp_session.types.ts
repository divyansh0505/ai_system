// ============ Repository DTOs ============

export interface CreateOtpSessionDto {
  email: string;
  otp: string;
  otp_expires_at: Date;
  session_type: string;
}

export interface UpdateOtpSessionDto {
  is_verified?: boolean;
  is_used?: boolean;
  otp?: string;
  otp_expires_at?: Date;
}
