import { AdminService } from "$lib/server/services/admin.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const hasAdmin = await AdminService.hasAnyAdmin();
  const adminCount = await AdminService.getAdminCount();

  return {
    hasAdmin,
    adminCount,
    user: event.locals.user,
    session: event.locals.session ? "exists" : "none",
  };
};
