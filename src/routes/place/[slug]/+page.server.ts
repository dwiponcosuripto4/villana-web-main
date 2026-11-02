import { placeService } from "$lib/server/services/place.service";
import { imageService } from "$lib/server/image";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const place = await placeService.findBySlug(params.slug);

  // Get sort parameter with validation
  const sortByParam = url.searchParams.get("sortBy");
  const validSortOptions = ["distance", "pvr", "google_rating", "newest"];
  const sortBy = validSortOptions.includes(sortByParam || "")
    ? sortByParam
    : "pvr";

  if (!place || place.status !== "published") {
    throw error(404, "Place not found");
  }

  // Get nearby places for recommendations
  const nearbyPlaces =
    place.latitude && place.longitude
      ? await placeService
          .findNearbyPlaces(
            parseFloat(place.latitude),
            parseFloat(place.longitude),
            10, // 10km radius
            6, // limit to 6 places
          )
          .then((places) => places.filter((p) => p.id !== place.id).slice(0, 5))
      : [];

  // Generate optimized OG image URL
  const primaryImageUrl = place.images?.[0]?.imageUrl || place.mainImage;
  const ogImageUrl = primaryImageUrl
    ? imageService.getOgImageUrl(primaryImageUrl)
    : null;

  return {
    user: locals.user,
    isAdmin: locals.user?.role === "admin",
    place,
    nearbyPlaces,
    sortBy,
    ogImageUrl,
    meta: {
      title: place.metaTitle || `${place.name} - Villana`,
      description:
        place.metaDescription ||
        `Discover ${place.name} and find nearby villas. ${place.description ? place.description.substring(0, 150) + "..." : ""}`,
      keywords: [
        place.name,
        place.type,
        place.category,
        place.city?.name,
        place.province?.name,
        "villa",
        "accommodation",
        "Indonesia",
      ]
        .filter(Boolean)
        .join(", "),
      image: place.mainImage,
      url: `/place/${place.slug}`,
      type: "place",
      place: {
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        type: place.type,
        category: place.category,
        rating: place.googleRating,
        ratingCount: place.googleRatingCount,
      },
    },
  };
};

