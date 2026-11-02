import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { province, city } from "../src/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { loadEnv } from "../src/lib/server/utils/env";
loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const client = postgres(
  process.env.DATABASE_URL ||
    "postgres://root:mysecretpassword@localhost:5432/local",
);
const db = drizzle(client);

async function importProvinces() {
  console.log("🌏 Starting province data import...");

  try {
    const provinceCsvPath = join(__dirname, "../data/geo/provinces.csv");
    const provinceData = readFileSync(provinceCsvPath, "utf8");
    const provinceLines = provinceData.trim().split("\n");

    let processedCount = 0;
    let skippedCount = 0;

    for (const line of provinceLines) {
      const [id, name] = line.split(",");

      if (!id || !name) {
        console.log(`⚠️  Skipping invalid line: ${line}`);
        continue;
      }

      // Check if province already exists
      const existingProvince = await db
        .select()
        .from(province)
        .where(eq(province.id, id));

      if (existingProvince.length > 0) {
        console.log(
          `⏭️  Province '${name}' (ID: ${id}) already exists. Skipping...`,
        );
        skippedCount++;
        continue;
      }

      await db.insert(province).values({
        id,
        name,
        createdAt: new Date(),
      });

      console.log(`✅ Province imported: ${id} - ${name}`);
      processedCount++;
    }

    console.log(`📊 Province import summary:`);
    console.log(`   • Processed: ${processedCount} province(s)`);
    console.log(`   • Skipped: ${skippedCount} province(s) (already exist)`);
    console.log(`   • Total lines: ${provinceLines.length}`);

    return { processedCount, skippedCount };
  } catch (error) {
    console.error("❌ Error importing provinces:", error);
    throw error;
  }
}

async function importCities() {
  console.log("🏙️ Starting city data import...");

  try {
    const cityCsvPath = join(__dirname, "../data/geo/cities.csv");
    const cityData = readFileSync(cityCsvPath, "utf8");
    const cityLines = cityData.trim().split("\n");

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const line of cityLines) {
      const [id, name] = line.split(",");

      if (!id || !name) {
        console.log(`⚠️  Skipping invalid line: ${line}`);
        continue;
      }

      // Extract province ID from city ID (first 2 digits)
      const provinceId = id.substring(0, 2);

      // Check if province exists
      const existingProvince = await db
        .select()
        .from(province)
        .where(eq(province.id, provinceId));

      if (existingProvince.length === 0) {
        console.log(
          `❌ Province '${provinceId}' not found for city '${name}' (ID: ${id}). Skipping...`,
        );
        errorCount++;
        continue;
      }

      // Check if city already exists
      const existingCity = await db.select().from(city).where(eq(city.id, id));

      if (existingCity.length > 0) {
        console.log(
          `⏭️  City '${name}' (ID: ${id}) already exists. Skipping...`,
        );
        skippedCount++;
        continue;
      }

      await db.insert(city).values({
        id,
        name,
        provinceId,
        createdAt: new Date(),
      });

      console.log(
        `✅ City imported: ${id} - ${name} (Province: ${provinceId})`,
      );
      processedCount++;
    }

    console.log(`📊 City import summary:`);
    console.log(`   • Processed: ${processedCount} city/cities`);
    console.log(`   • Skipped: ${skippedCount} city/cities (already exist)`);
    console.log(`   • Errors: ${errorCount} city/cities (missing province)`);
    console.log(`   • Total lines: ${cityLines.length}`);

    return { processedCount, skippedCount, errorCount };
  } catch (error) {
    console.error("❌ Error importing cities:", error);
    throw error;
  }
}

async function importGeoData() {
  try {
    console.log("🚀 Starting geo data import process...");
    console.log("=====================================\n");

    // Import provinces first
    const provinceResults = await importProvinces();

    console.log("\n=====================================\n");

    // Import cities second (requires provinces to exist)
    const cityResults = await importCities();

    console.log("\n=====================================");
    console.log("🎉 Geo data import completed!");
    console.log("📈 Overall summary:");
    console.log(
      `   • Provinces: ${provinceResults.processedCount} processed, ${provinceResults.skippedCount} skipped`,
    );
    console.log(
      `   • Cities: ${cityResults.processedCount} processed, ${cityResults.skippedCount} skipped, ${cityResults.errorCount} errors`,
    );
  } catch (error) {
    console.error("💥 Fatal error during geo data import:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the import
importGeoData();
