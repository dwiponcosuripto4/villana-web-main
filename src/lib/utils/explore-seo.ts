/**
 * Utility functions for generating Indonesian SEO content for explore page
 */

// ExploreFilters interface based on the server load
export interface ExploreFilters {
  priceMin?: number;
  priceMax?: number;
  bedroomMin?: number;
  bedroomMax?: number;
  search?: string;
  cityId?: string;
  provinceId?: string;
  sortBy?: string;
  hasBathtub?: boolean;
  hasPool?: boolean;
  hasBreakfast?: boolean;
  isPetFriendly?: boolean;
  isKidFriendly?: boolean;
  isSeniorFriendly?: boolean;
  isSyaria?: boolean;
  placeId?: string;
  nearbyRadius?: number;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface SEOContent {
  title: string;
  description: string;
  h1: string;
  descriptionParagraph: string;
}

/**
 * Format price in Indonesian rupiah
 */
export function formatPriceId(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `Rp${millions.toFixed(millions >= 10 ? 0 : 1)}jt`;
  } else if (price >= 1000) {
    const thousands = price / 1000;
    return `Rp${thousands.toFixed(0)}rb`;
  }
  return `Rp${price.toLocaleString("id-ID")}`;
}

/**
 * Clean and format city/province names for display
 */
function cleanLocationName(name: string): string {
  return name
    .replace(/^KABUPATEN\s+/i, "")
    .replace(/^KOTA\s+/i, "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get display name for location in Indonesian
 */
export function getLocationDisplayNameId(
  cityName?: string,
  provinceName?: string,
): string {
  const cleanCityName = cityName ? cleanLocationName(cityName) : undefined;
  const cleanProvinceName = provinceName
    ? cleanLocationName(provinceName)
    : undefined;

  if (cleanCityName && cleanProvinceName) {
    return `${cleanCityName}, ${cleanProvinceName}`;
  } else if (cleanCityName) {
    return cleanCityName;
  } else if (cleanProvinceName) {
    return cleanProvinceName;
  }
  return "Indonesia";
}

/**
 * Generate dynamic title for explore page in Indonesian
 */
export function generateExploreTitleId(
  filters: ExploreFilters,
  cityName?: string,
  provinceName?: string,
  villaCount?: number,
): string {
  const locationName = getLocationDisplayNameId(cityName, provinceName);

  // City search with specific filters
  if (cityName) {
    if (filters.bedroomMin && filters.priceMin) {
      return `Villa ${filters.bedroomMin} Kamar di ${cityName} mulai ${formatPriceId(filters.priceMin)} - Villana`;
    } else if (filters.priceMin) {
      return `Villa Murah di ${cityName} mulai ${formatPriceId(filters.priceMin)} - Villana`;
    } else if (filters.bedroomMin) {
      return `Villa ${filters.bedroomMin} Kamar di ${cityName} - Villana`;
    } else {
      return `Villa Terbaik di ${cityName} - Villana`;
    }
  }

  // Text search
  if (filters.search) {
    return `Villa '${filters.search}' - Villana`;
  }

  // Location radius search
  if (filters.lat && filters.lng && filters.radius) {
    return `Villa dalam ${filters.radius}km dari lokasi Anda - Villana`;
  }

  // Province only
  if (provinceName && !cityName) {
    return `Villa di ${provinceName} - Villana`;
  }

  // Price range only
  if (filters.priceMin && !cityName) {
    return `Villa mulai ${formatPriceId(filters.priceMin)} - Villana`;
  }

  // Bedroom filter only
  if (filters.bedroomMin && !cityName) {
    return `Villa ${filters.bedroomMin} Kamar Terbaik - Villana`;
  }

  // Default
  return "Jelajahi Villa bagus - Villana";
}

/**
 * Generate dynamic meta description for explore page in Indonesian
 */
export function generateExploreDescriptionId(
  filters: ExploreFilters,
  cityName?: string,
  provinceName?: string,
  villaCount?: number,
): string {
  const locationName = getLocationDisplayNameId(cityName, provinceName);
  const countText = villaCount ? `${villaCount}` : "berbagai";

  // City search
  if (cityName) {
    let baseDesc = `Temukan ${countText} villa mewah di ${locationName}. `;
    if (filters.priceMin) {
      baseDesc += `Villa mulai dari ${formatPriceId(filters.priceMin)}. `;
    }
    baseDesc +=
      "Filter berdasarkan harga, fasilitas, dan lokasi untuk menemukan villa liburan yang sempurna.";
    return baseDesc;
  }

  // Text search
  if (filters.search) {
    return `Jelajahi villa dengan '${filters.search}'. Ditemukan ${countText} properti dengan fasilitas modern dan akses terbaik.`;
  }

  // Location radius
  if (filters.lat && filters.lng && filters.radius) {
    return `Villa terbaik dalam radius ${filters.radius}km dari lokasi Anda. ${countText} pilihan villa dengan fasilitas premium.`;
  }

  // Price range
  if (filters.priceMin) {
    return `Villa terjangkau mulai dari ${formatPriceId(filters.priceMin)}. ${countText} pilihan dengan berbagai fasilitas premium di seluruh Indonesia.`;
  }

  // Default
  return "Jelajahi koleksi villa mewah terbaik di Indonesia. Filter berdasarkan lokasi, harga, dan fasilitas untuk pengalaman liburan tak terlupakan.";
}

/**
 * Generate dynamic H1 content for explore page in Indonesian
 */
export function generateExploreH1Id(
  filters: ExploreFilters,
  cityName?: string,
  provinceName?: string,
  villaCount?: number,
): string {
  // City search
  if (cityName) {
    return `Villa bagus di ${cityName}`;
  }

  // Text search
  if (filters.search) {
    return `Villa '${filters.search}'`;
  }

  // Location radius
  if (filters.lat && filters.lng && filters.radius) {
    return "Villa di Sekitar Lokasi Anda";
  }

  // Province only
  if (provinceName && !cityName) {
    return `Villa di ${provinceName}`;
  }

  // Price range
  if (filters.priceMin) {
    return `Villa Mulai ${formatPriceId(filters.priceMin)}`;
  }

  // Bedroom filter
  if (filters.bedroomMin) {
    return `Villa ${filters.bedroomMin} Kamar Terbaik`;
  }

  // Default
  return "Jelajahi Villa Terbaik";
}

/**
 * Generate description paragraph content in Indonesian
 */
export function generateDescriptionParagraphId(
  filters: ExploreFilters,
  cityName?: string,
  provinceName?: string,
  villaCount?: number,
): string {
  const locationName = getLocationDisplayNameId(cityName, provinceName);
  const countText = villaCount ? `${villaCount}` : "berbagai";

  if (cityName) {
    let desc = `Temukan pengalaman menginap terbaik dengan koleksi ${countText} villa premium di ${locationName}. `;
    if (filters.priceMin && filters.bedroomMin) {
      desc += `Villa ${filters.bedroomMin} kamar mulai dari ${formatPriceId(filters.priceMin)} dengan fasilitas lengkap. `;
    } else if (filters.priceMin) {
      desc += `Pilihan villa mulai dari ${formatPriceId(filters.priceMin)} dengan standar kualitas terbaik. `;
    }
    desc +=
      "Setiap villa telah dikurasi khusus untuk memberikan kenyamanan maksimal selama liburan Anda.";
    return desc;
  }

  if (filters.search) {
    return `Hasil pencarian untuk '${filters.search}' menampilkan ${countText} villa yang sesuai dengan kriteria Anda. Nikmati fasilitas modern dan lokasi strategis untuk pengalaman liburan yang tak terlupakan.`;
  }

  return `Jelajahi ${countText} villa mewah pilihan terbaik di seluruh Indonesia. Dari villa tepi pantai hingga villa pegunungan, temukan tempat menginap yang sempurna untuk liburan impian Anda.`;
}

/**
 * Generate complete SEO content for explore page
 */
export function generateExploreSEOContent(
  filters: ExploreFilters,
  cityName?: string,
  provinceName?: string,
  villaCount?: number,
): SEOContent {
  // Debug logging
  console.log("generateExploreSEOContent called with:", {
    filters,
    cityName,
    provinceName,
    villaCount,
  });

  const result = {
    title: generateExploreTitleId(filters, cityName, provinceName, villaCount),
    description: generateExploreDescriptionId(
      filters,
      cityName,
      provinceName,
      villaCount,
    ),
    h1: generateExploreH1Id(filters, cityName, provinceName, villaCount),
    descriptionParagraph: generateDescriptionParagraphId(
      filters,
      cityName,
      provinceName,
      villaCount,
    ),
  };

  console.log("Generated SEO content:", result);
  return result;
}

