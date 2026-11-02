import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { VillaService } from '$lib/server/services/villa.service';

export const GET: RequestHandler = async ({ locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const analytics = await VillaService.getOverallWhatsAppAnalytics();
    return json(analytics);
  } catch (error) {
    console.error('Error fetching WhatsApp analytics:', error);
    return json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
};