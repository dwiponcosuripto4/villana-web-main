import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { placeService } from "$lib/server/services/place.service";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { onlyAdmin } from "$lib/server/auth-utils";

const UPLOAD_DIR = "static/uploads/places";

export const POST: RequestHandler = onlyAdmin(async ({ request, params, locals }) => {

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file || !file.size) {
      return json({
        type: "error",
        data: { message: "Please select an image file" }
      }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return json({
        type: "error",
        data: { message: "File must be an image" }
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return json({
        type: "error",
        data: { message: "Image size must be less than 10MB" }
      }, { status: 400 });
    }

    const placeId = params.id;

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const fileName = `main-${placeId}-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/places/${fileName}`;

    // Update the place with the new main image URL
    await placeService.update(placeId, { mainImage: imageUrl });

    return json({
      type: "success",
      data: {
        imageUrl
      }
    });
  } catch (err) {
    console.error("Main image upload error:", err);
    return json({
      type: "error",
      data: { message: "Failed to upload main image" }
    }, { status: 500 });
  }
});