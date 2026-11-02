import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import {
  villa as villaTable,
  villaImage,
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
          cos(radians(${villaTable.latitude})) *
          cos(radians(${villaTable.longitude}) - radians(${longitude})) +
          sin(radians(${latitude})) *
          sin(radians(${villaTable.latitude}))
        ))
      )
    )`;

    const query = db
      .select({
        id: villaTable.id,
        slug: villaTable.slug,
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        status: villaTable.status,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        personCapacityMin: villaTable.personCapacityMin,
        personCapacityMax: villaTable.personCapacityMax,
        phoneNumber: villaTable.phoneNumber,
        pvr: villaTable.pvr,
        unitsCount: villaTable.unitsCount,
        hasPool: villaTable.hasPool,
        hasAc: villaTable.hasAc,
        hasBathtub: villaTable.hasBathtub,
        hasTv: villaTable.hasTv,
        hasBreakfast: villaTable.hasBreakfast,
        isPetFriendly: villaTable.isPetFriendly,
        isKidFriendly: villaTable.isKidFriendly,
        isSeniorFriendly: villaTable.isSeniorFriendly,
        isSyaria: villaTable.isSyaria,
        googleRating: villaTable.googleRating,
        googleRatingCount: villaTable.googleRatingCount,
        viewCount: villaTable.viewCount,
        savedCount: villaTable.savedCount,
        cityName: city.name,
        cityId: city.id,
        provinceName: province.name,
        provinceId: province.id,
        distance: distanceFormula,
      })
      .from(villaTable)
      .leftJoin(city, sql`${villaTable.cityId} = ${city.id}`)
      .leftJoin(province, sql`${villaTable.provinceId} = ${province.id}`)
      .where(
        and(
          isNotNull(villaTable.latitude),
          isNotNull(villaTable.longitude),
          eq(villaTable.status, "published"), // Only show published villas
          sql`${distanceFormula} <= ${radiusKm}`,
        ),
      )
      .orderBy(sql`${distanceFormula} ASC`)
      .limit(Math.min(limit, 100)); // Cap at 100 results

    const results = await query;

    // Fetch images for all villas
    const villaIds = results.map((v) => v.id);
    const images =
      villaIds.length > 0
        ? await db
            .select()
            .from(villaImage)
            .where(
              sql`${villaImage.villaId} IN ${sql`(${sql.join(villaIds, sql`, `)})`}`,
            )
        : // .orderBy(villaImage.order)
          [];

    // Group images by villa ID
    const imagesByVilla = images.reduce(
      (acc, img) => {
        if (!acc[img.villaId]) {
          acc[img.villaId] = [];
        }
        acc[img.villaId].push(img);
        return acc;
      },
      {} as Record<number, typeof images>,
    );

    // Format response
    const nearbyVillas = results.map((villa) => ({
      id: villa.id,
      slug: villa.slug,
      title: villa.title,
      address: villa.address,
      latitude: villa.latitude,
      longitude: villa.longitude,
      status: villa.status,
      priceMin: villa.priceMin,
      priceMax: villa.priceMax,
      bedroomMin: villa.bedroomMin,
      bedroomMax: villa.bedroomMax,
      personCapacityMin: villa.personCapacityMin,
      personCapacityMax: villa.personCapacityMax,
      phoneNumber: villa.phoneNumber,
      pvr: villa.pvr,
      unitsCount: villa.unitsCount,
      images: imagesByVilla[villa.id] || [],
      hasPool: villa.hasPool,
      hasAc: villa.hasAc,
      hasBathtub: villa.hasBathtub,
      hasTv: villa.hasTv,
      hasBreakfast: villa.hasBreakfast,
      isPetFriendly: villa.isPetFriendly,
      isKidFriendly: villa.isKidFriendly,
      isSeniorFriendly: villa.isSeniorFriendly,
      isSyaria: villa.isSyaria,
      googleRating: villa.googleRating,
      googleRatingCount: villa.googleRatingCount,
      viewCount: villa.viewCount,
      savedCount: villa.savedCount,
      city: villa.cityName
        ? {
            id: villa.cityId,
            name: villa.cityName,
            province: villa.provinceName
              ? {
                  id: villa.provinceId,
                  name: villa.provinceName,
                }
              : null,
          }
        : null,
      province: villa.provinceName
        ? {
            id: villa.provinceId,
            name: villa.provinceName,
          }
        : null,
      distanceKm: Math.round((villa.distance as number) * 100) / 100, // Round to 2 decimal places
    }));

    return json({
      villas: nearbyVillas,
      searchRadius: radiusKm,
      searchCenter: { latitude, longitude },
      totalFound: nearbyVillas.length,
      message:
        nearbyVillas.length > 0
          ? `Found ${nearbyVillas.length} villa(s) within ${radiusKm}km`
          : `No villas found within ${radiusKm}km of your location`,
    });
  } catch (error) {
    console.error("Nearby villas search error:", error);
    return json({ error: "Search failed" }, { status: 500 });
  }
};

