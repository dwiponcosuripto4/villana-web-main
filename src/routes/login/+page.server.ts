import { verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { AdminService } from "$lib/server/services/admin.service";
import { validateUsername, validatePassword } from "$lib/server/validation";
import type { Actions, PageServerLoad } from "./$types";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const PUBLIC_TURNSTILE_SITE_KEY = process.env.PUBLIC_TURNSTILE_SITE_KEY || "";

async function verifyTurnstile(
  token: string,
  remoteIP?: string,
): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn("Turnstile secret key not configured");
    return true; // Allow login in development if not configured
  }

  try {
    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (remoteIP) {
      formData.append("remoteip", remoteIP);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const result = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!result.success) {
      console.error("Turnstile verification failed:", result["error-codes"]);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying Turnstile:", error);
    return false;
  }
}

export const load: PageServerLoad = async (event) => {
  // Check if any admin exists
  const hasAdmin = await AdminService.hasAnyAdmin();

  if (!hasAdmin) {
    // No admin exists, redirect to setup
    redirect(302, "/admin/setup");
  }

  // If user is already logged in and is admin, redirect to admin dashboard
  if (event.locals.user && event.locals.user.role === "admin") {
    redirect(302, "/admin");
  }

  // console.log("Login page load debug:", {
  //   PUBLIC_TURNSTILE_SITE_KEY,
  //   hasKey: !!PUBLIC_TURNSTILE_SITE_KEY,
  // });

  return {
    hasAdmin,
    turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY,
    backUrl: event.url.searchParams.get("backUrl") || null,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
    const turnstileToken = formData.get("cf-turnstile-response");

    // Verify Turnstile token if configured
    if (PUBLIC_TURNSTILE_SITE_KEY) {
      if (!turnstileToken || typeof turnstileToken !== "string") {
        return fail(400, {
          message: "Please complete the security verification",
        });
      }

      const clientIP = event.getClientAddress();
      const isValidCaptcha = await verifyTurnstile(turnstileToken, clientIP);

      if (!isValidCaptcha) {
        return fail(400, {
          message: "Security verification failed. Please try again.",
        });
      }
    }

    if (!validateUsername(username)) {
      return fail(400, {
        message: "Invalid username",
      });
    }
    if (!validatePassword(password)) {
      return fail(400, { message: "Invalid password" });
    }

    const results = await db
      .select()
      .from(table.user)
      .where(eq(table.user.username, username));

    const existingUser = results.at(0);
    if (!existingUser) {
      return fail(400, { message: "Incorrect username or password" });
    }

    // Check if user is admin
    if (existingUser.role !== "admin") {
      return fail(400, {
        message: "Access denied. Admin privileges required.",
      });
    }

    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    if (!validPassword) {
      return fail(400, { message: "Incorrect username or password" });
    }

    const sessionToken = auth.generateSessionToken();
    const session = await auth.createSession(sessionToken, existingUser.id);
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

    // Debug logging for redirect
    const redirectTo = event.url.searchParams.get("redirect") || "/admin";

    redirect(302, redirectTo);
  },
};
