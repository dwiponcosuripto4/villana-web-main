import { execSync } from "child_process";
import { readdir, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { join, extname, basename } from "path";
import { existsSync } from "fs";

interface VillaImage {
  imageUrl: string;
  thumbnailUrl: string;
  altText: string;
  orderIndex: number;
}

interface VillaData {
  villa: {
    [key: string]: any;
  };
  images: VillaImage[];
  amenities: Array<{
    amenityName: string;
    amenityValue: string;
    icon: string;
  }>;
}

interface ImageMapping {
  oldPath: string;
  newPath: string;
  villaId: string;
  orderIndex: number;
  operation: "converted" | "renamed" | "skipped";
}

class ImageOptimizer {
  private readonly imagesDir = "./static/images/villas";
  private readonly villasDir = "./data/villas";
  private readonly backupDir = "./backups";
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
  private imageMappings: ImageMapping[] = [];
  private dryRun = false;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  async run() {
    console.log(
      `🚀 Starting image optimization ${this.dryRun ? "(DRY RUN)" : ""}`,
    );

    try {
      await this.createBackupDir();
      const villaIds = await this.getVillaIds();

      for (const villaId of villaIds) {
        console.log(`📁 Processing villa ${villaId}...`);
        await this.processVillaImages(villaId);
      }

      await this.updateVillaDataFiles();

      console.log("✅ Image optimization completed successfully!");
      this.printSummary();
    } catch (error) {
      console.error("❌ Error during optimization:", error);
      process.exit(1);
    }
  }

  private async createBackupDir() {
    if (!this.dryRun && !existsSync(this.backupDir)) {
      await mkdir(this.backupDir, { recursive: true });
      console.log(`📂 Created backup directory: ${this.backupDir}`);
    }
  }

  private async getVillaIds(): Promise<string[]> {
    try {
      const items = await readdir(this.imagesDir);
      return items.filter((item) => /^\d+$/.test(item));
    } catch (error) {
      throw new Error(`Failed to read images directory: ${error}`);
    }
  }

  private async processVillaImages(villaId: string) {
    const villaImagesDir = join(this.imagesDir, villaId);

    try {
      const files = await readdir(villaImagesDir);
      const imageFiles = files.filter((file) =>
        this.supportedExtensions.includes(extname(file)),
      );

      if (imageFiles.length === 0) {
        console.log(`⚠️  No images found in villa ${villaId}`);
        return;
      }

      // Sort images by name to maintain consistent ordering
      imageFiles.sort();

      console.log(`🖼️  Found ${imageFiles.length} images in villa ${villaId}`);

      // Get list of existing numeric webp files to avoid conflicts
      const existingNumericFiles = new Set(
        imageFiles
          .filter((file) => this.isNumericWebpFile(file))
          .map((file) => basename(file, ".webp")),
      );

      let nextAvailableNumber = 1;

      for (const oldFile of imageFiles) {
        const oldPath = join(villaImagesDir, oldFile);
        const fileExt = extname(oldFile).toLowerCase();

        if (fileExt === ".webp") {
          // Handle existing WebP files
          if (this.isNumericWebpFile(oldFile)) {
            // Already has numeric name, skip processing
            console.log(`  ✓ ${oldFile} - already has standardized name`);

            this.imageMappings.push({
              oldPath: `/images/villas/${villaId}/${oldFile}`,
              newPath: `/images/villas/${villaId}/${oldFile}`,
              villaId,
              orderIndex: parseInt(basename(oldFile, ".webp")),
              operation: "skipped",
            });
          } else {
            // Rename to standardized numeric name
            const newFileName = this.getNextAvailableFileName(
              existingNumericFiles,
              nextAvailableNumber,
            );
            const newPath = join(villaImagesDir, newFileName);

            await this.backupOriginalImage(oldPath, villaId, oldFile);
            await this.renameFile(oldPath, newPath);

            existingNumericFiles.add(basename(newFileName, ".webp"));
            nextAvailableNumber = Math.max(
              nextAvailableNumber,
              parseInt(basename(newFileName, ".webp")) + 1,
            );

            this.imageMappings.push({
              oldPath: `/images/villas/${villaId}/${oldFile}`,
              newPath: `/images/villas/${villaId}/${newFileName}`,
              villaId,
              orderIndex: parseInt(basename(newFileName, ".webp")),
              operation: "renamed",
            });

            console.log(`  ✓ ${oldFile} → ${newFileName} (renamed)`);
          }
        } else {
          // Convert other formats to WebP
          const newFileName = this.getNextAvailableFileName(
            existingNumericFiles,
            nextAvailableNumber,
          );
          const newPath = join(villaImagesDir, newFileName);

          await this.backupOriginalImage(oldPath, villaId, oldFile);
          await this.convertToWebP(oldPath, newPath);

          existingNumericFiles.add(basename(newFileName, ".webp"));
          nextAvailableNumber = Math.max(
            nextAvailableNumber,
            parseInt(basename(newFileName, ".webp")) + 1,
          );

          this.imageMappings.push({
            oldPath: `/images/villas/${villaId}/${oldFile}`,
            newPath: `/images/villas/${villaId}/${newFileName}`,
            villaId,
            orderIndex: parseInt(basename(newFileName, ".webp")),
            operation: "converted",
          });

          console.log(`  ✓ ${oldFile} → ${newFileName} (converted)`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to process villa ${villaId}: ${error}`);
    }
  }

  private isNumericWebpFile(fileName: string): boolean {
    const baseName = basename(fileName, ".webp");
    return (
      /^\d+$/.test(baseName) && extname(fileName).toLowerCase() === ".webp"
    );
  }

  private getNextAvailableFileName(
    existingFiles: Set<string>,
    startFrom: number,
  ): string {
    let number = startFrom;
    while (existingFiles.has(number.toString())) {
      number++;
    }
    return `${number}.webp`;
  }

  private async renameFile(oldPath: string, newPath: string) {
    if (this.dryRun) {
      console.log(`    [DRY RUN] Would rename: ${oldPath} → ${newPath}`);
      return;
    }

    try {
      execSync(`mv "${oldPath}" "${newPath}"`);
    } catch (error) {
      throw new Error(`Failed to rename file ${oldPath}: ${error}`);
    }
  }

  private async backupOriginalImage(
    imagePath: string,
    villaId: string,
    fileName: string,
  ) {
    if (this.dryRun) return;

    const backupVillaDir = join(this.backupDir, `villa-${villaId}`);
    if (!existsSync(backupVillaDir)) {
      await mkdir(backupVillaDir, { recursive: true });
    }

    const backupPath = join(backupVillaDir, fileName);
    await copyFile(imagePath, backupPath);
  }

  private async convertToWebP(inputPath: string, outputPath: string) {
    if (this.dryRun) {
      console.log(
        `    [DRY RUN] Would convert and resize: ${inputPath} → ${outputPath} (max width: ${this.maxWidth}px)`,
      );
      return;
    }

    try {
      // FFmpeg command with resize filter: scale width to maxWidth, keep aspect ratio
      const command = `ffmpeg -i "${inputPath}" -vf "scale=${this.maxWidth}:-1" -c:v libwebp -quality ${this.quality} -y "${outputPath}"`;
      execSync(command, { stdio: "pipe" });

      // Remove original file after successful conversion
      execSync(`rm "${inputPath}"`);
    } catch (error) {
      throw new Error(`FFmpeg conversion failed for ${inputPath}: ${error}`);
    }
  }

  private async updateVillaDataFiles() {
    console.log("\n📝 Updating villa data files...");

    try {
      const villaFiles = await readdir(this.villasDir);
      const jsonFiles = villaFiles.filter((file) => file.endsWith(".json"));

      for (const jsonFile of jsonFiles) {
        await this.updateVillaDataFile(jsonFile);
      }
    } catch (error) {
      throw new Error(`Failed to update villa data files: ${error}`);
    }
  }

  private async updateVillaDataFile(fileName: string) {
    const filePath = join(this.villasDir, fileName);

    try {
      // Backup original JSON file
      if (!this.dryRun) {
        const backupJsonPath = join(this.backupDir, fileName);
        await copyFile(filePath, backupJsonPath);
      }

      const jsonContent = await readFile(filePath, "utf-8");
      const villaData: VillaData = JSON.parse(jsonContent);

      // Extract villa ID from filename (e.g., "1.json" → "1" or "villa-1.json" → "1")
      const villaId =
        fileName.match(/^(\d+)\.json$/)?.[1] ||
        fileName.match(/villa-(\d+)\.json/)?.[1];
      if (!villaId) {
        console.log(`⚠️  Skipping ${fileName} - couldn't extract villa ID`);
        return;
      }

      // Update image references
      const updatedImages = villaData.images.map((image) => {
        const mapping = this.imageMappings.find(
          (m) => m.oldPath === image.imageUrl && m.villaId === villaId,
        );

        if (mapping) {
          return {
            ...image,
            imageUrl: mapping.newPath,
            thumbnailUrl: mapping.newPath,
          };
        }

        return image;
      });

      const updatedVillaData = {
        ...villaData,
        images: updatedImages,
      };

      if (this.dryRun) {
        console.log(`  [DRY RUN] Would update: ${fileName}`);
        console.log(`    Updated ${updatedImages.length} image references`);
      } else {
        await writeFile(filePath, JSON.stringify(updatedVillaData, null, "\t"));
        console.log(
          `  ✓ Updated ${fileName} with ${updatedImages.length} image references`,
        );
      }
    } catch (error) {
      throw new Error(`Failed to update ${fileName}: ${error}`);
    }
  }

  private printSummary() {
    const convertedCount = this.imageMappings.filter(
      (m) => m.operation === "converted",
    ).length;
    const renamedCount = this.imageMappings.filter(
      (m) => m.operation === "renamed",
    ).length;
    const skippedCount = this.imageMappings.filter(
      (m) => m.operation === "skipped",
    ).length;

    console.log("\n📊 Summary:");
    console.log(`  Total images processed: ${this.imageMappings.length}`);
    console.log(`  • Converted to WebP: ${convertedCount}`);
    console.log(`  • Renamed to numeric: ${renamedCount}`);
    console.log(`  • Skipped (already standardized): ${skippedCount}`);
    console.log(
      `  Villas updated: ${new Set(this.imageMappings.map((m) => m.villaId)).size}`,
    );
    console.log(`  Quality setting: ${this.quality}%`);
    console.log(`  Max width: ${this.maxWidth}px (proportional height)`);

    if (!this.dryRun) {
      console.log(`  Backups created in: ${this.backupDir}`);
    }

    console.log("\n🎉 All done! Images are now optimized and standardized.");

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

  if (dryRun) {
    console.log("🔍 Running in DRY RUN mode - no changes will be made\n");
  }

  const optimizer = new ImageOptimizer(dryRun);
  await optimizer.run();
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { ImageOptimizer };
