#!/usr/bin/env tsx

/**
 * Script to normalize place image data:
 * 1. Set mainImage field in place table from place_image table (order_index = 0)
 * 2. Remove images column from place table (will be handled via migration)
 * 3. Ensure proper image relationships
 */

import { db } from "../src/lib/server/db/index.js";
import { place, placeImage } from "../src/lib/server/db/schema.js";
import { eq, asc } from "drizzle-orm";

async function normalizePlaceImages() {
  console.log("🖼️  Starting place image normalization...");

  try {
    // Get all places
    const allPlaces = await db.select().from(place);

    let placesUpdated = 0;
    let placesWithNoImages = 0;
    let errors = 0;

    console.log(`📍 Found ${allPlaces.length} places to process`);

    for (const placeRecord of allPlaces) {
      try {
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
      } catch (placeError) {
        console.error(`❌ Error processing place ${placeRecord.name}:`, placeError);
        errors++;
      }
    }

    console.log("\n📊 Normalization Summary:");
    console.log(`✅ Places updated with mainImage: ${placesUpdated}`);
    console.log(`⚠️  Places with no images: ${placesWithNoImages}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📍 Total places processed: ${allPlaces.length}`);

    if (placesUpdated > 0) {
      console.log("\n🎉 Place images have been normalized!");
      console.log("   mainImage field now points to the first image from place_image table");
      console.log("   Next step: Create migration to remove 'images' column from place table");
    }

    // Show sample of updated places
    const sampleUpdatedPlaces = await db
      .select({
        name: place.name,
        mainImage: place.mainImage,
      })
      .from(place)
      .where(eq(place.mainImage, null))
      .limit(5);

    if (sampleUpdatedPlaces.length > 0) {
      console.log("\n📝 Sample places with mainImage set:");
      sampleUpdatedPlaces.forEach(p => {
        console.log(`   - ${p.name}: ${p.mainImage ? '✅ Has image' : '❌ No image'}`);
      });
    }

  } catch (error) {
    console.error("💥 Normalization failed:", error);
    process.exit(1);
  }
}

// Run the normalization
if (import.meta.url === `file://${process.argv[1]}`) {
  normalizePlaceImages()
    .then(() => {
      console.log("\n🌟 Place image normalization completed successfully!");
      console.log("\nNext steps:");
      console.log("1. Create a migration to remove 'images' column from place table");
      console.log("2. Update PlaceService to use place_image table for additional images");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Place image normalization failed:", error);
      process.exit(1);
    });
}