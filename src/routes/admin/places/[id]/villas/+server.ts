import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { placeService } from "$lib/server/services/place.service";
import type { VillaPlaceInput } from "$lib/types/place";

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const villas = await placeService.getPlaceVillas(params.id);
    return json({ villas });
  } catch (error) {
    console.error("Failed to fetch place villas:", error);
    return json({ error: "Failed to fetch place villas" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input: VillaPlaceInput = await request.json();
    input.placeId = params.id;

    // Basic validation
    if (!input.villaId || !input.distanceKm || !input.accessType) {
      return json({ error: "Missing required fields: villaId, distanceKm, accessType" }, { status: 400 });
    }

    const link = await placeService.linkToVilla(input);
    return json({ link }, { status: 201 });
  } catch (error) {
    console.error("Failed to link villa to place:", error);
    return json({ error: "Failed to link villa to place" }, { status: 500 });
  }
};