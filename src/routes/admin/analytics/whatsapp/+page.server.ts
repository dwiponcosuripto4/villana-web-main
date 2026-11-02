import type { PageServerLoad } from "./$types";
import { requireAdmin } from "$lib/server/auth-utils";
import { db } from "$lib/server/db";
import { villa as villaTable, villaButtonClick } from "$lib/server/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

type SortOption = "clicks" | "views" | "conversion" | "recent";

export const load: PageServerLoad = async (event) => {
  await requireAdmin(event);

  const url = event.url;
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const sortBy = (url.searchParams.get("sortBy") as SortOption) || "clicks";
  const offset = (page - 1) * limit;

  // Get total WhatsApp clicks
  const [totals] = await db
    .select({
      totalWhatsappClicks: sql<number>`COALESCE(SUM(${villaTable.whatsappClicks}), 0)`,
    })
    .from(villaTable)
    .where(eq(villaTable.status, "published"));

  const totalWhatsappClicks = Number(totals.totalWhatsappClicks) || 0;

  // Get total count for pagination
  const [countResult] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(villaTable)
    .where(eq(villaTable.status, "published"));

  const totalVillas = Number(countResult.count) || 0;
  const totalPages = Math.ceil(totalVillas / limit);

  // Build the query based on sort option
  let villasByClicks;

  if (sortBy === "recent") {
    // Join with villaButtonClick to get the most recent click
    const results = await db
      .select({
        villaId: villaTable.id,
        villaTitle: villaTable.title,
        villaSlug: villaTable.slug,
        whatsappClicks: villaTable.whatsappClicks,
        viewCount: villaTable.viewCount,
        lastClickAt: sql<Date | null>`MAX(${villaButtonClick.clickedAt})`,
      })
      .from(villaTable)
      .leftJoin(
        villaButtonClick,
        and(
          eq(villaButtonClick.villaId, villaTable.id),
          eq(villaButtonClick.buttonType, "whatsapp_contact")
        )
      )
      .where(eq(villaTable.status, "published"))
      .groupBy(villaTable.id)
      .orderBy(sql`MAX(${villaButtonClick.clickedAt}) DESC NULLS LAST`)
      .limit(limit)
      .offset(offset);

    villasByClicks = results.map((r) => ({
      villaId: r.villaId,
      villaTitle: r.villaTitle,
      villaSlug: r.villaSlug,
      whatsappClicks: r.whatsappClicks,
      viewCount: r.viewCount,
      lastClickAt: r.lastClickAt,
    }));
  } else {
    // Determine sort order
    let orderByClause;
    switch (sortBy) {
      case "views":
        orderByClause = desc(villaTable.viewCount);
        break;
      case "conversion":
        orderByClause = sql`CASE WHEN ${villaTable.viewCount} > 0 THEN (${villaTable.whatsappClicks}::float / ${villaTable.viewCount}::float) ELSE 0 END DESC`;
        break;
      case "clicks":
      default:
        orderByClause = desc(villaTable.whatsappClicks);
        break;
    }

    const results = await db
      .select({
        villaId: villaTable.id,
        villaTitle: villaTable.title,
        villaSlug: villaTable.slug,
        whatsappClicks: villaTable.whatsappClicks,
        viewCount: villaTable.viewCount,
      })
      .from(villaTable)
      .where(eq(villaTable.status, "published"))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    villasByClicks = results.map((r) => ({
      ...r,
      lastClickAt: null as Date | null,
    }));
  }

  return {
    totalWhatsappClicks,
    villasByClicks,
    sortBy,
    pagination: {
      page,
      limit,
      total: totalVillas,
      totalPages,
    },
  };
};
