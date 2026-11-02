import { db } from "$lib/server/db";
import {
  searchIndex,
  villa,
  villaImage,
  villaAmenity,
  villaVideo,
  villaBedSize,
  city,
  province,
  place,
  type Villa,
  type City,
  type Province,
} from "$lib/server/db/schema";
import { VillaService, type VillaWithRelations } from "./villa.service";
import {
  eq,
  sql,
  and,
  or,
  ilike,
  gte,
  lte,
  like,
  inArray,
  gt,
  desc,
} from "drizzle-orm";

export type SearchResult = {
  id: string;
  type: "city" | "villa" | "place";
  title: string;
  subtitle: string;
  slug?: string;
  data: {
    cityId?: string;
    villaId?: number;
    placeId?: string;
    city?: City & { province: Province };
    villa?: Villa;
    place?: any; // Place type from new schema
  };
};

export type VillaSortBy = "pvr" | "newest" | "google_rating" | "distance" | "most_viewed";

export interface VillaSearchFilters {
  priceMin?: number;
  priceMax?: number;
  bedroomMin?: number;
  bedroomMax?: number;
  search?: string;
  cityId?: string;
  provinceId?: string;
  status?: "draft" | "published";
  limit?: number;
  cursor?: string;
  sortBy?: VillaSortBy;
  // Amenity filters
  hasBathtub?: boolean;
  hasPool?: boolean;
  hasBreakfast?: boolean;
  isPetFriendly?: boolean;
  isKidFriendly?: boolean;
  isSeniorFriendly?: boolean;
  isSyaria?: boolean;
  // Nearby place filters
  placeId?: string;
  nearbyRadius?: number;
}

export interface VillaPaginatedResponse {
  villas: VillaWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export class SearchService {
  /**
   * Calculate exact Google rating score using the same SQL logic as the main query
   * This ensures consistency between cursor generation and database sorting
   */
  private static async calculateExactRatingScore(
    villaId: number,
  ): Promise<number> {
    try {
      const result = await db
        .select({
          score: sql<number>`(${villa.googleRating} * LOG(COALESCE(${villa.googleRatingCount}, 0) + 1))`,
        })
        .from(villa)
        .where(eq(villa.id, villaId))
        .limit(1);

      return result[0]?.score || 0;
    } catch (error) {
      console.error("Error calculating exact rating score:", error);
      return 0;
    }
  }

  static async search(
    query: string,
    limit: number = 10,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    try {
      const searchResults = await db
        .select({
          searchIndex: searchIndex,
          villa: villa,
          city: city,
          province: province,
        })
        .from(searchIndex)
        .leftJoin(villa, eq(searchIndex.villaId, villa.id))
        .leftJoin(city, eq(searchIndex.cityId, city.id))
        .leftJoin(province, eq(city.provinceId, province.id))
        .where(
          sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${searchTerm})`,
        )
        .limit(limit);

      const results: SearchResult[] = [];

      for (const row of searchResults) {
        if (row.searchIndex.idxType === "city" && row.city && row.province) {
          results.push({
            id: row.city.id,
            type: "city",
            title: row.city.name,
            subtitle: row.province.name,
            data: {
              cityId: row.city.id,
              city: {
                ...row.city,
                province: row.province,
              },
            },
          });
        } else if (row.searchIndex.idxType === "villa" && row.villa) {
          const villaCity =
            row.city && row.province
              ? { ...row.city, province: row.province }
              : undefined;

          results.push({
            id: row.villa.id.toString(),
            type: "villa",
            title: row.villa.title,
            subtitle: villaCity
              ? `${villaCity.name}, ${villaCity.province.name}`
              : row.villa.address,
            data: {
              villaId: row.villa.id,
              villa: row.villa,
              city: villaCity,
            },
          });
        }
      }

      if (results.length < limit) {
        const fallbackResults = await db
          .select({
            searchIndex: searchIndex,
            villa: villa,
            city: city,
            province: province,
          })
          .from(searchIndex)
          .leftJoin(villa, eq(searchIndex.villaId, villa.id))
          .leftJoin(city, eq(searchIndex.cityId, city.id))
          .leftJoin(province, eq(city.provinceId, province.id))
          .where(ilike(searchIndex.text, `%${searchTerm}%`))
          .limit(limit - results.length);

        const existingIds = new Set(results.map((r) => r.id));

        for (const row of fallbackResults) {
          if (row.searchIndex.idxType === "city" && row.city && row.province) {
            if (!existingIds.has(row.city.id)) {
              results.push({
                id: row.city.id,
                type: "city",
                title: row.city.name,
                subtitle: row.province.name,
                data: {
                  cityId: row.city.id,
                  city: {
                    ...row.city,
                    province: row.province,
                  },
                },
              });
              existingIds.add(row.city.id);
            }
          } else if (row.searchIndex.idxType === "villa" && row.villa) {
            if (!existingIds.has(row.villa.id.toString())) {
              const villaCity =
                row.city && row.province
                  ? { ...row.city, province: row.province }
                  : undefined;

              results.push({
                id: row.villa.id.toString(),
                type: "villa",
                title: row.villa.title,
                subtitle: villaCity
                  ? `${villaCity.name}, ${villaCity.province.name}`
                  : row.villa.address,
                data: {
                  villaId: row.villa.id,
                  villa: row.villa,
                  city: villaCity,
                },
              });
              existingIds.add(row.villa.id.toString());
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  }

  static async searchCities(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    const results = await SearchService.search(query, limit * 2);
    return results.filter((r) => r.type === "city").slice(0, limit);
  }

  static async searchVillas(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    const results = await SearchService.search(query, limit * 2);
    return results.filter((r) => r.type === "villa").slice(0, limit);
  }

  static async searchVillasWithFilters(
    filters: VillaSearchFilters = {},
  ): Promise<VillaWithRelations[]> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(villa.status, filters.status));
    }
    if (filters.priceMin) {
      conditions.push(gte(villa.priceMax, filters.priceMin.toString()));
    }
    if (filters.priceMax) {
      conditions.push(lte(villa.priceMin, filters.priceMax.toString()));
    }
    if (filters.bedroomMin) {
      conditions.push(gte(villa.bedroomMax, filters.bedroomMin));
    }
    if (filters.bedroomMax) {
      conditions.push(lte(villa.bedroomMin, filters.bedroomMax));
    }
    if (filters.cityId) {
      conditions.push(eq(villa.cityId, filters.cityId));
    }
    if (filters.provinceId) {
      conditions.push(eq(villa.provinceId, filters.provinceId));
    }

    // For search query, use the search index for better results
    if (filters.search) {
      // Get villa IDs from search index
      const searchResults = await db
        .select({ villaId: searchIndex.villaId })
        .from(searchIndex)
        .where(
          and(
            eq(searchIndex.idxType, "villa"),
            or(
              sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${filters.search})`,
              ilike(searchIndex.text, `%${filters.search}%`),
            ),
          ),
        );

