import type { PageServerLoad } from './$types';
import { PlaceService } from '$lib/server/services/place.service';
import { CityService } from '$lib/server/services/city.service';

const placeService = new PlaceService();

export const load: PageServerLoad = async ({ url, locals, fetch }) => {
  // Location-based search parameters
  const latitude = Number(url.searchParams.get("lat")) || undefined;
  const longitude = Number(url.searchParams.get("lng")) || undefined;
  const locationRadius = Number(url.searchParams.get("radius")) || undefined;

  // Check if we have location-based search
  if (latitude && longitude && locationRadius) {
    try {
      // Call our nearby-location API
      const apiUrl = `/api/places/nearby-location?lat=${latitude}&lng=${longitude}&radius=${locationRadius}&limit=100`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();

        return {
          places: data.places || [],
          cities: await CityService.getAllCities(),
          placeTypes: [
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
          ],
          placeCategories: [
            'dining',
            'nature',
            'culture',
            'shopping',
            'entertainment',
            'transport',
            'healthcare'
          ],
          selectedCity: null,
          filters: {
            latitude,
            longitude,
            locationRadius,
            isLocationSearch: true,
          },
          totalFound: data.totalFound,
          searchRadius: data.searchRadius,
          searchCenter: data.searchCenter,
          pagination: {
            page: 1,
            limit: 100,
            hasMore: false,
            totalOnPage: data.places?.length || 0
          },
          user: locals.user,
        };
      }
    } catch (error) {
      console.error('Location search error:', error);
      // Fall through to regular search if location search fails
    }
  }

  // Get query parameters for filtering
  const cityId = url.searchParams.get('city') || undefined;
  const type = url.searchParams.get('type') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const sortBy = url.searchParams.get('sortBy') || 'popular'; // popular, rating, name

  // Pagination
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12; // Number of places per page
  const offset = (page - 1) * limit;

  // Get selected city information if cityId is provided
  let selectedCity = null;
  if (cityId) {
    selectedCity = await CityService.getCityById(cityId);
  }

  // Get places using search method
  const placesResult = await placeService.search({
    query: search,
    type,
    category,
    cityId,
    sortBy,
    limit: limit + 1, // Get one extra to check if there are more
    offset,
  });

  // Check if there are more places
  const hasMore = placesResult.length > limit;
  if (hasMore) {
    placesResult.pop(); // Remove the extra place
  }

  // Optimize: Get all place images in a single query instead of N+1 queries
  const placeIds = placesResult.map(place => place.id);
  const imageMap = await placeService.getPlaceImages(placeIds);

  // Transform places data efficiently
  const places = placesResult.map((place) => ({
    ...place,
    mainImage: imageMap[place.id],
    nearbyVillasCount: 0, // Will be populated later if needed
  }));

  // Get all cities dynamically from the database
  const cities = await CityService.getAllCities();

  // Get place types and categories for filters
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

  return {
    places,
    cities,
    placeTypes,
    placeCategories,
    selectedCity,
    filters: {
      search,
      cityId,
      type,
      category,
      sortBy,
    },
    pagination: {
      page,
      limit,
      hasMore,
      totalOnPage: places.length
    },
    user: locals.user,
  };
};