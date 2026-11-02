import { error } from "@sveltejs/kit";
import { postService } from "$lib/server/services/post.service";
import { categoryService } from "$lib/server/services/category.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const category = await categoryService.findBySlug(params.slug);

  if (!category) {
    throw error(404, "Category not found");
  }

  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 12;

  const result = await postService.getPostsByCategory(params.slug, {
    page,
    limit,
    sortBy: "newest",
  });

  const allCategories = await categoryService.getWithPostCount();

  return {
    category,
    posts: result.posts,
    categories: allCategories.filter((c) => c.postCount > 0),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
      totalPages: Math.ceil(result.total / result.limit),
    },
  };
};
