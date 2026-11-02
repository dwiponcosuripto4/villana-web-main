import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";

export const GET: RequestHandler = async ({ params }) => {
  const villaId = parseInt(params.id, 10);

  if (isNaN(villaId)) {
    throw redirect(302, "/explore");
  }

  const villa = await VillaService.findById(villaId);

  if (!villa || villa.status !== "published") {
    throw redirect(302, "/explore");
  }

  // 301 = Permanent redirect (good for SEO)
  throw redirect(301, `/villa/${villa.slug}`);
};
