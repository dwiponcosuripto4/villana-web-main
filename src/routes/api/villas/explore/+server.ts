import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SearchService, type VillaSortBy } from "$lib/server/services/search.service";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const priceMin = Number(url.searchParams.get("priceMin")) || undefined;
    const priceMax = Number(url.searchParams.get("priceMax")) || undefined;
    const bedroomMin = Number(url.searchParams.get("bedroomMin")) || undefined;
    const bedroomMax = Number(url.searchParams.get("bedroomMax")) || undefined;
    const search = url.searchParams.get("search") || undefined;
    const cityId = url.searchParams.get("cityId") || undefined;
    const provinceId = url.searchParams.get("provinceId") || undefined;
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = Number(url.searchParams.get("limit")) || 20;

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
      sortByParam === 'newest' || sortByParam === 'google_rating'
        ? sortByParam
        : 'pvr'; // Default to pvr

    const filters = {
      status: "published" as const,
      priceMin,
      priceMax,
      bedroomMin,
      bedroomMax,
      search,
      cityId,
      provinceId,
      cursor,
      limit,
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

    const result = await SearchService.searchVillasWithFiltersPaginated(filters);

    return json(result);
  } catch (error) {
    console.error("Error in villas explore API:", error);
    return json(
      {
        villas: [],
        nextCursor: null,
        hasMore: false,
        error: "Failed to load villas",
      },
      { status: 500 }
    );
  }
};