import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { OtaService } from "$lib/server/services/ota.service";

// POST - Track an OTA link click
export const POST: RequestHandler = async ({ request, params, locals, getClientAddress }) => {
  const villaId = parseInt(params.id);
  if (isNaN(villaId)) {
    throw error(400, "Invalid villa ID");
  }

  try {
    const body = await request.json();
    const { otaLinkId } = body;

    if (!otaLinkId) {
      throw error(400, "OTA link ID is required");
    }

    // Get user info for tracking
    const userId = locals.user?.id ? parseInt(locals.user.id) : null;
    const userIp = getClientAddress();
    const userAgent = request.headers.get("user-agent") || undefined;
    const referer = request.headers.get("referer") || undefined;

    // Track the click
    const result = await OtaService.trackOtaClick(
      otaLinkId,
      userId,
      userIp,
      userAgent,
      referer
    );

    if (!result.success) {
      throw error(404, "OTA link not found");
    }

    return json({
      success: true,
      affiliateUrl: result.affiliateUrl,
    });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Error tracking OTA click:", err);
    throw error(500, "Failed to track OTA click");
  }
};
