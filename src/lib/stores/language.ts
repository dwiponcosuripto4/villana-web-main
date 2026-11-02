import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { LocaleOption, ResolvedLocale } from '$lib/server/language-utils';

interface LanguageState {
  current: ResolvedLocale;
  preference: LocaleOption;
  isUserSet: boolean;
}

// Create the language store
function createLanguageStore() {
  const { subscribe, set, update } = writable<LanguageState>({
    current: 'en',
    preference: 'auto',
    isUserSet: false
  });

  return {
    subscribe,

    /**
     * Initialize language store with user preference and current locale
     */
    initialize: (userLocale: LocaleOption | null, resolvedLocale: ResolvedLocale) => {
      set({
        current: resolvedLocale,
        preference: userLocale || 'auto',
        isUserSet: userLocale !== null && userLocale !== 'auto'
      });
    },

    /**
     * Update language preference (for authenticated users - saves to database)
     */
    updatePreference: async (locale: LocaleOption, userId?: number) => {
      let databaseUpdateFailed = false;

      if (browser && userId) {
        try {
          // Save to database for authenticated users
          const response = await fetch('/api/user/locale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locale })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Database update failed:', errorData);
            databaseUpdateFailed = true;
            // Don't throw - continue with local update
          } else {
            console.log('Database updated successfully');
          }
        } catch (error) {
          console.error('Failed to save locale preference:', error);
          databaseUpdateFailed = true;
          // Continue anyway - at least update local state
        }
      }

      // Update cookie for all users (authenticated and anonymous)
      if (browser) {
        const maxAge = 365 * 24 * 60 * 60; // 1 year
        document.cookie = `locale=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        console.log('Cookie updated to:', locale);
      }

      // Determine current locale based on preference
      let newCurrent: ResolvedLocale;
      if (locale === 'auto') {
        // Use browser detection
        newCurrent = getBrowserLocale();
      } else {
        newCurrent = locale as ResolvedLocale;
      }

      update(state => ({
        ...state,
        current: newCurrent,
        preference: locale,
        isUserSet: locale !== 'auto'
      }));

      // Only reload if database update was successful or if user is anonymous
      // For authenticated users where DB update failed, keep local state
      if (browser && (!userId || !databaseUpdateFailed)) {
        console.log('Reloading page to apply language change');
        setTimeout(() => window.location.reload(), 100); // Small delay to ensure state is updated
      } else if (databaseUpdateFailed) {
        console.log('Database update failed, keeping local state only');
      }
    },

    /**
     * Set current language without saving preference (temporary override)
     */
    setCurrent: (locale: ResolvedLocale) => {
      update(state => ({
        ...state,
        current: locale
      }));
    }
  };
}

/**
 * Get browser's preferred locale
 */
function getBrowserLocale(): ResolvedLocale {
  if (!browser) return 'en';

  const browserLang = navigator.language.toLowerCase();

  // Check if browser language is Indonesian
  if (browserLang.startsWith('id') || browserLang.includes('indonesia')) {
    return 'id';
  }

  // Default to English
  return 'en';
}

/**
 * Get locale from cookie (client-side)
 */
function getLocaleCookie(): LocaleOption | null {
  if (!browser) return null;

  const cookies = document.cookie.split('; ');
  const localeCookie = cookies.find(cookie => cookie.startsWith('locale='));

  if (localeCookie) {
    const locale = localeCookie.split('=')[1];
    if (locale === 'en' || locale === 'id' || locale === 'auto') {
      return locale as LocaleOption;
    }
  }

  return null;
}

// Export the store instance
export const languageStore = createLanguageStore();

// Export type for convenience
export type { LanguageState, LocaleOption, ResolvedLocale };