import { redirect, error, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { VillaOwnershipService } from "$lib/server/services/villa-ownership.service";
import { VillaService } from "$lib/server/services/villa.service";
import { db } from "$lib/server/db";
import { villaUpdateRequest, villa } from "$lib/server/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

// Field to category mapping for update requests
const fieldCategories: Record<string, string> = {
  title: "basic_info",
  priceMin: "pricing",
  priceMax: "pricing",
  bedroomMin: "basic_info",
  bedroomMax: "basic_info",
  personCapacityMin: "basic_info",
  personCapacityMax: "basic_info",
  hasAc: "amenities",
  hasBathtub: "amenities",
  hasTv: "amenities",
  hasBreakfast: "amenities",
  hasPool: "amenities",
  isPetFriendly: "amenities",
  isKidFriendly: "amenities",
  isSeniorFriendly: "amenities",
  isSyaria: "amenities",
  phoneNumber: "contact",
  address: "contact",
  latitude: "technical",
  longitude: "technical",
  googleMapsLink: "technical",
};

// Fields that can be edited directly without admin approval
const directEditFields = ["description", "unitsCount"];

export const load: PageServerLoad = async ({ locals, params }) => {
  // Require authentication
  if (!locals.user) {
    throw redirect(302, `/login?redirect=/dashboard/villas/${params.id}/edit`);
  }

  const villaId = parseInt(params.id);
  if (isNaN(villaId)) {
    throw error(400, "Invalid villa ID");
  }

  // Verify ownership
  const ownership = await VillaOwnershipService.isUserVillaOwner(
    villaId,
    locals.user.id,
  );

  if (!ownership) {
    throw error(403, "You do not have permission to edit this villa");
  }

  // Load villa data
  const villaData = await VillaService.findById(villaId);
  if (!villaData) {
    throw error(404, "Villa not found");
  }

  // Load pending update requests for this villa
  const pendingRequests = await db
    .select()
    .from(villaUpdateRequest)
    .where(
      and(
        eq(villaUpdateRequest.villaId, villaId),
        inArray(villaUpdateRequest.status, ["pending", "reviewed"]),
      ),
    )
    .orderBy(desc(villaUpdateRequest.createdAt));

  return {
    user: locals.user,
    villa: villaData,
    ownership,
    pendingRequests,
  };
};

export const actions: Actions = {
  // Direct update for description and unitsCount
  updateDirect: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, `/login?redirect=/dashboard/villas/${params.id}/edit`);
    }

    const villaId = parseInt(params.id);
    if (isNaN(villaId)) {
      return fail(400, { error: "Invalid villa ID" });
    }

    // Verify ownership
    const ownership = await VillaOwnershipService.isUserVillaOwner(
      villaId,
      locals.user.id,
    );

    if (!ownership) {
      return fail(403, { error: "You do not have permission to edit this villa" });
    }

    const formData = await request.formData();
    const description = formData.get("description") as string;
    const unitsCount = parseInt(formData.get("unitsCount") as string);

    // Validate inputs
    if (isNaN(unitsCount) || unitsCount < 1) {
      return fail(400, { error: "Units count must be at least 1" });
    }

    try {
      await VillaService.update(villaId, {
        description: description || undefined,
        unitsCount,
      });

      return { success: true, message: "Perubahan berhasil disimpan" };
    } catch (err) {
      console.error("Error updating villa:", err);
      return fail(500, {
        error: err instanceof Error ? err.message : "Failed to update villa",
      });
    }
  },

  // Request change for fields requiring admin approval
  requestChange: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, `/login?redirect=/dashboard/villas/${params.id}/edit`);
    }

    const villaId = parseInt(params.id);
    if (isNaN(villaId)) {
      return fail(400, { error: "Invalid villa ID" });
    }

    // Verify ownership
    const ownership = await VillaOwnershipService.isUserVillaOwner(
      villaId,
      locals.user.id,
    );

    if (!ownership) {
      return fail(403, { error: "You do not have permission to edit this villa" });
    }

    const formData = await request.formData();
    const fieldName = formData.get("fieldName") as string;
    const proposedValue = formData.get("proposedValue") as string;
    const changeReason = formData.get("changeReason") as string;

    // Validate field name
    if (!fieldName || !fieldCategories[fieldName]) {
      return fail(400, { error: "Invalid field name" });
    }

    // Don't allow requesting changes for direct edit fields
    if (directEditFields.includes(fieldName)) {
      return fail(400, { error: "This field can be edited directly" });
    }

    if (!proposedValue) {
      return fail(400, { error: "Proposed value is required" });
    }

    // Check if there's already a pending request for this field
    const existingRequest = await db
      .select()
      .from(villaUpdateRequest)
      .where(
        and(
          eq(villaUpdateRequest.villaId, villaId),
          eq(villaUpdateRequest.fieldName, fieldName),
          inArray(villaUpdateRequest.status, ["pending", "reviewed"]),
        ),
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return fail(400, {
        error: "Sudah ada permintaan perubahan yang pending untuk field ini",
      });
    }

    // Get current value from villa
    const villaData = await VillaService.findById(villaId);
    if (!villaData) {
      return fail(404, { error: "Villa not found" });
    }

    const currentValue = villaData[fieldName as keyof typeof villaData];

    try {
      await db.insert(villaUpdateRequest).values({
        villaId,
        ownerId: locals.user.id,
        updateType: "pending_approval",
        dataCategory: fieldCategories[fieldName] as any,
        fieldName,
        currentValue: currentValue != null ? String(currentValue) : null,
        proposedValue,
        changeReason: changeReason || null,
        status: "pending",
      });

      return { success: true, message: "Permintaan perubahan berhasil diajukan" };
    } catch (err) {
      console.error("Error creating change request:", err);
      return fail(500, {
        error: err instanceof Error ? err.message : "Failed to create change request",
      });
    }
  },

  // Cancel a pending request
  cancelRequest: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, `/login?redirect=/dashboard/villas/${params.id}/edit`);
    }

    const villaId = parseInt(params.id);
    if (isNaN(villaId)) {
      return fail(400, { error: "Invalid villa ID" });
    }

    // Verify ownership
    const ownership = await VillaOwnershipService.isUserVillaOwner(
      villaId,
      locals.user.id,
    );

    if (!ownership) {
      return fail(403, { error: "You do not have permission to edit this villa" });
    }

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;

    if (!requestId) {
      return fail(400, { error: "Request ID is required" });
    }

    // Verify request belongs to this villa and is pending
    const [existingRequest] = await db
      .select()
      .from(villaUpdateRequest)
      .where(
        and(
          eq(villaUpdateRequest.id, requestId),
          eq(villaUpdateRequest.villaId, villaId),
          eq(villaUpdateRequest.ownerId, locals.user.id),
        ),
      )
      .limit(1);

    if (!existingRequest) {
      return fail(404, { error: "Request not found" });
    }

    if (existingRequest.status !== "pending" && existingRequest.status !== "reviewed") {
      return fail(400, { error: "Only pending requests can be canceled" });
    }

    try {
      await db.delete(villaUpdateRequest).where(eq(villaUpdateRequest.id, requestId));

      return { success: true, message: "Permintaan berhasil dibatalkan" };
    } catch (err) {
      console.error("Error canceling request:", err);
      return fail(500, {
        error: err instanceof Error ? err.message : "Failed to cancel request",
      });
    }
  },
};
