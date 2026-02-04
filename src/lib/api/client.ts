import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Track if we're currently refreshing to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // IMPORTANT: Enable credentials to send/receive HttpOnly cookies
  withCredentials: true,
});

// Response interceptor - Handle 401 and refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';

    // List of endpoints that should NOT trigger token refresh
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/refresh')
      || requestUrl.includes('/auth/logout')
      || requestUrl.includes('/auth/me')  // CRITICAL: Don't refresh on /me failure
      || requestUrl.includes('/auth/verify-email')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/forgot-password')
      || requestUrl.includes('/auth/reset-password');

    // Only attempt refresh for 401 errors on non-auth endpoints that haven't been retried
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token - refresh token is in HttpOnly cookie, sent automatically
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Process queued requests
        processQueue(null);

        // After successful refresh, retry the original request
        // New access token cookie will be set by the backend
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError);

        // Refresh failed, logout user
        const authStore = useAuthStore.getState();
        await authStore.logout();

        // Only redirect if we're in the browser and not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
