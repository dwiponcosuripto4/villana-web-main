import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";
import { imageService } from "$lib/server/image";

export const load: PageServerLoad = async ({ params }) => {
  const { villa1, villa2 } = params;

  // Validate that both slugs are provided
  if (!villa1 || !villa2) {
    throw error(400, "Both villa slugs are required for comparison");
  }

  // Validate that the slugs are different
  if (villa1 === villa2) {
    throw error(400, "Cannot compare a villa with itself");
  }

  // Load full villa data for both villas
  const [villa1Data, villa2Data] = await Promise.all([
    VillaService.findBySlug(villa1),
    VillaService.findBySlug(villa2),
  ]);

  if (!villa1Data || villa1Data.status !== "published") {
    throw error(404, "First villa not found");
  }

  if (!villa2Data || villa2Data.status !== "published") {
    throw error(404, "Second villa not found");
  }

  // Generate optimized OG image URL from first villa's primary image
  const primaryImageUrl =
    villa1Data.images?.length > 0
      ? villa1Data.images[0].imageUrl
      : villa2Data.images?.length > 0
        ? villa2Data.images[0].imageUrl
        : null;

  const ogImageUrl = primaryImageUrl
    ? imageService.getOgImageUrl(primaryImageUrl)
    : null;

  return {
    villa1: villa1Data,
    villa2: villa2Data,
    ogImageUrl,
  };
};
