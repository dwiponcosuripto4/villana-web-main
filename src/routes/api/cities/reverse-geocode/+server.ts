import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CityService } from "$lib/server/services/city.service";

async function tryGoogleMapsGeocoding(latitude: number, longitude: number) {
  // import { GOOGLE_MAPS_API_KEY } from "$env/static/private";
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en`;

    console.log("Trying Google Maps API for reverse geocoding");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(googleUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Google API status: ${data.status}`);
    }

    // Extract city from Google's response
    const result = data.results[0];
    let cityName = null;
    let state = null;
    let country = null;

    for (const component of result.address_components) {
      const types = component.types;

      if (
        types.includes("locality") ||
        types.includes("administrative_area_level_2")
      ) {
        cityName = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.long_name;
      } else if (types.includes("country")) {
        country = component.long_name;
      }
    }

    if (!cityName) {
      throw new Error("No city found in Google response");
    }

    console.log(`Google Maps found city: ${cityName}`);

    // Try to find matching city in our database
    const matchedCity = await CityService.findNearestCityByName(cityName);

    return json({
      nominatimData: {
        displayName: result.formatted_address,
        city: cityName,
        state,
        country,
        countryCode: null,
      },
      matchedCity,
      coordinates: {
        latitude,
        longitude,
      },
    });
  } catch (error) {
    console.error("Google Maps geocoding failed:", error);
    return null;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return json(
        {
          error: "Latitude and longitude are required",
        },
        { status: 400 },
      );
    }

    // Validate coordinates
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return json(
        {
          error: "Invalid coordinates",
        },
        { status: 400 },
      );
    }

    // Use Nominatim API for reverse geocoding with timeout
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;

    console.log(
      `Attempting reverse geocoding for coordinates: ${latitude}, ${longitude}`,
    );

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    let response;
    try {
      response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "Villana-Villa-Search/1.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Nominatim fetch error:", error);

      if (error.name === "AbortError") {
        console.log("Nominatim request timed out");
        return json(
          {
            error: "Location service request timed out. Please try again.",
          },
          { status: 504 },
        );
      }

      // Try Google Maps API as fallback
      console.log(
        "Nominatim service unavailable, trying Google Maps API fallback",
      );

      if (!GOOGLE_MAPS_API_KEY) {
        console.log("No Google Maps API key available for fallback");
        return json(
          {
            error:
              "Location service temporarily unavailable. Please try selecting a city manually.",
          },
          { status: 503 },
        );
      }

      try {
        const googleResponse = await tryGoogleMapsGeocoding(
          latitude,
          longitude,
        );
        if (googleResponse) {
          return googleResponse;
        }
      } catch (googleError) {
        console.error("Google Maps fallback also failed:", googleError);
      }

      return json(
        {
          error:
            "Location service temporarily unavailable. Please try selecting a city manually.",
        },
        { status: 503 },
      );
    }

    if (!response.ok) {
      return json(
        {
          error: "Failed to get location information",
        },
        { status: 500 },
      );
    }

    const nominatimData = await response.json();

    if (!nominatimData.address) {
      return json(
        {
          error: "No address information found for these coordinates",
        },
        { status: 404 },
      );
    }

    // Extract city name from Nominatim response
    const address = nominatimData.address;
    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county;

    if (!cityName) {
      return json(
        {
          error: "Could not determine city from location",
        },
        { status: 404 },
      );
    }

    // Try to find matching city in our database
    const matchedCity = await CityService.findNearestCityByName(cityName);

    return json({
      nominatimData: {
        displayName: nominatimData.display_name,
        city: cityName,
        state: address.state || address.province,
        country: address.country,
        countryCode: address.country_code,
      },
      matchedCity,
      coordinates: {
        latitude,
        longitude,
      },
    });
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return json(
      {
        error: "Failed to process reverse geocoding request",
      },
      { status: 500 },
    );
  }
};
