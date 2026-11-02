import { error } from "@sveltejs/kit";
import { postService } from "$lib/server/services/post.service";
import { imageService } from "$lib/server/image";
import { OtherVillasService } from "$lib/server/services/other-villas.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const post = await postService.findBySlug(params.slug);

  if (!post) {
    throw error(404, "Post not found");
  }

  // Only show published posts to public
  if (post.status !== "published") {
    throw error(404, "Post not found");
  }

  // Get recent posts for sidebar (excluding current post)
  const recentPosts = await postService.getRecentPosts(5);
  const filteredRecentPosts = recentPosts.filter((p) => p.id !== post.id).slice(0, 4);

  // Generate optimized OG image URL if featured image exists
  const ogImageUrl = post.featuredImage
    ? imageService.getOgImageUrl(post.featuredImage)
    : null;

  // Fetch top villas for the post's city if set
  const topVillas = post.cityId
    ? await OtherVillasService.getTopVillasByCity(post.cityId, 3)
    : [];

  return {
    post,
    recentPosts: filteredRecentPosts,
    ogImageUrl,
    topVillas,
  };
};
