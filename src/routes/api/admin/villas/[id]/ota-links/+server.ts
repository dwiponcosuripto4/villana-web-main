import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { onlyAdmin } from "$lib/server/auth-utils";
import { OtaService } from "$lib/server/services/ota.service";

// GET - List all OTA links for a villa
export const GET: RequestHandler = async (event) => {
  await onlyAdmin(event);

  const villaId = parseInt(event.params.id);
  if (isNaN(villaId)) {
    throw error(400, "Invalid villa ID");
  }

  try {
    const otaLinks = await OtaService.getOtaLinksByVillaId(villaId);
    return json({ otaLinks });
  } catch (err) {
    console.error("Error fetching OTA links:", err);
    throw error(500, "Failed to fetch OTA links");
  }
};

// POST - Create a new OTA link
export const POST: RequestHandler = async (event) => {
  await onlyAdmin(event);

  const villaId = parseInt(event.params.id);
  if (isNaN(villaId)) {
    throw error(400, "Invalid villa ID");
  }

  try {
    const body = await event.request.json();

    // Validate required fields
    if (!body.provider) {
      throw error(400, "Provider is required");
    }
    if (!body.affiliateUrl) {
      throw error(400, "Affiliate URL is required");
    }

    // Validate URL format
    try {
      new URL(body.affiliateUrl);
    } catch {
      throw error(400, "Invalid affiliate URL format");
    }

    // Ensure HTTPS
    if (!body.affiliateUrl.startsWith("https://")) {
      throw error(400, "Affiliate URL must use HTTPS");
    }

    const otaLink = await OtaService.createOtaLink({
      villaId,
      provider: body.provider,
      affiliateUrl: body.affiliateUrl,
      customLabel: body.customLabel,
      priceMode: body.priceMode || "none",
      manualPrice: body.manualPrice,
      priceCurrency: body.priceCurrency || "IDR",
      isActive: body.isActive ?? true,
    });

    return json({ success: true, otaLink });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Error creating OTA link:", err);
    throw error(500, "Failed to create OTA link");
  }
};
