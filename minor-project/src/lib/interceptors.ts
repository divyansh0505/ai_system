import {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useSessionStore } from "@/store/sessionStore";
import { refreshAccessToken } from "@/services/auth";
import { resetAllStores } from "@/lib/resetStores";

// Extended config type to track retry attempts
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Shared state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Request interceptor that automatically attaches the access token
 * to all outgoing requests
 */
function onRequest(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const { auth } = useSessionStore.getState();

  // Attach access token if auth exists and token is available
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return config;
}

/**
 * Request error handler
 */
function onRequestError(error: AxiosError): Promise<never> {
  return Promise.reject(error);
}

/**
 * Response success handler - pass through successful responses
 */
function onResponse<T = unknown>(response: AxiosResponse<T>): AxiosResponse<T> {
  return response;
}

/**
 * Response error handler that detects 401 errors and triggers token refresh
 */
async function onResponseError(
  error: AxiosError,
  axiosInstance: AxiosInstance,
): Promise<AxiosResponse<unknown>> {
  const originalRequest = error.config as RetryableRequestConfig | undefined;

  // If no config, reject immediately
  if (!originalRequest) {
    return Promise.reject(error);
  }

  // If error is not 401 or request has already been retried, reject immediately
  if (error.response?.status !== 401 || originalRequest._retry) {
    return Promise.reject(error);
  }

  // Don't retry the refresh endpoint itself to prevent infinite loops
  if (originalRequest.url?.includes("/auth/refresh")) {
    console.error("Refresh token is invalid or expired. Logging out...");
    resetAllStores(); // Reset all stores on auth failure
    return Promise.reject(error);
  }

  // Mark this request as retried
  originalRequest._retry = true;

  try {
    // Get the current refresh token
    const { auth } = useSessionStore.getState();

    if (!auth?.refreshToken) {
      console.error("No refresh token available. Logging out...");
      resetAllStores(); // Reset all stores on auth failure
      return Promise.reject(error);
    }

    // If not currently refreshing, start a new refresh
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken(auth.refreshToken)
        .then(({ accessToken, refreshToken }) => {
          // Update tokens in store
          const { setAuth } = useSessionStore.getState();
          setAuth({ accessToken, refreshToken });
          return accessToken;
        })
        .catch((refreshError: Error) => {
          // Refresh failed - log out user
          console.error("Token refresh failed. Logging out...", refreshError);
          resetAllStores(); // Reset all stores on auth failure
          throw refreshError;
        })
        .finally(() => {
          // Reset refresh state
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    // Wait for the refresh to complete
    const newAccessToken = await refreshPromise;

    // Ensure we got a valid token
    if (!newAccessToken) {
      console.error("Failed to get new access token");
      return Promise.reject(error);
    }

    // Update the failed request with new token
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    // Retry the original request with new token
    return axiosInstance(originalRequest);
  } catch {
    // If refresh fails, reject with the original error
    return Promise.reject(error);
  }
}

/**
 * Setup interceptors on an Axios instance
 */
export function setupInterceptors(axiosInstance: AxiosInstance): AxiosInstance {
  // Request interceptor
  axiosInstance.interceptors.request.use(onRequest, onRequestError);

  // Response interceptor
  axiosInstance.interceptors.response.use(onResponse, (error: AxiosError) =>
    onResponseError(error, axiosInstance),
  );

  return axiosInstance;
}
