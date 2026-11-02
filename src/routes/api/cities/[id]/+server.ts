import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const GET: RequestHandler = async ({ params }) => {
  const cityId = params.id;

  if (!cityId) {
    return json(
      {
        error: "City ID is required",
      },
      { status: 400 },
    );
  }

  try {
    const city = await CityService.getCityById(cityId);

    if (!city) {
      return json(
        {
          error: "City not found",
        },
        { status: 404 },
      );
    }

    return json({ city });
  } catch (error) {
    console.error("Error fetching city:", error);
    return json(
      {
        error: "Failed to fetch city",
      },
      { status: 500 },
    );
  }
};
