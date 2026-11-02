import type { PageServerLoad, Actions } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { validateSessionToken } from "$lib/server/auth";
import { db } from "$lib/server/db";
import {
  villaUpdateRequest,
  villa,
  user,
  villa as villaTable,
} from "$lib/server/db/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { onlyAdmin } from "$lib/server/auth-utils";

async function getAdminUser(cookies: any) {
  const token = cookies.get("auth-session");
  const { user } = token ? await validateSessionToken(token) : { user: null };

  if (!user || user.role !== "admin") {
    throw error(403, "Access denied");
  }

  return user;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  await getAdminUser(cookies);

  // Get filters from query params
  const statusFilter = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  // Build query conditions
  const conditions = [];

  if (statusFilter !== "all") {
    conditions.push(eq(villaUpdateRequest.status, statusFilter as any));
  }

  // Fetch update requests with joins
  let rawRequests;
  if (conditions.length > 0) {
    rawRequests = await db
      .select({
        request: villaUpdateRequest,
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
        },
        owner: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
        },
      })
      .from(villaUpdateRequest)
      .innerJoin(villa, eq(villaUpdateRequest.villaId, villa.id))
      .innerJoin(user, eq(villaUpdateRequest.ownerId, user.id))
      .where(and(...conditions))
      .orderBy(desc(villaUpdateRequest.createdAt));
  } else {
    rawRequests = await db
      .select({
        request: villaUpdateRequest,
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
        },
        owner: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
        },
      })
      .from(villaUpdateRequest)
      .innerJoin(villa, eq(villaUpdateRequest.villaId, villa.id))
      .innerJoin(user, eq(villaUpdateRequest.ownerId, user.id))
      .orderBy(desc(villaUpdateRequest.createdAt));
  }

  // Filter by search if provided
  let requests = rawRequests;
  if (search) {
    const searchLower = search.toLowerCase();
    requests = rawRequests.filter(
      (r) =>
        r.villa.title.toLowerCase().includes(searchLower) ||
        r.owner.fullName?.toLowerCase().includes(searchLower) ||
        r.owner.email.toLowerCase().includes(searchLower),
    );
  }

  // Transform to expected structure
  const transformedRequests = requests.map((row) => ({
    id: row.request.id,
    villaId: row.request.villaId,
    ownerId: row.request.ownerId,
    updateType: row.request.updateType,
    dataCategory: row.request.dataCategory,
    fieldName: row.request.fieldName,
    currentValue: row.request.currentValue,
    proposedValue: row.request.proposedValue,
    changeReason: row.request.changeReason,
    status: row.request.status,
    reviewedBy: row.request.reviewedBy,
    reviewedAt: row.request.reviewedAt,
    adminNotes: row.request.adminNotes,
    appliedAt: row.request.appliedAt,
    createdAt: row.request.createdAt,
    updatedAt: row.request.updatedAt,
    villa: row.villa,
    owner: row.owner,
  }));

  // Get counts for each status
  const allRequests = await db
    .select({ status: villaUpdateRequest.status })
    .from(villaUpdateRequest);

  const statusCounts = {
    all: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    reviewed: allRequests.filter((r) => r.status === "reviewed").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  };

  return {
    requests: transformedRequests,
    statusFilter,
    search,
    statusCounts,
  };
};

export const actions: Actions = {
  approve: onlyAdmin(async ({ request, cookies }) => {
    const admin = await getAdminUser(cookies);

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!requestId) {
      return fail(400, { error: "Missing request ID" });
    }

    try {
      // Get the update request
      const [updateRequest] = await db
        .select()
        .from(villaUpdateRequest)
        .where(eq(villaUpdateRequest.id, requestId))
        .limit(1);

      if (!updateRequest) {
        return fail(404, { error: "Request not found" });
      }

      if (updateRequest.status !== "pending" && updateRequest.status !== "reviewed") {
        return fail(400, { error: "Request is not in a reviewable state" });
      }

      // Parse the proposed value based on the field type
      let parsedValue: any = updateRequest.proposedValue;

      // Handle boolean fields
      if (
        [
          "hasAc",
          "hasBathtub",
          "hasTv",
          "hasBreakfast",
          "hasPool",
          "isPetFriendly",
          "isKidFriendly",
          "isSeniorFriendly",
          "isSyaria",
        ].includes(updateRequest.fieldName)
      ) {
        parsedValue = updateRequest.proposedValue === "true";
      }

      // Handle number fields
      if (
        [
          "priceMin",
          "priceMax",
          "bedroomMin",
          "bedroomMax",
          "personCapacityMin",
          "personCapacityMax",
          "unitsCount",
        ].includes(updateRequest.fieldName)
      ) {
        parsedValue = updateRequest.proposedValue;
      }

      // Apply the change to the villa
      await db
        .update(villaTable)
        .set({
          [updateRequest.fieldName]: parsedValue,
          updatedAt: new Date(),
        })
        .where(eq(villaTable.id, updateRequest.villaId));

      // Update request status
      await db
        .update(villaUpdateRequest)
        .set({
          status: "approved",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          appliedAt: new Date(),
          adminNotes: adminNotes || null,
          updatedAt: new Date(),
        })
        .where(eq(villaUpdateRequest.id, requestId));

      return { success: true, action: "approved" };
    } catch (err: any) {
      console.error("Error approving update request:", err);
      return fail(500, { error: err.message || "Failed to approve request" });
    }
  }),

  reject: onlyAdmin(async ({ request, cookies }) => {
    const admin = await getAdminUser(cookies);

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!requestId) {
      return fail(400, { error: "Missing request ID" });
    }

    if (!adminNotes) {
      return fail(400, { error: "Admin notes/reason is required for rejection" });
    }

    try {
      // Get the update request
      const [updateRequest] = await db
        .select()
        .from(villaUpdateRequest)
        .where(eq(villaUpdateRequest.id, requestId))
        .limit(1);

      if (!updateRequest) {
        return fail(404, { error: "Request not found" });
      }

      if (updateRequest.status !== "pending" && updateRequest.status !== "reviewed") {
        return fail(400, { error: "Request is not in a reviewable state" });
      }

      // Update request status
      await db
        .update(villaUpdateRequest)
        .set({
          status: "rejected",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          adminNotes,
          updatedAt: new Date(),
        })
        .where(eq(villaUpdateRequest.id, requestId));

      return { success: true, action: "rejected" };
    } catch (err: any) {
      console.error("Error rejecting update request:", err);
      return fail(500, { error: err.message || "Failed to reject request" });
    }
  }),

  markReviewed: onlyAdmin(async ({ request, cookies }) => {
    await getAdminUser(cookies);

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;

    if (!requestId) {
      return fail(400, { error: "Missing request ID" });
    }

    try {
      await db
        .update(villaUpdateRequest)
        .set({
          status: "reviewed",
          updatedAt: new Date(),
        })
        .where(eq(villaUpdateRequest.id, requestId));

      return { success: true, action: "reviewed" };
    } catch (err: any) {
      console.error("Error updating request status:", err);
      return fail(500, { error: "Failed to update request status" });
    }
  }),
};
