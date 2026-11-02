import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { user, villa, villaOwnership, villaOwnershipClaim } from "$lib/server/db/schema";
import { eq, or } from "drizzle-orm";
import { resolveUserLanguage } from "$lib/server/language-utils";

export const load: LayoutServerLoad = async ({ locals, request }) => {
  // Ensure user is authenticated
  if (!locals.user) {
    throw redirect(302, "/register");
  }

  // Get full user data from database
  const dbUser = await db
    .select()
    .from(user)
    .where(eq(user.id, locals.user.id))
    .limit(1);

  if (dbUser.length === 0) {
    throw redirect(302, "/register");
  }

  const userData = dbUser[0];

  // Check if user has any owned villas or pending claims
  const [ownedVillas, pendingClaims] = await Promise.all([
    // Check for owned villas
    db
      .select({ count: villa.id })
      .from(villa)
      .where(eq(villa.ownerId, userData.id))
      .limit(1),

    // Check for pending claims
    db
      .select({ count: villaOwnershipClaim.id })
      .from(villaOwnershipClaim)
      .where(eq(villaOwnershipClaim.userId, userData.id))
      .limit(1)
  ]);

  const hasVillaActivity = ownedVillas.length > 0 || pendingClaims.length > 0;

  // Resolve user's language preference
  const resolvedLanguage = await resolveUserLanguage(userData, request);

  return {
    user: {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
      address: userData.address,
      profilePicture: userData.profilePicture,
      registrationMethod: userData.registrationMethod,
      emailVerified: userData.emailVerified,
      role: userData.role,
      locale: userData.locale || 'auto', // Fallback if field doesn't exist yet
      createdAt: userData.createdAt,
    },
    hasVillaActivity,
    language: {
      current: resolvedLanguage,
      userPreference: userData.locale || 'auto' // Fallback if field doesn't exist yet
    }
  };
};
