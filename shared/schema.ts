import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  status: text("status").notNull().default("active"), // 'active' | 'banned'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull().default(100),
  type: text("type").notNull().default("game"), // 'game' | 'challenge'
  difficulty: text("difficulty").notNull().default("easy"), // 'easy' | 'medium' | 'hard' | 'expert'
  cooldown: integer("cooldown").notNull().default(300), // seconds
  active: boolean("active").notNull().default(true),
  missionStatus: text("mission_status").notNull().default("active"), // 'active' | 'locked' | 'completed'
  answer: text("answer").notNull().default(""), // الإجابة الصحيحة للمهمة
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

export const plays = pgTable("plays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  missionId: varchar("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  timeSpent: integer("time_spent"), // seconds
  completed: boolean("completed").notNull().default(true),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertPlaySchema = createInsertSchema(plays).omit({
  id: true,
  timestamp: true,
});

export type InsertPlay = z.infer<typeof insertPlaySchema>;
export type Play = typeof plays.$inferSelect;
