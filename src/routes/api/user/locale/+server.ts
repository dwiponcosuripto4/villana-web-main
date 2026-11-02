import { json } from '@sveltejs/kit';
import { updateUserLocale } from '$lib/server/language-utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user?.id) {
      return json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { locale } = await request.json();

    // Validate locale value
    if (!locale || !['auto', 'en', 'id'].includes(locale)) {
      return json(
        { error: 'Invalid locale. Must be one of: auto, en, id' },
        { status: 400 }
      );
    }

    // Update user's locale preference
    const success = await updateUserLocale(locals.user.id, locale);

    if (!success) {
      return json(
        { error: 'Failed to update locale preference' },
        { status: 500 }
      );
    }

    return json({
      success: true,
      locale,
      message: 'Locale preference updated successfully'
    });

  } catch (error) {
    console.error('Error updating user locale:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};