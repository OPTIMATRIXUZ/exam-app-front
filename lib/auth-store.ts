"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, User, handleApiError, isApiError } from "./api";

interface AuthState {
  user: User | null;
  access: string | null;
  refresh: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (
    full_name: string,
    phone: string,
    password: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,
      isLoading: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true });

        try {
          const response = await apiClient.login(phone, password);

          if (isApiError(response)) {
            handleApiError(response.error || "Login failed");
            set({ isLoading: false });
            return false;
          }

          const { user, access, refresh } = response.data!;

          // Store token in localStorage for API requests
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);

          set({
            user,
            access,
            refresh,
            isLoading: false,
          });

          return true;
        } catch (error) {
          handleApiError("Network error during login");
          set({ isLoading: false });
          return false;
        }
      },

      register: async (full_name: string, phone: string, password: string) => {
        set({ isLoading: true });

        try {
          const response = await apiClient.register(full_name, phone, password);

          if (isApiError(response)) {
            handleApiError(response.error || "Registration failed");
            set({ isLoading: false });
            return false;
          }

          const { user, access, refresh } = response.data!;

          // Store token in localStorage for API requests
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);

          set({
            user,
            access,
            refresh,
            isLoading: false,
          });

          return true;
        } catch (error) {
          handleApiError("Network error during registration");
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear token from localStorage
          localStorage.removeItem("access_token");

          set({
            user: null,
            access: null,
            refresh: null,
            isLoading: false,
          });
        }
      },

      refreshTokens: async () => {
        set({ isLoading: true });

        try {
          const response = await apiClient.refresh();

          if (isApiError(response)) {
            handleApiError(response.error || "Token refresh failed");
            set({ isLoading: false });
            return false;
          }

          const { access, refresh } = response.data!;

          // Update tokens in localStorage
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);

          set({
            access,
            refresh,
            isLoading: false,
          });

          return true;
        } catch (error) {
          handleApiError("Network error during token refresh");
          set({ isLoading: false });
          return false;
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        access: state.access,
        refresh: state.refresh,
        isLoading: state.isLoading,
      }),
    }
  )
);
