import type { PageServerLoad } from "./$types";
import { placeService } from "$lib/server/services/place.service";
import { redirect } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth-utils";

export const load: PageServerLoad = async (event) => {
  // Check admin permission
  try {
    requireAdmin(event);
  } catch {
    throw redirect(302, "/admin/login");
  }

  try {
    const page = Number(event.url.searchParams.get("page")) || 1;
    const limit = Number(event.url.searchParams.get("limit")) || 20;
    const status = event.url.searchParams.get("status") as 'draft' | 'published' | undefined;

    const sortBy = event.url.searchParams.get("sortBy") as 'newest' | 'oldest' | 'popular' | 'rating' | 'alphabetical' | undefined;

    const searchParams = {
      query: event.url.searchParams.get("query") || undefined,
      type: event.url.searchParams.get("type") || undefined,
      category: event.url.searchParams.get("category") || undefined,
      cityId: event.url.searchParams.get("cityId") || undefined,
      provinceId: event.url.searchParams.get("provinceId") || undefined,
      status,
      sortBy,
      page,
      limit,
    };

    const result = await placeService.adminSearchWithCount(searchParams);

    return {
      places: result.places,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.total / result.limit),
      },
      searchParams: {
        query: searchParams.query || "",
        type: searchParams.type || "",
        category: searchParams.category || "",
        cityId: searchParams.cityId || "",
        provinceId: searchParams.provinceId || "",
        status: searchParams.status || "",
        sortBy: searchParams.sortBy || "",
      },
    };
  } catch (error) {
    console.error("Failed to load places:", error);
    return {
      places: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
        totalPages: 0,
      },
      searchParams: {
        query: "",
        type: "",
        category: "",
        cityId: "",
        provinceId: "",
        status: "",
        sortBy: "",
      },
    };
  }
};