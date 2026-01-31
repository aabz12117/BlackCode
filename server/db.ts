import { drizzle } from "drizzle-orm/sqlite-proxy";
import { Database } from "sqlite3";
import * as schema from "@shared/schema";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "local-db.sqlite");

// Create SQLite database
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
