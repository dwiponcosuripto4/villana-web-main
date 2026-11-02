import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { placeService } from "$lib/server/services/place.service";
import type { CreatePlaceInput, PlaceSearchParams } from "$lib/types/place";
import { onlyAdmin } from "$lib/server/auth-utils";

export const GET: RequestHandler = onlyAdmin(async ({ url, locals }) => {
  try {
    const searchParams: PlaceSearchParams = {
      query: url.searchParams.get("query") || undefined,
      type: url.searchParams.get("type") || undefined,
      category: url.searchParams.get("category") || undefined,
      cityId: url.searchParams.get("cityId") || undefined,
      provinceId: url.searchParams.get("provinceId") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "20"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const places = await placeService.search(searchParams);
    return json({ places });
  } catch (error) {
    console.error("Failed to fetch places:", error);
    return json({ error: "Failed to fetch places" }, { status: 500 });
  }
});

export const POST: RequestHandler = onlyAdmin(async ({ request, locals }) => {
  try {
    const input: CreatePlaceInput = await request.json();

    // Comprehensive validation
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push("Name is required");
    } else if (input.name.length > 255) {
      errors.push("Name must be 255 characters or less");
    }

    if (typeof input.latitude !== "number" || isNaN(input.latitude)) {
      errors.push("Valid latitude is required");
    } else if (input.latitude < -90 || input.latitude > 90) {
      errors.push("Latitude must be between -90 and 90");
    }

    if (typeof input.longitude !== "number" || isNaN(input.longitude)) {
      errors.push("Valid longitude is required");
    } else if (input.longitude < -180 || input.longitude > 180) {
      errors.push("Longitude must be between -180 and 180");
    }

    if (input.slug && input.slug.length > 255) {
      errors.push("Slug must be 255 characters or less");
    }

    if (input.description && input.description.length > 2000) {
      errors.push("Description must be 2000 characters or less");
    }

    if (input.address && input.address.length > 500) {
      errors.push("Address must be 500 characters or less");
    }

    // validate city and province IDs must exists
    if (!input.cityId || !input.provinceId) {
      errors.push("Please select a city");
    }

    if (input.mainImage && input.mainImage.length > 500) {
      errors.push("Main image URL must be 500 characters or less");
    }

    if (input.metaTitle && input.metaTitle.length > 60) {
      errors.push("Meta title should be 60 characters or less for SEO");
    }

    if (input.metaDescription && input.metaDescription.length > 160) {
      errors.push("Meta description should be 160 characters or less for SEO");
    }

    if (errors.length > 0) {
      return json(
        { error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    // check is already exists by slug
    if (input.slug) {
      const existingPlace = await placeService.getBySlug(input.slug);
      if (existingPlace) {
        return json(
          { error: `A place with this slug (${input.slug}) already exists` },
          { status: 409 },
        );
      }
    }

    const newPlace = await placeService.create(input);
    return json({ place: newPlace }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create place:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      // Unique constraint violation
      return json(
        { error: "A place with this slug already exists" },
        { status: 409 },
      );
    }

    return json({ error: "Failed to create place" }, { status: 500 });
  }
});
