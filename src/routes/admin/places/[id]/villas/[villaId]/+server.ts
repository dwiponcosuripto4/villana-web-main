import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { placeService } from "$lib/server/services/place.service";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const villaId = parseInt(params.villaId);
    const placeId = params.id;

    if (isNaN(villaId)) {
      return json({ error: "Invalid villa ID" }, { status: 400 });
    }

    await placeService.unlinkFromVilla(villaId, placeId);
    return json({ success: true });
  } catch (error) {
    console.error("Failed to unlink villa from place:", error);
    return json({ error: "Failed to unlink villa from place" }, { status: 500 });
  }
};