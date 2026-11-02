import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { place, city, province } from "$lib/server/db/schema";
import { sql, and, ilike, or, ne, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = url.searchParams.get("q") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const excludeIds = url.searchParams.get("exclude")?.split(",").filter(Boolean) || [];

    if (query.length < 2) {
      return json({ places: [] });
    }

    // Build query conditions
    const conditions = [
      or(
        ilike(place.name, `%${query}%`),
        ilike(place.address, `%${query}%`),
        ilike(city.name, `%${query}%`),
        ilike(province.name, `%${query}%`)
      ),
    ];

    if (excludeIds.length > 0) {
      conditions.push(ne(place.id, sql`ANY(${excludeIds})`));
    }

    const places = await db
      .select({
        id: place.id,
        name: place.name,
        slug: place.slug,
        type: place.type,
        category: place.category,
        status: place.status,
        address: place.address,
        cityName: city.name,
        provinceName: province.name,
      })
      .from(place)
      .leftJoin(city, eq(place.cityId, city.id))
      .leftJoin(province, eq(place.provinceId, province.id))
      .where(and(...conditions))
      .limit(limit)
      .orderBy(place.name);

    const formattedPlaces = places.map((p) => ({
      id: p.id,
      name: p.name,
      label: `${p.name} - ${p.address || p.cityName || p.type || 'Place'}`,
      value: p.id,
      type: p.type,
      category: p.category,
      status: p.status,
      address: p.address,
      cityName: p.cityName,
      provinceName: p.provinceName,
    }));

    return json({ places: formattedPlaces });
  } catch (error) {
    console.error("Error searching places:", error);
    return json({ error: "Failed to search places" }, { status: 500 });
  }
};