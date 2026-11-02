import { VillaService } from "$lib/server/services/villa.service";
import { OtaService } from "$lib/server/services/ota.service";
import { redirect, fail } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { Actions, PageServerLoad } from "./$types";
import { mapKeywordsByAddress } from "$lib/server/utils/locationMapper";
import { isLatLonValid } from "$lib/utils/validation";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

const UPLOAD_DIR = "static/uploads/villas";

export const load: PageServerLoad = async ({ params, url }) => {
  const villaId = parseInt(params.id, 10);

  if (isNaN(villaId)) {
    throw redirect(302, "/admin/villas");
  }

  const villa = await VillaService.findById(villaId);

  if (!villa) {
    throw redirect(302, "/admin/villas");
  }

  // Get linked places count
  let linkedPlacesCount = 0;
  try {
    const linkedPlaces = await VillaService.getVillaPlaces(villaId);
    linkedPlacesCount = linkedPlaces?.pagination.total || 0;
  } catch (error) {
    console.warn("Failed to load linked places count:", error);
  }

  // Get OTA links
  let otaLinks: Awaited<ReturnType<typeof OtaService.getOtaLinksByVillaId>> = [];
  try {
    otaLinks = await OtaService.getOtaLinksByVillaId(villaId);
  } catch (error) {
    console.warn("Failed to load OTA links:", error);
  }

  // Get creator information
  let creatorName = "Unknown";
  if (villa.createdBy) {
    try {
      const [creator] = await db
        .select()
        .from(user)
        .where(eq(user.id, villa.createdBy))
        .limit(1);

      if (creator) {
        creatorName =
          /*creator.fullName ||*/ creator.username ||
          creator.email ||
          "Unknown";
      }
    } catch (error) {
      console.warn("Failed to load creator information:", error);
    }
  }

  return {
    villa,
    created: url.searchParams.get("created") === "true",
    linkedPlacesCount,
    creatorName,
    otaLinks,
  };
};

