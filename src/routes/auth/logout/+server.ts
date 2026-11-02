import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  invalidateSession,
  deleteSessionTokenCookie,
  sessionCookieName,
} from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
  const sessionToken = event.cookies.get(sessionCookieName);

  if (sessionToken) {
    // Invalidate the session in the database
    try {
      // Get session ID from token
      const { sha256 } = await import("@oslojs/crypto/sha2");
      const { encodeHexLowerCase } = await import("@oslojs/encoding");
      const sessionId = encodeHexLowerCase(
        sha256(new TextEncoder().encode(sessionToken)),
      );

      await invalidateSession(sessionId);
    } catch (error) {
      console.error("Error invalidating session:", error);
    }
  }

  // Delete the session cookie
  deleteSessionTokenCookie(event);

  // Redirect to home page
  throw redirect(302, "/");
};
