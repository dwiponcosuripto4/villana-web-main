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
    const villaId = parseInt(params.id);
    if (isNaN(villaId)) {
      return json({ error: "Invalid villa ID" }, { status: 400 });
    }

    // Get all places for admin (includes both published and draft)
    const result = await placeService.getVillaPlacesForAdmin(villaId, { limit: 100 });
    return json({ places: result.places });
  } catch (error) {
    console.error("Failed to fetch villa places:", error);
    return json({ error: "Failed to fetch villa places" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const villaId = parseInt(params.id);
    if (isNaN(villaId)) {
      return json({ error: "Invalid villa ID" }, { status: 400 });
    }

    const input: VillaPlaceInput = await request.json();

    // Basic validation
    if (!input.placeId || !input.distanceKm || !input.accessType) {
      return json({ error: "Missing required fields: placeId, distanceKm, accessType" }, { status: 400 });
    }

    // Create the input with villaId
    const linkInput: VillaPlaceInput = {
      villaId: villaId,
      placeId: input.placeId,
      distanceKm: input.distanceKm,
      accessType: input.accessType,
      travelTimeMinutes: input.travelTimeMinutes,
      notes: input.notes,
      orderIndex: input.orderIndex || 0,
    };

    const link = await placeService.linkToVilla(linkInput);
    return json({ link }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to link place to villa:", error);

    // Check if it's a duplicate error
    if (error.message === "Place is already linked to this villa") {
      return json({ error: error.message }, { status: 409 });
    }

    return json({ error: "Failed to link place to villa" }, { status: 500 });
  }
};