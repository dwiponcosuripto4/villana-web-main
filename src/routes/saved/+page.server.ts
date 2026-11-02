import type { PageServerLoad } from "./$types";
import { SavedVillaService } from "$lib/server/services/savedVilla.service";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  // For authenticated users, try to get saved villas from server
  if (user) {
    try {
      const savedVillasWithDetails = await SavedVillaService.getSavedVillas(
        user.id,
      );

      // Transform to match the structure expected by the villa cards
      const villas = savedVillasWithDetails.map((saved) => saved.villa);
      const villaCount = await SavedVillaService.countSavedVillas(user.id);

      return {
        villas,
        isAuthenticated: true,
        villaCount,
        dbError: false,
        user,
      };
    } catch (error) {
      console.error("Database error loading saved villas:", error);
      // If database fails, fall back to client-side loading
      return {
        villas: [],
        isAuthenticated: true,
        dbError: true,
        user,
      };
    }
  }

  // For anonymous users, return empty array - they'll load from localStorage on client side
  return {
    villas: [],
    isAuthenticated: false,
    dbError: false,
    user: null,
  };
};
