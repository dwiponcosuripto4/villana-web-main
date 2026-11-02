#!/usr/bin/env tsx

/**
 * Script to fix existing places in the database that have incomplete data
 * This will update coordinates, addresses, and other missing information
 */

import { db } from "../src/lib/server/db/index.js";
import { place } from "../src/lib/server/db/schema.js";
import { eq } from "drizzle-orm";

interface PlaceUpdate {
  slug: string;
  latitude: number;
  longitude: number;
  address: string;
  cityId?: string;
  provinceId?: string;
  description?: string;
  googlePlaceId?: string;
}

const placeUpdates: PlaceUpdate[] = [
  {
    slug: "telaga-menjer",
    latitude: -7.2693,
    longitude: 109.9244,
    address: "Telaga Menjer, Garung, Wonosobo, Central Java",
    cityId: "3326", // Wonosobo
    provinceId: "33", // Central Java
    description:
      "Telaga Menjer adalah danau alami yang terletak di dataran tinggi Dieng dengan pemandangan perbukitan dan pegunungan yang sangat indah. Danau ini merupakan salah satu destinasi wisata populer di Wonosobo.",
  },
  {
    slug: "tugu-jogja",
    latitude: -7.7829,
    longitude: 110.3671,
    address: "Jl. Jend. Sudirman, Yogyakarta",
    cityId: "3404", // Yogyakarta
    provinceId: "34", // DIY Yogyakarta
    description:
      "Tugu Jogja adalah monumen bersejarah yang menjadi simbol kota Yogyakarta. Dibangun pada masa Sultan Hamengkubuwono I sebagai penanda garis imajiner antara Kraton, Tugu, dan Gunung Merapi. Tempat ini merupakan landmark penting dan titik nol kilometer Yogyakarta.",
  },
];

async function fixExistingPlaces() {
  console.log("🔧 Fixing existing places with missing data...");

  try {
    let placesUpdated = 0;
    let placesNotFound = 0;
    let errors = 0;

    for (const update of placeUpdates) {
      try {
        // Check if place exists
        const existingPlaces = await db
          .select()
          .from(place)
          .where(eq(place.slug, update.slug))
          .limit(1);

        if (existingPlaces.length === 0) {
          console.log(`⚠️  Place not found: ${update.slug}`);
          placesNotFound++;
          continue;
        }

        const existingPlace = existingPlaces[0];

        // Update the place with proper data
        await db
          .update(place)
          .set({
            latitude: update.latitude.toString(),
            longitude: update.longitude.toString(),
            address: update.address,
            cityId: update.cityId,
            provinceId: update.provinceId,
            description: update.description || existingPlace.description,
            googlePlaceId: update.googlePlaceId,
            updatedAt: new Date(),
          })
          .where(eq(place.slug, update.slug));

        placesUpdated++;
        console.log(`✅ Updated place: ${existingPlace.name} (${update.slug})`);
        console.log(
          `   📍 Coordinates: ${update.latitude}, ${update.longitude}`,
        );
        console.log(`   📧 Address: ${update.address}`);
      } catch (placeError) {
        console.error(`❌ Error updating place ${update.slug}:`, placeError);
        errors++;
      }
    }

    console.log("\n📊 Fix Summary:");
    console.log(`✅ Places updated: ${placesUpdated}`);
    console.log(`⚠️  Places not found: ${placesNotFound}`);
    console.log(`❌ Errors: ${errors}`);

    if (placesUpdated > 0) {
      console.log(
        "\n🎉 Existing places have been fixed with proper coordinates and data!",
      );
      console.log(
        "   The /places page should now display the places correctly.",
      );
    }
  } catch (error) {
    console.error("💥 Fix failed:", error);
    process.exit(1);
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  fixExistingPlaces()
    .then(() => {
      console.log("\n🌟 Place fixing completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Place fixing failed:", error);
      process.exit(1);
    });
}

