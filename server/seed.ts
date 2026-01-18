import { db } from "./db";
import { users, missions } from "@shared/schema";
import { log } from "./index";

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      log("Database already seeded, skipping...");
      return;
    }

    log("Seeding database...");

    // Create admin user
    await db.insert(users).values({
      code: "ADMIN001",
      name: "المشرف العام",
      points: 9999,
      level: 99,
      role: "admin",
      status: "active",
    });

    // Create test users
    await db.insert(users).values([
      {
        code: "GHOST777",
        name: "الشبح",
        points: 2500,
        level: 12,
        role: "user",
        status: "active",
      },
      {
        code: "VIPER002",
        name: "الأفعى",
        points: 1800,
        level: 9,
        role: "user",
        status: "active",
      },
      {
        code: "CYBER999",
        name: "سايبر",
        points: 3200,
        level: 15,
        role: "user",
        status: "active",
      },
      {
        code: "NOOB1234",
        name: "المبتدئ",
        points: 150,
        level: 2,
        role: "user",
        status: "active",
      },
    ]);

    // Create missions
    await db.insert(missions).values([
      {
        title: "تفكيك الشفرة",
        description: "قم بفك تشفير الرسالة السرية قبل انتهاء الوقت.",
        points: 100,
        type: "game",
        difficulty: "easy",
        active: true,
        cooldown: 300,
      },
      {
        title: "اختراق الجدار الناري",
        description: "تجاوز الحماية الأمنية للوصول إلى البيانات.",
        points: 250,
        type: "game",
        difficulty: "medium",
        active: true,
        cooldown: 600,
      },
      {
        title: "بروتوكول الظل",
        description: "مهمة سرية للغاية. المعلومات غير متوفرة.",
        points: 500,
        type: "challenge",
        difficulty: "hard",
        active: true,
        cooldown: 3600,
      },
      {
        title: "صائد الثغرات",
        description: "ابحث عن الثغرة الأمنية في النظام.",
        points: 1000,
        type: "game",
        difficulty: "expert",
        active: false,
        cooldown: 7200,
      },
    ]);

    log("Database seeded successfully!");
  } catch (error) {
    log(`Error seeding database: ${error}`);
  }
}
