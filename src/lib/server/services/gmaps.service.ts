import { join, dirname } from "path";
import { fileURLToPath } from "url";

export interface PlaceInfo {
  name: string;
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
}

/**
 * Get Google Place info (name, placeId, rating, user_ratings_total)
 * from latitude and longitude using the Places API.
 */
export async function getPlaceInfoFromLatLng(
  lat: number,
  lng: number,
  radius = 50, // meters
  apiKey?: string,
): Promise<PlaceInfo | null> {
  let _apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;
  console.log("Using Google Maps API Key:", _apiKey);

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${_apiKey}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("[getPlaceInfoFromLatLng] API response data:", data);

  if (data.status !== "OK" || !data.results.length) {
    console.error(
      "[getPlaceInfoFromLatLng] No results found or API error:",
      data.status,
    );
    return null;
  }

  const first = data.results[0];
  return {
    name: first.name,
    placeId: first.place_id,
    rating: first.rating,
    userRatingsTotal: first.user_ratings_total,
  };
}

export class GmapsService {
  static async getPlaceInfoFromLatLng(lat: number, lng: number, radius = 50) {
    return getPlaceInfoFromLatLng(lat, lng, radius);
  }
}
