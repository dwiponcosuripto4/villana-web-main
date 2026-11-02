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

  // Fetch all change requests with related villa and user data
  const changeRequests = await db
    .select({
      id: table.villaChangeRequest.id,
      subject: table.villaChangeRequest.subject,
      requestDetail: table.villaChangeRequest.requestDetail,
      status: table.villaChangeRequest.status,
      adminNotes: table.villaChangeRequest.adminNotes,
      createdAt: table.villaChangeRequest.createdAt,
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
    .from(table.villaChangeRequest)
    .innerJoin(
      table.villa,
      eq(table.villaChangeRequest.villaId, table.villa.id),
    )
    .innerJoin(table.user, eq(table.villaChangeRequest.userId, table.user.id))
    .orderBy(desc(table.villaChangeRequest.createdAt));

  return {
    changeRequests,
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
    const requestId = formData.get("requestId") as string;
    const status = formData.get("status") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!requestId || !status) {
      return fail(400, { error: "Missing required fields" });
    }

    const validStatuses = ["pending", "reviewed", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return fail(400, { error: "Invalid status" });
    }

    try {
      await db
        .update(table.villaChangeRequest)
        .set({
          status: status as any,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          adminNotes: adminNotes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(table.villaChangeRequest.id, requestId));

      return { success: true };
    } catch (err) {
      console.error("Error updating change request status:", err);
      return fail(500, { error: "Failed to update change request status" });
    }
  },
};
