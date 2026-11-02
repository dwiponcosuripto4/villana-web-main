import { db } from "$lib/server/db";
import {
  villa,
  villaOwnership,
  villaOwnershipClaim,
  villaUpdateRequest,
  villaImage,
  user,
  type VillaOwnershipClaim,
  type VillaOwnership,
  type VillaUpdateRequest,
} from "$lib/server/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export class VillaOwnershipService {
  // Check if a villa can be claimed (not already owned)
  static async isVillaClaimable(villaId: number): Promise<boolean> {
    const existingOwnership = await db
      .select()
      .from(villaOwnership)
      .where(
        and(
          eq(villaOwnership.villaId, villaId),
          eq(villaOwnership.isActive, true),
        ),
      )
      .limit(1);

    return existingOwnership.length === 0;
  }

  // Check if user already has a pending or approved claim for this villa
  static async hasUserClaimedVilla(
    villaId: number,
    userId: number,
  ): Promise<{
    hasClaim: boolean;
    status?: string;
    claimId?: string;
  }> {
    const existingClaim = await db
      .select()
      .from(villaOwnershipClaim)
      .where(
        and(
          eq(villaOwnershipClaim.villaId, villaId),
          eq(villaOwnershipClaim.userId, userId),
        ),
      )
      .orderBy(desc(villaOwnershipClaim.createdAt))
      .limit(1);

    if (existingClaim.length === 0) {
      return { hasClaim: false };
    }

    const claim = existingClaim[0];
    return {
      hasClaim: true,
      status: claim.status,
      claimId: claim.id,
    };
  }

  // Submit a new ownership claim
  static async submitClaim(claimData: {
    villaId: number;
    userId: string;
    claimReason: string;
    ownershipProof?: string;
    contactVerification?: string;
    additionalInfo?: string;
    verificationCode: string;
  }): Promise<VillaOwnershipClaim> {
    // Check if villa is claimable
    const isClaimable = await this.isVillaClaimable(claimData.villaId);
    if (!isClaimable) {
      throw new Error("This villa is already owned by another user");
    }

    // Check if user already has a claim
    const { hasClaim, status } = await this.hasUserClaimedVilla(
      claimData.villaId,
      claimData.userId,
    );
    if (
      hasClaim &&
      (status === "pending" ||
        status === "under_review" ||
        status === "approved")
    ) {
      throw new Error("You already have an active claim for this villa");
    }

    // Insert new claim
    const [newClaim] = await db
      .insert(villaOwnershipClaim)
      .values({
        villaId: claimData.villaId,
        userId: claimData.userId,
        claimReason: claimData.claimReason,
        ownershipProof: claimData.ownershipProof,
        contactVerification: claimData.contactVerification,
        additionalInfo: claimData.additionalInfo,
        verificationCode: claimData.verificationCode,
        status: "pending",
      })
      .returning();

    return newClaim;
  }

  // Get user's ownership claims
  static async getUserClaims(userId: string): Promise<
    (VillaOwnershipClaim & {
      villa: {
        title: string;
        slug: string;
        thumbnail: { imageUrl: string; thumbnailUrl: string | null } | null;
      };
    })[]
  > {
    const results = await db
      .select({
        id: villaOwnershipClaim.id,
        villaId: villaOwnershipClaim.villaId,
        userId: villaOwnershipClaim.userId,
        claimReason: villaOwnershipClaim.claimReason,
        ownershipProof: villaOwnershipClaim.ownershipProof,
        contactVerification: villaOwnershipClaim.contactVerification,
        additionalInfo: villaOwnershipClaim.additionalInfo,
        verificationCode: villaOwnershipClaim.verificationCode,
        status: villaOwnershipClaim.status,
        reviewedBy: villaOwnershipClaim.reviewedBy,
        reviewedAt: villaOwnershipClaim.reviewedAt,
        rejectionReason: villaOwnershipClaim.rejectionReason,
        adminNotes: villaOwnershipClaim.adminNotes,
        createdAt: villaOwnershipClaim.createdAt,
        updatedAt: villaOwnershipClaim.updatedAt,
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
        },
      })
      .from(villaOwnershipClaim)
      .innerJoin(villa, eq(villaOwnershipClaim.villaId, villa.id))
      .where(eq(villaOwnershipClaim.userId, userId))
      .orderBy(desc(villaOwnershipClaim.createdAt));

    // Fetch thumbnails for each villa
    const claimsWithThumbnails = await Promise.all(
      results.map(async (claim) => {
        const [firstImage] = await db
          .select({
            imageUrl: villaImage.imageUrl,
            thumbnailUrl: villaImage.thumbnailUrl,
          })
          .from(villaImage)
          .where(eq(villaImage.villaId, claim.villa.id))
          .orderBy(asc(villaImage.orderIndex))
          .limit(1);

        return {
          ...claim,
          villa: {
            title: claim.villa.title,
            slug: claim.villa.slug,
            thumbnail: firstImage || null,
          },
        };
      }),
    );

    return claimsWithThumbnails;
  }

  // Cancel a claim (user function - only for pending claims)
  static async cancelClaim(
    claimId: string,
    userId: string,
  ): Promise<VillaOwnershipClaim> {
    // Get the claim
    const [claim] = await db
      .select()
      .from(villaOwnershipClaim)
      .where(
        and(
          eq(villaOwnershipClaim.id, claimId),
          eq(villaOwnershipClaim.userId, userId),
        ),
      )
      .limit(1);

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Only allow canceling pending or under_review claims
    if (claim.status !== "pending" && claim.status !== "under_review") {
      throw new Error("Only pending or under review claims can be canceled");
    }

    const [updatedClaim] = await db
      .update(villaOwnershipClaim)
      .set({
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(eq(villaOwnershipClaim.id, claimId))
      .returning();

    return updatedClaim;
  }

  // Get user's owned villas
  static async getUserOwnedVillas(userId: number): Promise<
    (VillaOwnership & {
      villa: {
        title: string;
        slug: string;
        id: number;
        status: string;
        thumbnail: { imageUrl: string; thumbnailUrl: string | null } | null;
      };
    })[]
  > {
    const results = await db
      .select({
        id: villaOwnership.id,
        villaId: villaOwnership.villaId,
        userId: villaOwnership.userId,
        claimId: villaOwnership.claimId,
        ownershipType: villaOwnership.ownershipType,
        verificationLevel: villaOwnership.verificationLevel,
        canEditImmediately: villaOwnership.canEditImmediately,
        canEditPricing: villaOwnership.canEditPricing,
        isActive: villaOwnership.isActive,
        transferredAt: villaOwnership.transferredAt,
        transferredTo: villaOwnership.transferredTo,
        createdAt: villaOwnership.createdAt,
        updatedAt: villaOwnership.updatedAt,
        villa: {
          id: villa.id,
          title: villa.title,
          slug: villa.slug,
          status: villa.status,
        },
      })
      .from(villaOwnership)
      .innerJoin(villa, eq(villaOwnership.villaId, villa.id))
      .where(
        and(
          eq(villaOwnership.userId, userId),
          eq(villaOwnership.isActive, true),
        ),
      )
      .orderBy(desc(villaOwnership.createdAt));

    // Fetch thumbnails for each villa
    const villasWithThumbnails = await Promise.all(
      results.map(async (ownership) => {
        const [firstImage] = await db
          .select({
            imageUrl: villaImage.imageUrl,
            thumbnailUrl: villaImage.thumbnailUrl,
          })
          .from(villaImage)
          .where(eq(villaImage.villaId, ownership.villa.id))
          .orderBy(asc(villaImage.orderIndex))
          .limit(1);

        return {
          ...ownership,
          villa: {
            ...ownership.villa,
            thumbnail: firstImage || null,
          },
        };
      }),
    );

    return villasWithThumbnails;
  }

  // Check if user owns a specific villa
  static async isUserVillaOwner(
    villaId: number,
    userId: number,
  ): Promise<VillaOwnership | null> {
    const ownership = await db
      .select()
      .from(villaOwnership)
      .where(
        and(
          eq(villaOwnership.villaId, villaId),
          eq(villaOwnership.userId, userId),
          eq(villaOwnership.isActive, true),
        ),
      )
      .limit(1);

    return ownership.length > 0 ? ownership[0] : null;
  }

  // Approve a claim (admin function)
  static async approveClaim(
    claimId: string,
    reviewerId: string,
    adminNotes?: string,
  ): Promise<{ claim: VillaOwnershipClaim; ownership: VillaOwnership }> {
    // Get the claim
    const [claim] = await db
      .select()
      .from(villaOwnershipClaim)
      .where(eq(villaOwnershipClaim.id, claimId))
      .limit(1);

    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "pending" && claim.status !== "under_review") {
      throw new Error("Claim is not in a reviewable state");
    }

    // Check if villa is still claimable
    const isClaimable = await this.isVillaClaimable(claim.villaId);
    if (!isClaimable) {
      throw new Error("Villa is no longer claimable");
    }

    // Start transaction
    const [updatedClaim] = await db
      .update(villaOwnershipClaim)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(villaOwnershipClaim.id, claimId))
      .returning();

    // Create ownership record
    const [ownership] = await db
      .insert(villaOwnership)
      .values({
        villaId: claim.villaId,
        userId: claim.userId,
        claimId: claim.id,
        ownershipType: "owner",
        verificationLevel: "basic",
        canEditImmediately: true,
        canEditPricing: false,
        isActive: true,
      })
      .returning();

    // Update villa owner
    await db
      .update(villa)
      .set({
        ownerId: claim.userId,
        updatedAt: new Date(),
      })
      .where(eq(villa.id, claim.villaId));

    // Update user role to include owner if not already
    await db
      .update(user)
      .set({
        role: "owner",
        updatedAt: new Date(),
      })
      .where(eq(user.id, claim.userId));

    return { claim: updatedClaim, ownership };
  }

  // Reject a claim (admin function)
  static async rejectClaim(
    claimId: string,
    reviewerId: string,
    rejectionReason: string,
    adminNotes?: string,
  ): Promise<VillaOwnershipClaim> {
    const [updatedClaim] = await db
      .update(villaOwnershipClaim)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(villaOwnershipClaim.id, claimId))
      .returning();

    return updatedClaim;
  }

  // Get all pending claims for admin review
  static async getPendingClaims(): Promise<
    (VillaOwnershipClaim & {
      villa: { title: string; slug: string };
      user: { fullName: string; email: string };
    })[]
  > {
    return await db
      .select({
        id: villaOwnershipClaim.id,
        villaId: villaOwnershipClaim.villaId,
        userId: villaOwnershipClaim.userId,
        claimReason: villaOwnershipClaim.claimReason,
        ownershipProof: villaOwnershipClaim.ownershipProof,
        contactVerification: villaOwnershipClaim.contactVerification,
        additionalInfo: villaOwnershipClaim.additionalInfo,
        verificationCode: villaOwnershipClaim.verificationCode,
        status: villaOwnershipClaim.status,
        reviewedBy: villaOwnershipClaim.reviewedBy,
        reviewedAt: villaOwnershipClaim.reviewedAt,
        rejectionReason: villaOwnershipClaim.rejectionReason,
        adminNotes: villaOwnershipClaim.adminNotes,
        createdAt: villaOwnershipClaim.createdAt,
        updatedAt: villaOwnershipClaim.updatedAt,
        villa: {
          title: villa.title,
          slug: villa.slug,
        },
        user: {
          fullName: user.fullName,
          email: user.email,
        },
      })
      .from(villaOwnershipClaim)
      .innerJoin(villa, eq(villaOwnershipClaim.villaId, villa.id))
      .innerJoin(user, eq(villaOwnershipClaim.userId, user.id))
      .where(eq(villaOwnershipClaim.status, "pending"))
      .orderBy(desc(villaOwnershipClaim.createdAt));
  }
}

