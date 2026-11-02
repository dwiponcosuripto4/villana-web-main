import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { place } from '$lib/server/db/schema';
import { and, ilike, or, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '8');

    if (query.length < 2) {
      return json({
        success: true,
        data: [],
        total: 0
      });
    }

    // Search for places by name or description
    const places = await db
      .select({
        id: place.id,
        name: place.name,
        type: place.type,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address
      })
      .from(place)
      .where(
        and(
          eq(place.status, 'published'),
          or(
            ilike(place.name, `%${query}%`),
            ilike(place.description, `%${query}%`)
          )
        )
      )
      .orderBy(place.name)
      .limit(limit);

    return json({
      success: true,
      data: places,
      total: places.length
    });
  } catch (error) {
    console.error('Error in place autocomplete:', error);
    return json(
      {
        success: false,
        error: 'Failed to search places',
        data: []
      },
      { status: 500 }
    );
  }
};