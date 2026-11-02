import { db } from "$lib/server/db";
import {
  city,
  province,
  type City,
  type Province,
} from "$lib/server/db/schema";
import { eq, like, sql } from "drizzle-orm";

export interface CityWithProvince extends City {
  province: Province;
}

export interface CitySearchResult {
  cities: CityWithProvince[];
  total: number;
}

export interface ProvinceWithCityCount extends Province {
  cityCount: number;
}

export class CityService {
  static async searchCities(
    searchTerm: string,
    limit: number = 10,
  ): Promise<CityWithProvince[]> {
    const results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(sql`LOWER(${city.name}) LIKE LOWER(${`%${searchTerm}%`})`)
      .limit(limit)
      .orderBy(city.name);

    return results.map((result) => ({
      ...result.city,
      province: result.province,
    }));
  }

  static async getAllProvinces(): Promise<Province[]> {
    return await db.select().from(province).orderBy(province.name);
  }

  static async getProvincesWithCityCount(): Promise<ProvinceWithCityCount[]> {
    const results = await db
      .select({
        province: province,
        cityCount: sql<number>`count(${city.id})::int`,
      })
      .from(province)
      .leftJoin(city, eq(province.id, city.provinceId))
      .groupBy(province.id)
      .orderBy(province.name);

    return results.map((result) => ({
      ...result.province,
      cityCount: result.cityCount,
    }));
  }

  static async getCitiesByProvince(provinceId: string): Promise<City[]> {
    return await db
      .select()
      .from(city)
      .where(eq(city.provinceId, provinceId))
      .orderBy(city.name);
  }

  static async getCityById(cityId: string): Promise<CityWithProvince | null> {
    const results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(eq(city.id, cityId))
      .limit(1);

    if (results.length === 0) return null;

    const result = results[0];
    return {
      ...result.city,
      province: result.province,
    };
  }

  static async findNearestCityByName(
    cityName: string,
  ): Promise<CityWithProvince | null> {
    // First try exact match (case insensitive)
    let results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(sql`LOWER(${city.name}) = LOWER(${cityName})`)
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return {
        ...result.city,
        province: result.province,
      };
    }

