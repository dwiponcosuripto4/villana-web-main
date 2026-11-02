import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { place, city, province } from "$lib/server/db/schema";
import { sql, and, ne, inArray, not, eq } from "drizzle-orm";
import { calculateDistance } from "$lib/utils/distance";

function suggestAccessType(distanceKm: number): string {
  if (distanceKm <= 1) return "walking";
  if (distanceKm <= 5) return "motorcycle";
  if (distanceKm <= 10) return "driving";
  return "driving";
}

function suggestTravelTime(distanceKm: number, accessType: string): number {
  // Rough estimates based on access type
  const speeds: Record<string, number> = {
    walking: 5, // km/h
    bicycle: 15,
    motorcycle: 30,
    driving: 40,
    public_transport: 25,
    boat: 20,
    mixed: 25,
  };

  const speed = speeds[accessType] || 30;
  return Math.round((distanceKm / speed) * 60); // Convert to minutes
}

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lng = parseFloat(url.searchParams.get("lng") || "");
    const radius = parseFloat(url.searchParams.get("radius") || "5");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const excludeIds = url.searchParams.get("exclude")?.split(",").filter(Boolean) || [];

    if (isNaN(lat) || isNaN(lng)) {
      return json({ error: "Invalid coordinates" }, { status: 400 });
    }

    if (isNaN(radius) || radius <= 0 || radius > 100) {
      return json({ error: "Invalid radius (must be between 0 and 100)" }, { status: 400 });
    }

    // Build query conditions
    const conditions = [];

    // Don't filter by status for admin searches - show all places
    // If you want to only show published places, uncomment the line below
    // conditions.push(eq(place.status, "published"));

    if (excludeIds.length > 0) {
      conditions.push(not(inArray(place.id, excludeIds)));
    }

    // Fetch all places within a reasonable bounding box first
    // This is a rough filter to avoid calculating distance for all places
    const latDelta = radius / 111; // Rough conversion: 1 degree latitude ≈ 111 km
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    // First, let's get ALL places to debug if needed
    const allPlacesQuery = db
      .select({
        id: place.id,
        name: place.name,
        slug: place.slug,
        type: place.type,
        category: place.category,
        status: place.status,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        cityName: city.name,
        provinceName: province.name,
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id));

    // Apply conditions if any
    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;
    const places = whereConditions
      ? await allPlacesQuery.where(whereConditions)
      : await allPlacesQuery;

    console.log(`Found ${places.length} total places before distance filtering`);

    // Calculate distances and filter by radius
    let skippedNoCoords = 0;
    let skippedTooFar = 0;

    const placesWithDistance = places
      .map((p) => {
        // Handle coordinates that might be stored with commas instead of dots
        const latStr = p.latitude ? p.latitude.toString().replace(',', '.') : null;
        const lngStr = p.longitude ? p.longitude.toString().replace(',', '.') : null;

        const placeLatitude = latStr ? parseFloat(latStr) : null;
        const placeLongitude = lngStr ? parseFloat(lngStr) : null;

        if (!placeLatitude || !placeLongitude || isNaN(placeLatitude) || isNaN(placeLongitude)) {
          skippedNoCoords++;
          console.log(`Skipping place ${p.name} - no/invalid coordinates: lat=${p.latitude}, lng=${p.longitude}`);
          return null;
        }

        const distanceKm = calculateDistance(lat, lng, placeLatitude, placeLongitude);

        if (distanceKm > radius) {
          skippedTooFar++;
          console.log(`Skipping place ${p.name} - distance ${distanceKm}km > radius ${radius}km`);
          return null;
        }

        const suggestedAccess = suggestAccessType(distanceKm);
        const suggestedTime = suggestTravelTime(distanceKm, suggestedAccess);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          type: p.type,
          category: p.category,
          status: p.status,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          cityName: p.cityName,
          provinceName: p.provinceName,
          distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
          suggestedAccessType: suggestedAccess,
          suggestedTravelTime: suggestedTime,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    console.log(`Search summary:
      - Center: ${lat}, ${lng}
      - Radius: ${radius}km
      - Total places in DB: ${places.length}
      - Skipped (no coords): ${skippedNoCoords}
      - Skipped (too far): ${skippedTooFar}
      - Within radius: ${placesWithDistance.length}
      - Excluded IDs: ${excludeIds.join(', ') || 'none'}
    `);

    return json({
      places: placesWithDistance,
      searchCenter: { latitude: lat, longitude: lng },
      searchRadius: radius,
      totalFound: placesWithDistance.length,
      debug: {
        totalPlacesChecked: places.length,
        skippedNoCoordinates: skippedNoCoords,
        skippedTooFar: skippedTooFar,
        excludedIds: excludeIds,
      }
    });
  } catch (error) {
    console.error("Error searching nearby places:", error);
    return json({ error: "Failed to search nearby places" }, { status: 500 });
  }
};