export const actions = {
  updateStatus: onlyAdmin(async ({ request, params }) => {
    const villaId = parseInt(params.id, 10);

    if (isNaN(villaId)) {
      return fail(400, {
        error: "Invalid villa ID",
      });
    }

    const formData = await request.formData();
    const status = formData.get("status") as string;

    if (!status || (status !== "draft" && status !== "published")) {
      return fail(400, {
        error: "Invalid status value",
      });
    }

    try {
      await VillaService.update(villaId, {
        status,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error updating villa status:", error);
      return fail(500, {
        error: "Failed to update villa status",
      });
    }
  }),

  update: onlyAdmin(async ({ request, params }) => {
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
    const keywords = formData.get("keywords") as string;

    if (!title || !priceMin || !priceMax || !address || !phoneNumber) {
      return fail(400, {
        error: "Please fill in all required fields",
      });
    }

    if (!latitude) {
      return fail(400, {
        error: "Latitude is required, please enter latitude",
      });
    }

    if (!longitude) {
      return fail(400, {
        error: "Longitude is required, please enter latitude",
      });
    }

    // validate latitude and longitude
    if (isLatLonValid(latitude) === false) {
      return fail(400, { error: `Invalid latitude format: ${latitude}` });
    }
    if (isLatLonValid(longitude) === false) {
      return fail(400, { error: `Invalid longitude format: ${longitude}` });
    }

    try {
      const villaId = parseInt(params.id, 10);
      if (isNaN(villaId)) {
        return fail(400, {
          error: "Invalid villa ID",
        });
      }

      // const existingVila = await VillaService.findById(villaId);
      //
      // let mappedKeywords: string[] = existingVila?.keywords || [];
      let mappedKeywords: string[] = [];

      if (keywords) {
        const additionalKeywords = keywords
          .split(",")
          .map((kw) => kw.trim())
          .filter((kw) => kw.length > 0)
          .map((kw) => kw.toLowerCase());
        mappedKeywords = Array.from(
          new Set([...mappedKeywords, ...additionalKeywords]),
        );
      }

      await VillaService.update(villaId, {
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
        isKidFriendly,
        isPetFriendly,
        isSeniorFriendly,
        isSyaria,
        description: description || undefined,
        address,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        googleMapsLink: googleMapsLink || undefined,
        googlePlaceId: googlePlaceId || undefined,
        phoneNumber,
        status,
        provinceId: provinceId || undefined,
        cityId: cityId || undefined,
        keywords: mappedKeywords,
      });

      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to update villa",
      });
    }
  }),

  uploadImage: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const altText = formData.get("altText") as string;

    if (!file || file.size === 0) {
      return fail(400, {
        error: "Please select an image",
      });
    }

    if (!file.type.startsWith("image/")) {
      return fail(400, {
        error: "Please upload a valid image file",
      });
    }

    try {
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const villaId = parseInt(params.id, 10);
      if (isNaN(villaId)) {
        return fail(400, {
          error: "Invalid villa ID",
        });
      }

      const fileName = `${villaId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      const imageUrl = `/uploads/villas/${fileName}`;

      await VillaService.addImage(villaId, {
        imageUrl,
        thumbnailUrl: imageUrl, // In production, you'd generate a proper thumbnail
        altText: altText || undefined,
      });

      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to upload image",
      });
    }
  }),

  deleteImage: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;

    try {
      await VillaService.deleteImage(imageId);
      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to delete image",
      });
    }
  }),

  addAmenity: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const score = parseInt(formData.get("score") as string) || 0;

    if (!name) {
      return fail(400, {
        error: "Please provide amenity name",
      });
    }

    // Validate score range
    if (score < 0 || score > 3) {
      return fail(400, {
        error: "Score must be between 0 and 3",
      });
    }

    try {
      const villaId = parseInt(params.id, 10);
      if (isNaN(villaId)) {
        return fail(400, {
          error: "Invalid villa ID",
        });
      }

      await VillaService.addAmenity(villaId, {
        name,
        description,
        category: category || undefined,
        score,
      });

      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to add amenity",
      });
    }
  }),

  updateAmenity: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const amenityId = formData.get("amenityId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const score = parseInt(formData.get("score") as string) || 0;

    if (!amenityId) {
      return fail(400, {
        error: "Amenity ID is required",
      });
    }

    if (!name?.trim()) {
      return fail(400, {
        error: "Amenity name is required",
      });
    }

    // Validate score range
    if (score < 0 || score > 3) {
      return fail(400, {
        error: "Score must be between 0 and 3",
      });
    }

    try {
      await VillaService.updateAmenity(amenityId, {
        name: name.trim(),
        description: description?.trim() || undefined,
        category: category?.trim() || undefined,
        score,
      });

      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to update amenity",
      });
    }
  }),

  deleteAmenity: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const amenityId = formData.get("amenityId") as string;

    try {
      await VillaService.deleteAmenity(amenityId);
      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to delete amenity",
      });
    }
  }),

  uploadVideo: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const videoUrl = formData.get("videoUrl") as string;
    const altText = formData.get("altText") as string;
    const store = formData.get("store") as string;

    const villaId = parseInt(params.id, 10);
    if (isNaN(villaId)) {
      return fail(400, {
        error: "Invalid villa ID",
      });
    }

    // Handle file upload
    if (file && file.size > 0) {
      if (!file.type.startsWith("video/")) {
        return fail(400, {
          error: "Please upload a valid video file",
        });
      }

      try {
        if (!existsSync(UPLOAD_DIR)) {
          await mkdir(UPLOAD_DIR, { recursive: true });
        }

        const fileName = `${villaId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const uploadedVideoUrl = `/uploads/villas/${fileName}`;

        await VillaService.addVideo(villaId, {
          videoUrl: uploadedVideoUrl,
          altText: altText || undefined,
          store: "local",
        });

        return {
          success: true,
        };
      } catch (error) {
        return fail(500, {
          error: "Failed to upload video",
        });
      }
    }

    // Handle URL input (YouTube, Vimeo, etc.)
    if (videoUrl) {
      if (!videoUrl.trim()) {
        return fail(400, {
          error: "Please provide a video URL",
        });
      }

      try {
        await VillaService.addVideo(villaId, {
          videoUrl: videoUrl.trim(),
          altText: altText || undefined,
          store: store || "external",
        });

        return {
          success: true,
        };
      } catch (error) {
        return fail(500, {
          error: "Failed to add video",
        });
      }
    }

    return fail(400, {
      error: "Please either upload a video file or provide a video URL",
    });
  }),

  deleteVideo: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const videoId = formData.get("videoId") as string;

    try {
      await VillaService.deleteVideo(videoId);
      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to delete video",
      });
    }
  }),

  reorderImages: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const imageIds = formData.get("imageIds") as string;

    try {
      const villaId = parseInt(params.id, 10);
      if (isNaN(villaId)) {
        return fail(400, {
          error: "Invalid villa ID",
        });
      }

      const imageIdArray = JSON.parse(imageIds) as string[];
      await VillaService.updateImageOrder(villaId, imageIdArray);

      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to reorder images",
      });
    }
  }),

  updateImageAltText: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;
    const altText = formData.get("altText") as string;

    try {
      await VillaService.updateImageAltText(imageId, altText);
      return {
        success: true,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to update image description",
      });
    }
  }),

  uploadImages: onlyAdmin(async ({ request, params }) => {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return fail(400, {
        error: "Please select at least one image",
      });
    }

    if (files.length > 10) {
      return fail(400, {
        error: "Maximum 10 images can be uploaded at once",
      });
    }

    try {
      const villaId = parseInt(params.id, 10);
      if (isNaN(villaId)) {
        return fail(400, {
          error: "Invalid villa ID",
        });
      }

      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const uploadedImages = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const fileName = `${villaId}-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/villas/${fileName}`;

        const image = await VillaService.addImage(villaId, {
          imageUrl,
          thumbnailUrl: imageUrl,
          altText: undefined,
        });

        uploadedImages.push(image);
      }

      return {
        success: true,
        uploadedCount: uploadedImages.length,
      };
    } catch (error) {
      return fail(500, {
        error: "Failed to upload images",
      });
    }
  }),

  delete: onlyAdmin(async ({ params }) => {
    const villaId = parseInt(params.id, 10);
    if (isNaN(villaId)) {
      return fail(400, {
        error: "Invalid villa ID",
      });
    }

    try {
      await VillaService.delete(villaId);
    } catch (error) {
      return fail(500, {
        error: "Failed to delete villa",
      });
    }
    redirect(302, "/admin/villas");
  }),
} satisfies Actions;