    // If no exact match, try partial match
    results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(like(city.name, `%${cityName}%`))
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return {
        ...result.city,
        province: result.province,
      };
    }

    return null;
  }

  static async searchCitiesAndProvinces(
    searchTerm: string,
    limit: number = 10,
  ): Promise<{
    cities: CityWithProvince[];
    provinces: Province[];
  }> {
    // Search cities
    const cities = await this.searchCities(searchTerm, limit);

    // Search provinces
    const provinces = await db
      .select()
      .from(province)
      .where(sql`LOWER(${province.name}) LIKE LOWER(${`%${searchTerm}%`})`)
      .limit(5)
      .orderBy(province.name);

    return { cities, provinces };
  }

  static async findProvinceByFuzzyName(name: string): Promise<Province | null> {
    if (!name || !name.trim()) return null;

    const searchTerm = this.normalizeLocationName(name);

    // 1. Try exact match first (case-insensitive)
    let results = await db
      .select()
      .from(province)
      .where(sql`LOWER(${province.name}) = LOWER(${searchTerm})`)
      .limit(1);

    if (results.length > 0) return results[0];

    // 2. Try normalized exact match
    results = await db
      .select()
      .from(province)
      .where(
        sql`LOWER(${this.normalizeLocationNameForDB(province.name)}) = LOWER(${searchTerm})`,
      )
      .limit(1);

    if (results.length > 0) return results[0];

    // 3. Try starts with
    results = await db
      .select()
      .from(province)
      .where(sql`LOWER(${province.name}) LIKE LOWER(${searchTerm + "%"})`)
      .limit(1);

    if (results.length > 0) return results[0];

    // 4. Try contains
    results = await db
      .select()
      .from(province)
      .where(sql`LOWER(${province.name}) LIKE LOWER(${`%${searchTerm}%`})`)
      .limit(1);

    if (results.length > 0) return results[0];

    return null;
  }

  static async getAllCities(): Promise<CityWithProvince[]> {
    const results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .orderBy(city.name);

    return results.map((result) => ({
      ...result.city,
      province: result.province,
    }));
  }

  static async findCityByFuzzyName(
    cityName: string,
    provinceName?: string,
  ): Promise<CityWithProvince | null> {
    if (!cityName || !cityName.trim()) return null;

    const searchTerm = this.normalizeLocationName(cityName);
    let provinceId: string | undefined;

    // If province name is provided, try to find the province first
    if (provinceName) {
      const foundProvince = await this.findProvinceByFuzzyName(provinceName);
      if (foundProvince) {
        provinceId = foundProvince.id;
      }
    }

    // Helper function to build the correct where condition
    const buildWhereCondition = (nameCondition: any) => {
      if (provinceId) {
        return sql`${eq(city.provinceId, provinceId)} AND ${nameCondition}`;
      }
      return nameCondition;
    };

    // 1. Try exact match first (case-insensitive)
    let results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(
        buildWhereCondition(sql`LOWER(${city.name}) = LOWER(${searchTerm})`),
      )
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return { ...result.city, province: result.province };
    }

    // 2. Try normalized exact match
    results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(
        buildWhereCondition(
          sql`LOWER(${this.normalizeLocationNameForDB(city.name)}) = LOWER(${searchTerm})`,
        ),
      )
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return { ...result.city, province: result.province };
    }

    // 3. Try starts with
    results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(
        buildWhereCondition(
          sql`LOWER(${city.name}) LIKE LOWER(${searchTerm + "%"})`,
        ),
      )
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return { ...result.city, province: result.province };
    }

    // 4. Try contains
    results = await db
      .select({
        city: city,
        province: province,
      })
      .from(city)
      .innerJoin(province, eq(city.provinceId, province.id))
      .where(
        buildWhereCondition(
          sql`LOWER(${city.name}) LIKE LOWER(${`%${searchTerm}%`})`,
        ),
      )
      .limit(1);

    if (results.length > 0) {
      const result = results[0];
      return { ...result.city, province: result.province };
    }

    // If no match with province filter, try without province filter as fallback
    if (provinceId) {
      return this.findCityByFuzzyName(cityName);
    }

    return null;
  }

  private static normalizeLocationName(name: string): string {
    if (!name) return "";

    return (
      name
        .trim()
        .toLowerCase()
        // Remove common prefixes and suffixes
        .replace(/^(province\s+of\s+|provinsi\s+|prov\.?\s+)/i, "")
        .replace(/^(city\s+of\s+|kota\s+|kabupaten\s+|kab\.?\s+)/i, "")
        .replace(/^(daerah\s+khusus\s+ibukota\s+|dki\s+)/i, "")
        .replace(/^(daerah\s+istimewa\s+|di\s+)/i, "")
        // Remove extra whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  private static normalizeLocationNameForDB(columnRef: any): any {
    // This creates a SQL expression that normalizes the database column value
    return sql`TRIM(LOWER(
			REGEXP_REPLACE(
				REGEXP_REPLACE(
					REGEXP_REPLACE(
						REGEXP_REPLACE(
							REGEXP_REPLACE(${columnRef},
								'^(province\\s+of\\s+|provinsi\\s+|prov\\.?\\s+)', '', 'i'),
							'^(city\\s+of\\s+|kota\\s+|kabupaten\\s+|kab\\.?\\s+)', '', 'i'),
						'^(daerah\\s+khusus\\s+ibukota\\s+|dki\\s+)', '', 'i'),
					'^(daerah\\s+istimewa\\s+|di\\s+)', '', 'i'),
				'\\s+', ' ', 'g')))`;
  }
}
