import { hash } from "@node-rs/argon2";
import { fail } from "@sveltejs/kit";
import { eq, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { AdminService } from "$lib/server/services/admin.service";
import { UserService } from "$lib/server/services/user.service";
import {
  validateUsername,
  validatePassword,
} from "$lib/server/validation";
import type { Actions, PageServerLoad } from "./$types";

function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export const load: PageServerLoad = async (event) => {
  // Extract search params
  const page = Number(event.url.searchParams.get("page")) || 1;
  const limit = Number(event.url.searchParams.get("limit")) || 20;
  const query = event.url.searchParams.get("query") || undefined;
  const role = event.url.searchParams.get("role") as "admin" | "viewer" | "all" | undefined || "all";
  const sortBy = event.url.searchParams.get("sortBy") as "newest" | "oldest" | "alphabetical" | undefined || "newest";

  // Search users with pagination
  const result = await UserService.searchWithCount({
    query,
    role,
    sortBy,
    page,
    limit,
  });

  // Get all admins for stats (unchanged)
  const allAdmins = await UserService.getAllAdmins();

  // Get total counts for stats
  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(table.user);
  const totalUsers = Number(totalUsersResult[0].count);

  return {
    users: result.users.map((user) => ({
      ...user,
      isAdmin: user.role === "admin",
    })),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
      totalPages: Math.ceil(result.total / result.limit),
    },
    searchParams: {
      query: query || "",
      role: role || "all",
      sortBy: sortBy || "newest",
    },
    stats: {
      totalUsers,
      totalAdmins: allAdmins.length,
      totalViewers: totalUsers - allAdmins.length,
    },
    admins: allAdmins, // Keep for compatibility with existing checks
  };
};

export const actions: Actions = {
  createAdmin: async (event) => {
    const formData = await event.request.formData();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const username = formData.get("username");
    const password = formData.get("password");

    // Validate required fields
    if (!fullName || fullName.length < 2) {
      return fail(400, {
        error: "Full name must be at least 2 characters long",
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, {
        error: "Please enter a valid email address",
      });
    }

    if (!validateUsername(username)) {
      return fail(400, {
        error: "Invalid username (min 3, max 31 characters, alphanumeric only)",
      });
    }
    if (!validatePassword(password)) {
      return fail(400, {
        error: "Invalid password (min 6, max 255 characters)",
      });
    }

    // Check if username already exists
    const existingUserByUsername = await db
      .select()
      .from(table.user)
      .where(eq(table.user.username, username));
    if (existingUserByUsername.length > 0) {
      return fail(400, { error: "Username already exists" });
    }

    // Check if email already exists
    const existingUserByEmail = await db
      .select()
      .from(table.user)
      .where(eq(table.user.email, email));
    if (existingUserByEmail.length > 0) {
      return fail(400, { error: "Email address already exists" });
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    try {
      await db.insert(table.user).values({
        username,
        passwordHash,
        role: "admin",
        email,
        fullName,
      });

      return {
        success: true,
        message: "Admin user created successfully",
      };
    } catch (error) {
      console.error("Error creating admin:", error);
      return fail(500, { error: "Failed to create admin user" });
    }
  },

  promoteUser: async (event) => {
    const formData = await event.request.formData();
    const userIdStr = formData.get("userId") as string;

    if (!userIdStr) {
      return fail(400, { error: "User ID is required" });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return fail(400, { error: "Invalid User ID" });
    }

    try {
      await UserService.makeUserAdmin(userId);
      return {
        success: true,
        message: "User promoted to admin successfully",
      };
    } catch (error) {
      console.error("Error promoting user:", error);
      return fail(500, { error: "Failed to promote user to admin" });
    }
  },

  demoteAdmin: async (event) => {
    const formData = await event.request.formData();
    const userIdStr = formData.get("userId") as string;

    if (!userIdStr) {
      return fail(400, { error: "User ID is required" });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return fail(400, { error: "Invalid User ID" });
    }

    // Check if this is the last admin
    const canRemove = await UserService.canRemoveAdmin(userId);
    if (!canRemove) {
      return fail(400, {
        error:
          "Cannot remove the last admin. There must be at least one admin.",
      });
    }

    try {
      await UserService.removeAdminRole(userId);
      return {
        success: true,
        message: "Admin demoted to regular user successfully",
      };
    } catch (error) {
      console.error("Error demoting admin:", error);
      return fail(500, { error: "Failed to demote admin" });
    }
  },

  deleteUser: async (event) => {
    const formData = await event.request.formData();
    const userIdStr = formData.get("userId") as string;

    if (!userIdStr) {
      return fail(400, { error: "User ID is required" });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return fail(400, { error: "Invalid User ID" });
    }

    // Check if user is admin and if it's the last admin
    const userToDelete = await db
      .select()
      .from(table.user)
      .where(eq(table.user.id, userId));
    if (userToDelete.length === 0) {
      return fail(404, { error: "User not found" });
    }

    if (userToDelete[0].role === "admin") {
      const canRemove = await UserService.canRemoveAdmin(userId);
      if (!canRemove) {
        return fail(400, {
          error:
            "Cannot delete the last admin. There must be at least one admin.",
        });
      }
    }

    try {
      // Delete user sessions first
      await db.delete(table.session).where(eq(table.session.userId, userId));
      // Delete user
      await db.delete(table.user).where(eq(table.user.id, userId));

      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return fail(500, { error: "Failed to delete user" });
    }
  },

  resetPassword: async (event) => {
    const formData = await event.request.formData();
    const userIdStr = formData.get("userId") as string;
    const password = formData.get("password") as string | null;
    const generateRandom = formData.get("generateRandom") === "true";

    if (!userIdStr) {
      return fail(400, { error: "User ID is required" });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return fail(400, { error: "Invalid User ID" });
    }

    // Check if user exists
    const userToUpdate = await db
      .select()
      .from(table.user)
      .where(eq(table.user.id, userId));
    if (userToUpdate.length === 0) {
      return fail(404, { error: "User not found" });
    }

    let newPassword: string;

    if (generateRandom) {
      newPassword = generateRandomPassword();
    } else {
      if (!password) {
        return fail(400, { error: "Password is required" });
      }
      if (!validatePassword(password)) {
        return fail(400, {
          error: "Invalid password (min 6, max 255 characters)",
        });
      }
      newPassword = password;
    }

    const passwordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    try {
      // Update user password
      await db
        .update(table.user)
        .set({ passwordHash })
        .where(eq(table.user.id, userId));

      // Invalidate all user sessions for security
      await db.delete(table.session).where(eq(table.session.userId, userId));

      return {
        success: true,
        message: "Password reset successfully",
        generatedPassword: generateRandom ? newPassword : undefined,
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      return fail(500, { error: "Failed to reset password" });
    }
  },
};
