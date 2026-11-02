import { VillaService } from "$lib/server/services/villa.service";
import { redirect, fail } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import {
  validatePhoneNumber,
  getPhoneValidationMessage,
  isLatLonValid,
} from "$lib/utils/validation";
import type { Actions, PageServerLoad } from "./$types";
import { mapKeywordsByAddress } from "$lib/server/utils/locationMapper";

export const load: PageServerLoad = async () => {
  return {};
};

export const actions = {
  default: onlyAdmin(async ({ request, locals }) => {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const priceMin = formData.get("priceMin") as string;
    const priceMax = formData.get("priceMax") as string;
    const unitsCount = Number(formData.get("unitsCount")) || 1;
    const bedroomMin = Number(formData.get("bedroomMin")) || 0;
    const bedroomMax = Number(formData.get("bedroomMax")) || 0;
    const personCapacityMin = Number(formData.get("personCapacityMin")) || 0;
    const personCapacityMax = Number(formData.get("personCapacityMax")) || 0;
    const hasAc = formData.get("hasAc") === "on";
    const hasBathtub = formData.get("hasBathtub") === "on";
    const hasTv = formData.get("hasTv") === "on";
    const hasBreakfast = formData.get("hasBreakfast") === "on";
    const hasPool = formData.get("hasPool") === "on";
    const isKidFriendly = formData.get("isKidFriendly") === "on";
    const isPetFriendly = formData.get("isPetFriendly") === "on";
    const isSeniorFriendly = formData.get("isSeniorFriendly") === "on";
    const isSyaria = formData.get("isSyaria") === "on";
    const description = formData.get("description") as string;
    const address = formData.get("address") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const googleMapsLink = formData.get("googleMapsLink") as string;
    const googlePlaceId = formData.get("googlePlaceId") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const status = formData.get("status") as "draft" | "published";
    const provinceId = formData.get("provinceId") as string;
    const cityId = formData.get("cityId") as string;

    // validate latitude and longitude
    if (isLatLonValid(latitude) === false) {
      return fail(400, { error: "Invalid latitude format" });
    }
    if (isLatLonValid(longitude) === false) {
      return fail(400, { error: "Invalid longitude format" });
    }

    // Parse custom amenities
    const amenityNames = formData.getAll("amenityName") as string[];
    const amenityDescriptions = formData.getAll(
      "amenityDescription",
    ) as string[];
    const amenityCategories = formData.getAll("amenityCategory") as string[];
    const amenityScores = formData.getAll("amenityScore") as string[];

    // Phone number validation is now imported from validation utility

    const amenities = amenityNames
      .map((name, index) => ({
        name: name,
        description: amenityDescriptions[index] || "",
        category: amenityCategories[index] || "additional",
        score: Number(amenityScores[index]) || 1,
      }))
      .filter((amenity) => amenity.name.trim() !== "");

    // Validate required fields
    if (!title || !priceMin || !priceMax || !address || !phoneNumber) {
      return fail(400, {
        error: "Please fill in all required fields",
      });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return fail(400, {
        error: getPhoneValidationMessage(),
      });
    }

    // Validate price format
    const priceMinNum = parseFloat(priceMin);
    const priceMaxNum = parseFloat(priceMax);
    if (isNaN(priceMinNum) || isNaN(priceMaxNum)) {
      return fail(400, {
        error: "Invalid price format",
      });
    }
    if (priceMinNum > priceMaxNum) {
      return fail(400, {
        error: "Minimum price cannot be greater than maximum price",
      });
    }

    let mappedKeywords: string[] = mapKeywordsByAddress(address);

    let villa;

    try {
      console.log("Creating villa with data:", {
        title,
        priceMin,
        priceMax,
        unitsCount,
        bedroomMin,
        bedroomMax,
        personCapacityMin,
        personCapacityMax,
        hasAc,
        hasBathtub,
        hasTv,
        hasBreakfast,
        hasPool,
        description,
        address,
        latitude,
        longitude,
        googleMapsLink,
        googlePlaceId,
        phoneNumber,
        status,
        createdBy: locals.user!.id,
      });

      const slug = await VillaService.generateSlug(title);
      console.log("Generated slug:", slug);

      villa = await VillaService.create({
        title,
        slug,
        priceMin,
        priceMax,
        unitsCount,
        bedroomMin,
        bedroomMax,
        personCapacityMin,
        personCapacityMax,
        hasAc,
        hasBathtub,
        hasTv,
        hasBreakfast,
        hasPool,
        isKidFriendly,
        isPetFriendly,
        isSeniorFriendly,
        isSyaria,
        description: description || undefined,
        address,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        googleMapsLink: googleMapsLink || undefined,
        googlePlaceId,
        phoneNumber,
        status,
        provinceId: provinceId || undefined,
        cityId: cityId || undefined,
        createdBy: locals.user!.id,
        keywords: mappedKeywords,
      });

      console.log("Villa created:", villa.id);

      // Add custom amenities to the villa
      for (const amenity of amenities) {
        await VillaService.addAmenity(villa.id, amenity);
      }

      // Get external data from third-party services (e.g., Google Maps)
      // and update villa data accordingly
      VillaService.updateVillaPlaceData(villa.id);

      // console.log("Redirecting to villa edit page...");
    } catch (error) {
      console.error("Villa creation error:", error);
      return fail(500, {
        error: `Failed to create villa: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Redirect outside of try-catch block to avoid catching redirect exception
    // redirect(302, `/admin/villas/${villa.id}?created=true`);
    //
    return {
      success: true,
      nextUrl: `/admin/villas/${villa.id}`,
    };
  }),
} satisfies Actions;
