import { postService } from "$lib/server/services/post.service";
import { categoryService } from "$lib/server/services/category.service";
import { tagService } from "$lib/server/services/tag.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 12;

  const [result, categories, popularTags] = await Promise.all([
    postService.search({ page, limit, sortBy: "newest" }),
    categoryService.getWithPostCount(),
    tagService.getPopular(10),
  ]);

  return {
    posts: result.posts,
    categories: categories.filter((c) => c.postCount > 0),
    popularTags: popularTags.filter((t) => t.postCount > 0),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
      totalPages: Math.ceil(result.total / result.limit),
    },
  };
};
