import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface GooglePlacesTextSearchRequest {
  textQuery: string;
  languageCode?: string;
  regionCode?: string;
  pageSize?: number;
}

interface GooglePlacesTextSearchResponse {
  places?: Array<{
    id: string;
    displayName: {
      text: string;
      languageCode: string;
    };
    formattedAddress: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { textQuery, languageCode = 'en', regionCode = 'ID', pageSize = 10 }: GooglePlacesTextSearchRequest = await request.json();

    if (!textQuery || textQuery.trim().length === 0) {
      return json({ error: 'Text query is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not configured');
      return json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const requestBody = {
      textQuery: textQuery.trim(),
      languageCode,
      regionCode,
      pageSize: Math.min(pageSize, 20) // Limit to maximum 20 results
    };

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return json({
        error: `Google Places API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data: GooglePlacesTextSearchResponse = await response.json();

    // Transform the response to a simpler format
    const places = (data.places || []).map(place => ({
      id: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      placeId: place.id,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude
    }));

    return json({ places });

  } catch (error) {
    console.error('Error in places text search:', error);
    return json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};