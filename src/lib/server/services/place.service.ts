import { db } from "$lib/server/db";
import {
  place,
  placeImage,
  villaPlace,
  villa,
  city,
  province,
  villaImage,
} from "$lib/server/db/schema";
import { eq, and, or, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import type {
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceSearchParams,
  PlaceSearchResult,
  PlaceWithRelations,
  PlaceWithVillas,
  VillaPlaceInput,
} from "$lib/types/place";
import { generateSlug } from "$lib/utils/slug";

export class PlaceService {
  async create(input: CreatePlaceInput) {
    const slug = input.slug || generateSlug(input.name);

    const [newPlace] = await db
      .insert(place)
      .values({
        ...input,
        slug,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
      })
      .returning();

    return newPlace;
  }

  async update(id: string, input: UpdatePlaceInput) {
    const updateData: any = { ...input };

    if (input.latitude) {
      updateData.latitude = input.latitude.toString();
    }
    if (input.longitude) {
      updateData.longitude = input.longitude.toString();
    }

    delete updateData.id;

    const [updatedPlace] = await db
      .update(place)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(place.id, id))
      .returning();

    return updatedPlace;
  }

  async delete(id: string) {
    await db.delete(place).where(eq(place.id, id));
  }

  async findById(id: string): Promise<PlaceWithRelations | null> {
    const result = await db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .where(eq(place.id, id))
      .limit(1);

    if (!result[0]) return null;

    const {
      place: placeData,
      city: cityData,
      province: provinceData,
    } = result[0];

    return {
      ...placeData,
      city: cityData || undefined,
      province: provinceData || undefined,
    };
  }

  async getBySlug(slug: string): Promise<PlaceWithRelations | null> {
    const result = await db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .where(eq(place.slug, slug))
      .limit(1);

    if (!result[0]) return null;

    const {
      place: placeData,
      city: cityData,
      province: provinceData,
    } = result[0];

    return {
      ...placeData,
      city: cityData || undefined,
      province: provinceData || undefined,
    };
  }

  async findBySlug(slug: string): Promise<PlaceWithVillas | null> {
    const placeResult = await db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .where(eq(place.slug, slug))
      .limit(1);

    if (!placeResult[0]) return null;

    const {
      place: placeData,
      city: cityData,
      province: provinceData,
    } = placeResult[0];

    // Get nearby villas
    const villaResults = await db
      .select({
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
          priceMin: villa.priceMin,
          priceMax: villa.priceMax,
          bedroomMin: villa.bedroomMin,
          bedroomMax: villa.bedroomMax,
          googleRating: villa.googleRating,
          googleRatingCount: villa.googleRatingCount,
          pvr: villa.pvr,
          address: villa.address,
          status: villa.status,
          createdAt: villa.createdAt,
          provinceId: villa.provinceId,
          cityId: villa.cityId,
          unitsCount: villa.unitsCount,
          personCapacityMin: villa.personCapacityMin,
          personCapacityMax: villa.personCapacityMax,
          hasPool: villa.hasPool,
          hasBathtub: villa.hasBathtub,
          hasAc: villa.hasAc,
          hasTv: villa.hasTv,
          hasBreakfast: villa.hasBreakfast,
          phoneNumber: villa.phoneNumber,
          isPetFriendly: villa.isPetFriendly,
          isKidFriendly: villa.isKidFriendly,
          isSeniorFriendly: villa.isSeniorFriendly,
          isSyaria: villa.isSyaria,
        },
        villaPlace: {
          distanceKm: villaPlace.distanceKm,
          accessType: villaPlace.accessType,
          travelTimeMinutes: villaPlace.travelTimeMinutes,
        },
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(villaPlace)
      .innerJoin(villa, eq(villaPlace.villaId, villa.id))
      .leftJoin(city, eq(villa.cityId, city.id))
      .leftJoin(province, eq(villa.provinceId, province.id))
      .where(
        and(
          eq(villaPlace.placeId, placeData.id),
          eq(villa.status, "published"),
        ),
      )
      .orderBy(asc(villaPlace.distanceKm))
      .limit(20);

    // Get ALL images for villas (sorted by order_index)
    const villaImages = await db
      .select({
        villaId: villaImage.villaId,
        imageUrl: villaImage.imageUrl,
        thumbnailUrl: villaImage.thumbnailUrl,
        altText: villaImage.altText,
        orderIndex: villaImage.orderIndex,
      })
      .from(villaImage)
      .where(
        inArray(
          villaImage.villaId,
          villaResults.map((v) => v.villa.id),
        ),
      )
      .orderBy(asc(villaImage.orderIndex));

    // Group images by villa ID
    const imageMap = new Map<number, typeof villaImages>();
    villaImages.forEach((img) => {
      const villaId = img.villaId;
      if (!imageMap.has(villaId)) {
        imageMap.set(villaId, []);
      }
      imageMap.get(villaId)!.push(img);
    });

    const villas = villaResults.map(
      ({
        villa: v,
        villaPlace: vp,
        city: cityData,
        province: provinceData,
      }) => {
        const images = imageMap.get(v.id) || [];
        const mainImage = images.length > 0 ? images[0].imageUrl : undefined;

        return {
          ...v,
          mainImage,
          images, // Now includes ALL images for the villa
          distanceKm: vp.distanceKm,
          accessType: vp.accessType,
          travelTimeMinutes: vp.travelTimeMinutes,
          city: cityData || undefined,
          province: provinceData || undefined,
        };
      },
    );

    // Get place images
    const placeImages = await db
      .select()
      .from(placeImage)
      .where(eq(placeImage.placeId, placeData.id))
      .orderBy(asc(placeImage.orderIndex), asc(placeImage.createdAt));

    // Increment view count
    await db
      .update(place)
      .set({ viewCount: sql`${place.viewCount} + 1` })
      .where(eq(place.id, placeData.id));

    return {
      ...placeData,
      city: cityData || undefined,
      province: provinceData || undefined,
      villas,
      images: placeImages,
    };
  }

  async search(params: PlaceSearchParams): Promise<PlaceWithRelations[]> {
    const conditions = [];

    if (params.query) {
      conditions.push(
        or(
          ilike(place.name, `%${params.query}%`),
          ilike(place.description, `%${params.query}%`),
        ),
      );
    }

    if (params.type) {
      conditions.push(eq(place.type, params.type));
    }

    if (params.category) {
      conditions.push(eq(place.category, params.category));
    }

    // Support both single city and multiple cities
    if (params.cityId) {
      conditions.push(eq(place.cityId, params.cityId));
    } else if (params.cityIds && params.cityIds.length > 0) {
      conditions.push(inArray(place.cityId, params.cityIds));
    }

    if (params.provinceId) {
      conditions.push(eq(place.provinceId, params.provinceId));
    }

    // Always filter by published status
    conditions.push(eq(place.status, "published"));

    let query = db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add location-based filtering if coordinates and radius provided
    if (params.latitude && params.longitude && params.radius) {
      const distanceFormula = sql`
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(${params.latitude})) *
            cos(radians(${place.latitude}::numeric)) *
            cos(radians(${place.longitude}::numeric) - radians(${params.longitude})) +
            sin(radians(${params.latitude})) *
            sin(radians(${place.latitude}::numeric))
          ))
        )
      `;

      query = query.having(sql`${distanceFormula} <= ${params.radius}`);
    }

    // Apply sorting
    switch (params.sortBy) {
      case "name":
        query = query.orderBy(asc(place.name));
        break;
      case "rating":
        query = query.orderBy(desc(place.googleRating));
        break;
      case "popular":
        query = query.orderBy(desc(place.viewCount));
        break;
      default:
        query = query.orderBy(desc(place.createdAt));
        break;
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.offset(params.offset);
    }

    const results = await query;

    return results.map(
      ({ place: placeData, city: cityData, province: provinceData }) => ({
        ...placeData,
        city: cityData || undefined,
        province: provinceData || undefined,
      }),
    );
  }

  /**
   * Search places by area (supports both mapped cities and individual cities)
   */
  async searchByArea(
    areaSlug: string,
    params: Omit<PlaceSearchParams, "cityId" | "cityIds">,
  ): Promise<PlaceWithRelations[]> {
    const { getCityMapping } = await import("$lib/utils/city-mapping");
    const mapping = getCityMapping(areaSlug);

    if (mapping) {
      // Multi-city search using mapping
      return this.search({
        ...params,
        cityIds: mapping.cityIds,
      });
    } else {
      // Single city search - need to find city by name
      const cityName = areaSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Find city by name (this is a simplified approach)
      // In a real scenario, you might want to add a proper city lookup by name
      const cityResult = await db
        .select({
          city: {
            id: city.id,
            name: city.name,
          },
        })
        .from(city)
        .where(ilike(city.name, `%${cityName}%`))
        .limit(1);

      if (cityResult.length > 0) {
        return this.search({
          ...params,
          cityId: cityResult[0].city.id,
        });
      }

      return [];
    }
  }

  /**
   * Get places count for an area
   */
  async getAreaPlacesCount(areaSlug: string): Promise<number> {
    const { getCityMapping } = await import("$lib/utils/city-mapping");
    const mapping = getCityMapping(areaSlug);

    const conditions = [eq(place.status, "published")];

    if (mapping) {
      conditions.push(inArray(place.cityId, mapping.cityIds));
    } else {
      // Single city search
      const cityName = areaSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const cityResult = await db
        .select({ id: city.id })
        .from(city)
        .where(ilike(city.name, `%${cityName}%`))
        .limit(1);

      if (cityResult.length > 0) {
        conditions.push(eq(place.cityId, cityResult[0].id));
      } else {
        return 0;
      }
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(place)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async adminSearch(params: PlaceSearchParams): Promise<PlaceWithRelations[]> {
    const conditions = [];

    if (params.query) {
      conditions.push(
        or(
          ilike(place.name, `%${params.query}%`),
          ilike(place.description, `%${params.query}%`),
        ),
      );
    }

    if (params.type) {
      conditions.push(eq(place.type, params.type));
    }

    if (params.category) {
      conditions.push(eq(place.category, params.category));
    }

    if (params.cityId) {
      conditions.push(eq(place.cityId, params.cityId));
    }

    if (params.provinceId) {
      conditions.push(eq(place.provinceId, params.provinceId));
    }

    // Add status filter if specified
    if (params.status) {
      conditions.push(eq(place.status, params.status));
    }

    let query = db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Admin places sorted by creation time descending (latest first)
    query = query.orderBy(desc(place.createdAt));

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.offset(params.offset);
    }

    const results = await query;

    return results.map(
      ({ place: placeData, city: cityData, province: provinceData }) => ({
        ...placeData,
        city: cityData || undefined,
        province: provinceData || undefined,
      }),
    );
  }

  async adminSearchWithCount(
    params: PlaceSearchParams,
  ): Promise<PlaceSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Build conditions for both count and data queries
    const conditions = [];

    if (params.query) {
      conditions.push(
        or(
          ilike(place.name, `%${params.query}%`),
          ilike(place.description, `%${params.query}%`),
        ),
      );
    }

    if (params.type) {
      conditions.push(eq(place.type, params.type));
    }

    if (params.category) {
      conditions.push(eq(place.category, params.category));
    }

    if (params.cityId) {
      conditions.push(eq(place.cityId, params.cityId));
    }

    if (params.provinceId) {
      conditions.push(eq(place.provinceId, params.provinceId));
    }

    // Add status filter if specified
    if (params.status) {
      conditions.push(eq(place.status, params.status));
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(place);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    // Get paginated data
    let dataQuery = db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id));

    if (conditions.length > 0) {
      dataQuery = dataQuery.where(and(...conditions));
    }

    // Add dynamic sorting based on sortBy parameter
    let orderBy = desc(place.createdAt); // default to newest

    switch (params.sortBy) {
      case "oldest":
        orderBy = asc(place.createdAt);
        break;
      case "popular":
        orderBy = desc(place.viewCount);
        break;
      case "rating":
        orderBy = desc(place.googleRating);
        break;
      case "alphabetical":
        orderBy = asc(place.name);
        break;
      case "newest":
      default:
        orderBy = desc(place.createdAt);
        break;
    }

    dataQuery = dataQuery.orderBy(orderBy).limit(limit).offset(offset);

    const results = await dataQuery;

    const places = results.map(
      ({ place: placeData, city: cityData, province: provinceData }) => ({
        ...placeData,
        city: cityData || undefined,
        province: provinceData || undefined,
      }),
    );

    return {
      places,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<Array<PlaceWithRelations & { distance: number }>> {
    const distanceFormula = sql<number>`
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${latitude})) *
          cos(radians(${place.latitude}::numeric)) *
          cos(radians(${place.longitude}::numeric) - radians(${longitude})) +
          sin(radians(${latitude})) *
          sin(radians(${place.latitude}::numeric))
        ))
      )
    `;

    const results = await db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
        distance: distanceFormula,
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .where(
        and(
          eq(place.status, "published"),
          sql`${distanceFormula} <= ${radiusKm}`,
        ),
      )
      .orderBy(asc(distanceFormula))
      .limit(limit);

    return results.map(
      ({
        place: placeData,
        city: cityData,
        province: provinceData,
        distance,
      }) => ({
        ...placeData,
        city: cityData || undefined,
        province: provinceData || undefined,
        distance: Math.round(distance * 100) / 100,
      }),
    );
  }

  async linkToVilla(input: VillaPlaceInput) {
    // Check if already linked
    const existing = await db
      .select()
      .from(villaPlace)
      .where(
        and(
          eq(villaPlace.villaId, input.villaId),
          eq(villaPlace.placeId, input.placeId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Place is already linked to this villa");
    }

    const [link] = await db
      .insert(villaPlace)
      .values({
        villaId: input.villaId,
        placeId: input.placeId,
        distanceKm: input.distanceKm.toString(),
        accessType: input.accessType,
        travelTimeMinutes: input.travelTimeMinutes,
        notes: input.notes,
        orderIndex: input.orderIndex || 0,
      })
      .returning();

    return link;
  }

  async linkMultipleToVilla(inputs: VillaPlaceInput[]) {
    if (!inputs || inputs.length === 0) {
      return { added: 0, skipped: 0, links: [] };
    }

    // Check for existing links
    const villaId = inputs[0].villaId;
    const placeIds = inputs.map((input) => input.placeId);

    const existingLinks = await db
      .select({ placeId: villaPlace.placeId })
      .from(villaPlace)
      .where(
        and(
          eq(villaPlace.villaId, villaId),
          inArray(villaPlace.placeId, placeIds),
        ),
      );

    const existingPlaceIds = new Set(existingLinks.map((link) => link.placeId));

    // Filter out already linked places
    const newInputs = inputs.filter(
      (input) => !existingPlaceIds.has(input.placeId),
    );

    if (newInputs.length === 0) {
      return {
        added: 0,
        skipped: inputs.length,
        links: [],
      };
    }

    // Insert new links
    const values = newInputs.map((input) => ({
      villaId: input.villaId,
      placeId: input.placeId,
      distanceKm: input.distanceKm.toString(),
      accessType: input.accessType,
      travelTimeMinutes: input.travelTimeMinutes,
      notes: input.notes,
      orderIndex: input.orderIndex || 0,
    }));

    const links = await db
      .insert(villaPlace)
      .values(values)
      .onConflictDoNothing()
      .returning();

    return {
      added: links.length,
      skipped: existingPlaceIds.size,
      links,
    };
  }

  async unlinkFromVilla(villaId: number, placeId: string) {
    await db
      .delete(villaPlace)
      .where(
        and(eq(villaPlace.villaId, villaId), eq(villaPlace.placeId, placeId)),
      );
  }

  async getVillaPlaces(
    villaId: number,
    options: { page?: number; limit?: number } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 5;
    const offset = (page - 1) * limit;

    // Get total count first
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(villaPlace)
      .innerJoin(place, eq(villaPlace.placeId, place.id))
      .where(
        and(eq(villaPlace.villaId, villaId), eq(place.status, "published")),
      );

    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select({
        place: place,
        link: villaPlace,
      })
      .from(villaPlace)
      .innerJoin(place, eq(villaPlace.placeId, place.id))
      .where(
        and(eq(villaPlace.villaId, villaId), eq(place.status, "published")),
      )
      .orderBy(asc(villaPlace.orderIndex), asc(villaPlace.distanceKm))
      .limit(limit)
      .offset(offset);

    // Fetch images for each place
    const placesWithImages = await Promise.all(
      results.map(async ({ place: placeData, link }) => {
        // Get the first image (prefer orderIndex = 0, fallback to any image)
        let images = await db
          .select()
          .from(placeImage)
          .where(
            and(
              eq(placeImage.placeId, placeData.id),
              eq(placeImage.orderIndex, 0),
            ),
          )
          .limit(1);

        // If no image with orderIndex = 0, get any image sorted by orderIndex
        if (images.length === 0) {
          images = await db
            .select()
            .from(placeImage)
            .where(eq(placeImage.placeId, placeData.id))
            .orderBy(asc(placeImage.orderIndex))
            .limit(1);
        }

        const firstImage = images[0];

        return {
          ...placeData,
          distanceKm: link.distanceKm,
          accessType: link.accessType,
          travelTimeMinutes: link.travelTimeMinutes || undefined,
          notes: link.notes,
          orderIndex: link.orderIndex,
          // Use thumbnail_url as the main image
          mainImage:
            firstImage?.thumbnailUrl ||
            firstImage?.imageUrl ||
            placeData.mainImage,
        };
      }),
    );

    return {
      places: placesWithImages,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getVillaPlacesForAdmin(
    villaId: number,
    options: { page?: number; limit?: number } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 100; // Default higher limit for admin
    const offset = (page - 1) * limit;

    // Get total count first - NO STATUS FILTER for admin
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(villaPlace)
      .innerJoin(place, eq(villaPlace.placeId, place.id))
      .where(eq(villaPlace.villaId, villaId));

    const total = totalResult[0]?.count || 0;

    // Get paginated results - NO STATUS FILTER for admin
    const results = await db
      .select({
        place: place,
        link: villaPlace,
      })
      .from(villaPlace)
      .innerJoin(place, eq(villaPlace.placeId, place.id))
      .where(eq(villaPlace.villaId, villaId))
      .orderBy(asc(villaPlace.orderIndex), asc(villaPlace.distanceKm))
      .limit(limit)
      .offset(offset);

    // Fetch images for each place
    const placesWithImages = await Promise.all(
      results.map(async ({ place: placeData, link }) => {
        // Get the first image (prefer orderIndex = 0, fallback to any image)
        let images = await db
          .select()
          .from(placeImage)
          .where(
            and(
              eq(placeImage.placeId, placeData.id),
              eq(placeImage.orderIndex, 0),
            ),
          )
          .limit(1);

        // If no image with orderIndex = 0, get any image sorted by orderIndex
        if (images.length === 0) {
          images = await db
            .select()
            .from(placeImage)
            .where(eq(placeImage.placeId, placeData.id))
            .orderBy(asc(placeImage.orderIndex))
            .limit(1);
        }

        const firstImage = images[0];

        return {
          ...placeData,
          distanceKm: link.distanceKm,
          accessType: link.accessType,
          travelTimeMinutes: link.travelTimeMinutes || undefined,
          notes: link.notes,
          orderIndex: link.orderIndex,
          // Use thumbnail_url as the main image
          mainImage:
            firstImage?.thumbnailUrl ||
            firstImage?.imageUrl ||
            placeData.mainImage,
        };
      }),
    );

    return {
      places: placesWithImages,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getPopularPlaces(limit: number = 10) {
    const results = await db
      .select({
        place: place,
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
        villaCount: sql<number>`count(distinct ${villaPlace.villaId})`,
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .leftJoin(villaPlace, eq(place.id, villaPlace.placeId))
      .where(and(eq(place.isActive, true), eq(place.status, "published")))
      .groupBy(place.id, city.id, province.id)
      .orderBy(desc(place.viewCount))
      .limit(limit);

    // Fetch images for all places
    const placeIds = results.map((r) => r.place.id);
    const imageMap = await this.getPlaceImages(placeIds);

    return results.map(
      ({
        place: placeData,
        city: cityData,
        province: provinceData,
        villaCount,
      }) => ({
        ...placeData,
        mainImage: imageMap[placeData.id] || placeData.mainImage,
        city: cityData || undefined,
        province: provinceData || undefined,
        nearbyVillasCount: Number(villaCount),
      }),
    );
  }

  async getPlaceVillas(placeId: string) {
    const results = await db
      .select({
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
          status: villa.status,
          priceMin: villa.priceMin,
          priceMax: villa.priceMax,
          bedroomMin: villa.bedroomMin,
          bedroomMax: villa.bedroomMax,
        },
        link: villaPlace,
      })
      .from(villaPlace)
      .innerJoin(villa, eq(villaPlace.villaId, villa.id))
      .where(eq(villaPlace.placeId, placeId))
      .orderBy(asc(villaPlace.orderIndex), asc(villaPlace.distanceKm));

    return results.map(({ villa: villaData, link }) => ({
      ...villaData,
      distanceKm: link.distanceKm,
      accessType: link.accessType,
      travelTimeMinutes: link.travelTimeMinutes,
      notes: link.notes,
      orderIndex: link.orderIndex,
    }));
  }

  // Image management methods
  async addImage(
    placeId: string,
    imageData: {
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
      orderIndex?: number;
    },
  ) {
    const [image] = await db
      .insert(placeImage)
      .values({
        placeId,
        imageUrl: imageData.imageUrl,
        thumbnailUrl: imageData.thumbnailUrl,
        altText: imageData.altText,
        orderIndex: imageData.orderIndex || 0,
      })
      .returning();

    return image;
  }

  async deleteImage(imageId: string) {
    await db.delete(placeImage).where(eq(placeImage.id, imageId));
  }

  async updateImageOrder(placeId: string, imageIds: string[]) {
    const updates = imageIds.map((imageId, index) =>
      db
        .update(placeImage)
        .set({ orderIndex: index })
        .where(
          and(eq(placeImage.id, imageId), eq(placeImage.placeId, placeId)),
        ),
    );

    await Promise.all(updates);
  }

  async updateImageAltText(imageId: string, altText: string) {
    const [image] = await db
      .update(placeImage)
      .set({ altText })
      .where(eq(placeImage.id, imageId))
      .returning();
    return image;
  }

  async findByIdWithImages(id: string) {
    const placeResult = await this.findById(id);
    if (!placeResult) return null;

    const images = await db
      .select()
      .from(placeImage)
      .where(eq(placeImage.placeId, id))
      .orderBy(asc(placeImage.orderIndex), asc(placeImage.createdAt));

    return {
      ...placeResult,
      images,
    };
  }

  /**
   * Get main images for multiple places in a single optimized query
   * Returns a map of placeId -> mainImageUrl
   */
  async getPlaceImages(
    placeIds: string[],
  ): Promise<Record<string, string | undefined>> {
    if (placeIds.length === 0) return {};

    // Single query to get images for all places, ordered by orderIndex and creation time
    const images = await db
      .select({
        placeId: placeImage.placeId,
        imageUrl: placeImage.imageUrl,
        thumbnailUrl: placeImage.thumbnailUrl,
        orderIndex: placeImage.orderIndex,
        createdAt: placeImage.createdAt,
      })
      .from(placeImage)
      .where(inArray(placeImage.placeId, placeIds))
      .orderBy(
        asc(placeImage.placeId),
        asc(placeImage.orderIndex),
        asc(placeImage.createdAt),
      );

    // Group by placeId and take the first image (lowest orderIndex, earliest createdAt)
    const imageMap: Record<string, string | undefined> = {};

    images.forEach((img) => {
      if (!imageMap[img.placeId]) {
        // Prefer imageUrl over thumbnailUrl
        imageMap[img.placeId] = img.imageUrl || img.thumbnailUrl;
      }
    });

    return imageMap;
  }

  async countPlaces(status?: "draft" | "published"): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)::int` }).from(place);

    if (status) {
      query = query.where(eq(place.status, status));
    }

    const [{ count }] = await query;
    return count;
  }
}

export const placeService = new PlaceService();
