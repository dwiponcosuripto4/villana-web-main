import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  villa,
  villaImage,
  villaAmenity,
  villaVideo,
  villaBedSize,
  province,
  city,
} from "../src/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "fs";
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

// Geo lookup functions
async function findProvinceId(provinceName: string): Promise<string | null> {
  try {
    const result = await db
      .select()
      .from(province)
      .where(eq(province.name, provinceName.toUpperCase()));

    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error(`❌ Error finding province "${provinceName}":`, error);
    return null;
  }
}

async function findCityId(
  cityName: string,
  provinceId: string,
): Promise<string | null> {
  try {
    // Try exact match first
    let result = await db
      .select()
      .from(city)
      .where(eq(city.name, cityName.toUpperCase()));

    // If not found, try with "KABUPATEN" prefix
    if (result.length === 0) {
      result = await db
        .select()
        .from(city)
        .where(eq(city.name, `KABUPATEN ${cityName.toUpperCase()}`));
    }

    // If not found, try with "KOTA" prefix
    if (result.length === 0) {
      result = await db
        .select()
        .from(city)
        .where(eq(city.name, `KOTA ${cityName.toUpperCase()}`));
    }

    // Filter by province if multiple matches
    if (result.length > 0) {
      const cityInProvince = result.find((c) => c.provinceId === provinceId);
      return cityInProvince ? cityInProvince.id : result[0].id;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error finding city "${cityName}":`, error);
    return null;
  }
}

async function seedVillasFromJSON() {
  try {
    console.log("🌱 Starting fresh villa seeding from JSON files...");

    const dataDir = join(__dirname, "../data/villas");
    const files = readdirSync(dataDir).filter((file) => file.endsWith(".json"));

    console.log(`📁 Found ${files.length} JSON file(s) to process`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      console.log(`\n📄 Processing ${file}...`);

      try {
        const filePath = join(dataDir, file);
        const jsonData = JSON.parse(readFileSync(filePath, "utf8"));

        // Create villa without checking for existing (fresh seed)
        // Remove the ID from the JSON data as it will be auto-generated
        const villaData = { ...jsonData.villa };
        delete villaData.id; // Remove any existing ID

        // Resolve geo fields (province and city)
        let provinceId: string | null = null;
        let cityId: string | null = null;

        if (villaData.province) {
          provinceId = await findProvinceId(villaData.province);
          if (!provinceId) {
            console.log(
              `⚠️  Province "${villaData.province}" not found in database`,
            );
          } else {
            console.log(
              `🌏 Province resolved: "${villaData.province}" → ${provinceId}`,
            );
          }
        }

        if (villaData.city && provinceId) {
          cityId = await findCityId(villaData.city, provinceId);
          if (!cityId) {
            console.log(`⚠️  City "${villaData.city}" not found in database`);
          } else {
            console.log(`🏙️  City resolved: "${villaData.city}" → ${cityId}`);
          }
        }

        // Remove original geo fields and add IDs
        delete villaData.province;
        delete villaData.city;

        if (provinceId) villaData.provinceId = provinceId;
        if (cityId) villaData.cityId = cityId;

        // Check if villa with this slug already exists
        const existingVilla = await db
          .select()
          .from(villa)
          .where(eq(villa.slug, villaData.slug));

        if (existingVilla.length > 0) {
          console.log(
            `⏭️  Villa with slug '${villaData.slug}' already exists (ID: ${existingVilla[0].id}). Skipping...`,
          );
          skippedCount++;
          continue;
        }

        const [newVilla] = await db
          .insert(villa)
          .values({
            ...villaData,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Villa created: ID=${newVilla.id} (${newVilla.slug})`);

        // Add images
        if (jsonData.images && jsonData.images.length > 0) {
          for (const imageData of jsonData.images) {
            const imgData = { ...imageData };
            delete imgData.id; // Remove any existing ID

            await db.insert(villaImage).values({
              villaId: newVilla.id,
              ...imgData,
              createdAt: new Date(),
            });
          }
          console.log(`   🖼️  Added ${jsonData.images.length} image(s)`);
        }

        // Add amenities
        if (jsonData.amenities && jsonData.amenities.length > 0) {
          for (const amenityData of jsonData.amenities) {
            const amenData = { ...amenityData };
            delete amenData.id; // Remove any existing ID

            await db.insert(villaAmenity).values({
              villaId: newVilla.id,
              ...amenData,
              createdAt: new Date(),
            });
          }
          console.log(
            `   🎯 Added ${jsonData.amenities.length} amenity/amenities`,
          );
        }

        // Add videos
        if (jsonData.videos && jsonData.videos.length > 0) {
          for (const videoData of jsonData.videos) {
            const vidData = { ...videoData };
            delete vidData.id; // Remove any existing ID

            await db.insert(villaVideo).values({
              villaId: newVilla.id,
              ...vidData,
              createdAt: new Date(),
            });
          }
          console.log(`   🎬 Added ${jsonData.videos.length} video(s)`);
        }

        // Add bed sizes
        if (jsonData.bedSizes && jsonData.bedSizes.length > 0) {
          for (let i = 0; i < jsonData.bedSizes.length; i++) {
            const bedSizeData = jsonData.bedSizes[i];
            await db.insert(villaBedSize).values({
              villaId: newVilla.id,
              bedSize: bedSizeData.bedSize,
              quantity: bedSizeData.quantity || 1,
              orderIndex: i,
              createdAt: new Date(),
            });
          }
          console.log(`   🛏️  Added ${jsonData.bedSizes.length} bed size(s)`);
        }

        processedCount++;
      } catch (fileError) {
        console.error(`❌ Error processing ${file}:`, fileError);
        console.error("   Full error:", fileError);
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Processed: ${processedCount} villa(s)`);
    console.log(`   • Skipped: ${skippedCount} villa(s) (already exist)`);
    console.log(`   • Total files: ${files.length}`);
  } catch (error) {
    console.error("❌ Error during villa seeding:", error);
    console.error("   Full error:", error);
  } finally {
    await client.end();
  }
}

seedVillasFromJSON();
