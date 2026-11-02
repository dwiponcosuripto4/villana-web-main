import type { PageServerLoad, Actions } from "./$types";
import { redirect, error, fail } from "@sveltejs/kit";
import { placeService } from "$lib/server/services/place.service";
import { db } from "$lib/server/db";
import { city, province } from "$lib/server/db/schema";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { onlyAdmin, requireAdmin } from "$lib/server/auth-utils";

const UPLOAD_DIR = "static/uploads/places";

export const load: PageServerLoad = async (event) => {
  // Check admin permission
  try {
    requireAdmin(event);
  } catch {
    throw redirect(302, "/admin/login");
  }

  try {
    const [place, cities, provinces, linkedVillas] = await Promise.all([
      placeService.findByIdWithImages(event.params.id),
      db.select().from(city).orderBy(city.name),
      db.select().from(province).orderBy(province.name),
      placeService.getPlaceVillas(event.params.id),
    ]);

    if (!place) {
      throw error(404, "Place not found");
    }

    return {
      place,
      cities,
      provinces,
      linkedVillasCount: linkedVillas?.length || 0,
    };
  } catch (err) {
    console.error("Failed to load place:", err);
    throw error(500, "Failed to load place");
  }
};

export const actions: Actions = {
  // uploadMainImage: onlyAdmin(async ({ request, params, locals }) => {
  //
  //   const formData = await request.formData();
  //   const file = formData.get("image") as File;
  //
  //   if (!file || !file.size) {
  //     return fail(400, { data: { message: "Please select an image file" } });
  //   }
  //
  //   if (!file.type.startsWith("image/")) {
  //     return fail(400, { data: { message: "File must be an image" } });
  //   }
  //
  //   if (file.size > 10 * 1024 * 1024) { // 10MB limit
  //     return fail(400, { data: { message: "Image size must be less than 10MB" } });
  //   }
  //
  //   try {
  //     const placeId = params.id;
  //
  //     if (!existsSync(UPLOAD_DIR)) {
  //       await mkdir(UPLOAD_DIR, { recursive: true });
  //     }
  //
  //     // Generate unique filename
  //     const fileName = `main-${placeId}-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
  //     const filePath = path.join(UPLOAD_DIR, fileName);
  //     const buffer = Buffer.from(await file.arrayBuffer());
  //     await writeFile(filePath, buffer);
  //
  //     const imageUrl = `/uploads/places/${fileName}`;
  //
  //     // Update the place with the new main image URL
  //     await placeService.update(placeId, { mainImage: imageUrl });
  //
  //     return {
  //       type: "success",
  //       data: {
  //         imageUrl
  //       }
  //     };
  //   } catch (error) {
  //     console.error("Main image upload error:", error);
  //     return fail(500, { data: { message: "Failed to upload main image" } });
  //   }
  // }),

  uploadImages: onlyAdmin(async ({ request, params, locals }) => {
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
      const placeId = params.id;
      if (!placeId) {
        return fail(400, {
          error: "Invalid place ID",
        });
      }

      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const uploadedImages = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue; // Skip non-image files
        }

        // Generate unique filename
        const fileName = `${placeId}-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/places/${fileName}`;

        const image = await placeService.addImage(placeId, {
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
      console.error("Image upload error:", error);
      return fail(500, {
        error: "Failed to upload images",
      });
    }
  }),

  deleteImage: onlyAdmin(async ({ request, locals }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;

    if (!imageId) {
      return fail(400, { error: "Image ID is required" });
    }

    try {
      await placeService.deleteImage(imageId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting image:", error);
      return fail(500, { error: "Failed to delete image" });
    }
  }),

  updateImageOrder: onlyAdmin(async ({ request, locals }) => {
    const formData = await request.formData();
    const placeId = formData.get("placeId") as string;
    const imageIds = formData.get("imageIds") as string;

    if (!placeId || !imageIds) {
      return fail(400, { error: "Place ID and image IDs are required" });
    }

    try {
      const imageIdArray = JSON.parse(imageIds);
      await placeService.updateImageOrder(placeId, imageIdArray);
      return { success: true };
    } catch (error) {
      console.error("Error updating image order:", error);
      return fail(500, { error: "Failed to update image order" });
    }
  }),

  updateImageAltText: onlyAdmin(async ({ request, locals }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;
    const altText = formData.get("altText") as string;

    if (!imageId) {
      return fail(400, { error: "Image ID is required" });
    }

    try {
      await placeService.updateImageAltText(imageId, altText || "");
      return { success: true };
    } catch (error) {
      console.error("Error updating image alt text:", error);
      return fail(500, { error: "Failed to update image alt text" });
    }
  }),
};

