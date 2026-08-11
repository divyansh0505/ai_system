import API from "@/lib/api";

export interface Session {
  userId: string;
  email?: string;
  callId?: string;
  assistantId?: string;
  domain?: string;
  provider?: string;
}

export interface SessionResponse {
  data: {
    message: string;
  };
  success: boolean;
  error: Error;
}

export async function createSession({
  userId,
  email,
  callId,
  assistantId,
  domain,
  provider,
}: Session): Promise<SessionResponse> {
  const response = await API.post("/session", {
    user_id: userId,
    email,
    call_id: callId,
    assistant_id: assistantId,
    domain,
    provider,
  });
  return response.data;
}
