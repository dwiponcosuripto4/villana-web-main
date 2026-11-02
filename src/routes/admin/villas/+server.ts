import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { villa } from "$lib/server/db/schema";
import { ilike, or, and, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check admin permission
  if (!locals.user || locals.user.role !== "admin") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchQuery = url.searchParams.get("query") || "";
    const status = url.searchParams.get("status") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = db.select({
      id: villa.id,
      title: villa.title,
      slug: villa.slug,
      status: villa.status,
      priceMin: villa.priceMin,
      priceMax: villa.priceMax,
      bedroomMin: villa.bedroomMin,
      bedroomMax: villa.bedroomMax,
    }).from(villa);

    const conditions = [];

    if (searchQuery) {
      conditions.push(
        or(
          ilike(villa.title, `%${searchQuery}%`),
          ilike(villa.address, `%${searchQuery}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(villa.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const villas = await query
      .orderBy(villa.title)
      .limit(limit)
      .offset(offset);

    return json({ villas });
  } catch (error) {
    console.error("Failed to fetch villas:", error);
    return json({ error: "Failed to fetch villas" }, { status: 500 });
  }
};