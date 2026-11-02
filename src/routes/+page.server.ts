import type { PageServerLoad } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  try {
    const placesResponse = await fetch("/api/places/popular");
    const placesData = placesResponse.ok
      ? await placesResponse.json()
      : { data: [] };
    const randomPlaces =
      placesData.data
        ?.sort((a: any, b: any) => b.viewcount - a.viewcount)
        .slice(0, 6) || [];

    const allVillas = await VillaService.findAll({
      status: "published",
      limit: 20,
    });

    const randomVillas = allVillas.sort(() => Math.random() - 0.5).slice(0, 4);

    return {
      user: locals.user,
      randomPlaces,
      randomVillas,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      user: locals.user,
      randomPlaces: [],
      randomVillas: [],
    };
  }
};
