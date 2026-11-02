import { error } from "@sveltejs/kit";
import { postService } from "$lib/server/services/post.service";
import { tagService } from "$lib/server/services/tag.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const tag = await tagService.findBySlug(params.slug);

  if (!tag) {
    throw error(404, "Tag not found");
  }

  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 12;

  const result = await postService.getPostsByTag(params.slug, {
    page,
    limit,
    sortBy: "newest",
  });

  const popularTags = await tagService.getPopular(20);

  return {
    tag,
    posts: result.posts,
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
