import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { searchIndex, villa } from "$lib/server/db/schema";
import { sql, ilike, and, eq, ne, desc } from "drizzle-orm";

export interface SearchSuggestion {
  idx_type: "city" | "villa";
  text: string;
  cityId?: string;
  villaId?: number;
  slug?: string;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const excludeCityParam = url.searchParams.get("excludeCity") === "true";

    if (!query || query.trim().length < 2) {
      return json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    // Query with villa join for PVR ordering
    let results = [];
    if (excludeCityParam) {
      results = await db
        .select({
          idx_type: searchIndex.idxType,
          text: searchIndex.text,
          cityId: searchIndex.cityId,
          villaId: searchIndex.villaId,
          slug: searchIndex.slug,
          pvr: villa.pvr,
          villaTitle: villa.title,
          villaAddress: villa.address,
        })
        .from(searchIndex)
        .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
        .where(
          and(
            sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${searchTerm})`,
            ne(searchIndex.idxType, "city"),
            eq(villa.status, "published"),
          ),
        )
        .orderBy(
          sql`CASE ${searchIndex.idxType}
            WHEN 'city' THEN 1
            WHEN 'villa' THEN 2
          END`,
          sql`CASE
            WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
            THEN ${villa.pvr}
            ELSE 0
          END DESC`,
          searchIndex.text,
        )
        .limit(limit);
    } else {
      results = await db
        .select({
          idx_type: searchIndex.idxType,
          text: searchIndex.text,
          cityId: searchIndex.cityId,
          villaId: searchIndex.villaId,
          slug: searchIndex.slug,
          pvr: villa.pvr,
          villaTitle: villa.title,
          villaAddress: villa.address,
        })
        .from(searchIndex)
        .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
        .where(
          and(
            sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${searchTerm})`,
            sql`(${searchIndex.idxType} = 'city' OR (${searchIndex.idxType} = 'villa' AND ${villa.status} = 'published'))`,
          ),
        )
        .orderBy(
          sql`CASE ${searchIndex.idxType}
            WHEN 'city' THEN 1
            WHEN 'villa' THEN 2
          END`,
          sql`CASE
            WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
            THEN ${villa.pvr}
            ELSE 0
          END DESC`,
          searchIndex.text,
        )
        .limit(limit);
    }

    // If we don't get enough results from full-text search, try ILIKE fallback
    if (results.length < limit) {
      let fallbackResults = [];
      if (excludeCityParam) {
        fallbackResults = await db
          .select({
            idx_type: searchIndex.idxType,
            text: searchIndex.text,
            cityId: searchIndex.cityId,
            villaId: searchIndex.villaId,
            slug: searchIndex.slug,
            pvr: villa.pvr,
            villaTitle: villa.title,
            villaAddress: villa.address,
          })
          .from(searchIndex)
          .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
          .where(
            and(
              ilike(searchIndex.text, `%${searchTerm}%`),
              ne(searchIndex.idxType, "city"),
              eq(villa.status, "published"),
            ),
          )
          .orderBy(
            sql`CASE
              WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
              THEN ${villa.pvr}
              ELSE -1
            END DESC`,
            searchIndex.text,
          )
          .limit(limit - results.length);
      } else {
        fallbackResults = await db
          .select({
            idx_type: searchIndex.idxType,
            text: searchIndex.text,
            cityId: searchIndex.cityId,
            villaId: searchIndex.villaId,
            slug: searchIndex.slug,
            pvr: villa.pvr,
            villaTitle: villa.title,
            villaAddress: villa.address,
          })
          .from(searchIndex)
          .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
          .where(
            and(
              ilike(searchIndex.text, `%${searchTerm}%`),
              sql`(${searchIndex.idxType} = 'city' OR (${searchIndex.idxType} = 'villa' AND ${villa.status} = 'published'))`,
            ),
          )
          .orderBy(
            sql`CASE
              WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
              THEN ${villa.pvr}
              ELSE -1
            END DESC`,
            searchIndex.text,
          )
          .limit(limit - results.length);
      }
      // Deduplicate results based on actual displayed text
      const getDisplayText = (r: (typeof results)[0]) => {
        if (r.idx_type === "villa") {
          return r.villaTitle || r.text;
        } else {
          return r.text;
        }
      };

      const existingTexts = new Set(results.map(getDisplayText));
      for (const result of fallbackResults) {
        const displayText = getDisplayText(result);
        if (!existingTexts.has(displayText)) {
          results.push(result);
          existingTexts.add(displayText);
        }
      }
    }

