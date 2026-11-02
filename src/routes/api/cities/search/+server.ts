import { json } from '@sveltejs/kit';
import { CityService } from '$lib/server/services/city.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query.trim()) {
      return json({
        success: true,
        data: [],
        total: 0,
        limit,
      });
    }

    const cities = await CityService.searchCities(query, limit);

    return json({
      success: true,
      data: cities,
      total: cities.length,
      limit,
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    return json(
      {
        success: false,
        error: 'Failed to search cities',
      },
      { status: 500 }
    );
  }
};