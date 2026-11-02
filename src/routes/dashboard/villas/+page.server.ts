import { redirect, error, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { VillaOwnershipService } from "$lib/server/services/villa-ownership.service";

export const load: PageServerLoad = async ({ locals }) => {
  // Require authentication
  if (!locals.user) {
    throw redirect(302, "/login?redirect=/dashboard/villas");
  }

  try {
    // Get user's ownership claims and owned villas
    const [claims, ownedVillas] = await Promise.all([
      VillaOwnershipService.getUserClaims(locals.user.id),
      VillaOwnershipService.getUserOwnedVillas(locals.user.id),
    ]);

    // If user has no villa activity (no claims and no owned villas), show 404
    if (claims.length === 0 && ownedVillas.length === 0) {
      throw error(404, "Not Found");
    }

    return {
      user: locals.user,
      claims,
      ownedVillas,
    };
  } catch (err) {
    // If it's already an error we threw (like 404), re-throw it
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    console.error("Error loading villa ownership data:", err);
    return {
      user: locals.user,
      claims: [],
      ownedVillas: [],
      error: "Failed to load villa data",
    };
  }
};

export const actions: Actions = {
  cancelClaim: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, "/login?redirect=/dashboard/villas");
    }

    const formData = await request.formData();
    const claimId = formData.get("claimId") as string;

    if (!claimId) {
      return fail(400, { error: "Claim ID is required" });
    }

    try {
      await VillaOwnershipService.cancelClaim(claimId, locals.user.id);
      return { success: true };
    } catch (err) {
      console.error("Error canceling claim:", err);
      return fail(400, {
        error: err instanceof Error ? err.message : "Failed to cancel claim",
      });
    }
  },
};