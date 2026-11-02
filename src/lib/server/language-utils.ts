import { db } from "./db";
import { user as userTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { getLocale } from "$lib/paraglide/runtime.js";
import type { User } from "./db/schema";

export type LocaleOption = "auto" | "en" | "id";
export type ResolvedLocale = "en" | "id";

/**
 * Get user's saved locale preference from database
 */
export async function getUserLocale(
  userId: number,
): Promise<LocaleOption | null> {
  try {
    const result = await db
      .select({ locale: userTable.locale })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    return (result[0]?.locale as LocaleOption) || "auto";
  } catch (error) {
    console.error("Failed to get user locale:", error);
    // If the field doesn't exist in the database yet, return 'auto'
    return "auto";
  }
}

/**
 * Update user's locale preference in database
 */
export async function updateUserLocale(
  userId: number,
  locale: LocaleOption,
): Promise<boolean> {
  try {
    await db
      .update(userTable)
      .set({
        locale,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId));

    console.log(`Successfully updated user ${userId} locale to ${locale}`);
    return true;
  } catch (error) {
    console.error("Failed to update user locale:", error);
    console.error("Error details:", error);
    // If the locale column doesn't exist yet, the update will fail
    // In a production environment, you'd need to run the database migration first
    return false;
  }
}

/**
 * Resolve user's language preference with fallback logic
 */
export async function resolveUserLanguage(
  user: User | null,
  request: Request,
): Promise<ResolvedLocale> {
  // For authenticated users, check database preference first
  if (user?.id) {
    try {
      const userLocale = await getUserLocale(user.id);
      if (userLocale && userLocale !== "auto") {
        // console.log(`User ${user.id} has database locale preference: ${userLocale}`);
        return userLocale as ResolvedLocale;
      }
    } catch (error) {
      console.log("Database locale lookup failed, falling back to cookies");
    }
  }

  // Check for cookie preference (for anonymous users or if database fails)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = new URLSearchParams(cookieHeader.replace(/; /g, "&"));
    const cookieLocale = cookies.get("locale");
    if (cookieLocale === "en" || cookieLocale === "id") {
      // console.log(`Using cookie locale preference: ${cookieLocale}`);
      return cookieLocale;
    }
  }

  // Fall back to paraglide's browser detection
  try {
    const detectedLocale = getLocale();
    console.log(`Using browser-detected locale: ${detectedLocale}`);
    return detectedLocale === "id" ? "id" : "en";
  } catch {
    // Final fallback to English
    console.log("Using fallback locale: en");
    return "en";
  }
}

/**
 * Get locale from cookie (for client-side use)
 */
export function getLocaleFromCookie(
  cookieString?: string,
): LocaleOption | null {
  if (!cookieString) return null;

  const cookies = new URLSearchParams(cookieString.replace(/; /g, "&"));
  const locale = cookies.get("locale");

  if (locale === "en" || locale === "id" || locale === "auto") {
    return locale as LocaleOption;
  }

  return null;
}

/**
 * Set locale cookie (for client-side use)
 */
export function setLocaleCookie(locale: LocaleOption): string {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  return `locale=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
