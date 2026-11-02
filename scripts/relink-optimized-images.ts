import { readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { villaImage, villa, placeImage, place } from "../src/lib/server/db/schema.js";
import { eq, sql, or, and } from "drizzle-orm";
import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

interface ImageMapping {
  entityId: string | number;  // Can be number (villa) or string (place UUID)
  imageUrl: string;
  orderIndex: number;
}

interface EntityImageStatus {
  entityId: string | number;
  imageCount: number;
  hasOldPaths: boolean;
}

interface ProcessStats {
  totalEntities: number;
  entitiesNeedingRelink: number;
  entitiesProcessed: number;
  imagesRelinked: number;
  errors: number;
  skippedEntities: number;
  entitiesAlreadyOptimized: number;
}

type EntityType = "villa" | "place";

interface EntityConfig {
  entityType: EntityType;
  optimizedDir: string;
  table: typeof villaImage | typeof placeImage;
  entityTable: typeof villa | typeof place;
  entityName: string;
  pluralName: string;
}

class EntityImageRelinker {
  private readonly config: EntityConfig;
  private readonly imageMappings: ImageMapping[] = [];
  private readonly dryRun: boolean;
  private readonly specificEntityId?: string | number;
  private db;
  private client;
  private stats: ProcessStats = {
    totalEntities: 0,
    entitiesNeedingRelink: 0,
    entitiesProcessed: 0,
    imagesRelinked: 0,
    errors: 0,
    skippedEntities: 0,
    entitiesAlreadyOptimized: 0,
  };

  constructor(entityType: EntityType = "villa", dryRun: boolean = false, entityId?: string | number) {
    this.dryRun = dryRun;
    this.specificEntityId = entityId;
    this.config = this.getEntityConfig(entityType);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    this.client = postgres(databaseUrl);
    this.db = drizzle(this.client);
  }

  private getEntityConfig(entityType: EntityType): EntityConfig {
    const baseOptimizedDir = "./static/images-optm";

    switch (entityType) {
      case "villa":
        return {
          entityType: "villa",
          optimizedDir: process.env.IMAGE_OPTM_DIR || `${baseOptimizedDir}/villas`,
          table: villaImage,
          entityTable: villa,
          entityName: "villa",
          pluralName: "villas",
        };
      case "place":
        return {
          entityType: "place",
          optimizedDir: `${baseOptimizedDir}/places`,
          table: placeImage,
          entityTable: place,
          entityName: "place",
          pluralName: "places",
        };
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async run() {
    console.log(
      `🚀 Starting optimized ${this.config.entityName} image re-linking ${this.dryRun ? "(DRY RUN)" : ""}${
        this.specificEntityId ? ` for ${this.config.entityName} ${this.specificEntityId}` : ""
      }`
    );

    try {
      const entitiesNeedingRelink = await this.findEntitiesNeedingRelink();
      await this.scanOptimizedDirectory(entitiesNeedingRelink);
      await this.relinkImages();
      this.printSummary();
    } catch (error) {
      console.error("❌ Error during re-linking:", error);
      this.stats.errors++;
    } finally {
      await this.cleanup();
    }
  }

  private async cleanup() {
    try {
      await this.client.end();
    } catch (error) {
      console.error("Warning: Failed to close database connection:", error);
    }
  }

  private async findEntitiesNeedingRelink(): Promise<Set<string | number>> {
    console.log(`🔍 Checking database for ${this.config.pluralName} that need re-linking...`);

    const entitiesNeedingRelink = new Set<string | number>();

    if (this.specificEntityId) {
      // For specific entity, check if it needs re-linking
      const imageStatus = await this.checkEntityImageStatus(this.specificEntityId);
      if (imageStatus.imageCount === 0 || imageStatus.hasOldPaths) {
        entitiesNeedingRelink.add(this.specificEntityId);
        console.log(`📌 ${this.config.entityName} ${this.specificEntityId} needs re-linking`);
      } else {
        console.log(`✅ ${this.config.entityName} ${this.specificEntityId} already has optimized images`);
      }
    } else {
      // Get all entities that have no images or have old /uploads/ paths
      if (this.config.entityType === "villa") {
        const villasWithOldOrNoImages = await this.db
          .select({
            entityId: villa.id,
          })
          .from(villa)
          .leftJoin(villaImage, eq(villa.id, villaImage.villaId))
          .where(
            or(
              // Villas with no images
              sql`${villaImage.villaId} IS NULL`,
              // Villas with images that start with /uploads/
              sql`${villaImage.imageUrl} LIKE '/uploads/%'`,
              sql`${villaImage.thumbnailUrl} LIKE '/uploads/%'`
            )
          )
          .groupBy(villa.id);

        for (const result of villasWithOldOrNoImages) {
          entitiesNeedingRelink.add(result.entityId);
        }
      } else {
        const placesWithOldOrNoImages = await this.db
          .select({
            entityId: place.id,
          })
          .from(place)
          .leftJoin(placeImage, eq(place.id, placeImage.placeId))
          .where(
            or(
              // Places with no images
              sql`${placeImage.placeId} IS NULL`,
              // Places with images that start with /uploads/
              sql`${placeImage.imageUrl} LIKE '/uploads/%'`,
              sql`${placeImage.thumbnailUrl} LIKE '/uploads/%'`
            )
          )
          .groupBy(place.id);

        for (const result of placesWithOldOrNoImages) {
          entitiesNeedingRelink.add(result.entityId);
        }
      }

      console.log(`📊 Found ${entitiesNeedingRelink.size} ${this.config.pluralName} that need re-linking`);
    }

    this.stats.entitiesNeedingRelink = entitiesNeedingRelink.size;
    return entitiesNeedingRelink;
  }

  private async checkEntityImageStatus(entityId: string | number): Promise<EntityImageStatus> {
    let images: any[] = [];

    if (this.config.entityType === "villa") {
      images = await this.db
        .select({
          imageUrl: villaImage.imageUrl,
          thumbnailUrl: villaImage.thumbnailUrl,
        })
        .from(villaImage)
        .where(eq(villaImage.villaId, entityId as number));
    } else {
      images = await this.db
        .select({
          imageUrl: placeImage.imageUrl,
          thumbnailUrl: placeImage.thumbnailUrl,
        })
        .from(placeImage)
        .where(eq(placeImage.placeId, entityId as string));
    }

    const imageCount = images.length;
    const hasOldPaths = images.some(
      img =>
        img.imageUrl.startsWith('/uploads/') ||
        (img.thumbnailUrl && img.thumbnailUrl.startsWith('/uploads/'))
    );

    return {
      entityId,
      imageCount,
      hasOldPaths,
    };
  }

  private async scanOptimizedDirectory(entitiesNeedingRelink: Set<string | number>) {
    console.log(`📥 Scanning optimized images directory (${this.config.optimizedDir})...`);

    if (!existsSync(this.config.optimizedDir)) {
      throw new Error(`Optimized directory doesn't exist: ${this.config.optimizedDir}`);
    }

    let entityDirectories: string[] = [];

    if (this.specificEntityId) {
      // Check if specific entity directory exists and needs re-linking
      if (entitiesNeedingRelink.has(this.specificEntityId)) {
        const entityDir = join(this.config.optimizedDir, this.specificEntityId.toString());
        if (existsSync(entityDir)) {
          entityDirectories = [this.specificEntityId.toString()];
        } else {
          console.log(`⚠️  No optimized images found for ${this.config.entityName} ${this.specificEntityId}`);
          return;
        }
      } else {
        console.log(`✅ ${this.config.entityName} ${this.specificEntityId} already has optimized images, skipping`);
        this.stats.entitiesAlreadyOptimized = 1;
        return;
      }
    } else {
      // Get all entity directories that need re-linking
      const allEntries = await readdir(this.config.optimizedDir);
      entityDirectories = [];

      for (const entry of allEntries) {
        const entryPath = join(this.config.optimizedDir, entry);
        const entryStat = await stat(entryPath);

        if (entryStat.isDirectory()) {
          let entityId: string | number;
          let isValidEntity = false;

          if (this.config.entityType === "villa" && /^\d+$/.test(entry)) {
            // Villa: numeric ID
            entityId = parseInt(entry);
            isValidEntity = true;
          } else if (this.config.entityType === "place" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry)) {
            // Place: UUID
            entityId = entry;
            isValidEntity = true;
          }

          if (isValidEntity && entitiesNeedingRelink.has(entityId!)) {
            entityDirectories.push(entry);
          } else if (isValidEntity) {
            this.stats.entitiesAlreadyOptimized++;
          }
        }
      }
    }

    this.stats.totalEntities = entityDirectories.length;
    console.log(`🔍 Found ${this.stats.totalEntities} ${this.config.entityName} directories with optimized images that need re-linking`);

    if (this.stats.entitiesAlreadyOptimized > 0) {
      console.log(`✅ Skipped ${this.stats.entitiesAlreadyOptimized} ${this.config.pluralName} that already have optimized images`);
    }

    // Process each entity directory
    for (const entityIdStr of entityDirectories) {
      const entityId = this.config.entityType === "villa" ? parseInt(entityIdStr) : entityIdStr;
      await this.processEntityImages(entityId);
    }
  }

  private async processEntityImages(entityId: string | number) {
    try {
      const entityDir = join(this.config.optimizedDir, entityId.toString());
      const imageFiles = await readdir(entityDir);

      // Filter for .webp files and sort by number
      const webpFiles = imageFiles
        .filter(file => file.endsWith('.webp'))
        .sort((a, b) => {
          const aNum = parseInt(basename(a, '.webp'));
          const bNum = parseInt(basename(b, '.webp'));
          return aNum - bNum;
        });

      if (webpFiles.length === 0) {
        console.log(`⚠️  No .webp files found for ${this.config.entityName} ${entityId}`);
        this.stats.skippedEntities++;
        return;
      }

      console.log(`📁 Found ${webpFiles.length} images for ${this.config.entityName} ${entityId}`);

      // Verify entity exists in database
      const [entityExists] = await this.db
        .select({ id: this.config.entityTable.id })
        .from(this.config.entityTable)
        .where(eq(this.config.entityTable.id, entityId))
        .limit(1);

      if (!entityExists) {
        console.log(`⚠️  ${this.config.entityName} ${entityId} not found in database, skipping`);
        this.stats.skippedEntities++;
        return;
      }

      // Create image mappings
      for (const file of webpFiles) {
        const orderIndex = parseInt(basename(file, '.webp'));
        const imageUrl = `/images-optm/${this.config.pluralName}/${entityId}/${file}`;

        this.imageMappings.push({
          entityId,
          imageUrl,
          orderIndex,
        });
      }

      this.stats.entitiesProcessed++;
    } catch (error) {
      console.error(`❌ Error processing ${this.config.entityName} ${entityId}:`, error);
      this.stats.errors++;
    }
  }

  private async relinkImages() {
    if (this.imageMappings.length === 0) {
      console.log("📝 No images to re-link");
      return;
    }

    console.log(`\n📝 Re-linking ${this.imageMappings.length} images...`);

    // Group mappings by entity
    const mappingsByEntity = new Map<string | number, ImageMapping[]>();
    for (const mapping of this.imageMappings) {
      if (!mappingsByEntity.has(mapping.entityId)) {
        mappingsByEntity.set(mapping.entityId, []);
      }
      mappingsByEntity.get(mapping.entityId)!.push(mapping);
    }

    // Process each entity
    for (const [entityId, mappings] of mappingsByEntity.entries()) {
      if (this.dryRun) {
        console.log(`\n[DRY RUN] Would update ${this.config.entityName} ${entityId}:`);
        console.log(`  - Remove existing image records`);
        console.log(`  - Insert ${mappings.length} new image records:`);
        for (const mapping of mappings) {
          console.log(`    • ${mapping.imageUrl} (order: ${mapping.orderIndex})`);
        }
        this.stats.imagesRelinked += mappings.length;
        continue;
      }

      try {
        // Use transaction for atomic updates
        await this.db.transaction(async (tx) => {
          if (this.config.entityType === "villa") {
            // First, delete existing images for this villa
            await tx.delete(villaImage).where(eq(villaImage.villaId, entityId as number));

            // Then insert new image records
            for (const mapping of mappings) {
              await tx.insert(villaImage).values({
                villaId: mapping.entityId as number,
                imageUrl: mapping.imageUrl,
                thumbnailUrl: mapping.imageUrl, // Using same as imageUrl
                orderIndex: mapping.orderIndex,
                altText: `Villa ${mapping.entityId} Image ${mapping.orderIndex}`,
              });
            }
          } else {
            // First, delete existing images for this place
            await tx.delete(placeImage).where(eq(placeImage.placeId, entityId as string));

            // Then insert new image records
            for (const mapping of mappings) {
              await tx.insert(placeImage).values({
                placeId: mapping.entityId as string,
                imageUrl: mapping.imageUrl,
                thumbnailUrl: mapping.imageUrl, // Using same as imageUrl
                orderIndex: mapping.orderIndex,
                altText: `Place ${mapping.entityId} Image ${mapping.orderIndex}`,
              });
            }
          }
        });

        console.log(`✓ ${this.config.entityName} ${entityId}: Re-linked ${mappings.length} images`);
        this.stats.imagesRelinked += mappings.length;
      } catch (error) {
        console.error(`❌ Failed to update ${this.config.entityName} ${entityId}:`, error);
        this.stats.errors++;
      }
    }
  }

  private printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log(`📊 ${this.config.entityName.toUpperCase()} RE-LINKING SUMMARY`);
    console.log("=".repeat(60));
    console.log(`\n📁 Directory scanned: ${this.config.optimizedDir}`);
    console.log(`\n📈 Statistics:`);
    console.log(`  • ${this.config.entityName}s needing re-linking (from DB): ${this.stats.entitiesNeedingRelink}`);
    console.log(`  • ${this.config.entityName} directories with optimized images: ${this.stats.totalEntities}`);
    console.log(`  • ${this.config.entityName}s already optimized (skipped): ${this.stats.entitiesAlreadyOptimized}`);
    console.log(`  • ${this.config.entityName}s successfully processed: ${this.stats.entitiesProcessed}`);
    console.log(`  • ${this.config.entityName}s skipped (not in DB): ${this.stats.skippedEntities}`);
    console.log(`  • Total images re-linked: ${this.stats.imagesRelinked}`);
    console.log(`  • Errors encountered: ${this.stats.errors}`);

    if (this.stats.entitiesProcessed > 0) {
      const avgImagesPerEntity = (this.stats.imagesRelinked / this.stats.entitiesProcessed).toFixed(1);
      console.log(`  • Average images per ${this.config.entityName}: ${avgImagesPerEntity}`);
    }

    if (this.dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No actual database changes were made");
      console.log("💡 Run without --dry-run flag to apply changes");
    } else if (this.stats.errors === 0 && this.stats.imagesRelinked > 0) {
      console.log(`\n✅ ${this.config.entityName} re-linking completed successfully!`);
    } else if (this.stats.errors > 0) {
      console.log(`\n⚠️  ${this.config.entityName} re-linking completed with errors. Please review the output above.`);
    }

    console.log("=".repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || args.includes("-d");

  // Parse entity type arguments
  const processVillas = args.includes("--villa") || args.includes("-v");
  const processPlaces = args.includes("--place") || args.includes("-p");
  const processAll = args.includes("--all") || args.includes("-a");

  // Default to villa if no specific flag is provided
  const entitiesToProcess: EntityType[] = [];
  if (processAll) {
    entitiesToProcess.push("villa", "place");
  } else if (processPlaces && !processVillas) {
    entitiesToProcess.push("place");
  } else if (processVillas && !processPlaces) {
    entitiesToProcess.push("villa");
  } else if (!processVillas && !processPlaces && !processAll) {
    // Default to villa if no flags provided
    entitiesToProcess.push("villa");
  } else {
    // Both villa and place flags were provided
    entitiesToProcess.push("villa", "place");
  }

  // Parse entity ID if provided
  let entityId: string | number | undefined;
  const villaIdArg = args.find(arg => arg.startsWith("--villa-id="));
  const placeIdArg = args.find(arg => arg.startsWith("--place-id="));

  if (villaIdArg) {
    entityId = parseInt(villaIdArg.split("=")[1]);
    if (isNaN(entityId as number)) {
      console.error("❌ Invalid villa ID provided");
      process.exit(1);
    }
    // Force villa processing if villa ID is specified
    entitiesToProcess.length = 0;
    entitiesToProcess.push("villa");
  } else if (placeIdArg) {
    entityId = placeIdArg.split("=")[1];
    if (!entityId || entityId.length === 0) {
      console.error("❌ Invalid place ID provided");
      process.exit(1);
    }
    // Force place processing if place ID is specified
    entitiesToProcess.length = 0;
    entitiesToProcess.push("place");
  }

  if (dryRun) {
    console.log("🔍 Running in DRY RUN mode - no changes will be made\n");
  }

  console.log(`🎯 Processing: ${entitiesToProcess.join(", ")}\n`);

  for (const entityType of entitiesToProcess) {
    const relinker = new EntityImageRelinker(entityType, dryRun, entityId);
    await relinker.run();

    if (entitiesToProcess.length > 1 && entityType !== entitiesToProcess[entitiesToProcess.length - 1]) {
      console.log("\n" + "=".repeat(60) + "\n");
    }
  }

  if (entitiesToProcess.length > 1) {
    console.log("\n🎆 All entity types processed successfully!");
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Add help text
function showHelp() {
  console.log(`\nUsage: npm run relink-images [options]\n\nOptions:\n  --villa, -v        Process villa images only\n  --place, -p        Process place images only\n  --all, -a          Process all entity types (villas and places)\n  --dry-run, -d      Run in dry-run mode (no changes will be made)\n  --villa-id=ID      Process specific villa ID only\n  --place-id=ID      Process specific place ID only\n  --help, -h         Show this help message\n\nExamples:\n  npm run relink-images                    # Process villa images (default)\n  npm run relink-images --place            # Process place images only\n  npm run relink-images --all              # Process both villa and place images\n  npm run relink-images --villa-id=123     # Process specific villa\n  npm run relink-images --place-id=uuid    # Process specific place\n  npm run relink-images --all --dry-run    # Dry run for all entity types\n`);
}

export { EntityImageRelinker };