import { fail } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { postService } from "$lib/server/services/post.service";
import { categoryService } from "$lib/server/services/category.service";
import { tagService } from "$lib/server/services/tag.service";
import { generateSlug } from "$lib/utils/slug";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const [categories, tags] = await Promise.all([
    categoryService.getAll(),
    tagService.getAll(),
  ]);

  return {
    categories,
    tags,
  };
};

export const actions = {
  default: onlyAdmin(async ({ request, locals }) => {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const slugInput = formData.get("slug") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const featuredImage = formData.get("featuredImage") as string;
    const featuredImageAlt = formData.get("featuredImageAlt") as string;
    const categoryId = formData.get("categoryId") as string;
    const status = formData.get("status") as "draft" | "published";
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const tagIdsRaw = formData.getAll("tagIds") as string[];

    // Validate required fields
    if (!title || !content) {
      return fail(400, {
        error: "Title and content are required",
      });
    }

    // Generate or validate slug
    let slug = slugInput?.trim() || generateSlug(title);

    // Check if slug already exists
    const slugExists = await postService.slugExists(slug);
    if (slugExists) {
      // Append timestamp to make unique
      slug = `${slug}-${Date.now()}`;
    }

    // Parse tag IDs
    const tagIds = tagIdsRaw
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    try {
      const post = await postService.create({
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        featuredImage: featuredImage || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        authorId: locals.user!.id,
        status: status || "draft",
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        tagIds,
      });

      return {
        success: true,
        nextUrl: `/admin/posts/${post.id}`,
      };
    } catch (error) {
      console.error("Post creation error:", error);
      return fail(500, {
        error: `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),
} satisfies Actions;
