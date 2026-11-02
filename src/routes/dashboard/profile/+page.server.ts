import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";

function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true; // Optional field

  // Basic international phone format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return errors;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { user: userData } = await parent();
  return { user: userData };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { message: "Unauthorized" });
    }

    const formData = await request.formData();
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    // Validate required fields
    if (!fullName || fullName.length < 2) {
      return fail(400, {
        message: "Full name must be at least 2 characters long",
        fullName,
        phone,
        address,
      });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return fail(400, {
        message:
          "Please enter a valid phone number with country code (e.g., +1234567890)",
        fullName,
        phone,
        address,
      });
    }

    try {
      // Update user profile
      await db
        .update(user)
        .set({
          fullName,
          phone: phone || null,
          address: address || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, locals.user.id));

      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      console.error("Profile update error:", error);
      return fail(500, {
        message: "An error occurred updating your profile. Please try again.",
        fullName,
        phone,
        address,
      });
    }
  },

  changePassword: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { message: "Unauthorized" });
    }

    const formData = await request.formData();
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Get user from database to check current password
    const dbUser = await db
      .select()
      .from(user)
      .where(eq(user.id, locals.user.id))
      .limit(1);

    if (dbUser.length === 0 || !dbUser[0].passwordHash) {
      return fail(400, {
        passwordMessage:
          "Cannot change password for Google account. Please sign in with Google to manage your password.",
      });
    }

    const userRecord = dbUser[0];

    // Verify current password
    if (!currentPassword) {
      return fail(400, {
        passwordMessage: "Current password is required",
      });
    }

    try {
      const validPassword = await verify(
        userRecord.passwordHash,
        currentPassword,
      );
      if (!validPassword) {
        return fail(400, {
          passwordMessage: "Current password is incorrect",
        });
      }
    } catch (error) {
      return fail(400, {
        passwordMessage: "Current password is incorrect",
      });
    }

    // Validate new password
    if (!newPassword) {
      return fail(400, {
        passwordMessage: "New password is required",
      });
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return fail(400, {
        passwordMessage: passwordErrors.join(". "),
      });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, {
        passwordMessage: "New passwords do not match",
      });
    }

    try {
      // Hash new password
      const passwordHash = await hash(newPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      // Update password
      await db
        .update(user)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(user.id, locals.user.id));

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error("Password change error:", error);
      return fail(500, {
        passwordMessage:
          "An error occurred changing your password. Please try again.",
      });
    }
  },
};
