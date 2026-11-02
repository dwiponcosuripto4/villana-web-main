import type { LayoutServerLoad } from './$types';
import { resolveUserLanguage } from '$lib/server/language-utils';

export const load: LayoutServerLoad = async ({ locals, request }) => {
  // Resolve language for all users (authenticated and anonymous)
  const resolvedLanguage = await resolveUserLanguage(locals.user, request);

  // Try to get user preference from cookie if database doesn't have it
  let userPreference = locals.user?.locale || null;
  if (!userPreference || userPreference === 'auto') {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = new URLSearchParams(cookieHeader.replace(/; /g, '&'));
      const cookieLocale = cookies.get('locale');
      if (cookieLocale === 'en' || cookieLocale === 'id') {
        userPreference = cookieLocale;
      }
    }
  }

  return {
    user: locals.user,
    language: {
      current: resolvedLanguage,
      userPreference: userPreference || 'auto'
    }
  };
};