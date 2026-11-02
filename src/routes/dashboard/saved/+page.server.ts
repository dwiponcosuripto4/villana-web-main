import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { savedVilla, villa } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      villas: [],
      isAuthenticated: false,
      dbError: false,
    };
  }

  try {
    // Get saved villas for authenticated user
    const userSavedVillas = await db
      .select({
        villaId: savedVilla.villaId,
        savedAt: savedVilla.savedAt,
        villa: villa,
      })
      .from(savedVilla)
      .innerJoin(villa, eq(savedVilla.villaId, villa.id))
      .where(eq(savedVilla.userId, locals.user.id))
      .orderBy(savedVilla.savedAt);

    return {
      villas: userSavedVillas.map((item) => item.villa),
      isAuthenticated: true,
      dbError: false,
    };
  } catch (error) {
    console.error("Error loading saved villas:", error);
    return {
      villas: [],
      isAuthenticated: true,
      dbError: true,
    };
  }
};
