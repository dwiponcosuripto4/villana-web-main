#!/usr/bin/env tsx

/**
 * Migration script to transfer data from villa_nearby_place table to the new place/villa_place structure
 *
 * This script:
 * 1. Reads all existing villa nearby places
 * 2. Creates corresponding place entities
 * 3. Creates villa_place relationships
 * 4. Preserves all existing data
 */

import { db } from "../src/lib/server/db/index.js";
import { villaNearbyPlace, place, villaPlace, villa } from "../src/lib/server/db/schema.js";
import { generateSlug } from "../src/lib/utils/slug.js";
import { eq, and } from "drizzle-orm";

interface VillaNearbyPlaceWithVilla {
  id: string;
  villaId: number;
  name: string;
  description: string | null;
  distanceKm: string;
  accessType: string;
  placeType: string | null;
  orderIndex: number;
  villaSlug: string;
  villaTitle: string;
}

async function migrateVillaPlaces() {
  console.log("🚀 Starting villa places migration...");

  try {
    // Get all villa nearby places with villa info
    const nearbyPlaces = await db
      .select({
        id: villaNearbyPlace.id,
        villaId: villaNearbyPlace.villaId,
        name: villaNearbyPlace.name,
        description: villaNearbyPlace.description,
        distanceKm: villaNearbyPlace.distanceKm,
        accessType: villaNearbyPlace.accessType,
        placeType: villaNearbyPlace.placeType,
        orderIndex: villaNearbyPlace.orderIndex,
        villaSlug: villa.slug,
        villaTitle: villa.title,
      })
      .from(villaNearbyPlace)
      .innerJoin(villa, eq(villaNearbyPlace.villaId, villa.id))
      .orderBy(villaNearbyPlace.name);

    if (nearbyPlaces.length === 0) {
      console.log("✅ No villa nearby places found to migrate");
      return;
    }

    console.log(`📍 Found ${nearbyPlaces.length} villa nearby places to process`);

    // Group places by name and type to avoid creating duplicates
    const uniquePlaces = new Map<string, {
      name: string;
      description: string | null;
      type: string | null;
      slug: string;
      villaConnections: Array<{
        villaId: number;
        distanceKm: string;
        accessType: string;
        orderIndex: number;
        originalId: string;
        villaSlug: string;
        villaTitle: string;
      }>;
    }>();

    // Process each nearby place
    for (const nearbyPlace of nearbyPlaces) {
      const placeKey = `${nearbyPlace.name.toLowerCase()}-${nearbyPlace.placeType || 'unknown'}`;

      if (!uniquePlaces.has(placeKey)) {
        uniquePlaces.set(placeKey, {
          name: nearbyPlace.name,
          description: nearbyPlace.description,
          type: nearbyPlace.placeType,
          slug: generateSlug(nearbyPlace.name),
          villaConnections: [],
        });
      }

      const placeData = uniquePlaces.get(placeKey)!;
      placeData.villaConnections.push({
        villaId: nearbyPlace.villaId,
        distanceKm: nearbyPlace.distanceKm,
        accessType: nearbyPlace.accessType,
        orderIndex: nearbyPlace.orderIndex,
        originalId: nearbyPlace.id,
        villaSlug: nearbyPlace.villaSlug,
        villaTitle: nearbyPlace.villaTitle,
      });
    }

    console.log(`🏗️  Processing ${uniquePlaces.size} unique places...`);

    let placesCreated = 0;
    let relationshipsCreated = 0;
    let errors = 0;

    // Create places and relationships
    for (const [placeKey, placeData] of uniquePlaces) {
      try {
        // Check if place already exists
        const existingPlace = await db
          .select()
          .from(place)
          .where(eq(place.slug, placeData.slug))
          .limit(1);

        let placeId: string;

        if (existingPlace.length > 0) {
          placeId = existingPlace[0].id;
          console.log(`📍 Using existing place: ${placeData.name} (${placeData.slug})`);
        } else {
          // Create new place (using estimated coordinates for now)
          const [newPlace] = await db
            .insert(place)
            .values({
              name: placeData.name,
              slug: placeData.slug,
              description: placeData.description,
              type: placeData.type,
              category: mapTypeToCategory(placeData.type),
              latitude: "0", // Placeholder - will need to be updated manually
              longitude: "0", // Placeholder - will need to be updated manually
              isActive: true,
            })
            .returning();

          placeId = newPlace.id;
          placesCreated++;
          console.log(`✨ Created place: ${placeData.name} (${placeData.slug})`);
        }

        // Create villa-place relationships
        for (const connection of placeData.villaConnections) {
          try {
            // Check if relationship already exists
            const existingRelation = await db
              .select()
              .from(villaPlace)
              .where(
                and(
                  eq(villaPlace.villaId, connection.villaId),
                  eq(villaPlace.placeId, placeId)
                )
              )
              .limit(1);

            if (existingRelation.length === 0) {
              await db.insert(villaPlace).values({
                villaId: connection.villaId,
                placeId: placeId,
                distanceKm: connection.distanceKm,
                accessType: connection.accessType,
                orderIndex: connection.orderIndex,
              });

              relationshipsCreated++;
              console.log(`🔗 Linked "${placeData.name}" to villa "${connection.villaTitle}" (${connection.distanceKm}km)`);
            } else {
              console.log(`⚠️  Relationship already exists: "${placeData.name}" -> "${connection.villaTitle}"`);
            }
          } catch (relationError) {
            console.error(`❌ Error creating relationship for ${placeData.name} -> ${connection.villaTitle}:`, relationError);
            errors++;
          }
        }
      } catch (placeError) {
        console.error(`❌ Error creating place ${placeData.name}:`, placeError);
        errors++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Places created: ${placesCreated}`);
    console.log(`🔗 Relationships created: ${relationshipsCreated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📍 Unique places processed: ${uniquePlaces.size}`);
    console.log(`🏠 Total villa connections: ${nearbyPlaces.length}`);

    if (placesCreated > 0) {
      console.log("\n⚠️  IMPORTANT: The migrated places have placeholder coordinates (0, 0).");
      console.log("   Please update them with actual latitude/longitude values in the admin panel.");
    }

  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

function mapTypeToCategory(type: string | null): string | null {
  if (!type) return null;

  const typeToCategory: Record<string, string> = {
    restaurant: "dining",
    beach: "nature",
    temple: "culture",
    museum: "culture",
    park: "nature",
    shopping: "shopping",
    waterfall: "nature",
    mountain: "nature",
    lake: "nature",
    market: "shopping",
    tourist_attraction: "entertainment",
    airport: "transport",
    train_station: "transport",
    bus_station: "transport",
    hospital: "healthcare",
    gas_station: "other",
    bank: "other",
  };

  return typeToCategory[type] || "other";
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateVillaPlaces()
    .then(() => {
      console.log("\n🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Migration failed:", error);
      process.exit(1);
    });
}