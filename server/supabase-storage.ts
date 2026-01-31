import { createClient } from '@supabase/supabase-js';
import { users, missions, plays, type User, type InsertUser, type Mission, type InsertMission, type Play, type InsertPlay } from "@shared/schema";

// Supabase configuration
const SUPABASE_URL = 'https://hmdycuhxetnwcnbwhwua.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lhmomCyqpnkUDgvqjZYpaQ_1N9AZC9-';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class SupabaseStorage {
    // User operations
    async getUser(id: string): Promise<User | undefined> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error getting user:', error);
            return undefined;
        }
        return data;
    }

    async getUserByCode(code: string): Promise<User | undefined> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            console.error('Error getting user by code:', error);
            return undefined;
        }
        return data;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                ...insertUser,
                role: insertUser.role || "user",
                status: insertUser.status || "active",
                points: insertUser.points || 0,
                level: insertUser.level || 1,
            }])
            .select('*')
            .single();

        if (error) {
            console.error('Error creating user:', error);
            throw error;
        }
        return data;
    }

    async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating user:', error);
            throw error;
        }
        return updatedUser;
    }

    async updateUserFull(id: string, data: { name?: string; code?: string; points?: number; level?: number }): Promise<User> {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating user full:', error);
            throw error;
        }
        return updatedUser;
    }

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('Error getting all users:', error);
            return [];
        }
        return data;
    }

    async banUser(id: string): Promise<User> {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ status: 'banned' })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error banning user:', error);
            throw error;
        }
        return updatedUser;
    }

    async unbanUser(id: string): Promise<User> {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error unbanning user:', error);
            throw error;
        }
        return updatedUser;
    }

    // Mission operations
    async getMission(id: string): Promise<Mission | undefined> {
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error getting mission:', error);
            return undefined;
        }
        return data;
    }

    async getAllMissions(): Promise<Mission[]> {
        const { data, error } = await supabase
            .from('missions')
            .select('*');

        if (error) {
            console.error('Error getting all missions:', error);
            return [];
        }
        return data;
    }

    async getActiveMissions(): Promise<Mission[]> {
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .eq('active', true);

        if (error) {
            console.error('Error getting active missions:', error);
            return [];
        }
        return data;
    }

    async createMission(insertMission: InsertMission): Promise<Mission> {
        const { data, error } = await supabase
            .from('missions')
            .insert([{
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
            }])
            .select('*')
            .single();

        if (error) {
            console.error('Error creating mission:', error);
            throw error;
        }
        return data;
    }

    async updateMission(id: string, data: Partial<InsertMission>): Promise<Mission> {
        const { data: updatedMission, error } = await supabase
            .from('missions')
            .update(data)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating mission:', error);
            throw error;
        }
        return updatedMission;
    }

    async deleteMission(id: string): Promise<void> {
        const { error } = await supabase
            .from('missions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting mission:', error);
            throw error;
        }
    }

    async toggleMission(id: string): Promise<Mission> {
        const mission = await this.getMission(id);
        if (!mission) {
            throw new Error('Mission not found');
        }

        const { data: updatedMission, error } = await supabase
            .from('missions')
            .update({ active: !mission.active })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error toggling mission:', error);
            throw error;
        }
        return updatedMission;
    }

    // Play operations
    async createPlay(insertPlay: InsertPlay): Promise<Play> {
        const { data, error } = await supabase
            .from('plays')
            .insert([{
                ...insertPlay,
                timeSpent: insertPlay.timeSpent ?? null,
                completed: insertPlay.completed ?? false,
            }])
            .select('*')
            .single();

        if (error) {
            console.error('Error creating play:', error);
            throw error;
        }
        return data;
    }

    async getUserPlays(userId: string): Promise<Play[]> {
        const { data, error } = await supabase
            .from('plays')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error getting user plays:', error);
            return [];
        }
        return data;
    }

    async getMissionPlays(missionId: string): Promise<Play[]> {
        const { data, error } = await supabase
            .from('plays')
            .select('*')
            .eq('mission_id', missionId);

        if (error) {
            console.error('Error getting mission plays:', error);
            return [];
        }
        return data;
    }

    async deletePlay(id: string): Promise<void> {
        const { error } = await supabase
            .from('plays')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting play:', error);
            throw error;
        }
    }

    async addPlayForUser(userId: string, missionId: string, completed: boolean, score: number): Promise<Play> {
        const { data, error } = await supabase
            .from('plays')
            .insert([{
                user_id: userId,
                mission_id: missionId,
                completed,
                score,
                time_spent: 0,
            }])
            .select('*')
            .single();

        if (error) {
            console.error('Error adding play for user:', error);
            throw error;
        }
        return data;
    }

    // Leaderboard
    async getLeaderboard(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'user')
            .eq('status', 'active')
            .order('points', { ascending: false });

        if (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
        return data;
    }

    // Stats
    async getAllPlays(): Promise<Play[]> {
        const { data, error } = await supabase
            .from('plays')
            .select('*');

        if (error) {
            console.error('Error getting all plays:', error);
            return [];
        }
        return data;
    }
}

// Initialize Supabase storage and seed data if needed
export async function initializeSupabaseStorage() {
    const storage = new SupabaseStorage();

    try {
        // Check if there are any users in the database
        const users = await storage.getAllUsers();

        if (users.length === 0) {
            console.log('Seeding initial data to Supabase...');

            // Admin user
            await storage.createUser({
                code: "ADMIN001",
                name: "المشرف العام",
                points: 9999,
                level: 99,
                role: "admin",
                status: "active"
            });

            // Test users
            await storage.createUser({
                code: "GHOST777",
                name: "الشبح",
                points: 2500,
                level: 12,
                role: "user",
                status: "active"
            });

            await storage.createUser({
                code: "VIPER002",
                name: "الأفعى",
                points: 1800,
                level: 9,
                role: "user",
                status: "active"
            });

            await storage.createUser({
                code: "CYBER999",
                name: "سايبر",
                points: 3200,
                level: 15,
                role: "user",
                status: "active"
            });

            await storage.createUser({
                code: "NOOB1234",
                name: "المبتدئ",
                points: 150,
                level: 2,
                role: "user",
                status: "active"
            });

            // Missions
            await storage.createMission({
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
                targetUsers: []
            });

            await storage.createMission({
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
                targetUsers: []
            });

            await storage.createMission({
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
                targetUsers: []
            });

            await storage.createMission({
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
                targetUsers: []
            });

            console.log('Supabase storage initialized with seed data');
        } else {
            console.log('Supabase storage already contains data');
        }
    } catch (error) {
        console.error('Error initializing Supabase storage:', error);
        console.log('\nPlease ensure you have created the required tables in your Supabase dashboard.');
        console.log('Use the SQL statements from script/supabase-schema.sql to create the tables.');
        console.log('\nIf you have a DATABASE_URL, you can also try running: npm run db:push');
    }
}

export const storage = new SupabaseStorage();
