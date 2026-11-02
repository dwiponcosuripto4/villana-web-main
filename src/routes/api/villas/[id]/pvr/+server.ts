import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SavedVillaService } from "$lib/server/services/savedVilla.service";
import { VillaService } from "$lib/server/services/villa.service";

export const POST: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  const villaId = parseInt(params.id, 10);

  if (!user || user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const score = await VillaService.recalculateVillaScore(villaId);
    return json({ success: true, pvr: score });
  } catch (error) {
    console.error(`Error calculating score for villa ${villaId}:`, error);
    return json({ error: "Failed to calculating score" }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ params, locals }) => {
  throw new Error("Not implemented yet");
};
