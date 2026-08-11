import API from "@/lib/api";
import { AxiosError } from "axios";

type Auth = {
  accessToken: string;
  refreshToken: string;
};

type RefreshTokenResponse = {
  data: {
    access_token: string;
    refresh_token: string;
  };
};

function extractAuthErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const axiosError = err as AxiosError<{
      error?: { message?: string };
      message?: string;
    }>;

    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return "Failed to authenticate. Please try again.";
}

export interface CreateAuthTokenParams {
  organizationId: string;
  projectId?: string | null;
  projectType?: string | null;
  userEmail?: string | null;
}

export async function createAuthToken({
  organizationId,
  projectId,
  projectType,
  userEmail,
}: CreateAuthTokenParams) {
  const payload: Record<string, string> = {
    organization_id: organizationId,
  };

  if (projectId) {
    payload.project_id = projectId;
  }
  if (projectType) {
    payload.organization_project_type = projectType;
  }
  if (userEmail) {
    payload.user_email = userEmail;
  }

  try {
    const response = await API.post("/auth/generate", payload);
    const { data } = response.data;

    const auth: Auth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };

    return auth;
  } catch (err) {
    throw new Error(extractAuthErrorMessage(err));
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await API.post<RefreshTokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });

  return {
    accessToken: response.data.data.access_token,
    refreshToken: response.data.data.refresh_token,
  };
}

export interface LivekitTokenParams {
  orgId: string;
  projectId?: string | null;
  projectType?: string | null;
}

export async function createLivekitToken({
  orgId,
  projectId,
  projectType,
}: LivekitTokenParams) {
  const sessionResponse = await API.post("/sessions/create", {
    organization_id: orgId,
  });

  // Build the token request payload
  const tokenPayload: Record<string, string> = {
    session_id: sessionResponse.data.data.session_id,
  };

  // Only include project_id and project_type if they are provided
  if (projectId) {
    tokenPayload.project_id = projectId;
  }
  if (projectType) {
    tokenPayload.project_type = projectType;
  }

  const response = await API.post("/livekit/token", tokenPayload);

  // Return session_id along with livekit data
  return {
    ...response.data.data,
    sessionId: sessionResponse.data.data.session_id,
  };
}

export async function enrichUser(
  email: string,
  sessionId: string,
  hubspotutk?: string,
) {
  try {
    const payload: Record<string, string> = {
      user_email: email,
      session_id: sessionId,
    };

    if (hubspotutk) {
      payload.hubspotutk = hubspotutk;
    }

    const response = await API.post("/users/enrich", payload);

    return response.data;
  } catch (error) {
    console.error("Error enriching user:", error);
  }
}
