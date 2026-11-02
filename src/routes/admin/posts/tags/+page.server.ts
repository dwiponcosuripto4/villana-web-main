import { fail } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { tagService } from "$lib/server/services/tag.service";
import { generateSlug } from "$lib/utils/slug";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const tags = await tagService.getWithPostCount();
  return { tags };
};

export const actions = {
  create: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name?.trim()) {
      return fail(400, { error: "Tag name is required" });
    }

    const slug = generateSlug(name);
    const exists = await tagService.slugExists(slug);
    if (exists) {
      return fail(400, { error: "A tag with this name already exists" });
    }

    try {
      await tagService.create({
        name: name.trim(),
        slug,
      });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to create tag" });
    }
  }),

  update: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (isNaN(id) || !name?.trim()) {
      return fail(400, { error: "Invalid data" });
    }

    const slugExists = await tagService.slugExists(slug, id);
    if (slugExists) {
      return fail(400, { error: "Slug already exists" });
    }

    try {
      await tagService.update(id, {
        id,
        name: name.trim(),
        slug: slug?.trim() || generateSlug(name),
      });
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to update tag" });
    }
  }),

  delete: onlyAdmin(async ({ request }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);

    if (isNaN(id)) {
      return fail(400, { error: "Invalid tag ID" });
    }

    try {
      await tagService.delete(id);
      return { success: true };
    } catch (err) {
      return fail(500, { error: "Failed to delete tag" });
    }
  }),
} satisfies Actions;
