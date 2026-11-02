import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { provinceName } = await request.json();

    if (!provinceName || typeof provinceName !== "string") {
      return json(
        {
          error: "Province name is required",
        },
        { status: 400 },
      );
    }

    const matchedProvince =
      await CityService.findProvinceByFuzzyName(provinceName);

    if (!matchedProvince) {
      return json({
        exact: false,
        confidence: 0,
        id: null,
        name: null,
        originalQuery: provinceName,
      });
    }

    // Calculate confidence based on similarity
    const normalizedQuery = provinceName.trim().toLowerCase();
    const normalizedResult = matchedProvince.name.trim().toLowerCase();

    let confidence = 0;
    let exact = false;

    if (normalizedQuery === normalizedResult) {
      confidence = 1.0;
      exact = true;
    } else if (
      normalizedResult.startsWith(normalizedQuery) ||
      normalizedQuery.startsWith(normalizedResult)
    ) {
      confidence = 0.9;
    } else if (
      normalizedResult.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedResult)
    ) {
      confidence = 0.7;
    } else {
      confidence = 0.5;
    }

    return json({
      exact,
      confidence,
      id: matchedProvince.id,
      name: matchedProvince.name,
      originalQuery: provinceName,
    });
  } catch (error) {
    console.error("Error in province fuzzy matching:", error);
    return json(
      {
        error: "Failed to match province name",
      },
      { status: 500 },
    );
  }
};
