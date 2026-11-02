import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { VillaService } from '$lib/server/services/villa.service';

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const villaId = parseInt(params.id, 10);
  if (isNaN(villaId)) {
    return json({ error: 'Invalid villa ID' }, { status: 400 });
  }

  try {
    const analytics = await VillaService.getWhatsAppAnalytics(villaId);
    return json(analytics);
  } catch (error) {
    console.error(`Error fetching analytics for villa ${villaId}:`, error);
    return json({ error: 'Failed to fetch villa analytics' }, { status: 500 });
  }
};