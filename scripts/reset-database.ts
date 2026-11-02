import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

const client = postgres(
  process.env.DATABASE_URL ||
    "postgres://root:mysecretpassword@localhost:5432/local",
);
const db = drizzle(client);

async function resetDatabase() {
  try {
    console.log("🗑️  Dropping all villa-related tables...");

    // Drop tables in correct order (respecting foreign key constraints)
    await db.execute(sql`DROP TABLE IF EXISTS villa_bed_size CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS saved_villa CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS villa_video CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS villa_amenity CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS villa_image CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS villa CASCADE`);

    console.log("✅ Tables dropped successfully");
    console.log(
      "\n📝 Now run the following commands to recreate the tables with serial IDs:",
    );
    console.log("   1. npm run db:push");
    console.log("   2. npm run db:seed");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await client.end();
  }
}

resetDatabase();
