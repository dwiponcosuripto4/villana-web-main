import { redirect } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth-utils";
import { AdminService } from "$lib/server/services/admin.service";
import { VillaService } from "$lib/server/services/villa.service";
import { placeService } from "$lib/server/services/place.service";
import { postService } from "$lib/server/services/post.service";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const pathname = event.url.pathname;

  // Skip auth checks for login, setup, and status pages
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/setup" ||
    pathname === "/admin/status"
  ) {
    return {
      user: event.locals.user || null,
      adminCount: 0,
    };
  }

  // First check if any admin exists
  const hasAdmin = await AdminService.hasAnyAdmin();

  if (!hasAdmin) {
    // No admin exists, redirect to setup
    redirect(302, "/admin/setup");
  }

  try {
    // Admin exists, require admin authentication
    const user = requireAdmin(event);

    const adminCount = await AdminService.getAdminCount();

    // Load dashboard data if we're on the main admin page
    let dashboardData = null;
    if (pathname === "/admin") {
      try {
        // Use optimized methods that run SQL aggregations instead of fetching all data
        const [
          stats,
          recentVillas,
          totalPlaces,
          publishedPlaces,
          totalPosts,
          publishedPosts,
        ] = await Promise.all([
          VillaService.getDashboardStats(),
          VillaService.getRecentVillasLite(5),
          placeService.countPlaces(),
          placeService.countPlaces("published"),
          postService.countPosts(),
          postService.countPosts("published"),
        ]);

        dashboardData = {
          stats: {
            ...stats,
            adminCount,
            totalPlaces,
            publishedPlaces,
            totalPosts,
            publishedPosts,
          },
          recentVillas,
        };
      } catch (dashboardError) {
        console.error("Error loading dashboard data:", dashboardError);
        dashboardData = {
          stats: {
            totalVillas: 0,
            published: 0,
            drafts: 0,
            totalViews: 0,
            adminCount,
            totalPlaces: 0,
            publishedPlaces: 0,
            totalPosts: 0,
            publishedPosts: 0,
          },
          recentVillas: [],
        };
      }
    }

    return {
      user,
      adminCount,
      ...(dashboardData || {}),
    };
  } catch (error) {
    // Not authenticated or not admin, redirect to admin login
    redirect(302, "/admin/login?redirect=" + encodeURIComponent(pathname));
  }
};
