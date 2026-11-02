import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { VillaService } from '$lib/server/services/villa.service';

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const excludeIds = url.searchParams.get('exclude')?.split(',').map(id => parseInt(id)).filter(Boolean) || [];

  if (query.length < 2) {
    return json({ villas: [] });
  }

  try {
    // Use the existing villa search functionality
    const result = await VillaService.findAll({
      search: query,
      limit: Math.min(limit, 50), // Cap at 50 results
      status: 'published'
    });

    // Filter out excluded villas and format for autocomplete
    const villas = result
      .filter(villa => !excludeIds.includes(villa.id))
      .map(villa => ({
        id: villa.id,
        label: `${villa.title} (${villa.city?.name || villa.address})`,
        value: villa.id,
        title: villa.title,
        city: villa.city?.name,
        province: villa.province?.name,
        status: villa.status
      }));

    return json({ villas });
  } catch (error) {
    console.error('Villa search error:', error);
    return json({ error: 'Search failed' }, { status: 500 });
  }
};