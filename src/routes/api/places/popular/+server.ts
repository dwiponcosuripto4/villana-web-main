import { json } from "@sveltejs/kit";
import { placeService } from "$lib/server/services/place.service";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : 10;

    const places = await placeService.getPopularPlaces(limit);

    return json({
      success: true,
      data: places,
      total: places.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching popular places:", error);
    return json(
      {
        success: false,
        error: "Failed to fetch popular places",
      },
      { status: 500 },
    );
  }
};

