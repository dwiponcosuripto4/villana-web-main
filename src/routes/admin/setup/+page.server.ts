import { hash } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { AdminService } from "$lib/server/services/admin.service";
import {
  validateUsername,
  validatePassword,
} from "$lib/server/validation";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  // Check if any admin exists
  const hasAdmin = await AdminService.hasAnyAdmin();

  if (hasAdmin) {
    // If admin exists, redirect to login
    redirect(302, "/admin/login?redirect=/admin");
  }

  // If user is already logged in, redirect to make them admin
  if (event.locals.user) {
    await AdminService.makeUserAdmin(event.locals.user.id);
    redirect(302, "/admin");
  }

  return {
    message:
      "No admin account exists. Create the first admin account to get started.",
  };
};

export const actions: Actions = {
  default: async (event) => {
    // Double-check no admin exists
    const hasAdmin = await AdminService.hasAnyAdmin();
    if (hasAdmin) {
      return fail(400, { message: "Admin account already exists" });
    }

    const formData = await event.request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!validateUsername(username)) {
      return fail(400, {
        message:
          "Invalid username (min 3, max 31 characters, alphanumeric only)",
      });
    }
    if (!validatePassword(password)) {
      return fail(400, {
        message: "Invalid password (min 6, max 255 characters)",
      });
    }
    if (password !== confirmPassword) {
      return fail(400, { message: "Passwords do not match" });
    }

    // Check if username already exists
    const existingUsers = await db
      .select()
      .from(table.user)
      .where(eq(table.user.username, username));
    if (existingUsers.length > 0) {
      return fail(400, { message: "Username already exists" });
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    try {
      // Create user with admin role (ID will be auto-generated)
      const newAdmin = await db.insert(table.user).values({
        username,
        passwordHash,
        role: "admin",
        email: `${username}@admin.local`, // Generate a placeholder email for setup
        fullName: username, // Use username as fullName for setup
      }).returning();

      // Create session and log them in
      const sessionToken = auth.generateSessionToken();
      const session = await auth.createSession(sessionToken, newAdmin[0].id);
      auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
    } catch (error) {
      console.error("Error creating admin:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("unique")) {
          return fail(400, { message: "Username already exists" });
        }
        if (
          error.message.includes("connection") ||
          error.message.includes("database")
        ) {
          return fail(500, {
            message:
              "Database connection error. Please ensure the database is running.",
          });
        }
        return fail(500, { message: `Database error: ${error.message}` });
      }

      return fail(500, {
        message: "An error occurred while creating admin account",
      });
    }

    // Redirect after successful creation (outside try-catch)
    return redirect(302, "/admin");
  },
};
