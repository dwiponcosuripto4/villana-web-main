#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/server/db/schema";
import { sql, inArray } from "drizzle-orm";
import { toTitleCase } from "../src/lib/utils/format";
import * as readline from "readline";

import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

// Create standalone database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env file");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

// Import schema tables
const { searchIndex, city, province, villa } = schema;

async function clearSearchIndex(types?: IndexType[]) {
  if (types && types.length > 0) {
    console.log(`🧹 Clearing existing search index for types: ${types.join(", ")}...`);
    await db.delete(searchIndex).where(inArray(searchIndex.idxType, types));
    console.log(`✅ Search index cleared for types: ${types.join(", ")}`);
  } else {
    console.log("🧹 Clearing entire search index...");
    await db.delete(searchIndex);
    console.log("✅ Search index cleared");
  }
}

async function populateCities() {
  console.log("\n🏙️  Populating cities in search index...");

  try {
    // Get all cities with their provinces
    const cities = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, sql`${city.provinceId} = ${province.id}`);

    console.log(`Found ${cities.length} cities to index`);

    // Insert cities into search index
    for (const record of cities) {
      // Format city and province names with proper title case
      const formattedCityName = toTitleCase(record.city.name);

      // Special handling for DI and DKI provinces - keep them uppercase
      let formattedProvinceName = record.province.name;
      if (
        !formattedProvinceName.startsWith("DI ") &&
        !formattedProvinceName.startsWith("DKI ")
      ) {
        formattedProvinceName = toTitleCase(formattedProvinceName);
      }

      // Create search text with formatted names: "CityName, ProvinceName"
      const searchText = `${formattedCityName}, ${formattedProvinceName}`;

      await db.insert(searchIndex).values({
        idxType: "city",
        cityId: record.city.id,
        villaId: null,
        text: searchText,
      });
    }

    console.log(`✅ Indexed ${cities.length} cities`);
  } catch (error) {
    console.error("❌ Error populating cities:", error);
    throw error;
  }
}

async function populateVillas() {
  console.log("\n🏠 Populating villas in search index...");

  try {
    // Get all villas with their cities and provinces
    const villas = await db
      .select({
        villa: villa,
        city: city,
        province: province,
      })
      .from(villa)
      .leftJoin(city, sql`${villa.cityId} = ${city.id}`)
      .leftJoin(province, sql`${city.provinceId} = ${province.id}`)
      .where(sql`${villa.status} = 'published'`);

    console.log(`Found ${villas.length} published villas to index`);

    // Insert villas into search index
    let indexedCount = 0;
    for (const record of villas) {
      if (!record.villa) continue;

      // Build comprehensive search text
      const parts = [
        record.villa.title,
        // record.villa.slug.replace(/-/g, " "),
        record.villa.address,

        ...(record.villa.keywords || []),
      ];

      // Add city and province info if available
      if (record.city) {
        parts.push(record.city.name);
      }
      if (record.province) {
        parts.push(record.province.name);
      }
      if (record.villa.address) {
        parts.push(record.villa.address);
      }

      // // Add features for better searchability
      const features = [];
      // if (record.villa.hasAc) features.push("AC", "air conditioning");
      // if (record.villa.hasBathtub) features.push("bathtub", "bath");
      // if (record.villa.hasTv) features.push("TV", "television");
      // if (record.villa.hasBreakfast) features.push("breakfast");
      //
      // // Add bedroom count
      // if (record.villa.bedroomMin === record.villa.bedroomMax) {
      //   features.push(`${record.villa.bedroomMin} bedroom`);
      // } else {
      //   features.push(
      //     `${record.villa.bedroomMin}-${record.villa.bedroomMax} bedroom`,
      //   );
      // }
      //
      // // Add unit count
      // if (record.villa.unitsCount > 1) {
      //   features.push(`${record.villa.unitsCount} units`);
      // }

      const searchText = [...parts, ...features].filter(Boolean).join(" ");

      await db.insert(searchIndex).values({
        idxType: "villa",
        villaId: record.villa.id,
        cityId: record.city?.id || null,
        slug: record.villa.slug,
        text: searchText,
      });

      indexedCount++;
    }

    console.log(`✅ Indexed ${indexedCount} villas`);
  } catch (error) {
    console.error("❌ Error populating villas:", error);
    throw error;
  }
}

