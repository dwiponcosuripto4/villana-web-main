import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { city, province } from "$lib/server/db/schema";
import { requireAdmin } from "$lib/server/auth-utils";

export const load: PageServerLoad = async (event) => {
  // Check admin permission
  try {
    requireAdmin(event);
  } catch {
    throw redirect(302, "/admin/login");
  }

  try {
    // Load cities and provinces for the form
    const [cities, provinces] = await Promise.all([
      db.select().from(city).orderBy(city.name),
      db.select().from(province).orderBy(province.name),
    ]);

    return {
      cities,
      provinces,
    };
  } catch (error) {
    console.error("Failed to load form data:", error);
    return {
      cities: [],
      provinces: [],
    };
  }
};