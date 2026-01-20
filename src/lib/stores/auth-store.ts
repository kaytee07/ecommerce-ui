import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { apiClient } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

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
        try {
          // This will clear the HttpOnly cookies on the backend
          await apiClient.post('/auth/logout');
        } catch {
          // Ignore logout errors
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      refreshToken: async () => {
        try {
          // Refresh token is also in HttpOnly cookie, sent automatically
          await apiClient.post('/auth/refresh');
          // After refresh, verify by getting user info
          const response = await apiClient.get<{ status: boolean; data: User; message: string }>('/auth/me');
          set({ user: response.data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // Try to get user info - if cookies are valid, this will succeed
          const response = await apiClient.get<{ status: boolean; data: User; message: string }>('/auth/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          // Token might be expired, try to refresh
          try {
            await get().refreshToken();
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
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
