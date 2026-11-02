import type { PageServerLoad, Actions } from "./$types";
import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { validateSessionToken } from "$lib/server/auth";

import { loadEnv } from "$lib/server/utils/env";
loadEnv();

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_SITE_KEY = process.env.PUBLIC_TURNSTILE_SITE_KEY;

export const load: PageServerLoad = async ({ params, cookies }) => {
  // Get villa by slug
  const [villa] = await db
    .select()
    .from(table.villa)
    .where(eq(table.villa.slug, params.slug));

  if (!villa) {
    throw error(404, "Villa not found");
  }

  // Check authentication
  const token = cookies.get("auth-session");
  const { user } = token ? await validateSessionToken(token) : { user: null };

  return {
    villa,
    user,
    turnstileSiteKey: TURNSTILE_SITE_KEY,
  };
};

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    // Skip verification in development if no secret key is set
    if (
      !TURNSTILE_SECRET_KEY ||
      TURNSTILE_SECRET_KEY ===
        "1x00000000000000000000000000000000000000000000AA"
    ) {
      console.warn(
        "Turnstile verification skipped - no valid secret key configured",
      );
      return true;
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      },
    );

    const result = await response.json();
    console.log("Turnstile verification result:", result);
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

export const actions: Actions = {
  default: async ({ request, params, cookies, getClientAddress }) => {
    // Check authentication
    const token = cookies.get("auth-session");
    const { user } = token ? await validateSessionToken(token) : { user: null };

    if (!user) {
      throw redirect(302, `/admin/login?redirect=/villa/${params.slug}/report`);
    }

    const formData = await request.formData();
    const category = formData.get("category") as string;
    const customCategory = formData.get("customCategory") as string;
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const turnstileToken = formData.get("cf-turnstile-response") as string;

    // Validate required fields
    if (!category || !subject || !content) {
      return fail(400, {
        error: "Please fill in all required fields",
      });
    }

    // Validate turnstile
    if (!turnstileToken) {
      return fail(400, {
        error: "Please complete the verification captcha",
      });
    }

    console.log(
      "Verifying turnstile token:",
      turnstileToken.substring(0, 20) + "...",
    );
    const isValidCaptcha = await verifyTurnstile(
      turnstileToken,
      getClientAddress(),
    );

    if (!isValidCaptcha) {
      console.error(
        "Turnstile verification failed for token:",
        turnstileToken.substring(0, 20) + "...",
      );
      return fail(400, {
        error:
          "Security verification failed. Please refresh the page and try again.",
      });
    }

    // Get villa by slug
    const [villa] = await db
      .select()
      .from(table.villa)
      .where(eq(table.villa.slug, params.slug));

    if (!villa) {
      return fail(404, {
        error: "Villa not found",
      });
    }

    // Validate category
    const validCategories = ["scam", "invalid", "closed", "other"];
    if (!validCategories.includes(category)) {
      return fail(400, {
        error: "Invalid category selected",
      });
    }

    // Validate custom category if "other" is selected
    if (
      category === "other" &&
      (!customCategory || customCategory.trim() === "")
    ) {
      return fail(400, {
        error: "Please specify the issue type when selecting 'Other'",
      });
    }

    try {
      // Insert report into database
      await db.insert(table.villaReport).values({
        villaId: villa.id,
        userId: user.id,
        category: category as any,
        subject: subject.trim(),
        content: content.trim(),
        customCategory: category === "other" ? customCategory?.trim() : null,
        status: "pending",
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error submitting report:", err);
      return fail(500, {
        error: "Failed to submit report. Please try again.",
      });
    }
  },
};
