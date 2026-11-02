import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import {
  place as placeTable,
  placeImage,
  city,
  province,
} from "$lib/server/db/schema";
import { sql, and, isNotNull, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ url }) => {
  // Get query parameters
  const latitude = parseFloat(url.searchParams.get("lat") || "0");
  const longitude = parseFloat(url.searchParams.get("lng") || "0");
  const radiusKm = parseFloat(url.searchParams.get("radius") || "5");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  // Validate coordinates
  if (
    !latitude ||
    !longitude ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return json({ error: "Invalid coordinates provided" }, { status: 400 });
  }

  // Validate radius (1-50km range for public endpoint)
  if (radiusKm < 1 || radiusKm > 50) {
    return json(
      { error: "Radius must be between 1 and 50 kilometers" },
      { status: 400 },
    );
  }

  try {
    // Use Haversine formula to calculate distance
    // 6371 is Earth's radius in kilometers
    const distanceFormula = sql`(
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${latitude})) *
          cos(radians(${placeTable.latitude}::numeric)) *
          cos(radians(${placeTable.longitude}::numeric) - radians(${longitude})) +
          sin(radians(${latitude})) *
          sin(radians(${placeTable.latitude}::numeric))
        ))
      )
    )`;

    const query = db
      .select({
        id: placeTable.id,
        slug: placeTable.slug,
        name: placeTable.name,
        description: placeTable.description,
        type: placeTable.type,
        category: placeTable.category,
        address: placeTable.address,
        latitude: placeTable.latitude,
        longitude: placeTable.longitude,
        status: placeTable.status,
        googlePlaceId: placeTable.googlePlaceId,
        googleRating: placeTable.googleRating,
        googleRatingCount: placeTable.googleRatingCount,
        viewCount: placeTable.viewCount,
        cityName: city.name,
        cityId: city.id,
        provinceName: province.name,
        provinceId: province.id,
        distance: distanceFormula,
      })
      .from(placeTable)
      .leftJoin(city, sql`${placeTable.cityId} = ${city.id}`)
      .leftJoin(province, sql`${placeTable.provinceId} = ${province.id}`)
      .where(
        and(
          isNotNull(placeTable.latitude),
          isNotNull(placeTable.longitude),
          eq(placeTable.status, "published"), // Only show published places
          sql`${distanceFormula} <= ${radiusKm}`,
        ),
      )
      .orderBy(sql`${distanceFormula} ASC`)
      .limit(Math.min(limit, 100)); // Cap at 100 results

    const results = await query;

    // Fetch images for all places
    const placeIds = results.map((p) => p.id);
    const images =
      placeIds.length > 0
        ? await db
            .select()
            .from(placeImage)
            .where(
              sql`${placeImage.placeId} IN ${sql`(${sql.join(placeIds.map(id => sql`${id}::uuid`), sql`, `)})`}`,
            )
            .orderBy(placeImage.orderIndex)
        : [];

    // Group images by place ID
    const imagesByPlace = images.reduce(
      (acc, img) => {
        if (!acc[img.placeId]) {
          acc[img.placeId] = [];
        }
        acc[img.placeId].push(img);
        return acc;
      },
      {} as Record<string, typeof images>,
    );

    // Format response
    const nearbyPlaces = results.map((place) => {
      const images = imagesByPlace[place.id] || [];
      const mainImage = images.length > 0 ? images[0].imageUrl : undefined;

      return {
        id: place.id,
        slug: place.slug,
        name: place.name,
        description: place.description,
        type: place.type,
        category: place.category,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        status: place.status,
        googlePlaceId: place.googlePlaceId,
        googleRating: place.googleRating,
        googleRatingCount: place.googleRatingCount,
        viewCount: place.viewCount,
        images,
        mainImage,
        city: place.cityName
          ? {
              id: place.cityId,
              name: place.cityName,
            }
          : null,
        province: place.provinceName
          ? {
              id: place.provinceId,
              name: place.provinceName,
            }
          : null,
        distanceKm: Math.round((place.distance as number) * 100) / 100, // Round to 2 decimal places
      };
    });

    return json({
      places: nearbyPlaces,
      searchRadius: radiusKm,
      searchCenter: { latitude, longitude },
      totalFound: nearbyPlaces.length,
      message:
        nearbyPlaces.length > 0
          ? `Found ${nearbyPlaces.length} place(s) within ${radiusKm}km`
          : `No places found within ${radiusKm}km of your location`,
    });
  } catch (error) {
    console.error("Nearby places search error:", error);
    return json({ error: "Search failed" }, { status: 500 });
  }
};