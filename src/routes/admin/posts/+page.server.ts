import { postService } from "$lib/server/services/post.service";
import { categoryService } from "$lib/server/services/category.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const status = url.searchParams.get("status") as
    | "draft"
    | "published"
    | "archived"
    | null;
  const search = url.searchParams.get("search");
  const categoryId = url.searchParams.get("categoryId");
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;

  const sortByParam = url.searchParams.get("sortBy");
  const validSortValues = ["newest", "oldest", "popular", "alphabetical"];
  const sortBy = validSortValues.includes(sortByParam || "")
    ? (sortByParam as "newest" | "oldest" | "popular" | "alphabetical")
    : "newest";

  const result = await postService.adminSearch({
    query: search || undefined,
    status: status || undefined,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    page,
    limit,
    sortBy,
  });

  const categories = await categoryService.getAll();

  return {
    posts: result.posts,
    categories,
    filters: {
      status,
      search,
      categoryId,
      sortBy,
    },
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
      totalPages: Math.ceil(result.total / result.limit),
    },
  };
};
