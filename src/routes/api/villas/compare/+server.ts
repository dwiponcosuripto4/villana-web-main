import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";
import { groupAmenitiesByCategory } from "$lib/utils/amenity-categories";

export const GET: RequestHandler = async ({ url }) => {
  const ids = url.searchParams.get("ids");

  if (!ids) {
    return json({ error: "No villa IDs provided" }, { status: 400 });
  }

  const villaIds = ids
    .split(",")
    .filter(Boolean)
    .map((id) => parseInt(id, 10));

  if (villaIds.length !== 2) {
    return json(
      { error: "Please provide exactly 2 villa IDs" },
      { status: 400 },
    );
  }

  if (villaIds.some((id) => isNaN(id))) {
    return json({ error: "Invalid villa ID format" }, { status: 400 });
  }

  try {
    const [villa1, villa2] = await Promise.all(
      villaIds.map((id) => VillaService.findById(id)),
    );

    if (!villa1 || !villa2) {
      return json({ error: "One or more villas not found" }, { status: 404 });
    }

    // Use the new fixed categorization system for better comparison matching

    // Prepare comparison data
    const comparisonData = {
      villa1: {
        id: villa1.id,
        title: villa1.title,
        slug: villa1.slug,
        priceMin: villa1.priceMin,
        priceMax: villa1.priceMax,
        bedroomMin: villa1.bedroomMin,
        bedroomMax: villa1.bedroomMax,
        bedSizes: villa1.bedSizes,
        unitsCount: villa1.unitsCount,
        address: villa1.address,
        phoneNumber: villa1.phoneNumber,
        description: villa1.description,
        images: villa1.images,
        standardAmenities: {
          hasAc: villa1.hasAc,
          hasBathtub: villa1.hasBathtub,
          hasTv: villa1.hasTv,
          hasBreakfast: villa1.hasBreakfast,
        },
        amenities: groupAmenitiesByCategory(villa1.amenities),
        googleRating: villa1.googleRating,
        googleRatingCount: villa1.googleRatingCount,
        pvr: villa1.pvr ? villa1.pvr.slice(0, 3) : "-",
      },
      villa2: {
        id: villa2.id,
        title: villa2.title,
        slug: villa2.slug,
        priceMin: villa2.priceMin,
        priceMax: villa2.priceMax,
        bedroomMin: villa2.bedroomMin,
        bedroomMax: villa2.bedroomMax,
        bedSizes: villa2.bedSizes,
        unitsCount: villa2.unitsCount,
        address: villa2.address,
        phoneNumber: villa2.phoneNumber,
        description: villa2.description,
        images: villa2.images,
        standardAmenities: {
          hasAc: villa2.hasAc,
          hasBathtub: villa2.hasBathtub,
          hasTv: villa2.hasTv,
          hasBreakfast: villa2.hasBreakfast,
        },
        amenities: groupAmenitiesByCategory(villa2.amenities),
        googleRating: villa2.googleRating,
        googleRatingCount: villa2.googleRatingCount,
        pvr: villa2.pvr ? villa2.pvr.slice(0, 3) : "-",
      },
      // Helper data for UI
      differences: {
        price:
          villa1.priceMin !== villa2.priceMin ||
          villa1.priceMax !== villa2.priceMax,
        bedrooms:
          villa1.bedroomMin !== villa2.bedroomMin ||
          villa1.bedroomMax !== villa2.bedroomMax,
        standardAmenities: {
          hasAc: villa1.hasAc !== villa2.hasAc,
          hasBathtub: villa1.hasBathtub !== villa2.hasBathtub,
          hasTv: villa1.hasTv !== villa2.hasTv,
          hasBreakfast: villa1.hasBreakfast !== villa2.hasBreakfast,
        },
        googleRating: villa1.googleRating !== villa2.googleRating,
        pvr: villa1.pvr !== villa2.pvr,
      },
    };

    return json(comparisonData);
  } catch (error) {
    console.error("Error comparing villas:", error);
    return json({ error: "Failed to compare villas" }, { status: 500 });
  }
};
