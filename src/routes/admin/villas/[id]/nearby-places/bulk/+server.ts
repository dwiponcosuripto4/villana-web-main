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
    const { places } = data;

    if (!Array.isArray(places)) {
      return json({ error: "Places must be an array" }, { status: 400 });
    }

    // Validate each place has required fields
    for (const place of places) {
      if (!place.name || !place.distanceKm || !place.accessType) {
        return json(
          {
            error: "Each place must have name, distanceKm, and accessType",
          },
          { status: 400 },
        );
      }
    }

    await VillaService.updateNearbyPlaces(villaId, places);

    return json({ success: true });
  } catch (error) {
    console.error("Error bulk importing nearby places:", error);
    return json({ error: "Failed to import nearby places" }, { status: 500 });
  }
});
