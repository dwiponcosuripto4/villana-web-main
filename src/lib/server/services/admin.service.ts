import { db } from "$lib/server/db";
import { user, type User } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export class AdminService {
  static async hasAnyAdmin(): Promise<boolean> {
    const admins = await db
      .select()
      .from(user)
      .where(eq(user.role, "admin"))
      .limit(1);
    return admins.length > 0;
  }

  static async getAdminCount(): Promise<number> {
    const admins = await db.select().from(user).where(eq(user.role, "admin"));
    return admins.length;
  }

  static async getAllAdmins(): Promise<User[]> {
    return await db.select().from(user).where(eq(user.role, "admin"));
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
    const adminCount = await this.getAdminCount();
    return adminCount > 1; // Don't allow removing the last admin
  }
}
