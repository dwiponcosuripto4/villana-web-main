import { json } from '@sveltejs/kit';
import { placeService } from '$lib/server/services/place.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = {
      query: url.searchParams.get('q') || undefined,
      type: url.searchParams.get('type') || undefined,
      category: url.searchParams.get('category') || undefined,
      cityId: url.searchParams.get('cityId') || undefined,
      provinceId: url.searchParams.get('provinceId') || undefined,
      latitude: url.searchParams.get('lat') ? parseFloat(url.searchParams.get('lat')!) : undefined,
      longitude: url.searchParams.get('lng') ? parseFloat(url.searchParams.get('lng')!) : undefined,
      radius: url.searchParams.get('radius') ? parseFloat(url.searchParams.get('radius')!) : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
    };

    const places = await placeService.search(searchParams);

    return json({
      success: true,
      data: places,
      total: places.length,
      limit: searchParams.limit,
      offset: searchParams.offset,
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch places',
      },
      { status: 500 }
    );
  }
};