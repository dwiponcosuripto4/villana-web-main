import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { villa } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { VillaOwnershipService } from "$lib/server/services/villa-ownership.service";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const PUBLIC_TURNSTILE_SITE_KEY = process.env.PUBLIC_TURNSTILE_SITE_KEY || "";

// Generate a random 5-digit verification code
function generateVerificationCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export const load: PageServerLoad = async ({ params, locals }) => {
  // Require authentication
  if (!locals.user) {
    throw redirect(302, `/login?redirect=/villa/${params.slug}/claim`);
  }

  // Get villa data
  const [villaData] = await db
    .select({
      id: villa.id,
      title: villa.title,
      slug: villa.slug,
      ownerId: villa.ownerId,
      phoneNumber: villa.phoneNumber,
      address: villa.address,
    })
    .from(villa)
    .where(eq(villa.slug, params.slug))
    .limit(1);

  if (!villaData) {
    throw redirect(302, "/explore");
  }

  // Check if villa is already owned
  const isClaimable = await VillaOwnershipService.isVillaClaimable(
    villaData.id,
  );

  // Check if user already has a claim
  const { hasClaim, status, claimId } =
    await VillaOwnershipService.hasUserClaimedVilla(
      villaData.id,
      locals.user.id,
    );

  // Check if user is already the owner
  const isOwner = await VillaOwnershipService.isUserVillaOwner(
    villaData.id,
    locals.user.id,
  );

  return {
    villa: villaData,
    user: locals.user,
    isClaimable,
    hasClaim,
    claimStatus: status,
    claimId,
    isOwner: !!isOwner,
    turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY,
  };
};

export const actions: Actions = {
  submitClaim: async ({ params, locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: "You must be logged in to claim a villa" });
    }

    try {
      const formData = await request.formData();
      const claimReason = formData.get("claimReason") as string;
      const ownershipProof = formData.get("ownershipProof") as string;
      const contactVerification = formData.get("contactVerification") as string;
      const additionalInfo = formData.get("additionalInfo") as string;
      const turnstileToken = formData.get("cf-turnstile-response") as string;

      // Validate Turnstile token
      if (!turnstileToken) {
        return fail(400, {
          error: "Please complete the captcha verification",
          values: {
            claimReason,
            ownershipProof,
            contactVerification,
            additionalInfo,
          },
        });
      }

      // Verify Turnstile token with Cloudflare
      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: TURNSTILE_SECRET_KEY || "",
            response: turnstileToken,
          }),
        },
      );

      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        return fail(400, {
          error: "Captcha verification failed. Please try again.",
          values: {
            claimReason,
            ownershipProof,
            contactVerification,
            additionalInfo,
          },
        });
      }

      if (!claimReason || claimReason.trim().length < 10) {
        return fail(400, {
          error:
            "Please provide a detailed reason for your claim (minimum 10 characters)",
          values: {
            claimReason,
            ownershipProof,
            contactVerification,
            additionalInfo,
          },
        });
      }

      // Get villa ID
      const [villaData] = await db
        .select({ id: villa.id })
        .from(villa)
        .where(eq(villa.slug, params.slug))
        .limit(1);

      if (!villaData) {
        return fail(404, { error: "Villa not found" });
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Submit the claim
      const claim = await VillaOwnershipService.submitClaim({
        villaId: villaData.id,
        userId: locals.user.id,
        claimReason: claimReason.trim(),
        ownershipProof: ownershipProof?.trim() || undefined,
        contactVerification: contactVerification?.trim() || undefined,
        additionalInfo: additionalInfo?.trim() || undefined,
        verificationCode,
      });

      return {
        success: true,
        claimId: claim.id,
        verificationCode,
        message:
          "Klaim villa berhasil diajukan! Tim kami akan menghubungi nomor telepon villa untuk verifikasi.",
      };
    } catch (error) {
      console.error("Error submitting villa claim:", error);
      return fail(500, {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit claim. Please try again.",
      });
    }
  },
};

