import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  // If we reach here, it means the layout.server.ts has already checked
  // for admin existence and authentication, so we can proceed normally
  return data;
};
