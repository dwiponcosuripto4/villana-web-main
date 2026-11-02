import { VillaService } from "$lib/server/services/villa.service";
import { json } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = onlyAdmin(async ({ params, request }) => {
  const villaId = parseInt(params.id, 10);
  const placeId = params.placeId;

  if (isNaN(villaId) || !placeId) {
    return json({ error: "Invalid villa ID or place ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const nearbyPlace = await VillaService.updateNearbyPlace(placeId, {
      name: data.name,
      description: data.description,
      distanceKm: data.distanceKm,
      accessType: data.accessType,
      placeType: data.placeType,
    });

    return json({ nearbyPlace });
  } catch (error) {
    console.error("Error updating nearby place:", error);
    return json({ error: "Failed to update nearby place" }, { status: 500 });
  }
});

export const DELETE: RequestHandler = onlyAdmin(async ({ params }) => {
  const placeId = params.placeId;

  if (!placeId) {
    return json({ error: "Invalid place ID" }, { status: 400 });
  }

  try {
    await VillaService.deleteNearbyPlace(placeId);
    return json({ success: true });
  } catch (error) {
    console.error("Error deleting nearby place:", error);
    return json({ error: "Failed to delete nearby place" }, { status: 500 });
  }
});
