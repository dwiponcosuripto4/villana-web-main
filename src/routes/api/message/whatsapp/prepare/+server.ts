import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";
import { getTimeBasedGreeting } from "$lib/utils/whatsapp";
import { getAbsoluteShortVillaUrl } from "$lib/utils/short-url";
import { getAbsoluteUrl } from "$lib/config/site";

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
}) => {
  try {
    const clientAddress = getClientAddress();

    // Parse request body
    const body = await request.json();
    const { villa_id } = body;

    // Validation
    if (!villa_id) {
      return json(
        { error: "Missing required field: villa_id" },
        { status: 400 },
      );
    }

    const villaId = parseInt(villa_id, 10);
    if (isNaN(villaId)) {
      return json({ error: "Invalid villa ID" }, { status: 400 });
    }

    // Fetch villa
    const villa = await VillaService.findById(villaId);
    if (!villa || villa.status !== "published") {
      return json(
        { error: "Villa not found or not available" },
        { status: 404 },
      );
    }

    const user = locals.user;
    if (user?.role !== "admin") {
      // Track WhatsApp click
      const userAgent = request.headers.get("user-agent") || "";
      const referer = request.headers.get("referer") || "";

      await VillaService.trackWhatsAppClick(
        villaId,
        user?.id || null,
        clientAddress,
        userAgent,
        referer,
      );
    }

    // Generate WhatsApp message and URL
    const greeting = getTimeBasedGreeting();
    const villaUrl = getAbsoluteUrl(`/villa/${villa.slug}`);
    const message = `Halo ${greeting} kak, saya dapat info dari Villana ${villaUrl} \nApakah masih ada unit tersedia di ${villa.title}?`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhoneNumber = villa.phoneNumber.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

    return json({
      success: true,
      whatsapp_url: whatsappUrl,
      villa_title: villa.title,
    });
  } catch (error) {
    console.error("Error preparing WhatsApp message:", error);
    return json(
      { error: "Failed to prepare WhatsApp message" },
      { status: 500 },
    );
  }
};
