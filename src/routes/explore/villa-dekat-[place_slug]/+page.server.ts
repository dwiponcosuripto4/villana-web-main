import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import {
  SearchService,
  type VillaSortBy,
} from "$lib/server/services/search.service";
import { PlaceService } from "$lib/server/services/place.service";
import { formatCityName, formatGeoLocation } from "$lib/utils/format";

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const placeSlug = params["place_slug"];

  if (!placeSlug) {
    throw error(404, "Place not found");
  }

  // Extract place slug from the URL parameter
  // The URL format is "villa-dekat-{place-slug}", so we need to remove the "villa-dekat-" prefix
  const actualPlaceSlug = placeSlug.startsWith("villa-dekat-")
    ? placeSlug.replace("villa-dekat-", "")
    : placeSlug;

  // Find the place by slug
  const placeService = new PlaceService();
  const place = await placeService.findBySlug(actualPlaceSlug);
  if (!place) {
    throw error(404, "Place not found");
  }

  // Get search parameters for filtering and sorting
  const priceMin = Number(url.searchParams.get("priceMin")) || undefined;
  const priceMax = Number(url.searchParams.get("priceMax")) || undefined;
  const bedroomMin = Number(url.searchParams.get("bedroomMin")) || undefined;
  const bedroomMax = Number(url.searchParams.get("bedroomMax")) || undefined;

  // Amenity filters
  const hasBathtub = url.searchParams.get("hasBathtub") === "true" || undefined;
  const hasPool = url.searchParams.get("hasPool") === "true" || undefined;
  const hasBreakfast =
    url.searchParams.get("hasBreakfast") === "true" || undefined;
  const isPetFriendly =
    url.searchParams.get("isPetFriendly") === "true" || undefined;
  const isKidFriendly =
    url.searchParams.get("isKidFriendly") === "true" || undefined;
  const isSeniorFriendly =
    url.searchParams.get("isSeniorFriendly") === "true" || undefined;
  const isSyaria = url.searchParams.get("isSyaria") === "true" || undefined;

  // Sort parameter with validation
  const sortByParam = url.searchParams.get("sortBy");
  const sortBy: VillaSortBy =
    sortByParam === "newest" || sortByParam === "google_rating" || sortByParam === "distance"
      ? sortByParam
      : "pvr"; // Default to pvr

  // Pagination parameters
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 10;

  // Default nearby radius for place-based search (can be made configurable later)
  const nearbyRadius = 10; // 10km radius

  const filters = {
    status: "published" as const,
    priceMin,
    priceMax,
    bedroomMin,
    bedroomMax,
    sortBy,
    // Amenity filters
    hasBathtub,
    hasPool,
    hasBreakfast,
    isPetFriendly,
    isKidFriendly,
    isSeniorFriendly,
    isSyaria,
    // Place-specific filters
    placeId: place.id,
    nearbyRadius,
  };

  // Use linked villas from place for better performance and accuracy
  // This gets villas that are explicitly linked to this place in the database
  let villas = place.villas || [];

  // Apply filters to the linked villas
  if (priceMin !== undefined) {
    villas = villas.filter(villa => Number(villa.priceMin) >= priceMin);
  }
  if (priceMax !== undefined) {
    villas = villas.filter(villa => Number(villa.priceMax) <= priceMax);
  }
  if (bedroomMin !== undefined) {
    villas = villas.filter(villa => villa.bedroomMin >= bedroomMin);
  }
  if (bedroomMax !== undefined) {
    villas = villas.filter(villa => villa.bedroomMax <= bedroomMax);
  }
  if (hasBathtub) {
    villas = villas.filter(villa => villa.hasBathtub);
  }
  if (hasPool) {
    villas = villas.filter(villa => villa.hasPool);
  }
  if (hasBreakfast) {
    villas = villas.filter(villa => villa.hasBreakfast);
  }
  if (isPetFriendly) {
    villas = villas.filter(villa => villa.isPetFriendly);
  }
  if (isKidFriendly) {
    villas = villas.filter(villa => villa.isKidFriendly);
  }
  if (isSeniorFriendly) {
    villas = villas.filter(villa => villa.isSeniorFriendly);
  }
  if (isSyaria) {
    villas = villas.filter(villa => villa.isSyaria);
  }

  // Apply sorting
  if (sortBy === 'newest') {
    villas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'google_rating') {
    villas.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
  } else if (sortBy === 'distance') {
    // Sort by distance - closest first
    // The distanceKm field is directly available on the villa object from PlaceService
    villas.sort((a, b) => {
      const distA = a.distanceKm || Number.MAX_VALUE;
      const distB = b.distanceKm || Number.MAX_VALUE;
      return Number(distA) - Number(distB);
    });
  } else {
    // Default PVR sorting - highest PVR first
    villas.sort((a, b) => (b.pvr || 0) - (a.pvr || 0));
  }

  // Simple pagination for linked villas (since they're already loaded)
  const total = villas.length;
  const startIndex = cursor ? parseInt(cursor) || 0 : 0;
  const endIndex = startIndex + limit;
  const paginatedVillas = villas.slice(startIndex, endIndex);
  const hasMore = endIndex < total;
  const nextCursor = hasMore ? endIndex.toString() : null;

  const paginatedResult = {
    villas: paginatedVillas,
    total,
    hasMore,
    nextCursor,
  };

  // Generate SEO content
  const cleanPlaceName = place.name;
  const villaCount = paginatedResult.total || paginatedResult.villas.length;
  const locationDisplay = place.city
    ? formatCityName(place.city.name)
    : "Indonesia";
  const seoContent = {
    title: `Villa dekat ${cleanPlaceName} - Sewa Villa Terbaik di ${locationDisplay} | Villana`,
    description: `Temukan ${villaCount || "berbagai"} villa terbaik dekat ${cleanPlaceName} di ${locationDisplay}. Booking langsung ke owner tanpa fee OTA. Harga mulai ${paginatedResult.villas[0]?.priceMin ? `Rp${(paginatedResult.villas[0].priceMin / 1000).toFixed(0)}rb` : "terjangkau"}.`,
    h1: `Villa dekat ${cleanPlaceName}`,
    descriptionParagraph: `Berikut adalah daftar villa terbaik dekat ${cleanPlaceName} di ${locationDisplay} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA.`,
    canonical: `/explore/villa-dekat-${actualPlaceSlug}${url.search}`,
  };

  return {
    ...paginatedResult,
    place,
    seoContent,
    filters: {
      priceMin,
      priceMax,
      bedroomMin,
      bedroomMax,
      sortBy,
      hasBathtub,
      hasPool,
      hasBreakfast,
      isPetFriendly,
      isKidFriendly,
      isSeniorFriendly,
      isSyaria,
      placeId: place.id,
      nearbyRadius,
    },
    user: locals.user,
    paginated: true,
  };
};

