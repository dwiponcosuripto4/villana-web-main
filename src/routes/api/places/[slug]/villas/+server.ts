import { json } from '@sveltejs/kit';
import { placeService } from '$lib/server/services/place.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return json(
        {
          success: false,
          error: 'Place slug is required',
        },
        { status: 400 }
      );
    }

    const place = await placeService.findBySlug(slug);

    if (!place) {
      return json(
        {
          success: false,
          error: 'Place not found',
        },
        { status: 404 }
      );
    }

    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;

    // Extract villas from place data and apply pagination
    const allVillas = place.villas || [];
    const villas = allVillas.slice(offset, offset + limit);

    return json({
      success: true,
      data: {
        place: {
          id: place.id,
          name: place.name,
          slug: place.slug,
          latitude: place.latitude,
          longitude: place.longitude,
        },
        villas,
        total: allVillas.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching villas for place:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch villas for place',
      },
      { status: 500 }
    );
  }
};