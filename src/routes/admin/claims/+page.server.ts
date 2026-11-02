import type { PageServerLoad, Actions } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { VillaOwnershipService } from "$lib/server/services/villa-ownership.service";
import { validateSessionToken } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { villaOwnershipClaim, villa, user } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";

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

  // Get status filter from query params
  const statusFilter = url.searchParams.get("status") || "all";

  // Fetch claims with joins - select full tables
  let rawClaims;
  if (statusFilter !== "all") {
    rawClaims = await db
      .select()
      .from(villaOwnershipClaim)
      .innerJoin(villa, eq(villaOwnershipClaim.villaId, villa.id))
      .innerJoin(user, eq(villaOwnershipClaim.userId, user.id))
      .where(eq(villaOwnershipClaim.status, statusFilter as any))
      .orderBy(desc(villaOwnershipClaim.createdAt));
  } else {
    rawClaims = await db
      .select()
      .from(villaOwnershipClaim)
      .innerJoin(villa, eq(villaOwnershipClaim.villaId, villa.id))
      .innerJoin(user, eq(villaOwnershipClaim.userId, user.id))
      .orderBy(desc(villaOwnershipClaim.createdAt));
  }

  // Transform to the structure expected by the UI
  const claims = rawClaims.map((row) => ({
    id: row.villa_ownership_claim.id,
    villaId: row.villa_ownership_claim.villaId,
    userId: row.villa_ownership_claim.userId,
    claimReason: row.villa_ownership_claim.claimReason,
    ownershipProof: row.villa_ownership_claim.ownershipProof,
    contactVerification: row.villa_ownership_claim.contactVerification,
    additionalInfo: row.villa_ownership_claim.additionalInfo,
    verificationCode: row.villa_ownership_claim.verificationCode,
    status: row.villa_ownership_claim.status,
    reviewedBy: row.villa_ownership_claim.reviewedBy,
    reviewedAt: row.villa_ownership_claim.reviewedAt,
    rejectionReason: row.villa_ownership_claim.rejectionReason,
    adminNotes: row.villa_ownership_claim.adminNotes,
    createdAt: row.villa_ownership_claim.createdAt,
    updatedAt: row.villa_ownership_claim.updatedAt,
    villa: {
      id: row.villa.id,
      title: row.villa.title,
      slug: row.villa.slug,
      address: row.villa.address,
      phoneNumber: row.villa.phoneNumber,
    },
    user: {
      username: row.user.username,
      fullName: row.user.fullName,
      email: row.user.email,
      phoneNumber: row.user.phoneNumber,
    },
  }));

  // Get counts for each status
  const allClaims = await db
    .select({ status: villaOwnershipClaim.status })
    .from(villaOwnershipClaim);

  const statusCounts = {
    all: allClaims.length,
    pending: allClaims.filter((c) => c.status === "pending").length,
    under_review: allClaims.filter((c) => c.status === "under_review").length,
    approved: allClaims.filter((c) => c.status === "approved").length,
    rejected: allClaims.filter((c) => c.status === "rejected").length,
  };

  return {
    claims,
    statusFilter,
    statusCounts,
  };
};

export const actions: Actions = {
  approve: async ({ request, cookies }) => {
    const admin = await getAdminUser(cookies);

    const formData = await request.formData();
    const claimId = formData.get("claimId") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!claimId) {
      return fail(400, { error: "Missing claim ID" });
    }

    try {
      await VillaOwnershipService.approveClaim(
        claimId,
        String(admin.id),
        adminNotes || undefined
      );

      return { success: true, action: "approved" };
    } catch (err: any) {
      console.error("Error approving claim:", err);
      return fail(500, { error: err.message || "Failed to approve claim" });
    }
  },

  reject: async ({ request, cookies }) => {
    const admin = await getAdminUser(cookies);

    const formData = await request.formData();
    const claimId = formData.get("claimId") as string;
    const rejectionReason = formData.get("rejectionReason") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!claimId) {
      return fail(400, { error: "Missing claim ID" });
    }

    if (!rejectionReason) {
      return fail(400, { error: "Rejection reason is required" });
    }

    try {
      await VillaOwnershipService.rejectClaim(
        claimId,
        String(admin.id),
        rejectionReason,
        adminNotes || undefined
      );

      return { success: true, action: "rejected" };
    } catch (err: any) {
      console.error("Error rejecting claim:", err);
      return fail(500, { error: err.message || "Failed to reject claim" });
    }
  },

  markUnderReview: async ({ request, cookies }) => {
    await getAdminUser(cookies);

    const formData = await request.formData();
    const claimId = formData.get("claimId") as string;

    if (!claimId) {
      return fail(400, { error: "Missing claim ID" });
    }

    try {
      await db
        .update(villaOwnershipClaim)
        .set({
          status: "under_review",
          updatedAt: new Date(),
        })
        .where(eq(villaOwnershipClaim.id, claimId));

      return { success: true, action: "under_review" };
    } catch (err: any) {
      console.error("Error updating claim status:", err);
      return fail(500, { error: "Failed to update claim status" });
    }
  },
};
