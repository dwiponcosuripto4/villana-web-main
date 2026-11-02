import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const GET: RequestHandler = async ({ url }) => {
  const search = url.searchParams.get("search");
  const limit = Number(url.searchParams.get("limit")) || 10;

  if (!search || search.length < 2) {
    return json({
      cities: [],
      provinces: [],
      message: "Search term must be at least 2 characters",
    });
  }

  try {
    const results = await CityService.searchCitiesAndProvinces(search, limit);
    return json(results);
  } catch (error) {
    console.error("Error searching cities:", error);
    return json(
      {
        cities: [],
        provinces: [],
        error: "Failed to search cities",
      },
      { status: 500 },
    );
  }
};
