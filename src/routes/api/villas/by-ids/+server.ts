import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return json({ error: "Invalid or empty IDs array" }, { status: 400 });
    }

    // Validate all IDs are numbers
    const validIds = ids.filter(
      (id): id is number => typeof id === "number" && !isNaN(id) && id > 0
    );

    if (validIds.length === 0) {
      return json({ error: "No valid IDs provided" }, { status: 400 });
    }

    // Limit to prevent abuse (max 20 villas at once)
    const limitedIds = validIds.slice(0, 20);

    const villas = await VillaService.findByIds(limitedIds);

    return json({ villas });
  } catch (error) {
    console.error("Error fetching villas by IDs:", error);
    return json({ error: "Failed to fetch villas" }, { status: 500 });
  }
};
