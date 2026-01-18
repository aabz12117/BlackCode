import { create } from 'zustand';

export interface User {
  id: string;
  code: string;
  name: string;
  points: number;
  level: number;
  role: 'user' | 'admin';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'game' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  active: boolean;
  cooldown: number; // in seconds
}

export const MOCK_USERS: User[] = [
  { id: '1', code: 'ADMIN001', name: 'المشرف العام', points: 9999, level: 99, role: 'admin' },
  { id: '2', code: 'GHOST777', name: 'الشبح', points: 2500, level: 12, role: 'user' },
  { id: '3', code: 'VIPER002', name: 'الأفعى', points: 1800, level: 9, role: 'user' },
  { id: '4', code: 'CYBER999', name: 'سايبر', points: 3200, level: 15, role: 'user' },
  { id: '5', code: 'NOOB1234', name: 'المبتدئ', points: 150, level: 2, role: 'user' },
];

export const MOCK_MISSIONS: Mission[] = [
  { 
    id: 'm1', 
    title: 'تفكيك الشفرة', 
    description: 'قم بفك تشفير الرسالة السرية قبل انتهاء الوقت.', 
    points: 100, 
    type: 'game', 
    difficulty: 'easy', 
    active: true, 
    cooldown: 300 
  },
  { 
    id: 'm2', 
    title: 'اختراق الجدار الناري', 
    description: 'تجاوز الحماية الأمنية للوصول إلى البيانات.', 
    points: 250, 
    type: 'game', 
    difficulty: 'medium', 
    active: true, 
    cooldown: 600 
  },
  { 
    id: 'm3', 
    title: 'بروتوكول الظل', 
    description: 'مهمة سرية للغاية. المعلومات غير متوفرة.', 
    points: 500, 
    type: 'challenge', 
    difficulty: 'hard', 
    active: true, 
    cooldown: 3600 
  },
  { 
    id: 'm4', 
    title: 'صائد الثغرات', 
    description: 'ابحث عن الثغرة الأمنية في النظام.', 
    points: 1000, 
    type: 'game', 
    difficulty: 'expert', 
    active: false, 
    cooldown: 7200 
  },
];

interface AppState {
  user: User | null;
  missions: Mission[];
  users: User[];
  login: (code: string) => boolean;
  logout: () => void;
  addPoints: (points: number) => void;
  getLeaderboard: () => User[];
  toggleMission: (id: string) => void;
  addMission: (mission: Mission) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  missions: MOCK_MISSIONS,
  users: MOCK_USERS,
  
  login: (code: string) => {
    const user = get().users.find((u: User) => u.code === code);
    if (user) {
      set({ user });
      return true;
    }
    return false;
  },
  
  logout: () => set({ user: null }),
  
  addPoints: (points: number) => {
    set((state: AppState) => {
      if (!state.user) return state;
      const newPoints = state.user.points + points;
      const newLevel = Math.floor(newPoints / 200) + 1; // Simple level formula
      
      const updatedUser: User = { ...state.user, points: newPoints, level: newLevel };
      
      // Update in users list too for leaderboard
      const updatedUsers = state.users.map((u: User) => u.id === state.user!.id ? updatedUser : u);
      
      return { user: updatedUser, users: updatedUsers };
    });
  },
  
  getLeaderboard: () => {
    // Filter out admins from leaderboard
    return [...get().users]
      .filter((u: User) => u.role !== 'admin')
      .sort((a: User, b: User) => b.points - a.points);
  },
  
  // Admin actions
  toggleMission: (id: string) => {
    set((state: AppState) => ({
      missions: state.missions.map(m => 
        m.id === id ? { ...m, active: !m.active } : m
      )
    }));
  },

  addMission: (mission: Mission) => {
    set((state: AppState) => ({
      missions: [...state.missions, mission]
    }));
  }
}));
