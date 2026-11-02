import type { PageServerLoad } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";
import { CityService } from "$lib/server/services/city.service";
import { SearchService, type VillaSortBy } from "$lib/server/services/search.service";

export const load: PageServerLoad = async ({ url, locals, fetch }) => {
  // Location-based search parameters
  const latitude = Number(url.searchParams.get("lat")) || undefined;
  const longitude = Number(url.searchParams.get("lng")) || undefined;
  const locationRadius = Number(url.searchParams.get("radius")) || undefined;

  // Check if we have location-based search
  if (latitude && longitude && locationRadius) {
    try {
      // Call our nearby-location API
      const apiUrl = `/api/villas/nearby-location?lat=${latitude}&lng=${longitude}&radius=${locationRadius}&limit=100`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();

        return {
          villas: data.villas || [],
          hasMore: false, // No pagination for location search
          nextCursor: null,
          filters: {
            latitude,
            longitude,
            locationRadius,
            isLocationSearch: true,
          },
          totalFound: data.totalFound,
          searchRadius: data.searchRadius,
          searchCenter: data.searchCenter,
          selectedCity: null,
          user: locals.user,
          paginated: false,
        };
      }
    } catch (error) {
      console.error('Location search error:', error);
      // Fall through to regular search if location search fails
    }
  }

  // Regular filter-based search
  const priceMin = Number(url.searchParams.get("priceMin")) || undefined;
  const priceMax = Number(url.searchParams.get("priceMax")) || undefined;
  const bedroomMin = Number(url.searchParams.get("bedroomMin")) || undefined;
  const bedroomMax = Number(url.searchParams.get("bedroomMax")) || undefined;
  const search = url.searchParams.get("search") || undefined;
  const cityId = url.searchParams.get("city") || undefined;
  const provinceId = url.searchParams.get("province") || undefined;

  // Amenity filters
  const hasBathtub = url.searchParams.get("hasBathtub") === "true" || undefined;
  const hasPool = url.searchParams.get("hasPool") === "true" || undefined;
  const hasBreakfast = url.searchParams.get("hasBreakfast") === "true" || undefined;
  const isPetFriendly = url.searchParams.get("isPetFriendly") === "true" || undefined;
  const isKidFriendly = url.searchParams.get("isKidFriendly") === "true" || undefined;
  const isSeniorFriendly = url.searchParams.get("isSeniorFriendly") === "true" || undefined;
  const isSyaria = url.searchParams.get("isSyaria") === "true" || undefined;

  // Nearby place filters
  const placeId = url.searchParams.get("placeId") || undefined;
  const nearbyRadius = Number(url.searchParams.get("nearbyRadius")) || undefined;

  // Sort parameter with validation
  const sortByParam = url.searchParams.get("sortBy");
  const sortBy: VillaSortBy =
    sortByParam === 'newest' || sortByParam === 'google_rating' || sortByParam === 'most_viewed'
      ? sortByParam
      : 'pvr'; // Default to pvr

  // Pagination parameters
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 10;

  // Get selected city information if cityId is provided
  let selectedCity = null;
  if (cityId) {
    selectedCity = await CityService.getCityById(cityId);
  }

  const filters = {
    status: "published" as const,
    priceMin,
    priceMax,
    bedroomMin,
    bedroomMax,
    search,
    cityId,
    provinceId,
    sortBy,
    // Amenity filters
    hasBathtub,
    hasPool,
    hasBreakfast,
    isPetFriendly,
    isKidFriendly,
    isSeniorFriendly,
    isSyaria,
    // Nearby place filters
    placeId,
    nearbyRadius,
  };

  // Always use paginated search for better performance and infinite scroll
  const paginatedResult = await SearchService.searchVillasWithFiltersPaginated({
    ...filters,
    cursor,
    limit,
  });

  return {
    ...paginatedResult,
    filters: {
      priceMin,
      priceMax,
      bedroomMin,
      bedroomMax,
      search,
      cityId,
      provinceId,
      sortBy,
      hasBathtub,
      hasPool,
      hasBreakfast,
      isPetFriendly,
      isKidFriendly,
      isSeniorFriendly,
      isSyaria,
      placeId,
      nearbyRadius,
    },
    selectedCity,
    user: locals.user,
    paginated: true,
  };
};
