import { create } from 'zustand';
import type { User, Mission } from '@shared/schema';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

export type { User, Mission };