      const villaIds = searchResults
        .map((r) => r.villaId)
        .filter((id) => id !== null) as number[];

      if (villaIds.length > 0) {
        conditions.push(inArray(villa.id, villaIds));
      } else {
        // If no search results, return empty array
        return [];
      }
    }

    try {
      const query = db
        .select({
          villa: villa,
          province: province,
          city: city,
        })
        .from(villa)
        .leftJoin(province, eq(villa.provinceId, province.id))
        .leftJoin(city, eq(villa.cityId, city.id));

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      // Order by PVR (untuk scoring saat ini)
      query.orderBy(sql`${villa.pvr} DESC NULLS LAST`);

      const results = await query;

      // Fetch related data for each villa (same as VillaService.findAll)
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

          return VillaService.transformVillaImages({
            ...result.villa,
            images,
            amenities,
            videos,
            bedSizes,
            nearbyPlaces: [],
            province: result.province,
            city: result.city,
          });
        }),
      );

      return villas;
    } catch (error) {
      console.error("Error searching villas with filters:", error);
      return [];
    }
  }

  static async searchVillasWithFiltersPaginated(
    filters: VillaSearchFilters = {},
  ): Promise<VillaPaginatedResponse> {
    const limit = filters.limit || 20; // Default to 20 items per page
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(villa.status, filters.status));
    }
    if (filters.priceMin) {
      conditions.push(gte(villa.priceMax, filters.priceMin.toString()));
    }
    if (filters.priceMax) {
      conditions.push(lte(villa.priceMin, filters.priceMax.toString()));
    }
    if (filters.bedroomMin) {
      conditions.push(gte(villa.bedroomMax, filters.bedroomMin));
    }
    if (filters.bedroomMax) {
      conditions.push(lte(villa.bedroomMin, filters.bedroomMax));
    }
    if (filters.cityId) {
      conditions.push(eq(villa.cityId, filters.cityId));
    }
    if (filters.provinceId) {
      conditions.push(eq(villa.provinceId, filters.provinceId));
    }

    // Add amenity filters
    if (filters.hasBathtub) {
      conditions.push(eq(villa.hasBathtub, true));
    }
    if (filters.hasPool) {
      conditions.push(eq(villa.hasPool, true));
    }
    if (filters.hasBreakfast) {
      conditions.push(eq(villa.hasBreakfast, true));
    }
    if (filters.isPetFriendly) {
      conditions.push(eq(villa.isPetFriendly, true));
    }
    if (filters.isKidFriendly) {
      conditions.push(eq(villa.isKidFriendly, true));
    }
    if (filters.isSeniorFriendly) {
      conditions.push(eq(villa.isSeniorFriendly, true));
    }
    if (filters.isSyaria) {
      conditions.push(eq(villa.isSyaria, true));
    }

    // Add nearby place filter
    if (filters.placeId && filters.nearbyRadius) {
      // Get place coordinates
      const placeResult = await db
        .select({
          latitude: place.latitude,
          longitude: place.longitude,
        })
        .from(place)
        .where(eq(place.id, filters.placeId))
        .limit(1);

      if (placeResult[0]) {
        const placeLat = parseFloat(placeResult[0].latitude);
        const placeLng = parseFloat(placeResult[0].longitude);

        // Add distance condition using Haversine formula
        const distanceFormula = sql`
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${placeLat})) *
              cos(radians(${villa.latitude}::numeric)) *
              cos(radians(${villa.longitude}::numeric) - radians(${placeLng})) +
              sin(radians(${placeLat})) *
              sin(radians(${villa.latitude}::numeric))
            ))
          )
        `;

        conditions.push(sql`${distanceFormula} <= ${filters.nearbyRadius}`);
        // Also ensure villa has coordinates
        conditions.push(sql`${villa.latitude} IS NOT NULL`);
        conditions.push(sql`${villa.longitude} IS NOT NULL`);
      }
    }

    // Cursor-based pagination: handle different sort types
    const sortBy = filters.sortBy || "pvr";
    if (filters.cursor) {
      try {
        // Use '|' as separator to avoid conflicts with timestamps that contain ':'
        const separatorIndex = filters.cursor.lastIndexOf("|");
        let cursorValue: string;
        let idValue: number;

        if (separatorIndex === -1) {
          // Fallback for old cursor format (backward compatibility with ':' separator)
          const [value, cursorId] = filters.cursor.split(":");
          cursorValue = value;
          idValue = parseInt(cursorId);
        } else {
          // New cursor format using '|' separator
          cursorValue = filters.cursor.substring(0, separatorIndex);
          const cursorId = filters.cursor.substring(separatorIndex + 1);
          idValue = parseInt(cursorId);
        }

        if (!isNaN(idValue)) {
          if (sortBy === "pvr") {
            const pvrValue = parseFloat(cursorValue);
            if (!isNaN(pvrValue)) {
              // For cursor pagination with ORDER BY pvr DESC, id ASC
              // We want villas with pvr < cursorPvr OR (pvr = cursorPvr AND id > cursorId)
              conditions.push(
                or(
                  sql`${villa.pvr} < ${pvrValue}`,
                  and(sql`${villa.pvr} = ${pvrValue}`, gt(villa.id, idValue)),
                ),
              );
            }
          } else if (sortBy === "newest") {
            // For cursor pagination with ORDER BY created_at DESC, id ASC
            // We want villas with created_at < cursorDate OR (created_at = cursorDate AND id > cursorId)
            conditions.push(
              or(
                sql`${villa.createdAt} < ${cursorValue}::timestamp`,
                and(
                  sql`${villa.createdAt} = ${cursorValue}::timestamp`,
                  gt(villa.id, idValue),
                ),
              ),
            );
          } else if (sortBy === "google_rating") {
            const ratingValue = parseFloat(cursorValue);
            if (!isNaN(ratingValue)) {
              // For cursor pagination with ORDER BY google_rating_score DESC, id ASC
              // const googleRatingScore = sql`(${villa.googleRating} * LOG(COALESCE(${villa.googleRatingCount}, 0) + 1))`;
              const googleRatingScore = sql`(${villa.googleRating} * LOG(GREATEST(COALESCE(${villa.googleRatingCount}, 0), 0) + 1))`;
              conditions.push(
                or(
                  sql`${googleRatingScore} < ${ratingValue}`,
                  and(
                    sql`${googleRatingScore} = ${ratingValue}`,
                    gt(villa.id, idValue),
                  ),
                ),
              );
            }
          } else if (sortBy === "most_viewed") {
            const viewCountValue = parseInt(cursorValue);
            if (!isNaN(viewCountValue)) {
              // For cursor pagination with ORDER BY view_count DESC, id ASC
              conditions.push(
                or(
                  sql`${villa.viewCount} < ${viewCountValue}`,
                  and(
                    sql`${villa.viewCount} = ${viewCountValue}`,
                    gt(villa.id, idValue),
                  ),
                ),
              );
            }
          }
        }
      } catch (error) {
        console.error("Invalid cursor format:", filters.cursor);
      }
    }

    // For search query, use the search index for better results
    if (filters.search) {
      const searchResults = await db
        .select({ villaId: searchIndex.villaId })
        .from(searchIndex)
        .where(
          and(
            eq(searchIndex.idxType, "villa"),
            or(
              sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${filters.search})`,
              ilike(searchIndex.text, `%${filters.search}%`),
            ),
          ),
        );

      const villaIds = searchResults
        .map((r) => r.villaId)
        .filter((id) => id !== null) as number[];

      if (villaIds.length > 0) {
        conditions.push(inArray(villa.id, villaIds));
      } else {
        // If no search results, return empty response
        return {
          villas: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
        };
      }
    }

    try {
      const query = db
        .select({
          villa: villa,
          province: province,
          city: city,
        })
        .from(villa)
        .leftJoin(province, eq(villa.provinceId, province.id))
        .leftJoin(city, eq(villa.cityId, city.id));

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      // Dynamic ordering based on sortBy parameter
      const sortBy = filters.sortBy || "pvr";
      if (sortBy === "pvr") {
        // Order by PVR DESC (nulls last), then by ID ASC for consistent cursor pagination
        query.orderBy(sql`${villa.pvr} DESC NULLS LAST`, villa.id);
      } else if (sortBy === "newest") {
        // Order by creation date DESC, then by ID ASC
        query.orderBy(sql`${villa.createdAt} DESC`, villa.id);
      } else if (sortBy === "google_rating") {
        // Order by google_rating DSEC first and then by google_rating_count DESC.
        query.orderBy(
          sql`${villa.googleRating} DESC NULLS LAST`,
          sql`${villa.googleRatingCount} DESC NULLS LAST`,
          villa.id,
        );
      } else if (sortBy === "most_viewed") {
        // Order by view_count DESC, then by ID ASC for consistent cursor pagination
        query.orderBy(sql`${villa.viewCount} DESC NULLS LAST`, villa.id);
      }

      query.limit(limit + 1); // Fetch one extra to check if there are more results

      const results = await query;

      // Check if there are more results
      const hasMore = results.length > limit;
      const villas = hasMore ? results.slice(0, limit) : results;

      // Generate next cursor from the last item based on sort type
      // Use '|' as separator to avoid conflicts with timestamps
      let nextCursor: string | null = null;
      if (hasMore && villas.length > 0) {
        const lastVilla = villas[villas.length - 1].villa;
        const sortBy = filters.sortBy || "pvr";

        if (sortBy === "pvr") {
          nextCursor = `${lastVilla.pvr || 0}|${lastVilla.id}`;
        } else if (sortBy === "newest") {
          nextCursor = `${lastVilla.createdAt?.toISOString() || ""}|${lastVilla.id}`;
        } else if (sortBy === "google_rating") {
          // Use database-calculated score to ensure consistency with query ordering
          const exactScore = await SearchService.calculateExactRatingScore(
            lastVilla.id,
          );
          nextCursor = `${exactScore}|${lastVilla.id}`;
        } else if (sortBy === "most_viewed") {
          nextCursor = `${lastVilla.viewCount || 0}|${lastVilla.id}`;
        }
      }

      // Fetch related data for each villa
      const villasWithRelations = await Promise.all(
        villas.map(async (result) => {
          const [images, amenities, videos, bedSizes] = await Promise.all([
            db
              .select()
              .from(villaImage)
              .where(eq(villaImage.villaId, result.villa.id))
              .orderBy(villaImage.orderIndex),
            db
              .select()
              .from(villaAmenity)
              .where(eq(villaAmenity.villaId, result.villa.id)),
            db
              .select()
              .from(villaVideo)
              .where(eq(villaVideo.villaId, result.villa.id))
              .orderBy(villaVideo.orderIndex),
            db
              .select()
              .from(villaBedSize)
              .where(eq(villaBedSize.villaId, result.villa.id))
              .orderBy(villaBedSize.orderIndex),
          ]);

          return VillaService.transformVillaImages({
            ...result.villa,
            images,
            amenities,
            videos,
            bedSizes,
            nearbyPlaces: [],
            province: result.province,
            city: result.city,
          });
        }),
      );

      return {
        villas: villasWithRelations,
        nextCursor,
        hasMore,
        total: undefined, // TODO: Add count query for total when filters are applied
      };
    } catch (error) {
      console.error("Error searching villas with filters (paginated):", error);
      return {
        villas: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      };
    }
  }

  // PLACE SEARCH METHODS
  static async searchPlaces(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    try {
      // Import place and related tables dynamically to avoid issues if migration hasn't run yet
      const {
        place,
        city: cityTable,
        province: provinceTable,
      } = await import("$lib/server/db/schema");

      const places = await db
        .select({
          place: place,
          city: cityTable,
          province: provinceTable,
        })
        .from(place)
        .leftJoin(cityTable, eq(place.cityId, cityTable.id))
        .leftJoin(provinceTable, eq(place.provinceId, provinceTable.id))
        .where(
          and(
            eq(place.isActive, true),
            or(
              ilike(place.name, `%${searchTerm}%`),
              ilike(place.description, `%${searchTerm}%`),
              ilike(place.type, `%${searchTerm}%`),
            ),
          ),
        )
        .orderBy(desc(place.viewCount))
        .limit(limit);

      return places.map((row) => ({
        id: row.place.id,
        type: "place" as const,
        title: row.place.name,
        subtitle: row.city?.name
          ? `${row.place.type?.replace(/_/g, " ")} in ${row.city.name}`
          : row.place.type?.replace(/_/g, " ") || "Place",
        slug: row.place.slug,
        data: {
          placeId: row.place.id,
          place: row.place,
          city:
            row.city && row.province
              ? { ...row.city, province: row.province }
              : undefined,
        },
      }));
    } catch (error) {
      // If place table doesn't exist yet, return empty array
      console.warn("Place search not available yet:", error);
      return [];
    }
  }

  static async searchWithPlaces(
    query: string,
    limit: number = 15,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Split the limit between different types of results
    const villaLimit = Math.ceil(limit * 0.5); // 50% for villas
    const cityLimit = Math.ceil(limit * 0.3); // 30% for cities
    const placeLimit = Math.ceil(limit * 0.2); // 20% for places

    try {
      const [villaResults, cityResults, placeResults] = await Promise.all([
        SearchService.searchVillas(query, villaLimit),
        SearchService.searchCities(query, cityLimit),
        SearchService.searchPlaces(query, placeLimit),
      ]);

      // Combine and sort results by relevance (you can implement custom scoring)
      const allResults = [...villaResults, ...cityResults, ...placeResults];

      // Simple relevance scoring: exact matches first, then partial matches
      const searchTerm = query.toLowerCase().trim();
      allResults.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
        const bExact = b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
        return bExact - aExact;
      });

      return allResults.slice(0, limit);
    } catch (error) {
      console.error("Error in combined search:", error);
      // Fallback to regular search without places
      return SearchService.search(query, limit);
    }
  }

  static async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 10,
  ): Promise<SearchResult[]> {
    try {
      const { placeService } = await import(
        "$lib/server/services/place.service"
      );

      const places = await placeService.findNearbyPlaces(
        latitude,
        longitude,
        radiusKm,
        limit,
      );

      return places.map((place) => ({
        id: place.id,
        type: "place" as const,
        title: place.name,
        subtitle: `${place.distance}km away${place.city?.name ? ` • ${place.city.name}` : ""}`,
        slug: place.slug,
        data: {
          placeId: place.id,
          place: place,
          city: place.city,
        },
      }));
    } catch (error) {
      console.warn("Nearby places search not available yet:", error);
      return [];
    }
  }
}
