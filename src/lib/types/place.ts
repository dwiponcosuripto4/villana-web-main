import type { Place, PlaceImage, VillaPlace } from "$lib/server/db/schema";

export interface PlaceWithRelations extends Place {
  city?: {
    id: string;
    name: string;
  };
  province?: {
    id: string;
    name: string;
  };
  nearbyVillasCount?: number;
}

export interface PlaceWithImages extends PlaceWithRelations {
  images: PlaceImage[];
}

export interface PlaceWithVillas extends PlaceWithRelations {
  villas?: Array<{
    id: number;
    title: string;
    slug: string;
    mainImage?: string;
    priceMin: string;
    priceMax: string;
    bedroomMin: number;
    bedroomMax: number;
    distanceKm: string;
    accessType: string;
    travelTimeMinutes?: number;
  }>;
  images?: PlaceImage[];
}

export interface CreatePlaceInput {
  name: string;
  slug?: string;
  description?: string;
  type?: string;
  category?: string;
  latitude: number;
  longitude: number;
  address?: string;
  cityId?: string;
  provinceId?: string;
  googlePlaceId?: string;
  mainImage?: string;
  images?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: 'draft' | 'published';
}

export interface UpdatePlaceInput extends Partial<CreatePlaceInput> {
  id: string;
}

export interface PlaceSearchParams {
  query?: string;
  type?: string;
  category?: string;
  cityId?: string;
  cityIds?: string[]; // for multi-city searches
  provinceId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'alphabetical' | 'name';
  status?: 'draft' | 'published'; // for admin filtering
  page?: number; // for pagination
}

export interface PlaceSearchResult {
  places: PlaceWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface VillaPlaceInput {
  villaId: number;
  placeId: string;
  distanceKm: number;
  accessType: string;
  travelTimeMinutes?: number;
  notes?: string;
  orderIndex?: number;
}

export type PlaceType =
  | 'restaurant'
  | 'beach'
  | 'temple'
  | 'mosque'
  | 'museum'
  | 'park'
  | 'shopping'
  | 'waterfall'
  | 'mountain'
  | 'lake'
  | 'market'
  | 'tourist_attraction'
  | 'airport'
  | 'train_station'
  | 'bus_station'
  | 'hospital'
  | 'other';

export type PlaceCategory =
  | 'culinary'
  | 'nature'
  | 'culture'
  | 'shopping'
  | 'entertainment'
  | 'transport'
  | 'healthcare'
  | 'place_of_worship'
  | 'other';

export type AccessType =
  | 'walking'
  | 'driving'
  | 'motorcycle'
  | 'bicycle'
  | 'public_transport'
  | 'boat'
  | 'mixed';