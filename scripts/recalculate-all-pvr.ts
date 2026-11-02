#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/server/db/schema";
import { eq, sql, isNotNull, and, gt } from "drizzle-orm";
import { VillaService } from "../src/lib/server/services/villa.service";
import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

// Create standalone database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env file");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

// Import schema tables
const { villa } = schema;

// Configuration
const DEFAULT_BATCH_SIZE = 50;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || DEFAULT_BATCH_SIZE.toString());

interface BatchStats {
  total: number;
  processed: number;
  successful: number;
  skipped: number;
  failed: number;
  errors: Array<{ villaId: number; error: string }>;
}

async function getVillasForPVRRecalculation() {
  console.log("🔍 Fetching villas eligible for PVR recalculation...");

  // Get villas that have required data for PVR calculation
  const villas = await db
    .select({
      id: villa.id,
      title: villa.title,
      priceMin: villa.priceMin,
      priceMax: villa.priceMax,
      googleRating: villa.googleRating,
      googleRatingCount: villa.googleRatingCount,
      pvr: villa.pvr,
    })
    .from(villa)
    .where(
      and(
        isNotNull(villa.googleRating),
        isNotNull(villa.googleRatingCount),
        gt(villa.googleRatingCount, 0),
        isNotNull(villa.priceMin),
        isNotNull(villa.priceMax)
      )
    );

  console.log(`Found ${villas.length} villas eligible for PVR recalculation`);

  // Filter out villas with invalid price data
  const validVillas = villas.filter(v => {
    const priceMin = parseFloat(v.priceMin);
    const priceMax = parseFloat(v.priceMax);
    return priceMin > 0 && priceMax > 0 && priceMin <= priceMax;
  });

  if (validVillas.length !== villas.length) {
    console.log(`⚠️  Filtered out ${villas.length - validVillas.length} villas with invalid price data`);
  }

  console.log(`✅ ${validVillas.length} villas ready for processing`);
  return validVillas;
}

