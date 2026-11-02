#!/usr/bin/env node

import { db } from "../src/lib/server/db/index.js";
import { villaNearbyPlace, place, villaPlace } from "../src/lib/server/db/schema.js";
import { generateSlug } from "../src/lib/utils/slug.js";
import { eq } from "drizzle-orm";

interface UniquePlace {
  name: string;
  description?: string;
  placeType?: string;
  slug: string;
  id?: string;
}

interface VillaNearbyPlaceRecord {
  id: string;
  villaId: number;
  name: string;
  description?: string;
  distanceKm: string;
  accessType: string;
  placeType?: string;
  orderIndex: number;
}

async function migratePlaces() {
  console.log("🚀 Starting migration of villa nearby places to independent places...");

  try {
    // Step 1: Get all existing villa nearby places
    console.log("📊 Fetching existing villa nearby places...");
    const existingNearbyPlaces = await db
      .select()
      .from(villaNearbyPlace)
      .orderBy(villaNearbyPlace.name);

    console.log(`Found ${existingNearbyPlaces.length} villa nearby places`);

    // Step 2: Extract unique places
    console.log("🔍 Extracting unique places...");
    const uniquePlacesMap = new Map<string, UniquePlace>();

    for (const nearbyPlace of existingNearbyPlaces) {
      const key = `${nearbyPlace.name.toLowerCase().trim()}_${nearbyPlace.placeType || 'unknown'}`;

      if (!uniquePlacesMap.has(key)) {
        const slug = generateSlug(nearbyPlace.name);
        uniquePlacesMap.set(key, {
          name: nearbyPlace.name.trim(),
          description: nearbyPlace.description?.trim(),
          placeType: nearbyPlace.placeType,
          slug,
        });
      }
    }

    const uniquePlaces = Array.from(uniquePlacesMap.values());
    console.log(`Identified ${uniquePlaces.length} unique places`);

    // Step 3: Create place records
    console.log("💾 Creating place records...");
    const createdPlaces: Array<{ id: string; name: string; slug: string }> = [];

    for (let i = 0; i < uniquePlaces.length; i++) {
      const uniquePlace = uniquePlaces[i];

      try {
        // Check if slug already exists and make it unique if needed
        let slug = uniquePlace.slug;
        let counter = 1;

        while (true) {
          const existing = await db
            .select()
            .from(place)
            .where(eq(place.slug, slug))
            .limit(1);

          if (existing.length === 0) break;
          slug = `${uniquePlace.slug}-${counter}`;
          counter++;
        }

        const [newPlace] = await db
          .insert(place)
          .values({
            name: uniquePlace.name,
            slug,
            description: uniquePlace.description,
            type: uniquePlace.placeType || 'other',
            category: getCategoryFromType(uniquePlace.placeType),
            // Default coordinates (will be updated later via admin interface)
            latitude: "0",
            longitude: "0",
            isActive: true,
          })
          .returning({ id: place.id, name: place.name, slug: place.slug });

        createdPlaces.push(newPlace);
        uniquePlace.id = newPlace.id;

        if ((i + 1) % 10 === 0) {
          console.log(`Created ${i + 1}/${uniquePlaces.length} places...`);
        }
      } catch (error) {
        console.error(`Error creating place "${uniquePlace.name}":`, error);
      }
    }

    console.log(`✅ Created ${createdPlaces.length} place records`);

    // Step 4: Create villa-place relationships
    console.log("🔗 Creating villa-place relationships...");
    const nameToPlaceId = new Map(
      uniquePlaces.map(p => [`${p.name.toLowerCase().trim()}_${p.placeType || 'unknown'}`, p.id!])
    );

    let relationshipsCreated = 0;
    let relationshipErrors = 0;

    for (let i = 0; i < existingNearbyPlaces.length; i++) {
      const nearbyPlace = existingNearbyPlaces[i];
      const key = `${nearbyPlace.name.toLowerCase().trim()}_${nearbyPlace.placeType || 'unknown'}`;
      const placeId = nameToPlaceId.get(key);

      if (placeId) {
        try {
          await db
            .insert(villaPlace)
            .values({
              villaId: nearbyPlace.villaId,
              placeId,
              distanceKm: nearbyPlace.distanceKm,
              accessType: nearbyPlace.accessType,
              orderIndex: nearbyPlace.orderIndex,
            });

          relationshipsCreated++;
        } catch (error) {
          console.error(`Error creating relationship for villa ${nearbyPlace.villaId} and place "${nearbyPlace.name}":`, error);
          relationshipErrors++;
        }
      } else {
        console.warn(`Could not find place ID for "${nearbyPlace.name}" (${nearbyPlace.placeType})`);
        relationshipErrors++;
      }

      if ((i + 1) % 50 === 0) {
        console.log(`Processed ${i + 1}/${existingNearbyPlaces.length} relationships...`);
      }
    }

    console.log(`✅ Created ${relationshipsCreated} villa-place relationships`);
    if (relationshipErrors > 0) {
      console.log(`⚠️  ${relationshipErrors} relationships had errors`);
    }

    // Step 5: Summary
    console.log("\n📋 Migration Summary:");
    console.log(`• Original villa nearby places: ${existingNearbyPlaces.length}`);
    console.log(`• Unique places identified: ${uniquePlaces.length}`);
    console.log(`• Place records created: ${createdPlaces.length}`);
    console.log(`• Villa-place relationships created: ${relationshipsCreated}`);
    console.log(`• Errors: ${relationshipErrors}`);

    console.log("\n⚠️  Next Steps:");
    console.log("1. Update place coordinates via admin interface or Google Places API");
    console.log("2. Review and categorize places properly");
    console.log("3. Add place images and descriptions");
    console.log("4. Test the new place pages and villa relationships");
    console.log("5. Once verified, remove the old villa_nearby_place table");

    console.log("\n🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

function getCategoryFromType(placeType?: string): string {
  if (!placeType) return 'other';

  const typeMap: Record<string, string> = {
    'restaurant': 'dining',
    'cafe': 'dining',
    'food': 'dining',
    'beach': 'nature',
    'waterfall': 'nature',
    'mountain': 'nature',
    'lake': 'nature',
    'park': 'nature',
    'temple': 'culture',
    'museum': 'culture',
    'art_gallery': 'culture',
    'tourist_attraction': 'culture',
    'shopping_mall': 'shopping',
    'market': 'shopping',
    'shop': 'shopping',
    'airport': 'transport',
    'train_station': 'transport',
    'bus_station': 'transport',
    'hospital': 'healthcare',
    'clinic': 'healthcare',
  };

  return typeMap[placeType.toLowerCase()] || 'other';
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePlaces().catch(console.error);
}

export { migratePlaces };