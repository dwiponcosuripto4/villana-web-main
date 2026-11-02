import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { PlaceService } from "$lib/server/services/place.service";
import {
  getCityMapping,
  getDisplayNameForSlug,
  getAreaDescription,
  getSEOKeywords,
  isMultiCityArea
} from "$lib/utils/city-mapping";

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const cityName = params["city_name"];

  if (!cityName) {
    throw error(404, "City not found");
  }

  // Initialize place service
  const placeService = new PlaceService();

  // Get search parameters
  const sortByParam = url.searchParams.get("sortBy") || "popular";
  const sortBy = ["name", "rating", "popular"].includes(sortByParam)
    ? sortByParam as "name" | "rating" | "popular"
    : "popular";

  const type = url.searchParams.get("type") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;

  // Pagination parameters
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 12; // Places per page
  const offset = (page - 1) * limit;

  try {
    // Get places for the area using the new searchByArea method
    const places = await placeService.searchByArea(cityName, {
      sortBy,
      type,
      category,
      query: search,
      limit: limit + 1, // Get one extra to check if there are more
      offset,
    });

    // Check if there are more places for pagination
    const hasMore = places.length > limit;
    if (hasMore) {
      places.pop(); // Remove the extra place
    }

    // Get total count for the area
    const totalCount = await placeService.getAreaPlacesCount(cityName);

    // Get city mapping info
    const cityMapping = getCityMapping(cityName);
    const displayName = getDisplayNameForSlug(cityName);
    const areaDescription = getAreaDescription(cityName);
    const seoKeywords = getSEOKeywords(cityName);
    const isMultiArea = isMultiCityArea(cityName);

    // Optimize: Get all place images in a single query instead of N+1 queries
    const placeIds = places.map(place => place.id);
    const imageMap = await placeService.getPlaceImages(placeIds);

    // Add main images to places efficiently
    const placesWithImages = places.map((place) => ({
      ...place,
      mainImage: imageMap[place.id],
    }));

    // Generate place types and categories for filters
    const placeTypes = [
      'restaurant',
      'beach',
      'temple',
      'museum',
      'park',
      'shopping',
      'waterfall',
      'mountain',
      'lake',
      'market',
      'tourist_attraction',
      'airport',
      'train_station',
      'bus_station',
      'hospital'
    ];

    const placeCategories = [
      'dining',
      'nature',
      'culture',
      'shopping',
      'entertainment',
      'transport',
      'healthcare'
    ];

    // Generate SEO content
    const seoContent = {
      title: `Daftar tempat wisata di ${displayName} - Tempat Wisata Terbaik | Villana`,
      description: `Temukan ${totalCount || placesWithImages.length} tempat wisata terbaik di ${areaDescription}. Jelajahi destinasi kuliner, alam, budaya, dan hiburan populer dengan rating tinggi.`,
      h1: `Tempat Wisata di ${displayName}`,
      descriptionParagraph: `Berikut adalah daftar ${totalCount || placesWithImages.length} tempat wisata terbaik di ${areaDescription}. ${isMultiArea ? 'Area ini mencakup beberapa kota/kabupaten untuk memberikan pilihan destinasi yang lebih lengkap.' : 'Temukan berbagai destinasi menarik mulai dari wisata alam, budaya, kuliner, hingga hiburan.'} Setiap tempat telah dikurasi untuk memberikan pengalaman wisata terbaik.`,
      canonical: `/tempat-wisata-daerah-${cityName}${url.search}`,
      keywords: seoKeywords.join(", "),
    };

    // Generate breadcrumbs
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Tempat Wisata", url: "/places" },
      {
        name: displayName,
        url: `/tempat-wisata-daerah-${cityName}`,
        current: true
      },
    ];

    return {
      places: placesWithImages,
      totalCount,
      cityMapping,
      displayName,
      areaDescription,
      isMultiArea,
      seoContent,
      breadcrumbs,
      placeTypes,
      placeCategories,
      filters: {
        sortBy,
        type,
        category,
        search,
      },
      pagination: {
        page,
        limit,
        hasMore,
        totalOnPage: placesWithImages.length
      },
      user: locals.user,
    };

  } catch (err) {
    console.error(`Error loading places for city ${cityName}:`, err);
    throw error(500, "Failed to load places");
  }
};