    return json({
      suggestions: results.map((r) => ({
        idx_type: r.idx_type,
        text: r.idx_type === "villa" ? r.villaTitle || r.text : r.text,
        subText: r.idx_type === "villa" ? r.villaAddress || "" : "",
        cityId: r.cityId,
        villaId: r.villaId,
        slug: r.slug,
      })),
    });
  } catch (error) {
    console.error("Error in search suggestions API:", error);
    return json({ error: "Failed to get search suggestions" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    // Query with villa join for PVR ordering
    const results = await db
      .select({
        idx_type: searchIndex.idxType,
        text: searchIndex.text,
        cityId: searchIndex.cityId,
        villaId: searchIndex.villaId,
        slug: searchIndex.slug,
        pvr: villa.pvr,
        villaTitle: villa.title,
      })
      .from(searchIndex)
      .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
      .where(
        and(
          sql`to_tsvector('english', ${searchIndex.text}) @@ plainto_tsquery('english', ${searchTerm})`,
          sql`(${searchIndex.idxType} = 'city' OR (${searchIndex.idxType} = 'villa' AND ${villa.status} = 'published'))`,
        ),
      )
      .orderBy(
        sql`CASE ${searchIndex.idxType}
          WHEN 'city' THEN 1
          WHEN 'villa' THEN 2
        END`,
        sql`CASE
          WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
          THEN ${villa.pvr}
          ELSE 0
        END DESC`,
        searchIndex.text,
      )
      .limit(limit);

    // If we don't get enough results from full-text search, try ILIKE fallback
    if (results.length < limit) {
      const fallbackResults = await db
        .select({
          idx_type: searchIndex.idxType,
          text: searchIndex.text,
          cityId: searchIndex.cityId,
          villaId: searchIndex.villaId,
          slug: searchIndex.slug,
          pvr: villa.pvr,
          villaTitle: villa.title,
        })
        .from(searchIndex)
        .leftJoin(villa, sql`${searchIndex.villaId} = ${villa.id}`)
        .where(
          and(
            ilike(searchIndex.text, `%${searchTerm}%`),
            sql`(${searchIndex.idxType} = 'city' OR (${searchIndex.idxType} = 'villa' AND ${villa.status} = 'published'))`,
          ),
        )
        .orderBy(
          sql`CASE ${searchIndex.idxType}
            WHEN 'city' THEN 1
            WHEN 'villa' THEN 2
          END`,
          sql`CASE
            WHEN ${searchIndex.idxType} = 'villa' AND ${villa.pvr} IS NOT NULL
            THEN ${villa.pvr}
            ELSE 0
          END DESC`,
          searchIndex.text,
        )
        .limit(limit - results.length);

      // Deduplicate results based on actual displayed text
      const getDisplayText = (r: (typeof results)[0]) => {
        if (r.idx_type === "villa") {
          return r.villaTitle || r.text;
        } else {
          return r.text;
        }
      };

      const existingTexts = new Set(results.map(getDisplayText));
      for (const result of fallbackResults) {
        const displayText = getDisplayText(result);
        if (!existingTexts.has(displayText)) {
          results.push(result);
          existingTexts.add(displayText);
        }
      }
    }

    return json({
      suggestions: results.map((r) => ({
        idx_type: r.idx_type,
        text: r.idx_type === "villa" ? r.villaTitle || r.text : r.text,
        cityId: r.cityId,
        villaId: r.villaId,
        slug: r.slug,
      })),
    });
  } catch (error) {
    console.error("Error in search suggestions API:", error);
    return json({ error: "Failed to get search suggestions" }, { status: 500 });
  }
};
