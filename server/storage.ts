import { users, missions, plays, type User, type InsertUser, type Mission, type InsertMission, type Play, type InsertPlay } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Mission operations
  getMission(id: string): Promise<Mission | undefined>;
  getAllMissions(): Promise<Mission[]>;
  getActiveMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, data: Partial<InsertMission>): Promise<Mission>;
  toggleMission(id: string): Promise<Mission>;
  
  // Play operations
  createPlay(play: InsertPlay): Promise<Play>;
  getUserPlays(userId: string): Promise<Play[]>;
  getMissionPlays(missionId: string): Promise<Play[]>;
  
  // Leaderboard
  getLeaderboard(): Promise<User[]>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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

  // Leaderboard
  async getLeaderboard(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'user'))
      .orderBy(desc(users.points));
  }
}

export const storage = new DatabaseStorage();
