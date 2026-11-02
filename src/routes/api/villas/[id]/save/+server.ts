import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SavedVillaService } from "$lib/server/services/savedVilla.service";

export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const villaId = parseInt(params.id, 10);

  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const saved = await SavedVillaService.save(user.id, villaId);
    return json({ success: true, saved });
  } catch (error) {
    console.error("Error saving villa:", error);
    return json({ error: "Failed to save villa" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const villaId = parseInt(params.id, 10);

  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    await SavedVillaService.remove(user.id, villaId);
    return json({ success: true });
  } catch (error) {
    console.error("Error removing saved villa:", error);
    return json({ error: "Failed to remove saved villa" }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const villaId = parseInt(params.id, 10);

  if (!user) {
    return json({ saved: false });
  }

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const saved = await SavedVillaService.isSaved(user.id, villaId);
    return json({ saved });
  } catch (error) {
    console.error("Error checking saved status:", error);
    return json({ error: "Failed to check saved status" }, { status: 500 });
  }
};
