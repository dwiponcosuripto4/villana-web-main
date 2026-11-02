import { json, fail } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { placeService } from "$lib/server/services/place.service";
import type { UpdatePlaceInput } from "$lib/types/place";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { onlyAdmin } from "$lib/server/auth-utils";

const UPLOAD_DIR = "static/uploads/places";

export const GET: RequestHandler = onlyAdmin(async ({ params, locals }) => {

  try {
    const place = await placeService.findById(params.id);

    if (!place) {
      return json({ error: "Place not found" }, { status: 404 });
    }

    return json({ place });
  } catch (error) {
    console.error("Failed to fetch place:", error);
    return json({ error: "Failed to fetch place" }, { status: 500 });
  }
});

export const PUT: RequestHandler = onlyAdmin(async ({ params, request, locals }) => {

  try {
    const input: UpdatePlaceInput = await request.json();
    input.id = params.id;

    const updatedPlace = await placeService.update(params.id, input);

    if (!updatedPlace) {
      return json({ error: "Place not found" }, { status: 404 });
    }

    return json({ place: updatedPlace });
  } catch (error) {
    console.error("Failed to update place:", error);
    return json({ error: "Failed to update place" }, { status: 500 });
  }
});

export const POST: RequestHandler = onlyAdmin(async ({ params, request, locals, url }) => {

  const action = url.searchParams.get("action") || url.pathname.split("/").pop();

  // Check if this is a form action (has ?/ in search params)
  const formAction = url.search.match(/\?\/(\w+)/)?.[1];

  if (formAction) {
    try {
      const formData = await request.formData();

      switch (formAction) {
        case "uploadImages": {
          const files = formData.getAll("images") as File[];

          if (!files || files.length === 0) {
            return json({ error: "Please select at least one image" }, { status: 400 });
          }

          if (files.length > 10) {
            return json({ error: "Maximum 10 images can be uploaded at once" }, { status: 400 });
          }

          const placeId = params.id;
          if (!placeId) {
            return json({ error: "Invalid place ID" }, { status: 400 });
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

          return json({
            success: true,
            uploadedCount: uploadedImages.length,
          });
        }

        case "deleteImage": {
          const imageId = formData.get("imageId") as string;

          if (!imageId) {
            return json({ error: "Image ID is required" }, { status: 400 });
          }

          await placeService.deleteImage(imageId);
          return json({ success: true });
        }

        case "updateImageOrder": {
          const placeId = formData.get("placeId") as string;
          const imageIds = formData.get("imageIds") as string;

          if (!placeId || !imageIds) {
            return json({ error: "Place ID and image IDs are required" }, { status: 400 });
          }

          const imageIdArray = JSON.parse(imageIds);
          await placeService.updateImageOrder(placeId, imageIdArray);
          return json({ success: true });
        }

        case "updateImageAltText": {
          const imageId = formData.get("imageId") as string;
          const altText = formData.get("altText") as string;

          if (!imageId) {
            return json({ error: "Image ID is required" }, { status: 400 });
          }

          await placeService.updateImageAltText(imageId, altText || "");
          return json({ success: true });
        }

        default:
          return json({ error: "Unknown action" }, { status: 400 });
      }
    } catch (error) {
      console.error(`Error in ${formAction} action:`, error);
      return json({ error: `Failed to ${formAction}` }, { status: 500 });
    }
  }

  return json({ error: "Invalid request" }, { status: 400 });
});

export const DELETE: RequestHandler = onlyAdmin(async ({ params, locals }) => {

  try {
    await placeService.delete(params.id);
    return json({ success: true });
  } catch (error) {
    console.error("Failed to delete place:", error);
    return json({ error: "Failed to delete place" }, { status: 500 });
  }
});