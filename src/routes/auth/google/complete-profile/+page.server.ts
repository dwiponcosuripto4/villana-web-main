import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true; // Optional field

  // Basic international phone format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
}

export const load: PageServerLoad = async ({ locals }) => {
  // Ensure user is authenticated
  if (!locals.user) {
    throw redirect(302, "/register");
  }

  // Check if user already has complete profile
  const dbUser = await db
    .select()
    .from(user)
    .where(eq(user.id, locals.user.id))
    .limit(1);

  if (dbUser.length === 0) {
    throw redirect(302, "/register");
  }

  const userRecord = dbUser[0];

  // If profile is already complete, redirect to dashboard
  if (userRecord.phone || userRecord.address) {
    throw redirect(302, "/dashboard");
  }

  return {
    user: userRecord,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, "/register");
    }

    const formData = await request.formData();
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return fail(400, {
        message:
          "Please enter a valid phone number with country code (e.g., +1234567890)",
        phone,
        address,
      });
    }

    try {
      // Update user profile with phone and address
      await db
        .update(user)
        .set({
          phone: phone || null,
          address: address || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, locals.user.id));
    } catch (error) {
      console.error("Profile completion error:", error);
      return fail(500, {
        message: "An error occurred updating your profile. Please try again.",
        phone,
        address,
      });
    }

    throw redirect(302, "/dashboard");
  },
};
