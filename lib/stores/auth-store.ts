import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserFull } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: UserFull | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true });
        try {
          await apiClient.login(phone, password);
          const user = await apiClient.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, phone: string, password: string) => {
        set({ isLoading: true });
        try {
          await apiClient.register(name, phone, password);
          const user = await apiClient.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        apiClient.logout();
        set({ user: null, isAuthenticated: false });
      },

      loadUser: async () => {
        if (!get().isAuthenticated) return;
        
        set({ isLoading: true });
        try {
          const user = await apiClient.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);