async function processBatch(villas: any[], batchNumber: number, stats: BatchStats) {
  console.log(`\n📦 Processing batch ${batchNumber} (${villas.length} villas)...`);

  const results = await Promise.allSettled(
    villas.map(async (villa) => {
      try {
        const originalPvr = villa.pvr ? parseFloat(villa.pvr) : null;
        const newPvr = await VillaService.recalculateVillaScore(villa.id);

        if (newPvr !== undefined) {
          const pvrChange = originalPvr ? (newPvr - originalPvr).toFixed(2) : 'new';
          console.log(
            `  ✓ Villa ${villa.id} (${villa.title.substring(0, 30)}...): ` +
            `PVR ${originalPvr?.toFixed(2) || 'null'} → ${newPvr.toFixed(2)} ` +
            `(${pvrChange === 'new' ? 'new' : (pvrChange >= 0 ? '+' : '') + pvrChange})`
          );
          return { success: true, villaId: villa.id, newPvr };
        } else {
          console.log(`  ⚠️  Villa ${villa.id}: Skipped (insufficient data)`);
          return { success: false, villaId: villa.id, reason: 'insufficient_data' };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ Villa ${villa.id}: Error - ${errorMessage}`);
        return { success: false, villaId: villa.id, error: errorMessage };
      }
    })
  );

  // Process results
  for (const result of results) {
    stats.processed++;

    if (result.status === 'fulfilled') {
      const { success, reason, error } = result.value;
      if (success) {
        stats.successful++;
      } else if (reason === 'insufficient_data') {
        stats.skipped++;
      } else {
        stats.failed++;
        if (error) {
          stats.errors.push({ villaId: result.value.villaId, error });
        }
      }
    } else {
      stats.failed++;
      stats.errors.push({
        villaId: 0,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
    }
  }

  const progress = ((stats.processed / stats.total) * 100).toFixed(1);
  console.log(
    `📊 Batch ${batchNumber} complete: ` +
    `${results.filter(r => r.status === 'fulfilled' && r.value.success).length} successful, ` +
    `${results.filter(r => r.status === 'fulfilled' && r.value.reason === 'insufficient_data').length} skipped, ` +
    `${results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)).length} failed ` +
    `(${progress}% total progress)`
  );
}

async function recalculateAllPVR() {
  console.log("🚀 Starting batch PVR recalculation");
  console.log(`⚙️  Batch size: ${BATCH_SIZE}`);
  console.log("==========================================\n");

  const startTime = Date.now();
  const stats: BatchStats = {
    total: 0,
    processed: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all eligible villas
    const villas = await getVillasForPVRRecalculation();
    stats.total = villas.length;

    if (villas.length === 0) {
      console.log("ℹ️  No villas found for PVR recalculation");
      return;
    }

    // Process in batches
    const totalBatches = Math.ceil(villas.length / BATCH_SIZE);
    console.log(`📋 Processing ${villas.length} villas in ${totalBatches} batches\n`);

    for (let i = 0; i < villas.length; i += BATCH_SIZE) {
      const batch = villas.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      await processBatch(batch, batchNumber, stats);

      // Small delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < villas.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final statistics
    const duration = (Date.now() - startTime) / 1000;
    console.log("\n==========================================");
    console.log("📊 Final Results:");
    console.log("==========================================");
    console.log(`✅ Successfully recalculated: ${stats.successful} villas`);
    console.log(`⚠️  Skipped (insufficient data): ${stats.skipped} villas`);
    console.log(`❌ Failed: ${stats.failed} villas`);
    console.log(`⏱️  Total time: ${duration.toFixed(1)} seconds`);
    console.log(`📈 Processing rate: ${(stats.total / duration).toFixed(1)} villas/second`);

    // Show errors if any
    if (stats.errors.length > 0) {
      console.log("\n❌ Error Details:");
      console.log("==========================================");
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. Villa ${error.villaId}: ${error.error}`);
      });
    }

    console.log("\n✅ Batch PVR recalculation completed!");

  } catch (error) {
    console.error("\n==========================================");
    console.error("❌ Failed to recalculate PVR:", error);
    throw error;
  }
}

// Handle command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    help: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.log(`Unknown argument: ${arg}`);
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🏠 Villa PVR Batch Recalculation Script

Usage: npm run recalc-pvr-all [options]

Options:
  --dry-run     Show what would be processed without making changes
  --help, -h    Show this help message

Environment Variables:
  BATCH_SIZE    Number of villas to process per batch (default: ${DEFAULT_BATCH_SIZE})

This script recalculates PVR (Price Value Ratio) for all villas that have:
- Google rating and rating count
- Valid price range (priceMin and priceMax)
- Pricing data where priceMin > 0, priceMax > 0, and priceMin <= priceMax

The script processes villas in batches to handle large datasets efficiently
and provides detailed progress reporting and error handling.
`);
}

async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.dryRun) {
    console.log("🧪 DRY RUN MODE - No changes will be made\n");

    try {
      const villas = await getVillasForPVRRecalculation();
      console.log(`\n📋 Would process ${villas.length} villas in ${Math.ceil(villas.length / BATCH_SIZE)} batches`);
      console.log(`⚙️  Batch size: ${BATCH_SIZE}`);

      if (villas.length > 0) {
        console.log("\n📝 Sample villas to be processed:");
        const sample = villas.slice(0, 5);
        sample.forEach((villa, index) => {
          console.log(`  ${index + 1}. Villa ${villa.id}: ${villa.title.substring(0, 50)}...`);
        });
        if (villas.length > 5) {
          console.log(`  ... and ${villas.length - 5} more villas`);
        }
      }

      console.log("\n✅ Dry run completed. Use without --dry-run to execute.");
    } catch (error) {
      console.error("❌ Dry run failed:", error);
      process.exit(1);
    }
  } else {
    try {
      await recalculateAllPVR();
    } catch (error) {
      console.error("❌ Script failed:", error);
      process.exit(1);
    }
  }

  // Close database connection
  await client.end();
  process.exit(0);
}

// Run the script
main();