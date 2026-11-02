import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { villa as villaTable, city, province } from '$lib/server/db/schema';
import { sql, and, isNotNull } from 'drizzle-orm';
import { isAdmin } from '$lib/server/auth-utils';

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check admin permission using isAdmin utility
  if (!isAdmin(locals.user)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters
  const latitude = parseFloat(url.searchParams.get('lat') || '0');
  const longitude = parseFloat(url.searchParams.get('lng') || '0');
  const radiusKm = parseFloat(url.searchParams.get('radius') || '5');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const excludeIds = url.searchParams.get('exclude')?.split(',').map(id => parseInt(id)).filter(Boolean) || [];

  // Validate coordinates
  if (!latitude || !longitude || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return json({ error: 'Invalid coordinates provided' }, { status: 400 });
  }

  // Validate radius (1-20km range)
  if (radiusKm < 1 || radiusKm > 20) {
    return json({ error: 'Radius must be between 1 and 20 kilometers' }, { status: 400 });
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
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        status: villaTable.status,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        cityName: city.name,
        provinceName: province.name,
        distance: distanceFormula
      })
      .from(villaTable)
      .leftJoin(city, sql`${villaTable.cityId} = ${city.id}`)
      .leftJoin(province, sql`${villaTable.provinceId} = ${province.id}`)
      .where(
        and(
          isNotNull(villaTable.latitude),
          isNotNull(villaTable.longitude),
          sql`${distanceFormula} <= ${radiusKm}`
        )
      )
      .orderBy(sql`${distanceFormula} ASC`)
      .limit(Math.min(limit, 100)); // Cap at 100 results

    const results = await query;

    // Filter out excluded villas and format response
    const nearbyVillas = results
      .filter(villa => !excludeIds.includes(villa.id))
      .map(villa => ({
        id: villa.id,
        title: villa.title,
        address: villa.address,
        latitude: villa.latitude,
        longitude: villa.longitude,
        status: villa.status,
        priceMin: villa.priceMin,
        priceMax: villa.priceMax,
        bedroomMin: villa.bedroomMin,
        bedroomMax: villa.bedroomMax,
        cityName: villa.cityName,
        provinceName: villa.provinceName,
        distanceKm: Math.round((villa.distance as number) * 100) / 100, // Round to 2 decimal places
        // Auto-suggest access type based on distance
        suggestedAccessType: (villa.distance as number) <= 1 ? 'walking' : 'driving',
        // Auto-suggest travel time based on distance and access type
        suggestedTravelTime: Math.round(
          (villa.distance as number) <= 1
            ? (villa.distance as number) * 12 // 12 minutes per km walking
            : (villa.distance as number) * 3   // 3 minutes per km driving (city speed)
        )
      }));

    return json({
      villas: nearbyVillas,
      searchRadius: radiusKm,
      searchCenter: { latitude, longitude },
      totalFound: nearbyVillas.length
    });

  } catch (error) {
    console.error('Nearby villas search error:', error);
    return json({ error: 'Search failed' }, { status: 500 });
  }
};