import { db } from "$lib/server/db";
import {
  villa as villaTable,
  villaImage,
  villaOtherVillasCache,
  city,
  province,
  type Villa,
  type VillaImage,
} from "$lib/server/db/schema";
import { eq, sql, and, isNotNull, inArray, asc } from "drizzle-orm";
import { imageService } from "$lib/server/image";

export interface VillaWithDistance {
  id: number;
  slug: string;
  title: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  priceMin: string;
  priceMax: string;
  bedroomMin: number;
  bedroomMax: number;
  personCapacityMin: number;
  personCapacityMax: number;
  phoneNumber: string;
  pvr: string | null;
  unitsCount: number;
  hasPool: boolean;
  hasAc: boolean;
  hasBathtub: boolean;
  hasTv: boolean;
  hasBreakfast: boolean;
  isPetFriendly: boolean;
  isKidFriendly: boolean;
  isSeniorFriendly: boolean;
  isSyaria: boolean;
  googleRating: string | null;
  googleRatingCount: number | null;
  viewCount: number;
  savedCount: number;
  images: VillaImage[];
  city?: { id: string; name: string } | null;
  province?: { id: string; name: string } | null;
  distanceKm?: number | null; // Distance in km, null if same-city fallback
}

const NEARBY_RADIUS_KM = 15;
const MAX_OTHER_VILLAS = 3;

export class OtherVillasService {
  /**
   * Get other villas for a given villa (with cache)
   */
  static async getOtherVillas(
    villaId: number,
    villaData: { latitude: string | null; longitude: string | null; cityId: string | null }
  ): Promise<VillaWithDistance[]> {
    // 1. Check cache first
    const cached = await this.getFromCache(villaId);
    if (cached) {
      return cached;
    }

    // 2. Cache miss - compute and store
    const results = await this.computeOtherVillas(villaId, villaData);
    await this.saveToCache(villaId, results);
    return results;
  }

