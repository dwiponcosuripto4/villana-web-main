/**
 * Simple auto-save utility for villa forms
 * Saves form data to localStorage and restores it on page reload
 */

export interface VillaFormData {
  title?: string;
  priceMin?: string;
  priceMax?: string;
  unitsCount?: number;
  bedroomMin?: number;
  bedroomMax?: number;
  personCapacityMin?: number;
  personCapacityMax?: number;
  hasAc?: boolean;
  hasBathtub?: boolean;
  hasTv?: boolean;
  hasBreakfast?: boolean;
  hasPool?: boolean;
  description?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  googleMapsLink?: string;
  googlePlaceId?: string;
  phoneNumber?: string;
  status?: string;
  provinceId?: string;
  cityId?: string;
  selectedCity?: any;
  customAmenities?: Array<{
    name: string;
    description: string;
    category: string;
  }>;
  keywords?: string;
}

const STORAGE_PREFIX = "villana_form_";

/**
 * Generate storage key for form data
 * Now simplified to only distinguish between new and edit forms,
 * preventing localStorage bloat from per-villa storage
 */
export function getStorageKey(formType: "new" | "edit"): string {
  return `${STORAGE_PREFIX}villa_${formType}`;
}

/**
 * Save form data to localStorage with debounce
 */
let saveTimeout: ReturnType<typeof setTimeout>;
export function saveFormData(
  formType: "new" | "edit",
  data: VillaFormData,
  debounceMs: number = 1000,
): void {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    // Check if we're in browser environment
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      const storageKey = getStorageKey(formType);
      const dataToSave = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`Auto-saved form data to ${storageKey}`);
    } catch (error) {
      console.error("Error saving form data to localStorage:", error);
      // Handle quota exceeded error
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.warn("localStorage quota exceeded, attempting cleanup...");
        cleanupOldFormData();
      }
    }
  }, debounceMs);
}

/**
 * Load saved form data from localStorage
 */
export function loadFormData(formType: "new" | "edit"): VillaFormData | null {
  // Check if we're in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const storageKey = getStorageKey(formType);
    const saved = localStorage.getItem(storageKey);

    if (!saved) return null;

    const data = JSON.parse(saved);

    // Check if data is too old (older than 7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (data.timestamp && Date.now() - data.timestamp > maxAge) {
      console.log("Auto-saved form data is too old, removing...");
      localStorage.removeItem(storageKey);
      return null;
    }

    // Remove timestamp before returning
    delete data.timestamp;

    console.log(`Loaded auto-saved form data from ${storageKey}`);
    return data;
  } catch (error) {
    console.error("Error loading form data from localStorage:", error);
    return null;
  }
}

/**
 * Clear saved form data from localStorage
 */
export function clearFormData(formType: "new" | "edit"): void {
  // Check if we're in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const storageKey = getStorageKey(formType);
    localStorage.removeItem(storageKey);
    console.log(`Cleared auto-saved form data: ${storageKey}`);
  } catch (error) {
    console.error("Error clearing form data from localStorage:", error);
  }
}

/**
 * Clean up old form data from localStorage
 * Removes entries older than 7 days
 */
export function cleanupOldFormData(): void {
  // Check if we're in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find all form data keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && now - parsed.timestamp > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // If we can't parse it, remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove old entries
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Removed old form data: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old form data entries`);
    }
  } catch (error) {
    console.error("Error cleaning up old form data:", error);
  }
}

/**
 * Check if there is saved form data
 */
export function hasSavedFormData(formType: "new" | "edit"): boolean {
  // Check if we're in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  const storageKey = getStorageKey(formType);
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Migration function to clean up old per-villa storage keys
 * This should be called once when the app starts to remove the old bloated storage
 */
export function migrateFromPerVillaStorage(): void {
  // Check if we're in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    const oldPattern = new RegExp(`^${STORAGE_PREFIX}villa_edit_\\d+$`);

    // Find all old per-villa edit keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && oldPattern.test(key)) {
        keysToRemove.push(key);
      }
    }

    // Remove old keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Migrated: Removed old per-villa storage key: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(
        `Migration completed: Cleaned up ${keysToRemove.length} old per-villa storage keys`,
      );
    }
  } catch (error) {
    console.error("Error during storage migration:", error);
  }
}
