import { fail } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { categoryService } from "$lib/server/services/category.service";
import { generateSlug } from "$lib/utils/slug";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const categories = await categoryService.getWithPostCount();
  return { categories };
};

export const actions = {
  create: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name?.trim()) {
      return fail(400, { error: "Category name is required" });
    }

    const slug = generateSlug(name);
    const exists = await categoryService.slugExists(slug);
    if (exists) {
      return fail(400, { error: "A category with this name already exists" });
    }

    try {
      await categoryService.create({
        name: name.trim(),
        slug,
        description: description?.trim() || undefined,
      });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to create category" });
    }
  }),

  update: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;

    if (isNaN(id) || !name?.trim()) {
      return fail(400, { error: "Invalid data" });
    }

    const slugExists = await categoryService.slugExists(slug, id);
    if (slugExists) {
      return fail(400, { error: "Slug already exists" });
    }

    try {
      await categoryService.update(id, {
        id,
        name: name.trim(),
        slug: slug?.trim() || generateSlug(name),
        description: description?.trim() || undefined,
      });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to update category" });
    }
  }),

  delete: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);

    if (isNaN(id)) {
      return fail(400, { error: "Invalid category ID" });
    }

    try {
      await categoryService.delete(id);
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to delete category" });
    }
  }),
} satisfies Actions;
