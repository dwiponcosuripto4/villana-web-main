import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { villa } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    throw error(400, "Villa slug is required");
  }

  try {
    const villaData = await db
      .select({ id: villa.id, title: villa.title, slug: villa.slug })
      .from(villa)
      .where(eq(villa.slug, slug))
      .limit(1);

    if (villaData.length === 0) {
      throw error(404, "Villa not found");
    }

    return json(villaData[0]);
  } catch (err) {
    console.error("Error fetching villa by slug:", err);
    throw error(500, "Failed to fetch villa");
  }
};
