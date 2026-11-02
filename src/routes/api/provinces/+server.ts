import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const GET: RequestHandler = async ({ url }) => {
  const withCityCount = url.searchParams.get("withCityCount") === "true";

  try {
    if (withCityCount) {
      const provinces = await CityService.getProvincesWithCityCount();
      return json({ provinces });
    } else {
      const provinces = await CityService.getAllProvinces();
      return json({ provinces });
    }
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return json(
      {
        error: "Failed to fetch provinces",
      },
      { status: 500 },
    );
  }
};
