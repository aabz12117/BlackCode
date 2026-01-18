import { users, missions, plays, type User, type InsertUser, type Mission, type InsertMission, type Play, type InsertPlay } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.code, code));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserFull(id: string, data: { name?: string; code?: string; points?: number; level?: number }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async banUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status: 'banned' })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async unbanUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Mission operations
  async getMission(id: string): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission || undefined;
  }

  async getAllMissions(): Promise<Mission[]> {
    return await db.select().from(missions);
  }

  async getActiveMissions(): Promise<Mission[]> {
    return await db.select().from(missions).where(eq(missions.active, true));
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values(insertMission)
      .returning();
    return mission;
  }

  async updateMission(id: string, data: Partial<InsertMission>): Promise<Mission> {
    const [mission] = await db
      .update(missions)
      .set(data)
      .where(eq(missions.id, id))
      .returning();
    return mission;
  }

  async deleteMission(id: string): Promise<void> {
    await db.delete(missions).where(eq(missions.id, id));
  }

  async toggleMission(id: string): Promise<Mission> {
    const mission = await this.getMission(id);
    if (!mission) throw new Error("Mission not found");
    
    const [updated] = await db
      .update(missions)
      .set({ active: !mission.active })
      .where(eq(missions.id, id))
      .returning();
    return updated;
  }

  // Play operations
  async createPlay(insertPlay: InsertPlay): Promise<Play> {
    const [play] = await db
      .insert(plays)
      .values(insertPlay)
      .returning();
    return play;
  }

  async getUserPlays(userId: string): Promise<Play[]> {
    return await db.select().from(plays).where(eq(plays.userId, userId));
  }

  async getMissionPlays(missionId: string): Promise<Play[]> {
    return await db.select().from(plays).where(eq(plays.missionId, missionId));
  }

  async deletePlay(id: string): Promise<void> {
    await db.delete(plays).where(eq(plays.id, id));
  }

  async addPlayForUser(userId: string, missionId: string, completed: boolean, score: number): Promise<Play> {
    const [play] = await db
      .insert(plays)
      .values({
        userId,
        missionId,
        completed,
        score,
        timestamp: new Date(),
      })
      .returning();
    return play;
  }

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, 'user'), eq(users.status, 'active')))
      .orderBy(desc(users.points));
  }

  // Stats
  async getAllPlays(): Promise<Play[]> {
    return await db.select().from(plays);
  }
}

export const storage = new DatabaseStorage();
