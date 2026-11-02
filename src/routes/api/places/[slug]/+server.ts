import { json } from '@sveltejs/kit';
import { placeService } from '$lib/server/services/place.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
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

    return json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error('Error fetching place:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch place',
      },
      { status: 500 }
    );
  }
};