export interface CityMapping {
  displayName: string;
  cityIds: string[];
  description: string;
  province?: string;
  seoKeywords?: string[];
}

// Popular city name mappings to actual city IDs
// This allows URLs like "/tempat-wisata-daerah-jogja" to show places from multiple cities
export const CITY_MAPPINGS: Record<string, CityMapping> = {
  "jogja": {
    displayName: "Yogyakarta (Jogja)",
    cityIds: ["3471", "3404", "3401"], // Yogyakarta, Bantul, Sleman (example IDs)
    description: "Yogyakarta dan sekitarnya",
    province: "Daerah Istimewa Yogyakarta",
    seoKeywords: ["jogja", "yogyakarta", "bantul", "sleman", "malioboro", "candi"]
  },

  "bali": {
    displayName: "Bali",
    cityIds: ["5101", "5103", "5104", "5105", "5106", "5107", "5108", "5102"], // All Bali regencies
    description: "Seluruh Pulau Bali",
    province: "Bali",
    seoKeywords: ["bali", "denpasar", "ubud", "sanur", "seminyak", "kuta", "canggu"]
  },

  "jakarta": {
    displayName: "Jakarta",
    cityIds: ["3171", "3172", "3173", "3174", "3175", "3101"], // All Jakarta areas + Kepulauan Seribu
    description: "DKI Jakarta",
    province: "DKI Jakarta",
    seoKeywords: ["jakarta", "monas", "ancol", "taman mini", "kota tua"]
  },

  "bandung": {
    displayName: "Bandung Raya",
    cityIds: ["3273", "3204", "3217"], // Bandung, Bandung Barat, Cimahi
    description: "Bandung dan sekitarnya",
    province: "Jawa Barat",
    seoKeywords: ["bandung", "lembang", "cimahi", "dago", "braga"]
  },

  "surabaya": {
    displayName: "Surabaya Raya",
    cityIds: ["3578", "3515", "3525"], // Surabaya, Gresik, Sidoarjo
    description: "Surabaya dan sekitarnya",
    province: "Jawa Timur",
    seoKeywords: ["surabaya", "gresik", "sidoarjo", "juanda", "tunjungan"]
  },

  "medan": {
    displayName: "Medan Raya",
    cityIds: ["1275", "1214", "1261"], // Medan, Deli Serdang, Binjai
    description: "Medan dan sekitarnya",
    province: "Sumatera Utara",
    seoKeywords: ["medan", "deli serdang", "binjai", "maimun", "tjong a fie"]
  },

  "solo": {
    displayName: "Solo (Surakarta)",
    cityIds: ["3372", "3313", "3314"], // Surakarta, Karanganyar, Sukoharjo
    description: "Solo dan sekitarnya",
    province: "Jawa Tengah",
    seoKeywords: ["solo", "surakarta", "karanganyar", "sukoharjo", "keraton"]
  },

  "semarang": {
    displayName: "Semarang Raya",
    cityIds: ["3374", "3322", "3315"], // Semarang, Kendal, Demak
    description: "Semarang dan sekitarnya",
    province: "Jawa Tengah",
    seoKeywords: ["semarang", "kendal", "demak", "lawang sewu", "simpang lima"]
  },

  "malang": {
    displayName: "Malang Raya",
    cityIds: ["3573", "3507"], // Malang, Malang Regency
    description: "Malang dan sekitarnya",
    province: "Jawa Timur",
    seoKeywords: ["malang", "batu", "bromo", "selecta", "coban"]
  },

  "lombok": {
    displayName: "Lombok",
    cityIds: ["5201", "5202", "5203", "5204", "5205"], // All Lombok regencies
    description: "Seluruh Pulau Lombok",
    province: "Nusa Tenggara Barat",
    seoKeywords: ["lombok", "mataram", "senggigi", "gili", "rinjani"]
  }
};

/**
 * Get city mapping configuration for a given slug
 */
export function getCityMapping(slug: string): CityMapping | null {
  const normalizedSlug = slug.toLowerCase().trim();
  return CITY_MAPPINGS[normalizedSlug] || null;
}

/**
 * Check if a slug represents a mapped city area
 */
export function isMappedCity(slug: string): boolean {
  return getCityMapping(slug) !== null;
}

/**
 * Get all available mapped city slugs
 */
export function getAllMappedCities(): string[] {
  return Object.keys(CITY_MAPPINGS);
}

/**
 * Get city IDs for a given area slug
 * Returns array for mapped cities, or single-item array for individual cities
 */
export function getCityIdsForSlug(slug: string): string[] {
  const mapping = getCityMapping(slug);
  if (mapping) {
    return mapping.cityIds;
  }
  // For non-mapped cities, we'll need to resolve the city ID elsewhere
  return [];
}

/**
 * Get display name for a given area slug
 */
export function getDisplayNameForSlug(slug: string): string {
  const mapping = getCityMapping(slug);
  if (mapping) {
    return mapping.displayName;
  }

  // For non-mapped cities, convert slug to title case
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get area description for SEO purposes
 */
export function getAreaDescription(slug: string): string {
  const mapping = getCityMapping(slug);
  if (mapping) {
    return mapping.description;
  }

  return getDisplayNameForSlug(slug);
}

/**
 * Get SEO keywords for a given area
 */
export function getSEOKeywords(slug: string): string[] {
  const mapping = getCityMapping(slug);
  if (mapping && mapping.seoKeywords) {
    return mapping.seoKeywords;
  }

  return [getDisplayNameForSlug(slug).toLowerCase()];
}

/**
 * Check if an area covers multiple cities
 */
export function isMultiCityArea(slug: string): boolean {
  const mapping = getCityMapping(slug);
  return mapping ? mapping.cityIds.length > 1 : false;
}

/**
 * Generate URL slug from city name
 */
export function cityNameToSlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Convert slug back to searchable city name
 */
export function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}