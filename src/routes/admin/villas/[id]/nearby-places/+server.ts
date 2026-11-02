import { VillaService } from "$lib/server/services/villa.service";
import { json } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = onlyAdmin(async ({ params, request }) => {
  const villaId = parseInt(params.id, 10);

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const nearbyPlace = await VillaService.addNearbyPlace(villaId, {
      name: data.name,
      description: data.description,
      distanceKm: data.distanceKm,
      accessType: data.accessType,
      placeType: data.placeType,
    });

    return json({ nearbyPlace });
  } catch (error) {
    console.error("Error adding nearby place:", error);
    return json({ error: "Failed to add nearby place" }, { status: 500 });
  }
});