async function verifyIndex() {
  console.log("\n🔍 Verifying search index...");

  const stats = await db
    .select({
      type: searchIndex.idxType,
      count: sql<number>`count(*)::int`,
    })
    .from(searchIndex)
    .groupBy(searchIndex.idxType);

  console.log("\n📊 Search Index Statistics:");
  console.log("================================");
  for (const stat of stats) {
    console.log(
      `${stat.type === "city" ? "🏙️  Cities" : "🏠 Villas"}: ${stat.count} entries`,
    );
  }

  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  console.log("================================");
  console.log(`📋 Total entries: ${total}`);
}

async function testSearch() {
  console.log("\n🧪 Testing search functionality...");

  const testQueries = ["Jakarta", "Bali", "villa", "bedroom", "AC"];

  for (const query of testQueries) {
    const results = await db
      .select({
        type: searchIndex.idxType,
        text: searchIndex.text,
      })
      .from(searchIndex)
      .where(
        sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${query})`,
      )
      .limit(3);

    console.log(`\nSearch for "${query}": ${results.length} results`);
    for (const result of results) {
      console.log(`  - [${result.type}] ${result.text.substring(0, 60)}...`);
    }
  }
}

// Available index types
const AVAILABLE_TYPES = ["city", "villa"] as const;
type IndexType = typeof AVAILABLE_TYPES[number];

// Parse command line arguments
function parseArgs(): {
  types: IndexType[];
  showHelp: boolean;
} {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    return { types: [], showHelp: true };
  }

  const types: IndexType[] = [];

  if (args.includes("--all")) {
    types.push(...AVAILABLE_TYPES);
  } else {
    if (args.includes("--city")) types.push("city");
    if (args.includes("--villa")) types.push("villa");
  }

  return { types, showHelp: false };
}

// Display help information
function showHelpMessage() {
  console.log(`
🚀 Search Index Population Script

Usage:
  npx tsx scripts/populate-search-index.ts [flags]

Flags:
  --all          Reindex all types (cities and villas)
  --city         Reindex only cities
  --villa        Reindex only villas
  --help, -h     Show this help message

Examples:
  npx tsx scripts/populate-search-index.ts --all
  npx tsx scripts/populate-search-index.ts --villa
  npx tsx scripts/populate-search-index.ts --city
  npx tsx scripts/populate-search-index.ts --villa --city

Package.json scripts:
  npm run db:populate-search           # Reindex all types
  npm run db:populate-search -- --villa   # Reindex only villas
  npm run db:populate-search -- --city    # Reindex only cities
`);
}

// Function to get user confirmation
async function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(
        answer.toLowerCase().trim() === "y" ||
          answer.toLowerCase().trim() === "yes",
      );
    });
  });
}

async function main() {
  console.log("🚀 Starting search index population script");
  console.log("==========================================\n");

  // Parse command line arguments
  const { types, showHelp } = parseArgs();

  // Show help if requested
  if (showHelp) {
    showHelpMessage();
    process.exit(0);
  }

  // Show help and exit if no types specified
  if (types.length === 0) {
    console.log("❌ No index types specified. Please specify which types to reindex.\n");
    showHelpMessage();
    process.exit(1);
  }

  // Warn user and ask for confirmation before clearing existing index
  if (types.length === AVAILABLE_TYPES.length) {
    console.log(
      "⚠️  WARNING: This script will DELETE ALL existing search index data!",
    );
  } else {
    console.log(
      `⚠️  WARNING: This script will DELETE search index data for: ${types.join(", ")}`,
    );
  }
  console.log("This action cannot be undone.\n");

  const confirmed = await askForConfirmation(
    "Do you want to continue? (y/N): ",
  );

  if (!confirmed) {
    console.log("❌ Operation cancelled by user.");
    process.exit(0);
  }

  console.log(`✅ Proceeding with search index population for: ${types.join(", ")}...\n`);

  try {
    // Clear existing index for specified types
    await clearSearchIndex(types);

    // Populate based on specified types
    if (types.includes("city")) {
      await populateCities();
    }

    if (types.includes("villa")) {
      await populateVillas();
    }

    // Verify the index
    await verifyIndex();

    // Test search functionality
    await testSearch();

    console.log("\n==========================================");
    console.log(`✅ Search index population completed successfully for: ${types.join(", ")}!`);

    // Close database connection
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("\n==========================================");
    console.error("❌ Failed to populate search index:", error);

    // Close database connection
    await client.end();
    process.exit(1);
  }
}

// Run the script
main();
