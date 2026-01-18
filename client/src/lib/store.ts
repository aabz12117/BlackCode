import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Mission } from '@shared/schema';

interface AppState {
  user: User | null;
  loginDate: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const getTodayDate = () => new Date().toDateString();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      loginDate: null,
      setUser: (user) => {
        if (user) {
          const today = getTodayDate();
          set({ user, loginDate: today });
        } else {
          set({ user: null, loginDate: null });
        }
      },
      logout: () => set({ user: null, loginDate: null }),
    }),
    {
      name: 'zerocode-session',
      onRehydrateStorage: () => (state) => {
        if (state && state.loginDate) {
          const today = getTodayDate();
          if (state.loginDate !== today) {
            state.user = null;
            state.loginDate = null;
          }
        }
      },
    }
  )
);

export type { User, Mission };
