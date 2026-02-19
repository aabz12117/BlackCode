export type AccountStatus = 'active' | 'paused' | 'banned';

export interface User {
  timestamp: string;
  name: string;
  codeName: string;
  username: string;
  code: string;
  points: number;
  rank: string;
  completedTasks: string[]; // List of solved task names
  status: AccountStatus;
  isAdmin: boolean;
  rowId?: number; 
}

export type TaskStatus = 'active' | 'paused' | 'finished' | 'unknown';

export interface Task {
  timestamp: string;
  taskName: string;
  description: string;
  link: string;
  solution: string;
  status: TaskStatus;
  isVisible: boolean;
  points: number;
  maxWinners: number; // كم فوز
  rowId?: number; 
}

export const ADMIN_RANKS = [
  "نائب المدير",
  "المدير السري",
  "الزعيم الخفي"
];

export const ALL_RANKS = [
  "متدرب",
  "عميل مبتدئ",
  "عميل ميداني",
  "عميل متقدم",
  "عميل نخبوي",
  "نائب المدير",
  "المدير السري",
  "الزعيم الخفي"
];
