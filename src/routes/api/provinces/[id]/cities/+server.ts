import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const GET: RequestHandler = async ({ params }) => {
  const provinceId = params.id;

  if (!provinceId) {
    return json(
      {
        error: "Province ID is required",
      },
      { status: 400 },
    );
  }

  try {
    const cities = await CityService.getCitiesByProvince(provinceId);
    return json({ cities });
  } catch (error) {
    console.error("Error fetching cities for province:", error);
    return json(
      {
        error: "Failed to fetch cities",
      },
      { status: 500 },
    );
  }
};
