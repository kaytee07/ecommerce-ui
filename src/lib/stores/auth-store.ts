import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { apiClient } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;

  setUser: (user: User | null) => void;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

// Flag to prevent concurrent refresh attempts across the entire app
let isRefreshingGlobal = false;
let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isRefreshing: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (credentials) => {
        // Login - tokens are set as HttpOnly cookies by the backend
        const response = await apiClient.post<{ status: boolean; data: AuthResponse; message: string }>(
          '/auth/login',
          credentials
        );

        // After successful login, fetch user info
        // The access token is now in HttpOnly cookies, sent automatically
        try {
          const userResponse = await apiClient.get<{ status: boolean; data: User; message: string }>('/auth/me');
          set({ user: userResponse.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          // If we can't get user info, still mark as authenticated based on login success
          set({ isAuthenticated: true, isLoading: false });
        }

        return response.data.data;
      },

      register: async (data) => {
        const response = await apiClient.post<{ status: boolean; data: User; message: string }>(
          '/auth/register',
          data
        );
        return response.data.data;
      },

      logout: async () => {
        // Clear local state immediately
        set({ user: null, isAuthenticated: false, isRefreshing: false });

        // Reset global refresh state
        isRefreshingGlobal = false;
        refreshPromise = null;

        // Try to notify backend to clear cookies, but don't wait or fail on error
        // This is a "fire and forget" operation since we've already cleared local state
        try {
          await apiClient.post('/auth/logout').catch(() => {
            // Silently ignore - cookies might already be invalid
          });
        } catch {
          // Ignore all errors
        }
      },

      refreshToken: async (): Promise<boolean> => {
        // If already refreshing globally, wait for that refresh to complete
        if (isRefreshingGlobal && refreshPromise) {
          return refreshPromise;
        }

        // Start refresh
        isRefreshingGlobal = true;
        set({ isRefreshing: true });

        refreshPromise = (async () => {
          try {
            // Refresh token is also in HttpOnly cookie, sent automatically
            await apiClient.post('/auth/refresh');

            // After refresh, verify by getting user info
            const response = await apiClient.get<{ status: boolean; data: User; message: string }>('/auth/me');
            set({ user: response.data.data, isAuthenticated: true, isRefreshing: false });

            return true;
          } catch (error) {
            // Refresh failed - clear auth state
            set({ user: null, isAuthenticated: false, isRefreshing: false });
            return false;
          } finally {
            // Reset global refresh state
            isRefreshingGlobal = false;
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },

      checkAuth: async () => {
        // Prevent concurrent checkAuth calls
        if (get().isLoading && get().isRefreshing) {
          return;
        }

        set({ isLoading: true });

        try {
          // Try to get user info - if cookies are valid, this will succeed
          const response = await apiClient.get<{ status: boolean; data: User; message: string }>('/auth/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Token might be expired, try to refresh once
          const refreshed = await get().refreshToken();

          if (!refreshed) {
            // Refresh failed, user needs to login again
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user and isAuthenticated for UI state
        // Tokens are in HttpOnly cookies, not in client state
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
