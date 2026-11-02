import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { placeService } from "$lib/server/services/place.service";

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

    const { places } = await request.json();

    if (!Array.isArray(places) || places.length === 0) {
      return json({ error: "Places array is required" }, { status: 400 });
    }

    // Prepare inputs for batch linking
    const linkInputs = places.map(place => ({
      villaId,
      placeId: place.placeId || place.id,
      distanceKm: place.distanceKm,
      accessType: place.accessType || place.suggestedAccessType,
      travelTimeMinutes: place.travelTimeMinutes || place.suggestedTravelTime || null,
      notes: place.notes || null,
      orderIndex: place.orderIndex || 0,
    }));

    // Call the batch linking service
    const result = await placeService.linkMultipleToVilla(linkInputs);

    return json({
      success: true,
      added: result.added,
      skipped: result.skipped,
      message: `Successfully added ${result.added} places${result.skipped > 0 ? `, ${result.skipped} were already linked` : ''}`
    });
  } catch (error) {
    console.error("Failed to batch link places to villa:", error);
    return json({ error: "Failed to batch link places to villa" }, { status: 500 });
  }
};