import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";

export const GET: RequestHandler = async ({ params }) => {
  const villaId = parseInt(params.id, 10);

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const villa = await VillaService.findById(villaId);

    if (!villa) {
      return json({ error: "Villa not found" }, { status: 404 });
    }

    return json(villa);
  } catch (error) {
    console.error("Error fetching villa:", error);
    return json({ error: "Failed to fetch villa" }, { status: 500 });
  }
};
