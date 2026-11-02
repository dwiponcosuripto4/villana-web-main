import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SearchService } from "$lib/server/services/search.service";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!query || query.trim().length < 2) {
      return json({ results: [] });
    }

    const results = await SearchService.search(query, limit);

    return json({ results });
  } catch (error) {
    console.error("Error in search API:", error);
    return json({ error: "Failed to search" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return json({ results: [] });
    }

    const results = await SearchService.search(query, limit);

    return json({ results });
  } catch (error) {
    console.error("Error in search API:", error);
    return json({ error: "Failed to search" }, { status: 500 });
  }
};
