import { execSync } from "child_process";
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
  unlink,
  stat,
} from "fs/promises";
import { join, extname, basename } from "path";
import { existsSync } from "fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  villaImage,
  villa,
  placeImage,
  place,
} from "../src/lib/server/db/schema.js";
import { eq } from "drizzle-orm";

import { loadEnv } from "../src/lib/server/utils/env";

loadEnv();

interface FileMapping {
  oldPath: string;
  newPath: string;
  villaId: string;
  orderIndex: number;
  operation: "converted" | "renamed" | "skipped";
  imageId?: string;
}

interface ProcessStats {
  totalFiles: number;
  converted: number;
  skipped: number;
  errors: number;
  entitiesUpdated: Set<string>;
  originalSizeMB: number;
  optimizedSizeMB: number;
}

type EntityType = "villa" | "place";

interface EntityConfig {
  entityType: EntityType;
  uploadsDir: string;
  optimizedDir: string;
  backupDir: string;
  table: typeof villaImage | typeof placeImage;
  entityTable: typeof villa | typeof place;
  entityName: string;
  pluralName: string;
}

class EntityImageOptimizer {
  private config: EntityConfig;
  private baseUploadsDir = "./static/uploads";
  private baseOptimizedDir = "./static/images-optm";
  private readonly baseBackupDir = "./backups/uploads";
  private readonly lockFile = "./optimize-uploads.lock";
  private readonly supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".tiff",
    ".webp",
    ".JPG",
    ".JPEG",
    ".PNG",
    ".BMP",
    ".TIFF",
    ".WEBP",
  ];
  private readonly quality = 70;
  private readonly maxWidth = 1199;
  private fileMappings: FileMapping[] = [];
  private dryRun = false;
  private db;
  private client;
  private stats: ProcessStats = {
    totalFiles: 0,
    converted: 0,
    skipped: 0,
    errors: 0,
    entitiesUpdated: new Set(),
    originalSizeMB: 0,
    optimizedSizeMB: 0,
  };

  constructor(entityType: EntityType = "villa", dryRun: boolean = false) {
    this.dryRun = dryRun;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    this.client = postgres(databaseUrl);
    this.db = drizzle(this.client);

    this.baseUploadsDir =
      `${process.env.STATIC_DIR}/uploads` || this.baseUploadsDir;
    this.baseOptimizedDir =
      `${process.env.STATIC_DIR}/images-optm` || this.baseUploadsDir;

    // Configure based on entity type
    this.config = this.getEntityConfig(entityType);
  }

  private getEntityConfig(entityType: EntityType): EntityConfig {
    switch (entityType) {
      case "villa":
        return {
          entityType: "villa",
          uploadsDir:
            process.env.UPLOADED_IMAGE_DIR || `${this.baseUploadsDir}/villas`,
          optimizedDir:
            process.env.IMAGE_OPTM_DIR || `${this.baseOptimizedDir}/villas`,
          backupDir: `${this.baseBackupDir}/villas`,
          table: villaImage,
          entityTable: villa,
          entityName: "villa",
          pluralName: "villas",
        };
      case "place":
        return {
          entityType: "place",
          uploadsDir: `${this.baseUploadsDir}/places`,
          optimizedDir: `${this.baseOptimizedDir}/places`,
          backupDir: `${this.baseBackupDir}/places`,
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
      `🚀 Starting ${this.config.entityName} image optimization ${this.dryRun ? "(DRY RUN)" : ""}`,
    );

    try {
      await this.acquireLock();
      await this.createDirectories();

      const uploadFiles = await this.getUploadFiles();
      const groupedFiles = this.groupFilesByEntity(uploadFiles);

      for (const [entityId, files] of groupedFiles.entries()) {
        console.log(
          `📁 Processing ${this.config.entityName} ${entityId} (${files.length} files)...`,
        );
        await this.processEntityFiles(entityId, files);
      }

      await this.updateDatabaseRecords();
      await this.cleanupProcessedFiles();

      console.log("✅ Upload image optimization completed successfully!");
      this.printSummary();
    } catch (error) {
      console.error("❌ Error during optimization:", error);
      this.stats.errors++;
    } finally {
      await this.releaseLock();
      await this.cleanup();
    }
  }

  private async acquireLock() {
    if (existsSync(this.lockFile)) {
      throw new Error(
        "Another optimization process is already running. If this is incorrect, delete optimize-uploads.lock",
      );
    }

    if (!this.dryRun) {
      await writeFile(
        this.lockFile,
        `${process.pid}\n${new Date().toISOString()}`,
      );
    }
  }

  private async releaseLock() {
    if (!this.dryRun && existsSync(this.lockFile)) {
      await unlink(this.lockFile);
    }
  }

  private async cleanup() {
    try {
      await this.client.end();
    } catch (error) {
      console.error("Warning: Failed to close database connection:", error);
    }
  }

  private async createDirectories() {
    const dirs = [this.config.optimizedDir, this.config.backupDir];

    for (const dir of dirs) {
      if (!this.dryRun && !existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        console.log(`📂 Created directory: ${dir}`);
      }
    }
  }

  private async getUploadFiles(): Promise<string[]> {
    console.log(
      `📥 Reading ${this.config.entityName} upload directory (${this.config.uploadsDir})...`,
    );
    try {
      if (!existsSync(this.config.uploadsDir)) {
        console.log("⚠️  Upload directory doesn't exist");
        return [];
      }

      const files = await readdir(this.config.uploadsDir);
      console.log(`🔍 Found ${files.length} files in uploads directory`);
      return files.filter(
        (file) =>
          this.supportedExtensions.includes(extname(file)) &&
          this.hasEntityIdPrefix(file),
      );
    } catch (error) {
      throw new Error(`Failed to read uploads directory: ${error}`);
    }
  }

  private hasEntityIdPrefix(filename: string): boolean {
    // Check if filename starts with UUID pattern (entity ID)
    // Both villas and places use similar patterns
    const idPattern =
      this.config.entityType === "villa"
        ? /^\d+-\d+-/i // Villa: numeric ID pattern
        : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i; // Place: UUID pattern
    return idPattern.test(filename);
  }

  private extractEntityId(filename: string): string {
    const pattern =
      this.config.entityType === "villa"
        ? /^(\d+?)-\d+-/i // Villa: extract numeric ID
        : /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i; // Place: extract UUID
    const match = filename.match(pattern);
    return match ? match[1] : "";
  }

  private groupFilesByEntity(files: string[]): Map<string, string[]> {
    const grouped = new Map<string, string[]>();

    for (const file of files) {
      const entityId = this.extractEntityId(file);
      if (entityId) {
        if (!grouped.has(entityId)) {
          grouped.set(entityId, []);
        }
        grouped.get(entityId)!.push(file);
      }
    }

    return grouped;
  }

  private async processEntityFiles(entityId: string, files: string[]) {
    try {
      // Verify entity exists
      const [entityExists] = await this.db
        .select()
        .from(this.config.entityTable)
        .where(eq(this.config.entityTable.id, entityId))
        .limit(1);
      if (!entityExists) {
        console.log(
          `⚠️  ${this.config.entityName} ${entityId} not found in database, skipping files`,
        );
        return;
      }

      // Create entity-specific directories
      const entityOptimizedDir = join(this.config.optimizedDir, entityId);
      const entityBackupDir = join(this.config.backupDir, entityId);

      if (!this.dryRun) {
        if (!existsSync(entityOptimizedDir)) {
          await mkdir(entityOptimizedDir, { recursive: true });
        }
        if (!existsSync(entityBackupDir)) {
          await mkdir(entityBackupDir, { recursive: true });
        }
      }

      // Get existing optimized files to determine next available index
      const existingFiles = existsSync(entityOptimizedDir)
        ? await readdir(entityOptimizedDir)
        : [];
      const existingNumbers = new Set(
        existingFiles
          .filter((f) => /^\d+\.webp$/.test(f))
          .map((f) => parseInt(basename(f, ".webp"))),
      );

      let nextIndex = 1;
      while (existingNumbers.has(nextIndex)) {
        nextIndex++;
      }

      // Sort files to maintain consistent processing order
      files.sort();
      this.stats.totalFiles += files.length;

      for (const file of files) {
        await this.processFile(
          entityId,
          file,
          entityOptimizedDir,
          entityBackupDir,
          nextIndex,
        );
        nextIndex++;
      }

      this.stats.entitiesUpdated.add(entityId);
    } catch (error) {
      console.error(
        `❌ Failed to process ${this.config.entityName} ${entityId}:`,
        error,
      );
      this.stats.errors++;
    }
  }

  private async processFile(
    entityId: string,
    filename: string,
    optimizedDir: string,
    backupDir: string,
    orderIndex: number,
  ) {
    const oldPath = join(this.config.uploadsDir, filename);
    const fileExt = extname(filename).toLowerCase();
    const newFileName = `${orderIndex}.webp`;
    const newPath = join(optimizedDir, newFileName);
    const backupPath = join(backupDir, filename);

    try {
      // Find corresponding database record
      const imageUrl = `/uploads/${this.config.pluralName}/${filename}`;
      const [imageRecord] = await this.db
        .select()
        .from(this.config.table)
        .where(eq(this.config.table.imageUrl, imageUrl))
        .limit(1);

      if (!imageRecord) {
        console.log(`⚠️  No database record found for ${filename}, skipping`);
        this.stats.skipped++;
        return;
      }

      // Get original file size
      const originalStats = await stat(oldPath);
      const originalSizeMB = originalStats.size / (1024 * 1024);
      this.stats.originalSizeMB += originalSizeMB;

      // Backup original file
      if (!this.dryRun) {
        await copyFile(oldPath, backupPath);
      }

      let operation: "converted" | "skipped" = "converted";

      if (fileExt === ".webp") {
        // WebP file - copy and potentially resize
        if (this.dryRun) {
          console.log(
            `  [DRY RUN] Would process WebP: ${filename} → ${newFileName}`,
          );
        } else {
          await this.processWebP(oldPath, newPath);
          operation = "converted"; // Still counts as converted due to potential resizing
        }
      } else {
        // Convert to WebP
        if (this.dryRun) {
          console.log(
            `  [DRY RUN] Would convert: ${filename} → ${newFileName}`,
          );
        } else {
          await this.convertToWebP(oldPath, newPath);
        }
      }

      // Get optimized file size (only if not dry run and file was actually created)
      if (!this.dryRun && existsSync(newPath)) {
        const optimizedStats = await stat(newPath);
        const optimizedSizeMB = optimizedStats.size / (1024 * 1024);
        this.stats.optimizedSizeMB += optimizedSizeMB;
      } else if (this.dryRun) {
        // For dry run, estimate optimized size as 70% of original (rough estimate)
        this.stats.optimizedSizeMB += originalSizeMB * 0.7;
      }

      this.fileMappings.push({
        oldPath: imageUrl,
        newPath: `/images-optm/${this.config.pluralName}/${entityId}/${newFileName}`,
        villaId: entityId, // Keep as villaId for backward compatibility
        orderIndex,
        operation,
        imageId: imageRecord.id,
      });

      if (operation === "converted") {
        this.stats.converted++;
      } else {
        this.stats.skipped++;
      }

      const sizeSaved =
        originalSizeMB - (this.dryRun ? originalSizeMB * 0.7 : 0);
      console.log(
        `  ✓ ${filename} → ${newFileName} (${operation}) - ${originalSizeMB.toFixed(2)}MB → ${this.dryRun ? (originalSizeMB * 0.7).toFixed(2) : "?"}MB`,
      );
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
      this.stats.errors++;
    }
  }

  private async processWebP(inputPath: string, outputPath: string) {
    // Process WebP files to ensure they meet our size requirements
    const command = `ffmpeg -i "${inputPath}" -vf "scale=${this.maxWidth}:-1" -c:v libwebp -quality ${this.quality} -y "${outputPath}"`;
    execSync(command, { stdio: "pipe" });
  }

  private async convertToWebP(inputPath: string, outputPath: string) {
    const command = `ffmpeg -i "${inputPath}" -vf "scale=${this.maxWidth}:-1" -c:v libwebp -quality ${this.quality} -y "${outputPath}"`;
    execSync(command, { stdio: "pipe" });
  }

  private async updateDatabaseRecords() {
    if (this.fileMappings.length === 0) {
      console.log("📝 No database updates needed");
      return;
    }

    console.log(`📝 Updating ${this.fileMappings.length} database records...`);

    for (const mapping of this.fileMappings) {
      if (this.dryRun) {
        console.log(
          `  [DRY RUN] Would update image ${mapping.imageId}: ${mapping.oldPath} → ${mapping.newPath}`,
        );
        continue;
      }

      try {
        await this.db
          .update(this.config.table)
          .set({
            imageUrl: mapping.newPath,
            thumbnailUrl: mapping.newPath,
            orderIndex: mapping.orderIndex,
          })
          .where(eq(this.config.table.id, mapping.imageId!));

        console.log(`  ✓ Updated database record for image ${mapping.imageId}`);
      } catch (error) {
        console.error(
          `❌ Failed to update database record ${mapping.imageId}:`,
          error,
        );
        this.stats.errors++;
      }
    }
  }

  private async cleanupProcessedFiles() {
    if (this.dryRun) {
      console.log(
        `🗑️  [DRY RUN] Would cleanup ${this.fileMappings.length} processed upload files`,
      );
      return;
    }

    console.log(
      `🗑️  Cleaning up ${this.fileMappings.length} processed upload files...`,
    );

    for (const mapping of this.fileMappings) {
      try {
        const uploadPath = join(
          this.config.uploadsDir,
          basename(mapping.oldPath),
        );
        if (existsSync(uploadPath)) {
          await unlink(uploadPath);
          console.log(`  ✓ Removed ${basename(mapping.oldPath)}`);
        }
      } catch (error) {
        console.error(`❌ Failed to remove ${mapping.oldPath}:`, error);
        this.stats.errors++;
      }
    }
  }

  private printSummary() {
    const spaceSavedMB = this.stats.originalSizeMB - this.stats.optimizedSizeMB;
    const spaceSavedPercent =
      this.stats.originalSizeMB > 0
        ? (spaceSavedMB / this.stats.originalSizeMB) * 100
        : 0;

    console.log("\n📊 Summary:");
    console.log(`  Total files processed: ${this.stats.totalFiles}`);
    console.log(`  • Successfully converted: ${this.stats.converted}`);
    console.log(`  • Skipped: ${this.stats.skipped}`);
    console.log(`  • Errors: ${this.stats.errors}`);
    console.log(
      `  ${this.config.entityName}s updated: ${this.stats.entitiesUpdated.size}`,
    );
    console.log(`  Quality setting: ${this.quality}%`);
    console.log(`  Max width: ${this.maxWidth}px (proportional height)`);

    console.log("\n💾 Storage Optimization:");
    console.log(`  Original size: ${this.stats.originalSizeMB.toFixed(2)} MB`);
    console.log(
      `  Optimized size: ${this.stats.optimizedSizeMB.toFixed(2)} MB${this.dryRun ? " (estimated)" : ""}`,
    );
    console.log(
      `  Space saved: ${spaceSavedMB.toFixed(2)} MB (${spaceSavedPercent.toFixed(1)}%)`,
    );

    if (!this.dryRun) {
      console.log(`\n📁 Directories:`);
      console.log(`  Backups created in: ${this.config.backupDir}`);
      console.log(`  Optimized images in: ${this.config.optimizedDir}`);
    }

    console.log("\n🎉 Upload optimization complete!");

    if (this.dryRun) {
      console.log(
        "\n💡 This was a dry run. Run without --dry-run flag to apply changes.",
      );
    }
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

  if (dryRun) {
    console.log("🔍 Running in DRY RUN mode - no changes will be made\n");
  }

  console.log(`🎯 Processing: ${entitiesToProcess.join(", ")}\n`);

  for (const entityType of entitiesToProcess) {
    const optimizer = new EntityImageOptimizer(entityType, dryRun);
    await optimizer.run();

    if (
      entitiesToProcess.length > 1 &&
      entityType !== entitiesToProcess[entitiesToProcess.length - 1]
    ) {
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
  console.log(`
Usage: npm run optimize-uploads [options]

Options:
  --villa, -v      Process villa images only
  --place, -p      Process place images only
  --all, -a        Process all entity types (villas and places)
  --dry-run, -d    Run in dry-run mode (no changes will be made)
  --help, -h       Show this help message

Examples:
  npm run optimize-uploads                    # Process villa images (default)
  npm run optimize-uploads --place            # Process place images only
  npm run optimize-uploads --all              # Process both villa and place images
  npm run optimize-uploads --all --dry-run    # Dry run for all entity types
`);
}

export { EntityImageOptimizer };
