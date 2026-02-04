
import { supabase } from "./supabase";
import type { User, Mission, Play, InsertUser, InsertMission, InsertPlay } from "@shared/schema";

// Helper Functions for Mapping (snake_case -> camelCase)
function mapUser(data: any): User {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    points: data.points,
    level: data.level,
    role: data.role,
    status: data.status,
    createdAt: new Date(data.created_at),
  };
}

function mapMission(data: any): Mission {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    points: data.points,
    active: data.active,
    repeatable: data.repeatable,
    createdAt: new Date(data.created_at),
  };
}

function mapPlay(data: any): Play {
  return {
    id: data.id,
    userId: data.user_id,
    missionId: data.mission_id,
    completed: data.completed,
    score: data.score,
    timestamp: new Date(data.timestamp),
  };
}

// Authentication
export async function login(code: string): Promise<{ user: User }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      throw new Error("Invalid code or user not found");
    }

    if (data.status !== 'active') {
      throw new Error("Account is banned or inactive");
    }

    return { user: mapUser(data) };
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

// Users
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(mapUser);
}

export async function getUser(id: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !data) throw new Error("User not found");
  return mapUser(data);
}

export async function createUser(data: InsertUser, requesterId?: string): Promise<User> {
  // Client-side verification for admin actions is limited/insecure without RLS
  // For now, we proceed with the creation call
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      code: data.code.toUpperCase(),
      name: data.name,
      points: data.points ?? 0,
      level: data.level ?? 1,
      role: data.role ?? 'user',
      status: data.status ?? 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return mapUser(newUser);
}

export async function updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.code) updateData.code = data.code.toUpperCase();
  if (data.points !== undefined) updateData.points = data.points;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.role) updateData.role = data.role;
  if (data.status) updateData.status = data.status;

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapUser(updatedUser);
}

// Missions
export async function getMissions(activeOnly = false): Promise<Mission[]> {
  let query = supabase.from('missions').select('*');
  if (activeOnly) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapMission);
}

export async function getMission(id: string): Promise<Mission> {
  const { data, error } = await supabase.from('missions').select('*').eq('id', id).single();
  if (error) throw error;
  return mapMission(data);
}

export async function createMission(data: InsertMission): Promise<Mission> {
  const { data: newMission, error } = await supabase
    .from('missions')
    .insert([{
      title: data.title,
      description: data.description,
      points: data.points,
      active: data.active ?? true,
      repeatable: data.repeatable ?? false
    }])
    .select()
    .single();

  if (error) throw error;
  return mapMission(newMission);
}

export async function toggleMission(id: string): Promise<Mission> {
  // First get current status
  const mission = await getMission(id);
  const { data, error } = await supabase
    .from('missions')
    .update({ active: !mission.active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapMission(data);
}

export async function updateMission(id: string, data: Partial<InsertMission>): Promise<Mission> {
  const { data: updated, error } = await supabase
    .from('missions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapMission(updated);
}

export async function deleteMission(id: string): Promise<void> {
  const { error } = await supabase.from('missions').delete().eq('id', id);
  if (error) throw error;
}

export async function banUser(id: string, requesterId?: string): Promise<User> {
  return updateUser(id, { status: 'banned' });
}

export async function unbanUser(id: string, requesterId?: string): Promise<User> {
  return updateUser(id, { status: 'active' });
}

// Gameplay
export async function recordPlay(data: InsertPlay): Promise<Play> {
  // Check if mission is repeatable
  if (!data.completed) {
    const { data: play, error } = await supabase
      .from('plays')
      .insert([{
        user_id: data.userId,
        mission_id: data.missionId,
        completed: data.completed,
        score: data.score
      }])
      .select()
      .single();
    if (error) throw error;
    return mapPlay(play);
  }

  const mission = await getMission(data.missionId);
  if (!mission.repeatable) {
    const { data: existingPlays } = await supabase
      .from('plays')
      .select('*')
      .eq('user_id', data.userId)
      .eq('mission_id', data.missionId)
      .eq('completed', true);

    if (existingPlays && existingPlays.length > 0) {
      throw new Error("هذه المهمة متاحة مرة واحدة فقط وقد أكملتها بالفعل");
    }
  }

  const { data: play, error } = await supabase
    .from('plays')
    .insert([{
      user_id: data.userId,
      mission_id: data.missionId,
      completed: data.completed,
      score: data.score
    }])
    .select() // Need to select explicitly in v2
    .single();

  if (error) throw error;

  // Update user points
  if (data.score > 0) {
    const user = await getUser(data.userId);
    const newPoints = user.points + data.score;
    const newLevel = Math.floor(newPoints / 200) + 1;
    await updateUser(user.id, { points: newPoints, level: newLevel });
  }

  return mapPlay(play);
}

export async function getUserPlays(userId: string): Promise<Play[]> {
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(mapPlay);
}

// Leaderboard
export async function getLeaderboard(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('points', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data.map(mapUser);
}

// Admin Stats
export interface AdminStats {
  totalUsers: number;
  totalMissions: number;
  activeMissions: number;
  completedPlays: number;
  bannedUsers: number;
  mostPopularMission: {
    id: string;
    title: string;
    playCount: number;
  } | null;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
  const { count: bannedUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'banned');

  const { data: missions } = await supabase.from('missions').select('*');
  const totalMissions = missions?.length || 0;
  const activeMissions = missions?.filter(m => m.active).length || 0;

  const { data: plays } = await supabase.from('plays').select('*').eq('completed', true);
  const completedPlays = plays?.length || 0;

  let mostPopularMission = null;
  if (plays && plays.length > 0 && missions) {
    const counts: Record<string, number> = {};
    plays.forEach(p => counts[p.mission_id] = (counts[p.mission_id] || 0) + 1);

    let maxId = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxId = id;
      }
    });

    const mission = missions.find(m => m.id === maxId);
    if (mission) {
      mostPopularMission = {
        id: mission.id,
        title: mission.title,
        playCount: maxCount
      };
    }
  }

  return {
    totalUsers: totalUsers || 0,
    totalMissions,
    activeMissions,
    completedPlays,
    bannedUsers: bannedUsers || 0,
    mostPopularMission
  };
}

// Refresh user data
export async function refreshUser(id: string): Promise<User> {
  return getUser(id);
}

// Owner-only: Full user update
export async function updateUserFull(id: string, data: { name?: string; code?: string; points?: number; level?: number }, requesterId: string): Promise<User> {
  // Client-side, we just call update. Security relies on RLS (which user should set up)
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.code) updateData.code = data.code.toUpperCase();
  if (data.points !== undefined) updateData.points = data.points;
  if (data.level !== undefined) updateData.level = data.level;

  const { data: updated, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapUser(updated);
}

// Owner-only: Add play for user
export async function addPlayForUser(userId: string, missionId: string, completed: boolean, score: number, requesterId: string): Promise<Play> {
  const { data: play, error } = await supabase
    .from('plays')
    .insert([{
      user_id: userId,
      mission_id: missionId,
      completed,
      score
    }])
    .select()
    .single();

  if (error) throw error;

  if (completed && score > 0) {
    const user = await getUser(userId);
    const newPoints = user.points + score;
    const newLevel = Math.floor(newPoints / 200) + 1;
    await updateUser(user.id, { points: newPoints, level: newLevel });
  }

  return mapPlay(play);
}

// Owner-only: Delete play
export async function deletePlay(id: string, requesterId: string): Promise<void> {
  const { error } = await supabase.from('plays').delete().eq('id', id);
  if (error) throw error;
}
