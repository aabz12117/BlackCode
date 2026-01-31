import { users, missions, plays, type User, type InsertUser, type Mission, type InsertMission, type Play, type InsertPlay } from "@shared/schema";

// Memory storage
let memoryUsers: User[] = [];
let memoryMissions: Mission[] = [];
let memoryPlays: Play[] = [];

// Generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize memory storage with seed data
export function initializeMemoryStorage() {
  // Admin user
  memoryUsers.push({
    id: generateId(),
    code: "ADMIN001",
    name: "المشرف العام",
    points: 9999,
    level: 99,
    role: "admin",
    status: "active",
    createdAt: new Date()
  });

  // Test users
  memoryUsers.push({
    id: generateId(),
    code: "GHOST777",
    name: "الشبح",
    points: 2500,
    level: 12,
    role: "user",
    status: "active",
    createdAt: new Date()
  });
  memoryUsers.push({
    id: generateId(),
    code: "VIPER002",
    name: "الأفعى",
    points: 1800,
    level: 9,
    role: "user",
    status: "active",
    createdAt: new Date()
  });
  memoryUsers.push({
    id: generateId(),
    code: "CYBER999",
    name: "سايبر",
    points: 3200,
    level: 15,
    role: "user",
    status: "active",
    createdAt: new Date()
  });
  memoryUsers.push({
    id: generateId(),
    code: "NOOB1234",
    name: "المبتدئ",
    points: 150,
    level: 2,
    role: "user",
    status: "active",
    createdAt: new Date()
  });

  // Missions
  memoryMissions.push({
    id: generateId(),
    title: "تفكيك الشفرة",
    description: "قم بفك تشفير الرسالة السرية قبل انتهاء الوقت.",
    points: 100,
    type: "game",
    difficulty: "easy",
    active: true,
    cooldown: 300,
    answer: "DECRYPT",
    repeatable: true,
    hidden: false,
    hintUrl: null,
    targetUsers: [],
    createdAt: new Date()
  });
  memoryMissions.push({
    id: generateId(),
    title: "اختراق الجدار الناري",
    description: "تجاوز الحماية الأمنية للوصول إلى البيانات.",
    points: 250,
    type: "game",
    difficulty: "medium",
    active: true,
    cooldown: 600,
    answer: "FIREWALL",
    repeatable: true,
    hidden: false,
    hintUrl: null,
    targetUsers: [],
    createdAt: new Date()
  });
  memoryMissions.push({
    id: generateId(),
    title: "بروتوكول الظل",
    description: "مهمة سرية للغاية. المعلومات غير متوفرة.",
    points: 500,
    type: "challenge",
    difficulty: "hard",
    active: true,
    cooldown: 3600,
    answer: "SHADOW",
    repeatable: true,
    hidden: false,
    hintUrl: null,
    targetUsers: [],
    createdAt: new Date()
  });
  memoryMissions.push({
    id: generateId(),
    title: "صائد الثغرات",
    description: "ابحث عن الثغرة الأمنية في النظام.",
    points: 1000,
    type: "game",
    difficulty: "expert",
    active: false,
    cooldown: 7200,
    answer: "EXPLOIT",
    repeatable: false,
    hidden: false,
    hintUrl: null,
    targetUsers: [],
    createdAt: new Date()
  });

  console.log("Memory storage initialized with seed data");
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  updateUserFull(id: string, data: { name?: string; code?: string; points?: number; level?: number }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  banUser(id: string): Promise<User>;
  unbanUser(id: string): Promise<User>;

  // Mission operations
  getMission(id: string): Promise<Mission | undefined>;
  getAllMissions(): Promise<Mission[]>;
  getActiveMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, data: Partial<InsertMission>): Promise<Mission>;
  deleteMission(id: string): Promise<void>;
  toggleMission(id: string): Promise<Mission>;

  // Play operations
  createPlay(play: InsertPlay): Promise<Play>;
  getUserPlays(userId: string): Promise<Play[]>;
  getMissionPlays(missionId: string): Promise<Play[]>;
  deletePlay(id: string): Promise<void>;
  addPlayForUser(userId: string, missionId: string, completed: boolean, score: number): Promise<Play>;

  // Leaderboard
  getLeaderboard(): Promise<User[]>;

  // Stats
  getAllPlays(): Promise<Play[]>;
}

