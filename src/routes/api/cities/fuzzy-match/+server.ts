import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { cityName, provinceName } = await request.json();

    if (!cityName || typeof cityName !== "string") {
      return json(
        {
          error: "City name is required",
        },
        { status: 400 },
      );
    }

    const matchedCity = await CityService.findCityByFuzzyName(
      cityName,
      provinceName,
    );

    if (!matchedCity) {
      return json({
        exact: false,
        confidence: 0,
        cityId: null,
        cityName: null,
        provinceId: null,
        provinceName: null,
        originalQuery: { cityName, provinceName },
      });
    }

    // Calculate confidence based on similarity
    const normalizedCityQuery = cityName.trim().toLowerCase();
    const normalizedCityResult = matchedCity.name.trim().toLowerCase();

    let confidence = 0;
    let exact = false;

    if (normalizedCityQuery === normalizedCityResult) {
      confidence = 1.0;
      exact = true;
    } else if (
      normalizedCityResult.startsWith(normalizedCityQuery) ||
      normalizedCityQuery.startsWith(normalizedCityResult)
    ) {
      confidence = 0.9;
    } else if (
      normalizedCityResult.includes(normalizedCityQuery) ||
      normalizedCityQuery.includes(normalizedCityResult)
    ) {
      confidence = 0.7;
    } else {
      confidence = 0.5;
    }

    // If province was provided, check if it matches and adjust confidence
    if (provinceName) {
      const normalizedProvinceQuery = provinceName.trim().toLowerCase();
      const normalizedProvinceResult = matchedCity.province.name
        .trim()
        .toLowerCase();

      if (normalizedProvinceQuery === normalizedProvinceResult) {
        // Province matches exactly, boost confidence
        confidence = Math.min(confidence + 0.1, 1.0);
      } else if (
        !normalizedProvinceResult.includes(normalizedProvinceQuery) &&
        !normalizedProvinceQuery.includes(normalizedProvinceResult)
      ) {
        // Province doesn't match at all, reduce confidence
        confidence = Math.max(confidence - 0.2, 0.1);
      }
    }

    return json({
      exact,
      confidence,
      cityId: matchedCity.id,
      cityName: matchedCity.name,
      provinceId: matchedCity.province.id,
      provinceName: matchedCity.province.name,
      originalQuery: { cityName, provinceName },
    });
  } catch (error) {
    console.error("Error in city fuzzy matching:", error);
    return json(
      {
        error: "Failed to match city name",
      },
      { status: 500 },
    );
  }
};
