import type { PageServerLoad, Actions } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { eq, desc } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { validateSessionToken } from "$lib/server/auth";

export const load: PageServerLoad = async ({ cookies }) => {
  // Check authentication and admin role
  const token = cookies.get("auth-session");
  const { user } = token ? await validateSessionToken(token) : { user: null };

  if (!user || user.role !== "admin") {
    throw error(403, "Access denied");
  }

  // Fetch all reports with related villa and user data
  const reports = await db
    .select({
      id: table.villaReport.id,
      category: table.villaReport.category,
      subject: table.villaReport.subject,
      content: table.villaReport.content,
      customCategory: table.villaReport.customCategory,
      status: table.villaReport.status,
      createdAt: table.villaReport.createdAt,
      villa: {
        id: table.villa.id,
        title: table.villa.title,
        slug: table.villa.slug,
        address: table.villa.address,
      },
      user: {
        id: table.user.id,
        username: table.user.username,
      },
    })
    .from(table.villaReport)
    .innerJoin(table.villa, eq(table.villaReport.villaId, table.villa.id))
    .innerJoin(table.user, eq(table.villaReport.userId, table.user.id))
    .orderBy(desc(table.villaReport.createdAt));

  return {
    reports,
  };
};

export const actions: Actions = {
  updateStatus: async ({ request, cookies }) => {
    // Check authentication and admin role
    const token = cookies.get("auth-session");
    const { user } = token ? await validateSessionToken(token) : { user: null };

    if (!user || user.role !== "admin") {
      return fail(403, { error: "Access denied" });
    }

    const formData = await request.formData();
    const reportId = formData.get("reportId") as string;
    const status = formData.get("status") as string;

    if (!reportId || !status) {
      return fail(400, { error: "Missing required fields" });
    }

    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return fail(400, { error: "Invalid status" });
    }

    try {
      await db
        .update(table.villaReport)
        .set({
          status: status as any,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(table.villaReport.id, reportId));

      return { success: true };
    } catch (err) {
      console.error("Error updating report status:", err);
      return fail(500, { error: "Failed to update report status" });
    }
  },
};
