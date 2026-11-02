import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SavedVillaService } from "$lib/server/services/savedVilla.service";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ villas: [] });
  }

  try {
    const savedVillas = await SavedVillaService.getSavedVillas(user.id);
    return json({ villas: savedVillas });
  } catch (error) {
    console.error("Error fetching saved villas:", error);
    return json({ error: "Failed to fetch saved villas" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { villaIds } = await request.json();

    if (!Array.isArray(villaIds)) {
      return json({ error: "Invalid request body" }, { status: 400 });
    }

    await SavedVillaService.bulkSave(user.id, villaIds);
    return json({ success: true });
  } catch (error) {
    console.error("Error bulk saving villas:", error);
    return json({ error: "Failed to save villas" }, { status: 500 });
  }
};
