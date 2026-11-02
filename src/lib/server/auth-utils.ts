import type { RequestEvent } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import type { User } from "$lib/server/db/schema";

export function requireAuth(event: RequestEvent) {
  if (!event.locals.user) {
    throw new Error("Authentication required");
  }
  return event.locals.user;
}

export function requireAdmin(event: RequestEvent) {
  const user = requireAuth(event);
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

/**
 * Higher-order function that wraps action handlers with admin authorization
 * @param actionHandler - The action handler function to protect
 * @returns Protected action handler that requires admin access
 */
export function onlyAdmin<T extends (...args: any[]) => any>(
  actionHandler: T,
): T {
  return (async (event: RequestEvent) => {
    try {
      requireAdmin(event);
    } catch (error) {
      return fail(403, {
        error: "Unauthorized",
      });
    }
    return actionHandler(event);
  }) as T;
}
