import { db } from "$lib/server/db";
import {
  villa as villaTable,
  villaImage,
  villaAmenity,
  villaVideo,
  villaBedSize,
  villaLastUpdate,
  villaNearbyPlace,
  province,
  city,
  searchIndex,
  villaButtonClick,
  villaButtonClickTypeEnum,
  type Villa,
  type VillaImage,
  type VillaAmenity,
  type VillaVideo,
  type VillaBedSize,
  type VillaNearbyPlace,
  type Province,
  type City,
  type VillaButtonClick,
} from "$lib/server/db/schema";
import { OtherVillasService } from "./other-villas.service";
import {
  calcFacilityScore,
  calcPVR,
  normalizeRating,
  type FacilityScoreParams,
} from "$lib/utils/formula";
import { GoogleMapsService } from "$lib/utils/google-maps";
import { eq, desc, asc, and, gte, lte, like, sql, ilike } from "drizzle-orm";
import { imageService } from "$lib/server/image";

export interface VillaWithRelations extends Villa {
  images: VillaImage[];
  amenities: VillaAmenity[];
  videos: VillaVideo[];
  bedSizes: VillaBedSize[];
  nearbyPlaces: VillaNearbyPlace[];
  province?: Province | null;
  city?: City | null;
  googlePlaceId: string | null;
}

export interface CreateVillaInput {
  title: string;
  slug: string;
  priceMin: string;
  priceMax: string;
  unitsCount: number;
  bedroomMin: number;
  bedroomMax: number;
  personCapacityMin?: number;
  personCapacityMax?: number;
  hasAc: boolean;
  hasBathtub: boolean;
  hasTv: boolean;
  hasBreakfast: boolean;
  hasPool: boolean;
  description?: string;
  address: string;
  latitude?: string;
  longitude?: string;
  googleMapsLink?: string;
  googlePlaceId?: string;
  phoneNumber: string;
  status: "draft" | "published";
  createdBy?: string;
  keywords?: string[];
}

export type VillaSortBy = "newest" | "oldest" | "most_viewed" | "title_asc" | "title_desc";

export interface VillaFilters {
  status?: "draft" | "published";
  priceMin?: number;
  priceMax?: number;
  bedroomMin?: number;
  bedroomMax?: number;
  search?: string;
  cityId?: string;
  provinceId?: string;
  limit?: number;
  offset?: number;
  sortBy?: VillaSortBy;
}

export interface BedSizeInput {
  bedSize: string;
  quantity: number;
}

