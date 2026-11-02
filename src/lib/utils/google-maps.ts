interface GoogleMapsPlace {
  displayName?: {
    text: string;
    languageCode: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  types?: string[];
  priceLevel?: string;
}

interface GoogleMapsResponse {
  places: GoogleMapsPlace[];
}

interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius: number;
  apiKey: string;
}

export interface PlaceInfo {
  name: string;
  placeId: string;
  rating?: number;
  userRatingCount?: number;
}

export interface TextSearchPlace {
  id: string;
  name: string;
  address: string;
  placeId: string;
  latitude?: number;
  longitude?: number;
}

export class GoogleMapsService {
  private static readonly API_ENDPOINT =
    "https://places.googleapis.com/v1/places:searchNearby";
  private static readonly FIELD_MASK = [
    "places.displayName",
    "places.location",
    "places.formattedAddress",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.photos",
    "places.types",
    "places.priceLevel",
  ].join(",");

  static async searchNearbyAccommodations(
    params: NearbySearchParams,
  ): Promise<GoogleMapsPlace[]> {
    const { latitude, longitude, radius, apiKey } = params;

    const requestBody = {
      includedTypes: ["lodging"],
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: radius,
        },
      },
    };

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": this.FIELD_MASK,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Maps API error: ${response.status} - ${errorText}`,
        );
      }

      const data: GoogleMapsResponse = await response.json();
      return data.places || [];
    } catch (error) {
      console.error("Error fetching places from Google Maps:", error);
      // throw error;
      return [];
    }
  }

  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // /**
  //  * Get Google Place info (name, placeId, rating, user_ratings_total)
  //  * from latitude and longitude using the Places API.
  //  */
  // static async getPlaceInfoFromLatLng(
  //   lat: number,
  //   lng: number,
  //   radius = 50, // meters
  //   apiKey?: string,
  // ): Promise<PlaceInfo | null> {
  //   let _apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;
  //   console.log("Using Google Maps API Key:", _apiKey);
  //
  //   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${_apiKey}`;
  //
  //   const response = await fetch(url);
  //   const data = await response.json();
  //   console.log("[getPlaceInfoFromLatLng] API response data:", data);
  //
  //   if (data.status !== "OK" || !data.results.length) {
  //     console.error(
  //       "[getPlaceInfoFromLatLng] No results found or API error:",
  //       data.status,
  //     );
  //     return null;
  //   }
  //
  //   const first = data.results[0];
  //   return {
  //     name: first.name,
  //     placeId: first.place_id,
  //     rating: first.rating,
  //     userRatingCount: first.user_ratings_total,
  //   };
  // }

  static async getPlaceInfoByPlaceId(
    placeId: string,
    apiKey?: string,
  ): Promise<PlaceInfo | null> {
    const _apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;

    // use new API
    // curl -X GET -H 'Content-Type: application/json' \
    // -H "X-Goog-Api-Key: API_KEY" \
    // -H "X-Goog-FieldMask: formattedAddress,displayName" \
    // https://places.googleapis.com/v1/places/ChIJj61dQgK6j4AR4GeTYWZsKWw

    // const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=display_name,user_ratings_total,rating&key=${_apiKey}`;
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    try {
      const req = new Request(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": _apiKey!,
          "X-Goog-FieldMask": "displayName,rating,userRatingCount",
        },
      });

      const response = await fetch(req);
      const data = await response.json();
      console.log(
        "[getPlaceInfoByPlaceId] Google Maps API response data:",
        data,
      );

      if (response.status !== 200 || !data) {
        console.error(
          "[getPlaceInfoByPlaceId] No result found or API error:",
          data.status,
        );
        return null;
      }

      return {
        name: data.displayName?.text || "",
        placeId: placeId,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
      };
    } catch (e) {
      console.error(
        `Cannot get place info by place id: ${e}\nwhen fetching from this url: ${url}`,
      );
      return null;
    }
  }

  static async searchPlacesByText(
    textQuery: string,
    languageCode = "en",
    regionCode = "ID",
    pageSize = 10,
  ): Promise<TextSearchPlace[]> {
    try {
      const response = await fetch("/api/places/search-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textQuery,
          languageCode,
          regionCode,
          pageSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.places || [];
    } catch (error) {
      console.error("Error searching places by text:", error);
      throw error;
    }
  }
}

export type { GoogleMapsPlace, NearbySearchParams };