  /**
   * Get top villas in a city (for blog posts)
   * Returns villas sorted by PVR (Price-Value Rating)
   */
  static async getTopVillasByCity(
    cityId: string,
    limit: number = 3
  ): Promise<VillaWithDistance[]> {
    const query = db
      .select({
        id: villaTable.id,
        slug: villaTable.slug,
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        personCapacityMin: villaTable.personCapacityMin,
        personCapacityMax: villaTable.personCapacityMax,
        phoneNumber: villaTable.phoneNumber,
        pvr: villaTable.pvr,
        unitsCount: villaTable.unitsCount,
        hasPool: villaTable.hasPool,
        hasAc: villaTable.hasAc,
        hasBathtub: villaTable.hasBathtub,
        hasTv: villaTable.hasTv,
        hasBreakfast: villaTable.hasBreakfast,
        isPetFriendly: villaTable.isPetFriendly,
        isKidFriendly: villaTable.isKidFriendly,
        isSeniorFriendly: villaTable.isSeniorFriendly,
        isSyaria: villaTable.isSyaria,
        googleRating: villaTable.googleRating,
        googleRatingCount: villaTable.googleRatingCount,
        viewCount: villaTable.viewCount,
        savedCount: villaTable.savedCount,
        cityId: city.id,
        cityName: city.name,
        provinceId: province.id,
        provinceName: province.name,
      })
      .from(villaTable)
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .where(
        and(
          eq(villaTable.cityId, cityId),
          eq(villaTable.status, "published")
        )
      )
      .orderBy(sql`${villaTable.pvr} DESC NULLS LAST`)
      .limit(limit);

    const rows = await query;

    // Fetch images
    const villaIds = rows.map((r) => r.id);
    const images = await this.fetchImagesForVillas(villaIds);

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      bedroomMin: row.bedroomMin,
      bedroomMax: row.bedroomMax,
      personCapacityMin: row.personCapacityMin,
      personCapacityMax: row.personCapacityMax,
      phoneNumber: row.phoneNumber,
      pvr: row.pvr,
      unitsCount: row.unitsCount,
      hasPool: row.hasPool,
      hasAc: row.hasAc,
      hasBathtub: row.hasBathtub,
      hasTv: row.hasTv,
      hasBreakfast: row.hasBreakfast,
      isPetFriendly: row.isPetFriendly,
      isKidFriendly: row.isKidFriendly,
      isSeniorFriendly: row.isSeniorFriendly,
      isSyaria: row.isSyaria,
      googleRating: row.googleRating,
      googleRatingCount: row.googleRatingCount,
      viewCount: row.viewCount,
      savedCount: row.savedCount,
      images: images.get(row.id) || [],
      city: row.cityId ? { id: row.cityId, name: row.cityName! } : null,
      province: row.provinceId ? { id: row.provinceId, name: row.provinceName! } : null,
      distanceKm: null,
    }));
  }

  /**
   * Get cached other villas
   */
  private static async getFromCache(villaId: number): Promise<VillaWithDistance[] | null> {
    const cacheEntry = await db
      .select()
      .from(villaOtherVillasCache)
      .where(eq(villaOtherVillasCache.villaId, villaId))
      .limit(1);

    if (cacheEntry.length === 0 || !cacheEntry[0].otherVillaIds.length) {
      return null;
    }

    const { otherVillaIds, distances } = cacheEntry[0];

    // Fetch full villa data for cached IDs
    const villas = await this.fetchVillasByIds(otherVillaIds);

    // Merge distance data and maintain order
    const villaMap = new Map(villas.map((v) => [v.id, v]));
    const result: VillaWithDistance[] = [];

    for (let i = 0; i < otherVillaIds.length; i++) {
      const villa = villaMap.get(otherVillaIds[i]);
      if (villa) {
        result.push({
          ...villa,
          distanceKm: distances?.[i] ? parseFloat(distances[i]) : null,
        });
      }
    }

    return result;
  }

  /**
   * Save computed results to cache
   */
  private static async saveToCache(villaId: number, villas: VillaWithDistance[]): Promise<void> {
    if (villas.length === 0) return;

    const otherVillaIds = villas.map((v) => v.id);
    const distances = villas.map((v) => (v.distanceKm != null ? v.distanceKm.toFixed(2) : null));

    await db
      .insert(villaOtherVillasCache)
      .values({
        villaId,
        otherVillaIds,
        distances,
      })
      .onConflictDoUpdate({
        target: villaOtherVillasCache.villaId,
        set: {
          otherVillaIds,
          distances,
          createdAt: new Date(),
        },
      });
  }

  /**
   * Compute other villas (expensive operation)
   * 1. Find nearby villas within 15km radius, sorted by PVR DESC
   * 2. If < 3 results, fill with same-city villas
   */
  private static async computeOtherVillas(
    villaId: number,
    villaData: { latitude: string | null; longitude: string | null; cityId: string | null }
  ): Promise<VillaWithDistance[]> {
    const results: VillaWithDistance[] = [];
    const excludeIds: number[] = [villaId];

    // Query 1: Nearby villas within 15km (if villa has coordinates)
    if (villaData.latitude && villaData.longitude) {
      const lat = parseFloat(villaData.latitude);
      const lng = parseFloat(villaData.longitude);

      const nearbyVillas = await this.findNearbyVillas(lat, lng, excludeIds, MAX_OTHER_VILLAS);
      results.push(...nearbyVillas);
      excludeIds.push(...nearbyVillas.map((v) => v.id));
    }

    // Query 2: Same-city fallback (if needed)
    if (results.length < MAX_OTHER_VILLAS && villaData.cityId) {
      const remaining = MAX_OTHER_VILLAS - results.length;
      const sameCityVillas = await this.findSameCityVillas(
        villaData.cityId,
        excludeIds,
        remaining
      );
      results.push(...sameCityVillas);
    }

    return results;
  }

  /**
   * Find nearby villas within radius using Haversine formula
   */
  private static async findNearbyVillas(
    lat: number,
    lng: number,
    excludeIds: number[],
    limit: number
  ): Promise<VillaWithDistance[]> {
    // Haversine formula: 6371 is Earth's radius in km
    const distanceFormula = sql`(
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) *
          cos(radians(${villaTable.latitude})) *
          cos(radians(${villaTable.longitude}) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(${villaTable.latitude}))
        ))
      )
    )`;

    const query = db
      .select({
        id: villaTable.id,
        slug: villaTable.slug,
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        personCapacityMin: villaTable.personCapacityMin,
        personCapacityMax: villaTable.personCapacityMax,
        phoneNumber: villaTable.phoneNumber,
        pvr: villaTable.pvr,
        unitsCount: villaTable.unitsCount,
        hasPool: villaTable.hasPool,
        hasAc: villaTable.hasAc,
        hasBathtub: villaTable.hasBathtub,
        hasTv: villaTable.hasTv,
        hasBreakfast: villaTable.hasBreakfast,
        isPetFriendly: villaTable.isPetFriendly,
        isKidFriendly: villaTable.isKidFriendly,
        isSeniorFriendly: villaTable.isSeniorFriendly,
        isSyaria: villaTable.isSyaria,
        googleRating: villaTable.googleRating,
        googleRatingCount: villaTable.googleRatingCount,
        viewCount: villaTable.viewCount,
        savedCount: villaTable.savedCount,
        cityId: city.id,
        cityName: city.name,
        provinceId: province.id,
        provinceName: province.name,
        distance: distanceFormula,
      })
      .from(villaTable)
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .where(
        and(
          isNotNull(villaTable.latitude),
          isNotNull(villaTable.longitude),
          eq(villaTable.status, "published"),
          sql`${distanceFormula} <= ${NEARBY_RADIUS_KM}`,
          excludeIds.length > 0
            ? sql`${villaTable.id} NOT IN (${sql.join(excludeIds, sql`, `)})`
            : sql`1=1`
        )
      )
      .orderBy(sql`${villaTable.pvr} DESC NULLS LAST`)
      .limit(limit);

    const rows = await query;

    // Fetch images
    const villaIds = rows.map((r) => r.id);
    const images = await this.fetchImagesForVillas(villaIds);

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      bedroomMin: row.bedroomMin,
      bedroomMax: row.bedroomMax,
      personCapacityMin: row.personCapacityMin,
      personCapacityMax: row.personCapacityMax,
      phoneNumber: row.phoneNumber,
      pvr: row.pvr,
      unitsCount: row.unitsCount,
      hasPool: row.hasPool,
      hasAc: row.hasAc,
      hasBathtub: row.hasBathtub,
      hasTv: row.hasTv,
      hasBreakfast: row.hasBreakfast,
      isPetFriendly: row.isPetFriendly,
      isKidFriendly: row.isKidFriendly,
      isSeniorFriendly: row.isSeniorFriendly,
      isSyaria: row.isSyaria,
      googleRating: row.googleRating,
      googleRatingCount: row.googleRatingCount,
      viewCount: row.viewCount,
      savedCount: row.savedCount,
      images: images.get(row.id) || [],
      city: row.cityId ? { id: row.cityId, name: row.cityName! } : null,
      province: row.provinceId ? { id: row.provinceId, name: row.provinceName! } : null,
      distanceKm: Math.round((row.distance as number) * 100) / 100,
    }));
  }

  /**
   * Find villas in the same city
   */
  private static async findSameCityVillas(
    cityId: string,
    excludeIds: number[],
    limit: number
  ): Promise<VillaWithDistance[]> {
    const query = db
      .select({
        id: villaTable.id,
        slug: villaTable.slug,
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        personCapacityMin: villaTable.personCapacityMin,
        personCapacityMax: villaTable.personCapacityMax,
        phoneNumber: villaTable.phoneNumber,
        pvr: villaTable.pvr,
        unitsCount: villaTable.unitsCount,
        hasPool: villaTable.hasPool,
        hasAc: villaTable.hasAc,
        hasBathtub: villaTable.hasBathtub,
        hasTv: villaTable.hasTv,
        hasBreakfast: villaTable.hasBreakfast,
        isPetFriendly: villaTable.isPetFriendly,
        isKidFriendly: villaTable.isKidFriendly,
        isSeniorFriendly: villaTable.isSeniorFriendly,
        isSyaria: villaTable.isSyaria,
        googleRating: villaTable.googleRating,
        googleRatingCount: villaTable.googleRatingCount,
        viewCount: villaTable.viewCount,
        savedCount: villaTable.savedCount,
        cityId: city.id,
        cityName: city.name,
        provinceId: province.id,
        provinceName: province.name,
      })
      .from(villaTable)
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .where(
        and(
          eq(villaTable.cityId, cityId),
          eq(villaTable.status, "published"),
          excludeIds.length > 0
            ? sql`${villaTable.id} NOT IN (${sql.join(excludeIds, sql`, `)})`
            : sql`1=1`
        )
      )
      .orderBy(sql`${villaTable.pvr} DESC NULLS LAST`)
      .limit(limit);

    const rows = await query;

    // Fetch images
    const villaIds = rows.map((r) => r.id);
    const images = await this.fetchImagesForVillas(villaIds);

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      bedroomMin: row.bedroomMin,
      bedroomMax: row.bedroomMax,
      personCapacityMin: row.personCapacityMin,
      personCapacityMax: row.personCapacityMax,
      phoneNumber: row.phoneNumber,
      pvr: row.pvr,
      unitsCount: row.unitsCount,
      hasPool: row.hasPool,
      hasAc: row.hasAc,
      hasBathtub: row.hasBathtub,
      hasTv: row.hasTv,
      hasBreakfast: row.hasBreakfast,
      isPetFriendly: row.isPetFriendly,
      isKidFriendly: row.isKidFriendly,
      isSeniorFriendly: row.isSeniorFriendly,
      isSyaria: row.isSyaria,
      googleRating: row.googleRating,
      googleRatingCount: row.googleRatingCount,
      viewCount: row.viewCount,
      savedCount: row.savedCount,
      images: images.get(row.id) || [],
      city: row.cityId ? { id: row.cityId, name: row.cityName! } : null,
      province: row.provinceId ? { id: row.provinceId, name: row.provinceName! } : null,
      distanceKm: null, // No distance for same-city fallback
    }));
  }

  /**
   * Fetch villas by IDs (for cache retrieval)
   */
  private static async fetchVillasByIds(ids: number[]): Promise<VillaWithDistance[]> {
    if (ids.length === 0) return [];

    const rows = await db
      .select({
        id: villaTable.id,
        slug: villaTable.slug,
        title: villaTable.title,
        address: villaTable.address,
        latitude: villaTable.latitude,
        longitude: villaTable.longitude,
        priceMin: villaTable.priceMin,
        priceMax: villaTable.priceMax,
        bedroomMin: villaTable.bedroomMin,
        bedroomMax: villaTable.bedroomMax,
        personCapacityMin: villaTable.personCapacityMin,
        personCapacityMax: villaTable.personCapacityMax,
        phoneNumber: villaTable.phoneNumber,
        pvr: villaTable.pvr,
        unitsCount: villaTable.unitsCount,
        hasPool: villaTable.hasPool,
        hasAc: villaTable.hasAc,
        hasBathtub: villaTable.hasBathtub,
        hasTv: villaTable.hasTv,
        hasBreakfast: villaTable.hasBreakfast,
        isPetFriendly: villaTable.isPetFriendly,
        isKidFriendly: villaTable.isKidFriendly,
        isSeniorFriendly: villaTable.isSeniorFriendly,
        isSyaria: villaTable.isSyaria,
        googleRating: villaTable.googleRating,
        googleRatingCount: villaTable.googleRatingCount,
        viewCount: villaTable.viewCount,
        savedCount: villaTable.savedCount,
        cityId: city.id,
        cityName: city.name,
        provinceId: province.id,
        provinceName: province.name,
      })
      .from(villaTable)
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .where(inArray(villaTable.id, ids));

    // Fetch images
    const images = await this.fetchImagesForVillas(ids);

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      bedroomMin: row.bedroomMin,
      bedroomMax: row.bedroomMax,
      personCapacityMin: row.personCapacityMin,
      personCapacityMax: row.personCapacityMax,
      phoneNumber: row.phoneNumber,
      pvr: row.pvr,
      unitsCount: row.unitsCount,
      hasPool: row.hasPool,
      hasAc: row.hasAc,
      hasBathtub: row.hasBathtub,
      hasTv: row.hasTv,
      hasBreakfast: row.hasBreakfast,
      isPetFriendly: row.isPetFriendly,
      isKidFriendly: row.isKidFriendly,
      isSeniorFriendly: row.isSeniorFriendly,
      isSyaria: row.isSyaria,
      googleRating: row.googleRating,
      googleRatingCount: row.googleRatingCount,
      viewCount: row.viewCount,
      savedCount: row.savedCount,
      images: images.get(row.id) || [],
      city: row.cityId ? { id: row.cityId, name: row.cityName! } : null,
      province: row.provinceId ? { id: row.provinceId, name: row.provinceName! } : null,
      distanceKm: null, // Will be filled from cache
    }));
  }

  /**
   * Fetch images for multiple villas with optimized thumbnails
   */
  private static async fetchImagesForVillas(villaIds: number[]): Promise<Map<number, VillaImage[]>> {
    if (villaIds.length === 0) return new Map();

    const images = await db
      .select()
      .from(villaImage)
      .where(inArray(villaImage.villaId, villaIds))
      .orderBy(asc(villaImage.orderIndex));

    const imagesByVilla = new Map<number, VillaImage[]>();
    for (const img of images) {
      if (!imagesByVilla.has(img.villaId)) {
        imagesByVilla.set(img.villaId, []);
      }
      // Apply image optimization transformation to thumbnailUrl
      imagesByVilla.get(img.villaId)!.push({
        ...img,
        thumbnailUrl: imageService.getVillaCardThumbnailUrl(img.imageUrl),
      });
    }

    return imagesByVilla;
  }

  /**
   * Invalidate cache for all villas in a city
   * Called when a villa is created/updated/deleted in that city
   */
  static async invalidateCacheForCity(cityId: string | null): Promise<void> {
    if (!cityId) return;

    // Get all villa IDs in this city
    const villasInCity = await db
      .select({ id: villaTable.id })
      .from(villaTable)
      .where(eq(villaTable.cityId, cityId));

    const villaIds = villasInCity.map((v) => v.id);
    if (villaIds.length === 0) return;

    // Delete cache entries for these villas
    await db
      .delete(villaOtherVillasCache)
      .where(inArray(villaOtherVillasCache.villaId, villaIds));

    // Also delete cache entries that reference these villas in their otherVillaIds
    // This is more complex - we need to find caches that contain any of these villa IDs
    // For simplicity, we'll clear cache for the entire city area
    // A more sophisticated approach would parse the array, but this is good enough
  }

  /**
   * Invalidate cache for a specific villa
   */
  static async invalidateCacheForVilla(villaId: number): Promise<void> {
    await db
      .delete(villaOtherVillasCache)
      .where(eq(villaOtherVillasCache.villaId, villaId));
  }
}
