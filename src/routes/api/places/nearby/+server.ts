import { json } from '@sveltejs/kit';
import { placeService } from '$lib/server/services/place.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = url.searchParams.get('radius');
    const limit = url.searchParams.get('limit');

    if (!lat || !lng) {
      return json(
        {
          success: false,
          error: 'Latitude and longitude are required',
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 10;
    const limitNum = limit ? parseInt(limit) : 20;

    if (isNaN(latitude) || isNaN(longitude)) {
      return json(
        {
          success: false,
          error: 'Invalid latitude or longitude',
        },
        { status: 400 }
      );
    }

    const places = await placeService.findNearbyPlaces(latitude, longitude, radiusKm, limitNum);

    return json({
      success: true,
      data: places,
      total: places.length,
      center: { latitude, longitude },
      radius: radiusKm,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch nearby places',
      },
      { status: 500 }
    );
  }
};