#!/usr/bin/env tsx

/**
 * Seed script to populate the places table with popular Indonesian tourist destinations
 *
 * This script adds:
 * - Popular beaches, temples, museums, nature attractions
 * - Restaurants and dining spots
 * - Markets and shopping areas
 * - Transportation hubs
 * - With accurate coordinates and detailed information
 */

import { db } from "../src/lib/server/db/index.js";
import { place, placeImage } from "../src/lib/server/db/schema.js";
import { generateSlug } from "../src/lib/utils/slug.js";
import { eq } from "drizzle-orm";

interface PlaceData {
  name: string;
  description: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  cityId?: string;
  provinceId?: string;
  googlePlaceId?: string;
  mainImage?: string;
}

const popularPlaces: PlaceData[] = [
  // BALI - Beaches
  {
    name: "Kuta Beach",
    description:
      "Famous beach known for its long stretch of golden sand, perfect for surfing and watching spectacular sunsets. Popular with both beginners and experienced surfers.",
    type: "beach",
    category: "nature",
    latitude: -8.7188,
    longitude: 115.1693,
    address: "Kuta, Badung Regency, Bali",
    cityId: "5171", // Denpasar
    provinceId: "51",
    googlePlaceId: "ChIJzSR4g7xK0i0R7t5tFVR5bP8",
  },
  {
    name: "Seminyak Beach",
    description:
      "Upscale beach area known for its trendy beach clubs, luxury resorts, and sophisticated dining scene. Perfect for relaxation and sunset cocktails.",
    type: "beach",
    category: "nature",
    latitude: -8.6908,
    longitude: 115.154,
    address: "Seminyak, Badung Regency, Bali",
    cityId: "5171",
    provinceId: "51",
  },
  {
    name: "Sanur Beach",
    description:
      "Calm beach ideal for families, with gentle waves perfect for swimming and learning to surf. Known for beautiful sunrise views.",
    type: "beach",
    category: "nature",
    latitude: -8.6843,
    longitude: 115.2652,
    address: "Sanur, Denpasar, Bali",
    cityId: "5171",
    provinceId: "51",
  },

  // BALI - Temples
  {
    name: "Tanah Lot Temple",
    description:
      "Iconic rock formation temple located on the coast, famous for spectacular sunset views. One of Bali's most photographed temples.",
    type: "temple",
    category: "culture",
    latitude: -8.6211,
    longitude: 115.0867,
    address: "Tabanan Regency, Bali",
    cityId: "5104",
    provinceId: "51",
  },
  {
    name: "Uluwatu Temple",
    description:
      "Ancient clifftop temple offering breathtaking ocean views and traditional Kecak fire dance performances at sunset.",
    type: "temple",
    category: "culture",
    latitude: -8.8291,
    longitude: 115.0846,
    address: "Uluwatu, Badung Regency, Bali",
    cityId: "5171",
    provinceId: "51",
  },

  // YOGYAKARTA - Temples
  {
    name: "Borobudur Temple",
    description:
      "UNESCO World Heritage site and the world's largest Buddhist temple complex. Famous for stunning sunrise views and intricate stone carvings.",
    type: "temple",
    category: "culture",
    latitude: -7.608,
    longitude: 110.2038,
    address: "Magelang, Central Java",
    cityId: "3371",
    provinceId: "33",
  },
  {
    name: "Prambanan Temple",
    description:
      "Magnificent Hindu temple complex and UNESCO World Heritage site. The largest Hindu temple in Indonesia with towering spires.",
    type: "temple",
    category: "culture",
    latitude: -7.752,
    longitude: 110.4915,
    address: "Sleman Regency, Yogyakarta",
    cityId: "3374",
    provinceId: "34",
  },

  // YOGYAKARTA - Culture & Shopping
  {
    name: "Malioboro Street",
    description:
      "The main shopping street of Yogyakarta, lined with shops, street food vendors, and traditional batik stores. A cultural hub of the city.",
    type: "market",
    category: "shopping",
    latitude: -7.7931,
    longitude: 110.3659,
    address: "Malioboro Street, Yogyakarta",
    cityId: "3404",
    provinceId: "34",
  },
  {
    name: "Taman Sari Water Castle",
    description:
      "Former royal garden and bathing complex of the Sultan of Yogyakarta. Features underground tunnels and historic architecture.",
    type: "tourist_attraction",
    category: "culture",
    latitude: -7.8059,
    longitude: 110.3587,
    address: "Kraton, Yogyakarta",
    cityId: "3404",
    provinceId: "34",
  },

  // JAKARTA - Modern Attractions
  {
    name: "National Monument (Monas)",
    description:
      "Iconic 132-meter tower symbolizing Indonesian independence. Offers panoramic views of Jakarta from the observation deck.",
    type: "tourist_attraction",
    category: "culture",
    latitude: -6.1754,
    longitude: 106.8272,
    address: "Central Jakarta, Jakarta",
    cityId: "3173",
    provinceId: "31",
  },
  {
    name: "Grand Indonesia Shopping Mall",
    description:
      "One of Jakarta's largest and most luxurious shopping malls, featuring international brands, dining, and entertainment.",
    type: "shopping",
    category: "shopping",
    latitude: -6.1926,
    longitude: 106.8239,
    address: "Central Jakarta, Jakarta",
    cityId: "3173",
    provinceId: "31",
  },

  // EAST JAVA - Nature
  {
    name: "Mount Bromo",
    description:
      "Active volcano and part of the Bromo Tengger Semeru National Park. Famous for spectacular sunrise views and otherworldly landscape.",
    type: "mountain",
    category: "nature",
    latitude: -7.9425,
    longitude: 112.953,
    address: "Probolinggo, East Java",
    cityId: "3573",
    provinceId: "35",
  },

  // BANDUNG - Nature & Shopping
  {
    name: "Kawah Putih",
    description:
      "Stunning white crater lake with turquoise waters, surrounded by white limestone formations. Popular day trip destination from Bandung.",
    type: "lake",
    category: "nature",
    latitude: -7.1661,
    longitude: 107.4022,
    address: "Ciwidey, West Bandung Regency, West Java",
    cityId: "3273",
    provinceId: "32",
  },
  {
    name: "Cihampelas Walk",
    description:
      "Modern shopping center known as 'Ciwalk', featuring local and international brands, restaurants, and entertainment facilities.",
    type: "shopping",
    category: "shopping",
    latitude: -6.8951,
    longitude: 107.5903,
    address: "Bandung, West Java",
    cityId: "3273",
    provinceId: "32",
  },

  // UBUD, BALI - Culture & Nature
  {
    name: "Ubud Traditional Market",
    description:
      "Vibrant traditional market selling handicrafts, textiles, spices, and local artwork. Essential cultural experience in Ubud.",
    type: "market",
    category: "shopping",
    latitude: -8.5069,
    longitude: 115.2586,
    address: "Ubud, Gianyar Regency, Bali",
    cityId: "5171",
    provinceId: "51",
  },
  {
    name: "Tegallalang Rice Terraces",
    description:
      "Beautiful stepped rice terraces offering stunning views and photo opportunities. Traditional Balinese irrigation system still in use.",
    type: "tourist_attraction",
    category: "nature",
    latitude: -8.4341,
    longitude: 115.2839,
    address: "Tegallalang, Gianyar Regency, Bali",
    cityId: "5171",
    provinceId: "51",
  },

  // Transportation Hubs
  {
    name: "Ngurah Rai International Airport",
    description:
      "Main international airport serving Bali, connecting the island to domestic and international destinations.",
    type: "airport",
    category: "transport",
    latitude: -8.7467,
    longitude: 115.1671,
    address: "Tuban, Badung Regency, Bali",
    cityId: "5171",
    provinceId: "51",
  },
  {
    name: "Yogyakarta Railway Station",
    description:
      "Main railway station serving Yogyakarta, connecting the city to Jakarta, Surabaya, and other major cities in Java.",
    type: "train_station",
    category: "transport",
    latitude: -7.7893,
    longitude: 110.3639,
    address: "Yogyakarta",
    cityId: "3404",
    provinceId: "34",
  },

  // Restaurants
  {
    name: "Gudeg Wijilan",
    description:
      "Famous traditional restaurant serving gudeg, Yogyakarta's signature dish. A must-try authentic local dining experience.",
    type: "restaurant",
    category: "dining",
    latitude: -7.8013,
    longitude: 110.3645,
    address: "Wijilan, Yogyakarta",
    cityId: "3404",
    provinceId: "34",
  },
];

