#!/usr/bin/env tsx

/**
 * Complete setup script for place images:
 * 1. Normalize existing place image data
 * 2. Set mainImage from place_image table
 * 3. Apply migration to remove images column
 */

import { db } from "../src/lib/server/db/index.js";
import { place, placeImage } from "../src/lib/server/db/schema.js";
import { eq, asc } from "drizzle-orm";

async function setupPlaceImages() {
  console.log("🚀 Starting complete place images setup...");

  try {
    console.log("\n📋 Step 1: Normalizing place image data...");

    // Get all places
    const allPlaces = await db.select().from(place);
    let placesUpdated = 0;
    let placesWithNoImages = 0;

    console.log(`📍 Found ${allPlaces.length} places to process`);

    for (const placeRecord of allPlaces) {
      // Get the first image (order_index = 0) for this place
      const firstImage = await db
        .select()
        .from(placeImage)
        .where(eq(placeImage.placeId, placeRecord.id))
        .orderBy(asc(placeImage.orderIndex), asc(placeImage.createdAt))
        .limit(1);

      if (firstImage.length > 0) {
        const mainImageUrl = firstImage[0].thumbnailUrl || firstImage[0].imageUrl;

        // Update the place with the main image
        await db
          .update(place)
          .set({
            mainImage: mainImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(place.id, placeRecord.id));

        placesUpdated++;
        console.log(`✅ Updated ${placeRecord.name}: ${mainImageUrl}`);
      } else {
        placesWithNoImages++;
        console.log(`⚠️  No images found for: ${placeRecord.name}`);

        // Clear mainImage if it exists but no place_image records
        if (placeRecord.mainImage) {
          await db
            .update(place)
            .set({
              mainImage: null,
              updatedAt: new Date(),
            })
            .where(eq(place.id, placeRecord.id));
          console.log(`   🧹 Cleared outdated mainImage`);
        }
      }
    }

    console.log("\n📊 Normalization Results:");
    console.log(`✅ Places updated with mainImage: ${placesUpdated}`);
    console.log(`⚠️  Places with no images: ${placesWithNoImages}`);
    console.log(`📍 Total places processed: ${allPlaces.length}`);

    console.log("\n📋 Step 2: Verification...");

    // Verify the results
    const placesWithMainImage = await db
      .select({
        name: place.name,
        mainImage: place.mainImage,
      })
      .from(place)
      .limit(5);

    console.log("\n📝 Sample places after normalization:");
    placesWithMainImage.forEach(p => {
      console.log(`   - ${p.name}: ${p.mainImage ? '✅ Has mainImage' : '❌ No mainImage'}`);
    });

    // Count total images in place_image table
    const totalPlaceImages = await db
      .select({ count: placeImage.id })
      .from(placeImage);

    console.log(`\n📸 Total images in place_image table: ${totalPlaceImages.length}`);

    console.log("\n🎉 Place images setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Run: npm run db:migrate (to apply migration removing 'images' column)");
    console.log("2. Test the /places page to ensure images display correctly");
    console.log("3. The PlaceService will now use place_image table for all image operations");

  } catch (error) {
    console.error("💥 Setup failed:", error);
    process.exit(1);
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupPlaceImages()
    .then(() => {
      console.log("\n🌟 Complete setup finished!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Setup failed:", error);
      process.exit(1);
    });
}