export interface VillaPlacesResult {
  places: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export class VillaService {
  /**
   * Transform villa images to use optimized thumbnailUrl
   * This overwrites the thumbnailUrl field with an optimized URL for VillaCard display
   */
  static transformVillaImages(villa: VillaWithRelations): VillaWithRelations {
    return {
      ...villa,
      images: villa.images.map((image) => ({
        ...image,
        thumbnailUrl: imageService.getVillaCardThumbnailUrl(image.imageUrl),
      })),
    };
  }

  /**
   * Get dashboard statistics using SQL aggregations (optimized for performance)
   * Replaces the old approach of fetching all villas and calculating in JS
   */
  static async getDashboardStats(): Promise<{
    totalVillas: number;
    published: number;
    drafts: number;
    totalViews: number;
    avgPriceMin: number;
    avgPriceMax: number;
  }> {
    const [stats] = await db
      .select({
        totalVillas: sql<number>`COUNT(*)`,
        published: sql<number>`COUNT(*) FILTER (WHERE ${villaTable.status} = 'published')`,
        drafts: sql<number>`COUNT(*) FILTER (WHERE ${villaTable.status} = 'draft')`,
        totalViews: sql<number>`COALESCE(SUM(${villaTable.viewCount}), 0)`,
        avgPriceMin: sql<number>`COALESCE(AVG(${villaTable.priceMin}::numeric) FILTER (WHERE ${villaTable.status} = 'published'), 0)`,
        avgPriceMax: sql<number>`COALESCE(AVG(${villaTable.priceMax}::numeric) FILTER (WHERE ${villaTable.status} = 'published'), 0)`,
      })
      .from(villaTable);

    return {
      totalVillas: Number(stats.totalVillas) || 0,
      published: Number(stats.published) || 0,
      drafts: Number(stats.drafts) || 0,
      totalViews: Number(stats.totalViews) || 0,
      avgPriceMin: Math.round(Number(stats.avgPriceMin) || 0),
      avgPriceMax: Math.round(Number(stats.avgPriceMax) || 0),
    };
  }

  /**
   * Get recent villas with only the first image (lightweight query for dashboard)
   * Avoids N+1 problem by batching image queries
   */
  static async getRecentVillasLite(
    limit: number = 5,
  ): Promise<
    Array<{
      id: number;
      title: string;
      slug: string;
      status: string;
      priceMin: string;
      priceMax: string;
      bedrooms: number;
      viewCount: number;
      createdAt: Date;
      firstImage: { imageUrl: string; thumbnailUrl: string | null } | null;
    }>
  > {
    const villas = await db
      .select()
      .from(villaTable)
      .orderBy(desc(villaTable.createdAt))
      .limit(limit);

    const villaIds = villas.map((v) => v.id);
    const images =
      villaIds.length > 0
        ? await db
            .select()
            .from(villaImage)
            .where(
              sql`${villaImage.villaId} IN (${sql.join(villaIds.map((id) => sql`${id}`), sql`, `)})`,
            )
            .orderBy(asc(villaImage.orderIndex))
        : [];

    // Keep only the first image (lowest order index) per villa.
    const imageMap = new Map<number, (typeof images)[number]>();
    for (const img of images) {
      if (!imageMap.has(img.villaId)) imageMap.set(img.villaId, img);
    }

    return villas.map((v) => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      status: v.status,
      priceMin: v.priceMin,
      priceMax: v.priceMax,
      bedrooms: v.bedroomMax,
      viewCount: v.viewCount,
      createdAt: v.createdAt,
      firstImage: imageMap.get(v.id)
        ? {
            imageUrl: imageMap.get(v.id)!.imageUrl,
            thumbnailUrl: imageMap.get(v.id)!.thumbnailUrl,
          }
        : null,
    }));
  }

  static async create(input: CreateVillaInput): Promise<Villa> {
    const [newVilla] = await db
      .insert(villaTable)
      .values({
        ...input,
        updatedAt: new Date(),
      })
      .returning();

    // Add to search index if published
    if (newVilla.status === "published") {
      await this.addToSearchIndex(newVilla.id);
    }

    // Invalidate "Other Villas" cache for this city
    if (newVilla.cityId) {
      await OtherVillasService.invalidateCacheForCity(newVilla.cityId);
    }

    return newVilla;
  }

  static async update(
    id: number,
    input: Partial<CreateVillaInput>,
  ): Promise<Villa> {
    // Get old villa data to check if city changed
    const [oldVilla] = await db
      .select({ cityId: villaTable.cityId })
      .from(villaTable)
      .where(eq(villaTable.id, id));

    const [updatedVilla] = await db
      .update(villaTable)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(villaTable.id, id))
      .returning();

    // Update search index - handles adding, updating, or removing based on status
    await this.updateSearchIndex(id);

    // Invalidate "Other Villas" cache for affected cities
    if (updatedVilla.cityId) {
      await OtherVillasService.invalidateCacheForCity(updatedVilla.cityId);
    }
    // Also invalidate old city if it changed
    if (oldVilla?.cityId && oldVilla.cityId !== updatedVilla.cityId) {
      await OtherVillasService.invalidateCacheForCity(oldVilla.cityId);
    }

    return updatedVilla;
  }

  static async delete(id: number): Promise<boolean> {
    // Get villa's city before deleting (for cache invalidation)
    const [villa] = await db
      .select({ cityId: villaTable.cityId })
      .from(villaTable)
      .where(eq(villaTable.id, id));

    // Remove from search index first
    await this.removeFromSearchIndex(id);

    const result = await db.delete(villaTable).where(eq(villaTable.id, id));

    // Invalidate "Other Villas" cache for this city
    // Note: The villa's own cache entry is auto-deleted via CASCADE
    if (villa?.cityId) {
      await OtherVillasService.invalidateCacheForCity(villa.cityId);
    }

    return true;
  }

  static async findById(id: number): Promise<VillaWithRelations | null> {
    const [result] = await db
      .select({
        villa: villaTable,
        province: province,
        city: city,
      })
      .from(villaTable)
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .where(eq(villaTable.id, id));

    if (!result) return null;

    const images = await db
      .select()
      .from(villaImage)
      .where(eq(villaImage.villaId, id))
      .orderBy(villaImage.orderIndex);

    const amenities = await db
      .select()
      .from(villaAmenity)
      .where(eq(villaAmenity.villaId, id));

    const videos = await db
      .select()
      .from(villaVideo)
      .where(eq(villaVideo.villaId, id))
      .orderBy(villaVideo.orderIndex);

    const bedSizes = await db
      .select()
      .from(villaBedSize)
      .where(eq(villaBedSize.villaId, id))
      .orderBy(villaBedSize.orderIndex);

    let nearbyPlaces: VillaNearbyPlace[] = [];
    try {
      nearbyPlaces = await db
        .select()
        .from(villaNearbyPlace)
        .where(eq(villaNearbyPlace.villaId, id))
        .orderBy(villaNearbyPlace.orderIndex);
    } catch (error) {
      console.warn(
        "Could not fetch nearby places (table may not exist yet):",
        error,
      );
      nearbyPlaces = [];
    }

    return this.transformVillaImages({
      ...result.villa,
      images,
      amenities,
      videos,
      bedSizes,
      nearbyPlaces,
      province: result.province,
      city: result.city,
    });
  }

  static async findBySlug(slug: string): Promise<VillaWithRelations | null> {
    const [result] = await db
      .select({
        villa: villaTable,
        province: province,
        city: city,
      })
      .from(villaTable)
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .where(eq(villaTable.slug, slug));

    if (!result) return null;

    const images = await db
      .select()
      .from(villaImage)
      .where(eq(villaImage.villaId, result.villa.id))
      .orderBy(villaImage.orderIndex);

    const amenities = await db
      .select()
      .from(villaAmenity)
      .where(eq(villaAmenity.villaId, result.villa.id));

    const videos = await db
      .select()
      .from(villaVideo)
      .where(eq(villaVideo.villaId, result.villa.id))
      .orderBy(villaVideo.orderIndex);

    const bedSizes = await db
      .select()
      .from(villaBedSize)
      .where(eq(villaBedSize.villaId, result.villa.id))
      .orderBy(villaBedSize.orderIndex);

    let nearbyPlaces: VillaNearbyPlace[] = [];
    try {
      nearbyPlaces = await db
        .select()
        .from(villaNearbyPlace)
        .where(eq(villaNearbyPlace.villaId, result.villa.id))
        .orderBy(villaNearbyPlace.orderIndex);
    } catch (error) {
      console.warn(
        "Could not fetch nearby places (table may not exist yet):",
        error,
      );
      nearbyPlaces = [];
    }

    await db
      .update(villaTable)
      .set({ viewCount: sql`${villaTable.viewCount} + 1` })
      .where(eq(villaTable.id, result.villa.id));

    return this.transformVillaImages({
      ...result.villa,
      images,
      amenities,
      videos,
      bedSizes,
      nearbyPlaces,
      province: result.province,
      city: result.city,
    });
  }

  /**
   * Find multiple villas by their IDs
   * Returns villas in the same order as the input IDs
   * Only returns published villas
   */
  static async findByIds(ids: number[]): Promise<VillaWithRelations[]> {
    if (ids.length === 0) return [];

    // Query all villas matching the IDs (only published)
    const results = await db
      .select({
        villa: villaTable,
        province: province,
        city: city,
      })
      .from(villaTable)
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .leftJoin(city, eq(villaTable.cityId, city.id))
      .where(
        and(
          sql`${villaTable.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
          eq(villaTable.status, "published")
        )
      );

    if (results.length === 0) return [];

    const villaIds = results.map((r) => r.villa.id);

    // Batch fetch related data
    const [images, amenities, videos, bedSizes] = await Promise.all([
      db
        .select()
        .from(villaImage)
        .where(sql`${villaImage.villaId} IN (${sql.join(villaIds.map((id) => sql`${id}`), sql`, `)})`)
        .orderBy(villaImage.orderIndex),
      db
        .select()
        .from(villaAmenity)
        .where(sql`${villaAmenity.villaId} IN (${sql.join(villaIds.map((id) => sql`${id}`), sql`, `)})`),
      db
        .select()
        .from(villaVideo)
        .where(sql`${villaVideo.villaId} IN (${sql.join(villaIds.map((id) => sql`${id}`), sql`, `)})`)
        .orderBy(villaVideo.orderIndex),
      db
        .select()
        .from(villaBedSize)
        .where(sql`${villaBedSize.villaId} IN (${sql.join(villaIds.map((id) => sql`${id}`), sql`, `)})`)
        .orderBy(villaBedSize.orderIndex),
    ]);

    // Group related data by villa ID
    const imagesMap = new Map<number, VillaImage[]>();
    const amenitiesMap = new Map<number, VillaAmenity[]>();
    const videosMap = new Map<number, VillaVideo[]>();
    const bedSizesMap = new Map<number, VillaBedSize[]>();

    images.forEach((img) => {
      if (!imagesMap.has(img.villaId)) imagesMap.set(img.villaId, []);
      imagesMap.get(img.villaId)!.push(img);
    });
    amenities.forEach((a) => {
      if (!amenitiesMap.has(a.villaId)) amenitiesMap.set(a.villaId, []);
      amenitiesMap.get(a.villaId)!.push(a);
    });
    videos.forEach((v) => {
      if (!videosMap.has(v.villaId)) videosMap.set(v.villaId, []);
      videosMap.get(v.villaId)!.push(v);
    });
    bedSizes.forEach((b) => {
      if (!bedSizesMap.has(b.villaId)) bedSizesMap.set(b.villaId, []);
      bedSizesMap.get(b.villaId)!.push(b);
    });

    // Build villa objects map
    const villasMap = new Map<number, VillaWithRelations>();
    results.forEach((result) => {
      villasMap.set(result.villa.id, {
        ...result.villa,
        images: imagesMap.get(result.villa.id) || [],
        amenities: amenitiesMap.get(result.villa.id) || [],
        videos: videosMap.get(result.villa.id) || [],
        bedSizes: bedSizesMap.get(result.villa.id) || [],
        nearbyPlaces: [],
        province: result.province,
        city: result.city,
      });
    });

    // Return in the same order as input IDs, filtering out any not found
    return ids
      .map((id) => villasMap.get(id))
      .filter((villa): villa is VillaWithRelations => villa !== undefined)
      .map((villa) => this.transformVillaImages(villa));
  }

  static async countVillas(filters: VillaFilters = {}): Promise<number> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(villaTable.status, filters.status));
    }
    if (filters.priceMin) {
      conditions.push(gte(villaTable.priceMax, filters.priceMin.toString()));
    }
    if (filters.priceMax) {
      conditions.push(lte(villaTable.priceMin, filters.priceMax.toString()));
    }
    if (filters.bedroomMin) {
      conditions.push(gte(villaTable.bedroomMax, filters.bedroomMin));
    }
    if (filters.bedroomMax) {
      conditions.push(lte(villaTable.bedroomMin, filters.bedroomMax));
    }
    if (filters.search) {
      conditions.push(ilike(villaTable.title, `%${filters.search}%`));
    }
    if (filters.cityId) {
      conditions.push(eq(villaTable.cityId, filters.cityId));
    }
    if (filters.provinceId) {
      conditions.push(eq(villaTable.provinceId, filters.provinceId));
    }

    const query = db
      .select({ count: sql<number>`count(*)` })
      .from(villaTable);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const result = await query;
    return Number(result[0].count);
  }

  static async findAll(
    filters: VillaFilters = {},
  ): Promise<VillaWithRelations[]> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(villaTable.status, filters.status));
    }
    if (filters.priceMin) {
      conditions.push(gte(villaTable.priceMax, filters.priceMin.toString()));
    }
    if (filters.priceMax) {
      conditions.push(lte(villaTable.priceMin, filters.priceMax.toString()));
    }
    if (filters.bedroomMin) {
      conditions.push(gte(villaTable.bedroomMax, filters.bedroomMin));
    }
    if (filters.bedroomMax) {
      conditions.push(lte(villaTable.bedroomMin, filters.bedroomMax));
    }
    if (filters.search) {
      conditions.push(ilike(villaTable.title, `%${filters.search}%`));
    }
    if (filters.cityId) {
      conditions.push(eq(villaTable.cityId, filters.cityId));
    }
    if (filters.provinceId) {
      conditions.push(eq(villaTable.provinceId, filters.provinceId));
    }

    const query = db
      .select({
        villa: villaTable,
        province: province,
        city: city,
      })
      .from(villaTable)
      .leftJoin(province, eq(villaTable.provinceId, province.id))
      .leftJoin(city, eq(villaTable.cityId, city.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Dynamic ordering based on sortBy parameter
    const sortBy = filters.sortBy || "newest";
    if (sortBy === "newest") {
      query.orderBy(desc(villaTable.createdAt));
    } else if (sortBy === "oldest") {
      query.orderBy(asc(villaTable.createdAt));
    } else if (sortBy === "most_viewed") {
      query.orderBy(sql`${villaTable.viewCount} DESC NULLS LAST`);
    } else if (sortBy === "title_asc") {
      query.orderBy(asc(villaTable.title));
    } else if (sortBy === "title_desc") {
      query.orderBy(desc(villaTable.title));
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }
    if (filters.offset) {
      query.offset(filters.offset);
    }

    const results = await query;

    const villas = await Promise.all(
      results.map(async (result) => {
        const images = await db
          .select()
          .from(villaImage)
          .where(eq(villaImage.villaId, result.villa.id))
          .orderBy(villaImage.orderIndex);

        const amenities = await db
          .select()
          .from(villaAmenity)
          .where(eq(villaAmenity.villaId, result.villa.id));

        const videos = await db
          .select()
          .from(villaVideo)
          .where(eq(villaVideo.villaId, result.villa.id))
          .orderBy(villaVideo.orderIndex);

        const bedSizes = await db
          .select()
          .from(villaBedSize)
          .where(eq(villaBedSize.villaId, result.villa.id))
          .orderBy(villaBedSize.orderIndex);

        let nearbyPlaces: VillaNearbyPlace[] = [];
        try {
          nearbyPlaces = await db
            .select()
            .from(villaNearbyPlace)
            .where(eq(villaNearbyPlace.villaId, result.villa.id))
            .orderBy(villaNearbyPlace.orderIndex);
        } catch (error) {
          console.warn(
            "Could not fetch nearby places (table may not exist yet):",
            error,
          );
          nearbyPlaces = [];
        }

        return this.transformVillaImages({
          ...result.villa,
          images,
          amenities,
          videos,
          bedSizes,
          nearbyPlaces,
          province: result.province,
          city: result.city,
        });
      }),
    );

    return villas;
  }

  static async getLastUpdate(villaId: number, name: string) {
    const [record] = await db
      .select()
      .from(villaLastUpdate)
      .where(
        and(
          eq(villaLastUpdate.villaId, villaId),
          eq(villaLastUpdate.name, name),
        ),
      );
    return record;
  }

  static async recordLastUpdate(
    villaId: number,
    name: string,
    updatedBy: string,
  ) {
    const [rv] = await db
      .update(villaLastUpdate)
      .set({
        lastUpdatedAt: new Date(),
        name,
        updatedBy,
      })
      .where(eq(villaLastUpdate.villaId, villaId))
      .returning();
    // console.log("recordLastUpdate rv:", rv);
    if (rv) {
      return rv;
    }
    const [newRecord] = await db
      .insert(villaLastUpdate)
      .values({
        villaId,
        lastUpdatedAt: new Date(),
        name,
        updatedBy,
        lastValue: "",
      })
      .returning();
    return newRecord;
  }

  static async updateGoogleMapsRating(
    villaId: number,
    rating: number,
    userRatingsTotal: number,
    updatedBy: string,
  ) {
    const [rv] = await db
      .update(villaTable)
      .set({
        googleRating: rating.toFixed(2),
        googleRatingCount: userRatingsTotal,
        updatedSystemAt: new Date(),
      })
      .where(eq(villaTable.id, villaId))
      .returning();

    // console.log("[updateGoogleMapsRating] Update villa rv:", rv);

    if (rv) {
      const lastUpd = await this.recordLastUpdate(
        villaId,
        "google_maps_rating",
        updatedBy,
      );
      // if (lastUpd) {
      //   console.log("Recorded last update for Google Maps rating:", lastUpd);
      // }
    }
  }

  static async addImage(
    villaId: number,
    imageData: {
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
      orderIndex?: number;
    },
  ) {
    const [image] = await db
      .insert(villaImage)
      .values({
        villaId,
        ...imageData,
      })
      .returning();
    return image;
  }

  static async deleteImage(imageId: string) {
    await db.delete(villaImage).where(eq(villaImage.id, imageId));
  }

  static async updateImageOrder(villaId: number, imageIds: string[]) {
    const updates = imageIds.map((imageId, index) =>
      db
        .update(villaImage)
        .set({ orderIndex: index })
        .where(
          and(eq(villaImage.id, imageId), eq(villaImage.villaId, villaId)),
        ),
    );

    await Promise.all(updates);
  }

  static async updateImageAltText(imageId: string, altText: string) {
    const [image] = await db
      .update(villaImage)
      .set({ altText })
      .where(eq(villaImage.id, imageId))
      .returning();
    return image;
  }

  static async addAmenity(
    villaId: number,
    amenityData: {
      name: string;
      description?: string;
      category?: string;
      icon?: string;
      score?: number;
    },
  ) {
    const [amenity] = await db
      .insert(villaAmenity)
      .values({
        villaId,
        ...amenityData,
      })
      .returning();
    return amenity;
  }

  static async updateAmenity(
    amenityId: string,
    amenityData: {
      name?: string;
      description?: string;
      category?: string;
      icon?: string;
    },
  ) {
    const [amenity] = await db
      .update(villaAmenity)
      .set(amenityData)
      .where(eq(villaAmenity.id, amenityId))
      .returning();
    return amenity;
  }

  static async deleteAmenity(amenityId: string) {
    await db.delete(villaAmenity).where(eq(villaAmenity.id, amenityId));
  }

  static async addVideo(
    villaId: number,
    videoData: {
      videoUrl: string;
      thumbnailUrl?: string;
      altText?: string;
      orderIndex?: number;
      store?: string;
    },
  ) {
    const [video] = await db
      .insert(villaVideo)
      .values({
        villaId,
        ...videoData,
      })
      .returning();
    return video;
  }

  static async deleteVideo(videoId: string) {
    await db.delete(villaVideo).where(eq(villaVideo.id, videoId));
  }

  static async addBedSize(
    villaId: number,
    bedSizeData: { bedSize: string; quantity?: number; orderIndex?: number },
  ) {
    const [bedSize] = await db
      .insert(villaBedSize)
      .values({
        villaId,
        ...bedSizeData,
      })
      .returning();
    return bedSize;
  }

  static async deleteBedSize(bedSizeId: string) {
    await db.delete(villaBedSize).where(eq(villaBedSize.id, bedSizeId));
  }

  static async updateBedSizes(villaId: number, bedSizes: BedSizeInput[]) {
    // Delete existing bed sizes
    await db.delete(villaBedSize).where(eq(villaBedSize.villaId, villaId));

    // Insert new bed sizes
    if (bedSizes.length > 0) {
      const bedSizeEntries = bedSizes.map((bs, index) => ({
        villaId,
        bedSize: bs.bedSize,
        quantity: bs.quantity,
        orderIndex: index,
      }));
      await db.insert(villaBedSize).values(bedSizeEntries);
    }
  }

  static calculateFacilityScoreDetails(villa: VillaWithRelations): {
    params: FacilityScoreParams;
    sum: number;
    score: number;
  } {
    const params: FacilityScoreParams = {
      breakfast: villa.hasBreakfast ? 1 : 0,
      bathtub: villa.hasBathtub ? 1 : 0,
      ac: villa.hasAc ? 1 : 0,
      tv: villa.hasTv ? 1 : 0,
    };

    let equipmentComplimentary = 0;
    let welcomeComplimentary = 0;

    for (const amenity of villa.amenities) {
      if (amenity.category === "pool") {
        params.pool = amenity.score || 2;
      } else if (amenity.category === "scenery") {
        params.view = amenity.score || 1;
      } else if (amenity.category === "kitchen") {
        params.kitchen = amenity.score || 1;
      } else if (amenity.category === "gym") {
        params.gym = amenity.score || 1;
      } else if (amenity.category === "resto") {
        params.resto = amenity.score || 1;
      } else if (amenity.category === "parking") {
        params.parking = amenity.score || 1;
      } else if (amenity.category === "connectivity") {
        params.wifi = amenity.score || 1;
      } else if (amenity.category === "entertainment") {
        // params.entertainment = amenity.score || 1;
        params.entertainment = Math.max(
          Math.min((params.entertainment || 0) + (amenity.score || 0), 3),
          1,
        );
      } else if (amenity.category === "access") {
        params.access = Math.max(
          Math.min((params.access || 0) + (amenity.score || 0), 3),
          1,
        );
      } else if (amenity.category === "equipment-complimentary") {
        equipmentComplimentary = Math.min(
          equipmentComplimentary + (amenity.score || 0),
          3,
        );
      } else if (amenity.category === "welcome-complimentary") {
        // welcomeComplimentary += amenity.score || 0;
        welcomeComplimentary = Math.min(
          welcomeComplimentary + (amenity.score || 0),
          3,
        );
      } else if (amenity.category === "meeting-room") {
        params.meetingRoom = amenity.score || 0;
      } else if (amenity.category === "playground") {
        params.playground = amenity.score || 0;
      }
    }

    params.bedrooms = Math.min(2, villa.bedroomMax || 0);

    const sum = Object.values(params).reduce((acc, val) => acc + (val || 0), 0);
    const score = calcFacilityScore(params);

    return { params, sum, score };
  }

  static calculateFacilityScore(villa: VillaWithRelations): number {
    return this.calculateFacilityScoreDetails(villa).score;
  }

  static async updateVillaPlaceData(
    villaWithRelationOrId: VillaWithRelations | number,
  ) {
    let villa;
    if (typeof villaWithRelationOrId === "number") {
      villa = await this.findById(villaWithRelationOrId);
    } else {
      villa = villaWithRelationOrId;
    }

    if (!villa) {
      console.log("Villa not found for updateVillaPlaceData");
      return;
    }
    if (!villa.googlePlaceId) {
      return;
    }

    console.log("[updateVillaPlaceData] Starting update for villa:", villa.id);

    // get latest update in villaLastUpdate table

    const lastUpdate = await VillaService.getLastUpdate(
      villa.id,
      "google_maps_rating",
    );
    if (lastUpdate) {
      // check is last update is within 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (lastUpdate.lastUpdatedAt && lastUpdate.lastUpdatedAt > sevenDaysAgo) {
        console.log(
          "Google Maps rating recently updated (< 7 days), skipping update for villa:",
          villa.id,
        );
        return;
      }
    }
    console.log(
      "Proceeding to update Google Maps rating for villa:",
      villa.id,
      "with place ID:",
      villa.googlePlaceId,
    );

    console.log("Fetching Google Maps place info for villa:", villa.id);
    const placeInfo = await GoogleMapsService.getPlaceInfoByPlaceId(
      villa.googlePlaceId,
    );

    console.log("Fetched place info:", placeInfo);

    if (placeInfo && (placeInfo.rating || placeInfo.userRatingCount)) {
      await VillaService.updateGoogleMapsRating(
        villa.id,
        placeInfo.rating || 0,
        placeInfo.userRatingCount || 0,
        "system",
      );
      console.log(
        `Villa ${villa.id} Google Maps rating updated: ${placeInfo.rating} (${placeInfo.userRatingCount} reviews)`,
      );

      // now re-calculate score based on new rating
      this.recalculateVillaScore(villa.id);
    }
  }

  static async recalculateVillaScore(id: number) {
    const villa = await VillaService.findById(id);

    if (!villa) {
      console.log("Villa not found for score recalculation:", id);
      return;
    }

    if (
      !villa.googleRating ||
      !villa.googleRatingCount ||
      villa.googleRatingCount === 0
    ) {
      return;
    }

    const priceMin = parseFloat(villa.priceMin);
    const priceMax = parseFloat(villa.priceMax);

    if (!priceMin || !priceMax) {
      return;
    }

    if (priceMin <= 0 || priceMax <= 0 || priceMin > priceMax) {
      return;
    }
    console.log("Recalculating villa score for villa:", id);

    const F = VillaService.calculateFacilityScore(villa);
    const rating = parseFloat(villa.googleRating);
    const ratingCount = villa.googleRatingCount;

    const P = (priceMin + priceMax) / 2;

    const pvr = calcPVR(F, rating, ratingCount, P);

    console.log(`Calculated PVR for villa ${id}: ${pvr.toFixed(2)}`);

    // update pvr in villa table
    await db
      .update(villaTable)
      .set({ pvr: pvr.toFixed(2) })
      .where(eq(villaTable.id, id));

    return pvr;
  }

  static async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select()
        .from(villaTable)
        .where(eq(villaTable.slug, slug));
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Nearby Places CRUD operations
  static async addNearbyPlace(
    villaId: number,
    nearbyPlaceData: {
      name: string;
      description?: string;
      distanceKm: string;
      accessType: string;
      placeType?: string;
      orderIndex?: number;
    },
  ) {
    const [nearbyPlace] = await db
      .insert(villaNearbyPlace)
      .values({
        villaId,
        ...nearbyPlaceData,
      })
      .returning();
    return nearbyPlace;
  }

  static async updateNearbyPlace(
    nearbyPlaceId: string,
    nearbyPlaceData: {
      name?: string;
      description?: string;
      distanceKm?: string;
      accessType?: string;
      placeType?: string;
      orderIndex?: number;
    },
  ) {
    const [nearbyPlace] = await db
      .update(villaNearbyPlace)
      .set({
        ...nearbyPlaceData,
        updatedAt: new Date(),
      })
      .where(eq(villaNearbyPlace.id, nearbyPlaceId))
      .returning();
    return nearbyPlace;
  }

  static async deleteNearbyPlace(nearbyPlaceId: string) {
    await db
      .delete(villaNearbyPlace)
      .where(eq(villaNearbyPlace.id, nearbyPlaceId));
  }

  static async updateNearbyPlacesOrder(
    villaId: number,
    nearbyPlaceIds: string[],
  ) {
    const updates = nearbyPlaceIds.map((nearbyPlaceId, index) =>
      db
        .update(villaNearbyPlace)
        .set({ orderIndex: index })
        .where(
          and(
            eq(villaNearbyPlace.id, nearbyPlaceId),
            eq(villaNearbyPlace.villaId, villaId),
          ),
        ),
    );

    await Promise.all(updates);
  }

  static async updateNearbyPlaces(
    villaId: number,
    nearbyPlacesData: Array<{
      name: string;
      description?: string;
      distanceKm: string;
      accessType: string;
      placeType?: string;
    }>,
  ) {
    // Delete existing nearby places
    await db
      .delete(villaNearbyPlace)
      .where(eq(villaNearbyPlace.villaId, villaId));

    // Insert new nearby places
    if (nearbyPlacesData.length > 0) {
      const nearbyPlaceEntries = nearbyPlacesData.map((np, index) => ({
        villaId,
        name: np.name,
        description: np.description,
        distanceKm: np.distanceKm,
        accessType: np.accessType,
        placeType: np.placeType,
        orderIndex: index,
      }));
      await db.insert(villaNearbyPlace).values(nearbyPlaceEntries);
    }
  }

  // NEW PLACE STRUCTURE METHODS
  static async getVillaPlaces(
    villaId: number,
    options: { page?: number; limit?: number } = {},
  ): Promise<VillaPlacesResult> {
    try {
      // Import the new place-related tables
      const { place, villaPlace } = await import("$lib/server/db/schema");
      const { placeService } = await import(
        "$lib/server/services/place.service"
      );

      const results = await placeService.getVillaPlaces(villaId, options);
      // console.log(
      //   `Found ${results.places.length} villa places for villa ${villaId} using new structure (page ${results.pagination.page})`,
      // );
      return results;
    } catch (error) {
      // Fallback to old structure if new structure doesn't exist yet or has no data
      console.warn(
        "New place structure not available, falling back to old structure:",
        error,
      );

      try {
        // Try to get old nearby places structure as fallback
        const villa = await this.findById(villaId);
        if (villa?.nearbyPlaces && villa.nearbyPlaces.length > 0) {
          console.log(
            `Found ${villa.nearbyPlaces.length} legacy nearby places for villa ${villaId}`,
          );
          return villa.nearbyPlaces;
        }
      } catch (fallbackError) {
        console.error("Error accessing legacy nearby places:", fallbackError);
      }

      console.log(`No places found for villa ${villaId} in either structure`);
      return [];
    }
  }

  // Search Index Management Methods
  static async addToSearchIndex(villaId: number): Promise<void> {
    try {
      // Get villa with all relations
      const villa = await this.findById(villaId);
      if (!villa || villa.status !== "published") {
        return; // Don't add draft villas to search index
      }

      // Build comprehensive search text
      const parts = [villa.title, villa.address, ...(villa.keywords || [])];

      // Add city and province info if available
      if (villa.city) {
        parts.push(villa.city.name);
      }
      if (villa.province) {
        parts.push(villa.province.name);
      }

      console.log("Building search index text parts:", parts);

      const searchText = parts.filter(Boolean).join(" ");

      // Check if entry already exists
      const existing = await db
        .select()
        .from(searchIndex)
        .where(eq(searchIndex.villaId, villaId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing entry
        await db
          .update(searchIndex)
          .set({
            text: searchText,
            cityId: villa.cityId,
            slug: villa.slug,
            updatedAt: new Date(),
          })
          .where(eq(searchIndex.villaId, villaId));
      } else {
        // Insert new entry
        await db.insert(searchIndex).values({
          idxType: "villa",
          villaId: villaId,
          cityId: villa.cityId,
          slug: villa.slug,
          text: searchText,
        });
      }
    } catch (error) {
      console.error(`Error adding villa ${villaId} to search index:`, error);
      // Don't throw - search index update failure shouldn't break villa operations
    }
  }

  static async updateSearchIndex(villaId: number): Promise<void> {
    console.log(`Updating search index for villa ${villaId}`);
    try {
      // Get villa with all relations
      const villa = await this.findById(villaId);
      if (!villa) {
        // Villa deleted or doesn't exist - remove from index
        await this.removeFromSearchIndex(villaId);
        return;
      }

      if (villa.status !== "published") {
        // Villa is draft - remove from index
        await this.removeFromSearchIndex(villaId);
        return;
      }

      // Villa is published - update or add to index
      await this.addToSearchIndex(villaId);
    } catch (error) {
      console.error(`Error updating search index for villa ${villaId}:`, error);
      // Don't throw - search index update failure shouldn't break villa operations
    }
  }

  static async removeFromSearchIndex(villaId: number): Promise<void> {
    try {
      await db.delete(searchIndex).where(eq(searchIndex.villaId, villaId));
    } catch (error) {
      console.error(
        `Error removing villa ${villaId} from search index:`,
        error,
      );
      // Don't throw - search index update failure shouldn't break villa operations
    }
  }

  /**
   * Track a WhatsApp button click and increment the counter
   */
  static async trackWhatsAppClick(
    villaId: number,
    userId: number | null = null,
    userIp?: string,
    userAgent?: string,
    referer?: string
  ): Promise<void> {
    try {
      // Insert detailed click event
      await db.insert(villaButtonClick).values({
        villaId,
        userId,
        buttonType: "whatsapp_contact",
        userIp,
        userAgent,
        referer,
        clickedAt: new Date(),
      });

      // Increment the WhatsApp counter in the villa table
      await db
        .update(villaTable)
        .set({
          whatsappClicks: sql`${villaTable.whatsappClicks} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(villaTable.id, villaId));

    } catch (error) {
      console.error(`Error tracking WhatsApp click for villa ${villaId}:`, error);
      // Don't throw - analytics tracking failure shouldn't break user functionality
    }
  }

  /**
   * Get WhatsApp click analytics for a villa
   */
  static async getWhatsAppAnalytics(villaId: number): Promise<{
    whatsappClicks: number;
    recentClicks: VillaButtonClick[];
  }> {
    try {
      // Get current counter from villa table
      const [villa] = await db
        .select({
          whatsappClicks: villaTable.whatsappClicks,
        })
        .from(villaTable)
        .where(eq(villaTable.id, villaId));

      if (!villa) {
        throw new Error(`Villa with ID ${villaId} not found`);
      }

      // Get recent click events (last 50)
      const recentClicks = await db
        .select()
        .from(villaButtonClick)
        .where(eq(villaButtonClick.villaId, villaId))
        .orderBy(desc(villaButtonClick.clickedAt))
        .limit(50);

      return {
        whatsappClicks: villa.whatsappClicks || 0,
        recentClicks,
      };
    } catch (error) {
      console.error(`Error getting WhatsApp analytics for villa ${villaId}:`, error);
      // Return zeros if there's an error (e.g., columns don't exist yet)
      return {
        whatsappClicks: 0,
        recentClicks: [],
      };
    }
  }

  /**
   * Get overall WhatsApp click analytics (admin overview)
   */
  static async getOverallWhatsAppAnalytics(): Promise<{
    totalWhatsappClicks: number;
    topVillasByClicks: Array<{
      villaId: number;
      villaTitle: string;
      whatsappClicks: number;
    }>;
  }> {
    try {
      // Get overall totals
      const [totals] = await db
        .select({
          totalWhatsappClicks: sql<number>`SUM(${villaTable.whatsappClicks})`,
        })
        .from(villaTable)
        .where(eq(villaTable.status, "published"));

      const totalWhatsappClicks = Number(totals.totalWhatsappClicks) || 0;

      // Get top villas by WhatsApp clicks
      const topVillas = await db
        .select({
          villaId: villaTable.id,
          villaTitle: villaTable.title,
          whatsappClicks: villaTable.whatsappClicks,
        })
        .from(villaTable)
        .where(eq(villaTable.status, "published"))
        .orderBy(desc(villaTable.whatsappClicks))
        .limit(10);

      return {
        totalWhatsappClicks,
        topVillasByClicks: topVillas.map(villa => ({
          villaId: villa.villaId,
          villaTitle: villa.villaTitle,
          whatsappClicks: villa.whatsappClicks || 0,
        })),
      };
    } catch (error) {
      console.error("Error getting overall WhatsApp analytics:", error);
      // Return zeros if there's an error (e.g., columns don't exist yet)
      return {
        totalWhatsappClicks: 0,
        topVillasByClicks: [],
      };
    }
  }
}