export class MemoryStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return memoryUsers.find(user => user.id === id);
  }

  async getUserByCode(code: string): Promise<User | undefined> {
    return memoryUsers.find(user => user.code === code);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: generateId(),
      ...insertUser,
      role: insertUser.role || "user",
      status: insertUser.status || "active",
      points: insertUser.points || 0,
      level: insertUser.level || 1,
      createdAt: new Date()
    };
    memoryUsers.push(user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const index = memoryUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      memoryUsers[index] = { ...memoryUsers[index], ...data };
      return memoryUsers[index];
    }
    throw new Error("User not found");
  }

  async updateUserFull(id: string, data: { name?: string; code?: string; points?: number; level?: number }): Promise<User> {
    const index = memoryUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      memoryUsers[index] = { ...memoryUsers[index], ...data };
      return memoryUsers[index];
    }
    throw new Error("User not found");
  }

  async getAllUsers(): Promise<User[]> {
    return memoryUsers;
  }

  async banUser(id: string): Promise<User> {
    const index = memoryUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      memoryUsers[index].status = "banned";
      return memoryUsers[index];
    }
    throw new Error("User not found");
  }

  async unbanUser(id: string): Promise<User> {
    const index = memoryUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      memoryUsers[index].status = "active";
      return memoryUsers[index];
    }
    throw new Error("User not found");
  }

  // Mission operations
  async getMission(id: string): Promise<Mission | undefined> {
    return memoryMissions.find(mission => mission.id === id);
  }

  async getAllMissions(): Promise<Mission[]> {
    return memoryMissions;
  }

  async getActiveMissions(): Promise<Mission[]> {
    return memoryMissions.filter(mission => mission.active);
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const mission: Mission = {
      id: generateId(),
      ...insertMission,
      points: insertMission.points ?? 100,
      active: insertMission.active ?? true,
      type: insertMission.type ?? "game",
      difficulty: insertMission.difficulty ?? "easy",
      cooldown: insertMission.cooldown ?? 300,
      repeatable: insertMission.repeatable ?? true,
      hidden: insertMission.hidden ?? false,
      answer: insertMission.answer ?? "",
      hintUrl: insertMission.hintUrl ?? null,
      targetUsers: insertMission.targetUsers ?? [],
      createdAt: new Date()
    };
    memoryMissions.push(mission);
    return mission;
  }

  async updateMission(id: string, data: Partial<InsertMission>): Promise<Mission> {
    const index = memoryMissions.findIndex(mission => mission.id === id);
    if (index !== -1) {
      memoryMissions[index] = { ...memoryMissions[index], ...data };
      return memoryMissions[index];
    }
    throw new Error("Mission not found");
  }

  async deleteMission(id: string): Promise<void> {
    memoryMissions = memoryMissions.filter(mission => mission.id !== id);
    memoryPlays = memoryPlays.filter(play => play.missionId !== id);
  }

  async toggleMission(id: string): Promise<Mission> {
    const index = memoryMissions.findIndex(mission => mission.id === id);
    if (index !== -1) {
      memoryMissions[index].active = !memoryMissions[index].active;
      return memoryMissions[index];
    }
    throw new Error("Mission not found");
  }

  // Play operations
  async createPlay(insertPlay: InsertPlay): Promise<Play> {
    const play: Play = {
      id: generateId(),
      ...insertPlay,
      timeSpent: insertPlay.timeSpent ?? null,
      completed: insertPlay.completed ?? false,
      timestamp: new Date()
    };
    memoryPlays.push(play);
    return play;
  }

  async getUserPlays(userId: string): Promise<Play[]> {
    return memoryPlays.filter(play => play.userId === userId);
  }

  async getMissionPlays(missionId: string): Promise<Play[]> {
    return memoryPlays.filter(play => play.missionId === missionId);
  }

  async deletePlay(id: string): Promise<void> {
    memoryPlays = memoryPlays.filter(play => play.id !== id);
  }

  async addPlayForUser(userId: string, missionId: string, completed: boolean, score: number): Promise<Play> {
    const play: Play = {
      id: generateId(),
      userId,
      missionId,
      completed,
      score,
      timeSpent: 0,
      timestamp: new Date()
    };
    memoryPlays.push(play);
    return play;
  }

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return [...memoryUsers]
      .filter(user => user.role === "user" && user.status === "active")
      .sort((a, b) => b.points - a.points);
  }

  // Stats
  async getAllPlays(): Promise<Play[]> {
    return memoryPlays;
  }
}

export const storage = new MemoryStorage();
