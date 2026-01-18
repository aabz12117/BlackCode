import type { User, Mission, Play, InsertUser, InsertMission, InsertPlay } from "@shared/schema";

// Authentication
export async function login(code: string): Promise<{ user: User }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }
  
  return res.json();
}

// Users
export async function getUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function createUser(data: InsertUser): Promise<User> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create user");
  }
  
  return res.json();
}

export async function updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

// Missions
export async function getMissions(activeOnly = false): Promise<Mission[]> {
  const url = activeOnly ? "/api/missions?active=true" : "/api/missions";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch missions");
  return res.json();
}

export async function getMission(id: string): Promise<Mission> {
  const res = await fetch(`/api/missions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch mission");
  return res.json();
}

export async function createMission(data: InsertMission): Promise<Mission> {
  const res = await fetch("/api/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Failed to create mission");
  return res.json();
}

export async function toggleMission(id: string): Promise<Mission> {
  const res = await fetch(`/api/missions/${id}/toggle`, {
    method: "POST",
  });
  
  if (!res.ok) throw new Error("Failed to toggle mission");
  return res.json();
}

export async function updateMission(id: string, data: Partial<InsertMission>): Promise<Mission> {
  const res = await fetch(`/api/missions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Failed to update mission");
  return res.json();
}

export async function deleteMission(id: string): Promise<void> {
  const res = await fetch(`/api/missions/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Failed to delete mission");
}

export async function banUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}/ban`, {
    method: "POST",
  });
  
  if (!res.ok) throw new Error("Failed to ban user");
  return res.json();
}

export async function unbanUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}/unban`, {
    method: "POST",
  });
  
  if (!res.ok) throw new Error("Failed to unban user");
  return res.json();
}

// Gameplay
export async function recordPlay(data: InsertPlay): Promise<Play> {
  const res = await fetch("/api/plays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Failed to record play");
  return res.json();
}

export async function getUserPlays(userId: string): Promise<Play[]> {
  const res = await fetch(`/api/plays/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch play history");
  return res.json();
}

// Leaderboard
export async function getLeaderboard(): Promise<User[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

// Refresh user data
export async function refreshUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("Failed to refresh user");
  return res.json();
}
