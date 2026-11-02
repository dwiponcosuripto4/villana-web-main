import { db } from "$lib/server/db";
import { user, type User } from "$lib/server/db/schema";
import { eq, and, or, ilike, sql, desc, asc } from "drizzle-orm";
import type { UserSearchParams, UserSearchResult, SafeUser } from "$lib/types/user";

// Safe user columns - excludes passwordHash to prevent leaking to client
const safeUserColumns = {
  id: user.id,
  age: user.age,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  address: user.address,
  role: user.role,
  googleId: user.googleId,
  emailVerified: user.emailVerified,
  profilePicture: user.profilePicture,
  registrationMethod: user.registrationMethod,
  locale: user.locale,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

export class UserService {
  static async searchWithCount(
    params: UserSearchParams
  ): Promise<UserSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Build conditions for both count and data queries
    const conditions = [];

    // Search across multiple fields
    if (params.query) {
      const searchTerm = `%${params.query}%`;
      conditions.push(
        or(
          ilike(user.fullName, searchTerm),
          ilike(user.email, searchTerm),
          ilike(user.username, searchTerm)
        )
      );
    }

    // Filter by role
    if (params.role && params.role !== "all") {
      conditions.push(eq(user.role, params.role));
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(user);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    // Get paginated data with sorting (excluding passwordHash)
    let dataQuery = db.select(safeUserColumns).from(user);

    if (conditions.length > 0) {
      dataQuery = dataQuery.where(and(...conditions));
    }

    // Apply sorting
    switch (params.sortBy) {
      case "oldest":
        dataQuery = dataQuery.orderBy(asc(user.createdAt));
        break;
      case "alphabetical":
        dataQuery = dataQuery.orderBy(asc(user.fullName));
        break;
      case "newest":
      default:
        dataQuery = dataQuery.orderBy(desc(user.createdAt));
        break;
    }

    // Apply pagination
    dataQuery = dataQuery.limit(limit).offset(offset);

    const users = await dataQuery;

    return {
      users,
      page,
      limit,
      total: Number(total),
      hasMore: offset + users.length < Number(total),
    };
  }

  static async getAllAdmins(): Promise<SafeUser[]> {
    return await db.select(safeUserColumns).from(user).where(eq(user.role, "admin"));
  }

  static async makeUserAdmin(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, userId))
      .returning();
    return updatedUser;
  }

  static async removeAdminRole(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(user)
      .set({ role: "viewer" })
      .where(eq(user.id, userId))
      .returning();
    return updatedUser;
  }

  static async canRemoveAdmin(userId: number): Promise<boolean> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "admin"));
    return Number(count) > 1; // Don't allow removing the last admin
  }

  static async getAdminCount(): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "admin"));
    return Number(count);
  }

  static async deleteUser(userId: number): Promise<void> {
    // This will be called from the page.server.ts which handles session deletion
    await db.delete(user).where(eq(user.id, userId));
  }
}