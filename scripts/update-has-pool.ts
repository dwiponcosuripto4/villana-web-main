import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { villa, villaAmenity } from "../src/lib/server/db/schema";
import { eq, or, ilike, sql } from "drizzle-orm";
import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

// Database connection
const client = postgres(
  process.env.DATABASE_URL ||
    "postgres://root:mysecretpassword@localhost:5432/local",
);
const db = drizzle(client);

// Pool-related keywords to check in amenity names
const POOL_KEYWORDS = [
  "pool",
  "infinity pool",
  "private pool",
  "swimming pool",
  "heated pool",
  "poolside",
  "pool deck",
  "pool area",
  "jacuzzi",
  "hot tub",
  "spa pool",
  "plunge pool",
  "lap pool",
  "kiddie pool",
  "pool bar",
  "pool service",
];

async function updateHasPool() {
  console.log("Starting hasPool update process...\n");

  try {
    // First, get all villas with pool amenities
    console.log("Step 1: Finding villas with pool amenities...");

    // Query villas that have amenities with category 'pool'
    const villasWithPoolCategory = await db
      .selectDistinct({ villaId: villaAmenity.villaId })
      .from(villaAmenity)
      .where(eq(villaAmenity.category, "pool"));

    console.log(`Found ${villasWithPoolCategory.length} villas with pool category amenities`);

    // Query villas that have amenities with pool-related keywords in the name
    const poolConditions = POOL_KEYWORDS.map(keyword =>
      ilike(villaAmenity.name, `%${keyword}%`)
    );

    const villasWithPoolKeywords = await db
      .selectDistinct({ villaId: villaAmenity.villaId })
      .from(villaAmenity)
      .where(or(...poolConditions));

    console.log(`Found ${villasWithPoolKeywords.length} villas with pool-related keywords in amenity names`);

    // Combine all villa IDs (removing duplicates)
    const allVillaIds = new Set([
      ...villasWithPoolCategory.map(v => v.villaId),
      ...villasWithPoolKeywords.map(v => v.villaId),
    ]);

    console.log(`\nTotal unique villas with pools: ${allVillaIds.size}`);

    if (allVillaIds.size === 0) {
      console.log("No villas with pool amenities found. Nothing to update.");
      await client.end();
      return;
    }

    // Update hasPool to true for all these villas
    console.log("\nStep 2: Updating hasPool field...");

    let updatedCount = 0;
    for (const villaId of allVillaIds) {
      await db
        .update(villa)
        .set({ hasPool: true })
        .where(eq(villa.id, villaId));
      updatedCount++;

      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} villas...`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} villas with hasPool = true`);

    // Optional: Show some statistics
    console.log("\nStep 3: Verifying results...");

    const totalVillas = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(villa);

    const villasWithPool = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(villa)
      .where(eq(villa.hasPool, true));

    console.log(`\nFinal Statistics:`);
    console.log(`- Total villas in database: ${totalVillas[0].count}`);
    console.log(`- Villas with hasPool = true: ${villasWithPool[0].count}`);
    console.log(`- Percentage with pools: ${((villasWithPool[0].count / totalVillas[0].count) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error("Error updating hasPool:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n✅ Database connection closed");
  }
}

// Run the update
updateHasPool().catch(console.error);