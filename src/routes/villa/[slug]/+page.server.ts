import {
  VillaService,
  type VillaWithRelations,
} from "$lib/server/services/villa.service";
import { VillaOwnershipService } from "$lib/server/services/villa-ownership.service";
import { OtaService } from "$lib/server/services/ota.service";
import { OtherVillasService } from "$lib/server/services/other-villas.service";
import { imageService } from "$lib/server/image";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { GoogleMapsService } from "$lib/utils/google-maps";
import { calcPVR, normalizeRating } from "$lib/utils/formula";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const villa = await VillaService.findBySlug(params.slug);

  if (!villa || villa.status !== "published") {
    throw error(404, "Villa not found");
  }

  // console.log(JSON.stringify(villa, null, 2));

  deferToUpdate(villa, locals.user);

  // Get other villas (nearby within 15km or same city, sorted by PVR)
  const otherVillas = await OtherVillasService.getOtherVillas(villa.id, {
    latitude: villa.latitude,
    longitude: villa.longitude,
    cityId: villa.cityId,
  });

  // Get nearby places pagination parameters
  const nearbyPage = Number(url.searchParams.get("nearbyPage")) || 1;
  const nearbyLimit = 5; // Fixed limit for nearby places display

  // Try to get villa places using new structure, with fallback to old structure
  let villaPlacesData: any = { places: [], pagination: null };
  try {
    villaPlacesData = await VillaService.getVillaPlaces(villa.id, {
      page: nearbyPage,
      limit: nearbyLimit,
    });
    console.log(
      `Villa ${villa.id} (${villa.slug}): Found ${villaPlacesData.places.length} places (page ${nearbyPage})`,
    );
  } catch (error) {
    // Continue with old structure if new one isn't available
    console.log("Using legacy nearby places structure for villa:", villa.slug);
    villaPlacesData = { places: [], pagination: null };
  }

  // Check if villa is claimable (not already owned)
  const isClaimable = await VillaOwnershipService.isVillaClaimable(villa.id);

  // Get active OTA links for this villa
  let otaLinks: Awaited<
    ReturnType<typeof OtaService.getActiveOtaLinksByVillaId>
  > = [];
  try {
    otaLinks = await OtaService.getActiveOtaLinksByVillaId(villa.id);
  } catch (err) {
    console.warn("Failed to load OTA links:", err);
  }

  // Generate optimized OG image URL
  const ogImageUrl =
    villa.images?.length > 0
      ? imageService.getOgImageUrl(villa.images[0].imageUrl)
      : null;

  return {
    villa,
    otherVillas,
    villaPlaces: villaPlacesData.places,
    villaPlacesPagination: villaPlacesData.pagination,
    isAdmin: locals.user?.role === "admin",
    user: locals.user,
    isClaimable,
    otaLinks,
    ogImageUrl,
  };
};

type TUser = { id: string; username: string; role: string } | null;

/**
 * This function defers non-critical updates to be performed asynchronously.
 * For example, updating villa data from external sources.
 */
async function deferToUpdate(villa: VillaWithRelations, user: TUser) {
  // Defer non-critical updates (e.g., view count increment, update place information from Google Maps, etc)
  await VillaService.updateVillaPlaceData(villa);
}
