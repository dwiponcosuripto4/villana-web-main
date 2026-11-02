import { VillaService, type VillaSortBy } from "$lib/server/services/villa.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const status = url.searchParams.get("status") as "draft" | "published" | null;
  const search = url.searchParams.get("search");
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  // Sort parameter with validation
  const sortByParam = url.searchParams.get("sortBy");
  const validSortValues: VillaSortBy[] = ["newest", "oldest", "most_viewed", "title_asc", "title_desc"];
  const sortBy: VillaSortBy = validSortValues.includes(sortByParam as VillaSortBy)
    ? (sortByParam as VillaSortBy)
    : "newest";

  const filters = {
    status: status || undefined,
    search: search || undefined,
    limit,
    offset,
    sortBy,
  };

  const [villas, total] = await Promise.all([
    VillaService.findAll(filters),
    VillaService.countVillas(filters),
  ]);

  return {
    villas,
    filters: {
      status,
      search,
      sortBy,
    },
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
