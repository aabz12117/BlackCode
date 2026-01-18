import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMissionSchema, insertPlaySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const user = await storage.getUserByCode(code.toUpperCase());
      
      if (!user) {
        return res.status(401).json({ message: "Invalid code" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is banned or inactive" });
      }

      // Set session (simplified - in production use express-session or JWT)
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User Management
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      // Server-side role validation: require authorized requester for creating users
      const requesterId = req.headers['x-requester-id'] as string;
      if (!requesterId) {
        return res.status(401).json({ message: "غير مصرح - معرف المستخدم مطلوب" });
      }
      
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(401).json({ message: "غير مصرح - مستخدم غير موجود" });
      }
      
      // Only owner and admin can create users
      if (requester.role !== 'owner' && requester.role !== 'admin') {
        return res.status(403).json({ message: "غير مصرح - صلاحيات غير كافية" });
      }
      
      // Only owner can create admins
      if (result.data.role === 'admin' && requester.role !== 'owner') {
        return res.status(403).json({ message: "فقط المالك يستطيع إنشاء مشرفين" });
      }

      const user = await storage.createUser(result.data);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Create user error:", error);
      if (error.message?.includes("duplicate") || error.code === '23505') {
        return res.status(409).json({ message: "User with this code already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/ban", async (req, res) => {
    try {
      // Require requester ID for authorization
      const requesterId = req.headers['x-requester-id'] as string;
      if (!requesterId) {
        return res.status(401).json({ message: "غير مصرح - معرف المستخدم مطلوب" });
      }
      
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(401).json({ message: "غير مصرح - مستخدم غير موجود" });
      }
      
      // Only owner and admin can ban users
      if (requester.role !== 'owner' && requester.role !== 'admin') {
        return res.status(403).json({ message: "غير مصرح - صلاحيات غير كافية" });
      }
      
      // Get the target user to check their role
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Prevent banning owner
      if (targetUser.role === 'owner') {
        return res.status(403).json({ message: "لا يمكن حظر المالك" });
      }
      
      // Admin can only ban users, not other admins
      if (requester.role === 'admin' && targetUser.role === 'admin') {
        return res.status(403).json({ message: "المشرف يستطيع حظر المستخدمين فقط" });
      }

      const user = await storage.banUser(req.params.id);
      res.json(user);
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post("/api/users/:id/unban", async (req, res) => {
    try {
      // Require requester ID for authorization
      const requesterId = req.headers['x-requester-id'] as string;
      if (!requesterId) {
        return res.status(401).json({ message: "غير مصرح - معرف المستخدم مطلوب" });
      }
      
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(401).json({ message: "غير مصرح - مستخدم غير موجود" });
      }
      
      // Only owner and admin can unban users
      if (requester.role !== 'owner' && requester.role !== 'admin') {
        return res.status(403).json({ message: "غير مصرح - صلاحيات غير كافية" });
      }
      
      // Get the target user to check their role
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Admin can only unban users, not other admins
      if (requester.role === 'admin' && targetUser.role === 'admin') {
        return res.status(403).json({ message: "المشرف يستطيع رفع الحظر عن المستخدمين فقط" });
      }

      const user = await storage.unbanUser(req.params.id);
      res.json(user);
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Mission Management
  app.get("/api/missions", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const missions = activeOnly 
        ? await storage.getActiveMissions()
        : await storage.getAllMissions();
      res.json(missions);
    } catch (error) {
      console.error("Get missions error:", error);
      res.status(500).json({ message: "Failed to fetch missions" });
    }
  });

  app.get("/api/missions/:id", async (req, res) => {
    try {
      const mission = await storage.getMission(req.params.id);
      if (!mission) {
        return res.status(404).json({ message: "Mission not found" });
      }
      res.json(mission);
    } catch (error) {
      console.error("Get mission error:", error);
      res.status(500).json({ message: "Failed to fetch mission" });
    }
  });

  app.post("/api/missions", async (req, res) => {
    try {
      const result = insertMissionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const mission = await storage.createMission(result.data);
      res.status(201).json(mission);
    } catch (error) {
      console.error("Create mission error:", error);
      res.status(500).json({ message: "Failed to create mission" });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    try {
      const mission = await storage.updateMission(req.params.id, req.body);
      res.json(mission);
    } catch (error) {
      console.error("Update mission error:", error);
      res.status(500).json({ message: "Failed to update mission" });
    }
  });

  app.post("/api/missions/:id/toggle", async (req, res) => {
    try {
      const mission = await storage.toggleMission(req.params.id);
      res.json(mission);
    } catch (error) {
      console.error("Toggle mission error:", error);
      res.status(500).json({ message: "Failed to toggle mission" });
    }
  });

  app.delete("/api/missions/:id", async (req, res) => {
    try {
      await storage.deleteMission(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete mission error:", error);
      res.status(500).json({ message: "Failed to delete mission" });
    }
  });

  // Gameplay - Recording Play Sessions
  app.post("/api/plays", async (req, res) => {
    try {
      const result = insertPlaySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      // Check if mission is one-time only and already completed
      const mission = await storage.getMission(result.data.missionId);
      if (mission && !mission.repeatable) {
        const existingPlays = await storage.getUserPlays(result.data.userId);
        const alreadyCompleted = existingPlays.some(
          p => p.missionId === result.data.missionId && p.completed
        );
        if (alreadyCompleted) {
          return res.status(400).json({ message: "هذه المهمة متاحة مرة واحدة فقط وقد أكملتها بالفعل" });
        }
      }

      // Create the play record
      const play = await storage.createPlay(result.data);

      // Award points to the user if completed successfully
      if (result.data.completed && result.data.score > 0) {
        const user = await storage.getUser(result.data.userId);
        
        if (user && mission) {
          const newPoints = user.points + result.data.score;
          const newLevel = Math.floor(newPoints / 200) + 1; // Simple level formula
          
          await storage.updateUser(user.id, {
            points: newPoints,
            level: newLevel
          });
        }
      }

      res.status(201).json(play);
    } catch (error) {
      console.error("Create play error:", error);
      res.status(500).json({ message: "Failed to record play session" });
    }
  });

  app.get("/api/plays/user/:userId", async (req, res) => {
    try {
      const plays = await storage.getUserPlays(req.params.userId);
      res.json(plays);
    } catch (error) {
      console.error("Get user plays error:", error);
      res.status(500).json({ message: "Failed to fetch play history" });
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}
