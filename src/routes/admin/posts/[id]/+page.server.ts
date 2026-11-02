import { error, fail, redirect } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { postService } from "$lib/server/services/post.service";
import { categoryService } from "$lib/server/services/category.service";
import { tagService } from "$lib/server/services/tag.service";
import { CityService } from "$lib/server/services/city.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const postId = parseInt(params.id);
  if (isNaN(postId)) {
    throw error(400, "Invalid post ID");
  }

  const post = await postService.findById(postId);
  if (!post) {
    throw error(404, "Post not found");
  }

  const [categories, tags] = await Promise.all([
    categoryService.getAll(),
    tagService.getAll(),
  ]);

  // Fetch city data if post has cityId
  let city = null;
  if (post.cityId) {
    city = await CityService.getCityById(post.cityId);
  }

  return {
    post,
    categories,
    tags,
    city,
  };
};

export const actions = {
  update: onlyAdmin(async ({ request, params }) => {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return fail(400, { error: "Invalid post ID" });
    }

    const formData = await request.formData();

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const featuredImage = formData.get("featuredImage") as string;
    const featuredImageAlt = formData.get("featuredImageAlt") as string;
    const categoryId = formData.get("categoryId") as string;
    const cityId = formData.get("cityId") as string;
    const status = formData.get("status") as "draft" | "published" | "archived";
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const tagIdsRaw = formData.getAll("tagIds") as string[];

    // Validate required fields
    if (!title || !content) {
      return fail(400, { error: "Title and content are required" });
    }

    // Check slug uniqueness (excluding current post)
    if (slug) {
      const slugExists = await postService.slugExists(slug, postId);
      if (slugExists) {
        return fail(400, { error: "Slug already exists. Please choose a different slug." });
      }
    }

    // Parse tag IDs
    const tagIds = tagIdsRaw
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    try {
      await postService.update(postId, {
        id: postId,
        title,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        content,
        featuredImage: featuredImage || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        categoryId: categoryId ? parseInt(categoryId) : null,
        cityId: cityId || null,
        status,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        tagIds,
      });

      return { success: true };
    } catch (err) {
      console.error("Post update error:", err);
      return fail(500, {
        error: `Failed to update post: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  }),

  publish: onlyAdmin(async ({ params }) => {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return fail(400, { error: "Invalid post ID" });
    }

    try {
      await postService.publish(postId);
      return { success: true, action: "published" };
    } catch (err) {
      return fail(500, { error: "Failed to publish post" });
    }
  }),

  unpublish: onlyAdmin(async ({ params }) => {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return fail(400, { error: "Invalid post ID" });
    }

    try {
      await postService.unpublish(postId);
      return { success: true, action: "unpublished" };
    } catch (err) {
      return fail(500, { error: "Failed to unpublish post" });
    }
  }),

  delete: onlyAdmin(async ({ params }) => {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return fail(400, { error: "Invalid post ID" });
    }

    try {
      await postService.delete(postId);
      throw redirect(302, "/admin/posts");
    } catch (err) {
      if (err instanceof Response) throw err; // Re-throw redirect
      return fail(500, { error: "Failed to delete post" });
    }
  }),
} satisfies Actions;
