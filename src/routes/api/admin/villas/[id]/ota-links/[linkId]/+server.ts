import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { onlyAdmin } from "$lib/server/auth-utils";
import { OtaService } from "$lib/server/services/ota.service";

// GET - Get a single OTA link
export const GET: RequestHandler = async (event) => {
  await onlyAdmin(event);

  const linkId = event.params.linkId;
  if (!linkId) {
    throw error(400, "Invalid link ID");
  }

  try {
    const otaLink = await OtaService.getOtaLinkById(linkId);
    if (!otaLink) {
      throw error(404, "OTA link not found");
    }
    return json({ otaLink });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Error fetching OTA link:", err);
    throw error(500, "Failed to fetch OTA link");
  }
};

// PUT - Update an OTA link
export const PUT: RequestHandler = async (event) => {
  await onlyAdmin(event);

  const linkId = event.params.linkId;
  if (!linkId) {
    throw error(400, "Invalid link ID");
  }

  try {
    const body = await event.request.json();

    // Validate URL format if provided
    if (body.affiliateUrl) {
      try {
        new URL(body.affiliateUrl);
      } catch {
        throw error(400, "Invalid affiliate URL format");
      }

      // Ensure HTTPS
      if (!body.affiliateUrl.startsWith("https://")) {
        throw error(400, "Affiliate URL must use HTTPS");
      }
    }

    const otaLink = await OtaService.updateOtaLink(linkId, {
      provider: body.provider,
      affiliateUrl: body.affiliateUrl,
      customLabel: body.customLabel,
      priceMode: body.priceMode,
      manualPrice: body.manualPrice,
      priceCurrency: body.priceCurrency,
      isActive: body.isActive,
    });

    if (!otaLink) {
      throw error(404, "OTA link not found");
    }

    return json({ success: true, otaLink });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Error updating OTA link:", err);
    throw error(500, "Failed to update OTA link");
  }
};

// DELETE - Delete an OTA link
export const DELETE: RequestHandler = async (event) => {
  await onlyAdmin(event);

  const linkId = event.params.linkId;
  if (!linkId) {
    throw error(400, "Invalid link ID");
  }

  try {
    await OtaService.deleteOtaLink(linkId);
    return json({ success: true });
  } catch (err) {
    console.error("Error deleting OTA link:", err);
    throw error(500, "Failed to delete OTA link");
  }
};