async function seedPlaces() {
  console.log("🌱 Starting places seeding...");

  try {
    let placesCreated = 0;
    let placesSkipped = 0;
    let errors = 0;

    for (const placeData of popularPlaces) {
      try {
        const slug = generateSlug(placeData.name);

        // Check if place already exists
        const existingPlace = await db
          .select()
          .from(place)
          .where(eq(place.slug, slug))
          .limit(1);

        if (existingPlace.length > 0) {
          console.log(`⚠️  Place already exists: ${placeData.name} (${slug})`);
          placesSkipped++;
          continue;
        }

        // Create new place
        const [newPlace] = await db
          .insert(place)
          .values({
            name: placeData.name,
            slug: slug,
            description: placeData.description,
            type: placeData.type,
            category: placeData.category,
            latitude: placeData.latitude.toString(),
            longitude: placeData.longitude.toString(),
            address: placeData.address,
            cityId: placeData.cityId,
            provinceId: placeData.provinceId,
            googlePlaceId: placeData.googlePlaceId,
            mainImage: placeData.mainImage,
            isActive: true,
            viewCount: Math.floor(Math.random() * 1000), // Random initial view count
          })
          .returning();

        placesCreated++;
        console.log(
          `✨ Created place: ${placeData.name} (${slug}) in ${placeData.address}`,
        );

        // Set mainImage if provided
        if (placeData.mainImage) {
          // Also add it as the first image in place_image table
          await db.insert(placeImage).values({
            placeId: newPlace.id,
            imageUrl: placeData.mainImage,
            orderIndex: 0,
            altText: `${placeData.name} - Main Image`,
          });
          console.log(`  📸 Added main image to place_image table`);
        }
      } catch (placeError) {
        console.error(`❌ Error creating place ${placeData.name}:`, placeError);
        errors++;
      }
    }

    console.log("\n📊 Seeding Summary:");
    console.log(`✅ Places created: ${placesCreated}`);
    console.log(`⚠️  Places skipped (already exist): ${placesSkipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📍 Total places processed: ${popularPlaces.length}`);

    if (placesCreated > 0) {
      console.log(
        "\n🎉 Popular Indonesian places have been successfully seeded!",
      );
      console.log(
        "   The /places page should now display real tourist attractions.",
      );
    }
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPlaces()
    .then(() => {
      console.log("\n🌟 Places seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Places seeding failed:", error);
      process.exit(1);
    });
}

