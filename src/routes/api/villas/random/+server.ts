import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";

export const GET: RequestHandler = async () => {
  try {
    // Fetch published villas (larger pool for better randomization)
    const allVillas = await VillaService.findAll({
      status: "published",
      limit: 50, // Increased pool size for better randomization
    });

    if (allVillas.length === 0) {
      return json([]);
    }

    // Better randomization using Fisher-Yates shuffle
    const shuffled = [...allVillas];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take first 3 from shuffled array
    const randomVillas = shuffled.slice(0, 3);

    return json(randomVillas);
  } catch (error) {
    console.error("Error fetching random villas:", error);
    return json({ error: "Failed to fetch villas" }, { status: 500 });
  }
};