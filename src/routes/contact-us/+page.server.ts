import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactMessage } from '$lib/server/db/schema';

const PUBLIC_TURNSTILE_SITE_KEY = process.env.PUBLIC_TURNSTILE_SITE_KEY || "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

// Manual validation function
function validateContactForm(data: { subject: string; content: string; turnstileToken: string }) {
  const errors: string[] = [];

  if (!data.subject || data.subject.trim().length === 0) {
    errors.push("Subject is required");
  } else if (data.subject.length > 255) {
    errors.push("Subject too long (max 255 characters)");
  }

  if (!data.content || data.content.trim().length < 10) {
    errors.push("Content must be at least 10 characters");
  } else if (data.content.length > 5000) {
    errors.push("Content too long (max 5000 characters)");
  }

  if (!data.turnstileToken) {
    errors.push("Captcha verification required");
  }

  return errors;
}

export const load: PageServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY,
  };
};

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn("Turnstile secret key not configured");
    return true; // Allow in development if not configured
  }

  try {
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
        }),
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, {
        error: "You must be logged in to send a message",
      });
    }

    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const turnstileToken = formData.get("cf-turnstile-response") as string;

    // Validate input
    const validationErrors = validateContactForm({ subject, content, turnstileToken });
    if (validationErrors.length > 0) {
      return fail(400, {
        error: validationErrors[0],
        values: { subject, content }
      });
    }

    // Verify Turnstile token
    if (PUBLIC_TURNSTILE_SITE_KEY) {
      const isValidToken = await verifyTurnstile(turnstileToken);
      if (!isValidToken) {
        return fail(400, {
          error: "Captcha verification failed. Please try again.",
          values: { subject, content }
        });
      }
    }

    // Save message to database
    try {
      await db.insert(contactMessage).values({
        userId: locals.user.id,
        subject,
        content,
      });

      return {
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!"
      };
    } catch (error) {
      console.error("Failed to save contact message:", error);
      return fail(500, {
        error: "Failed to send message. Please try again later.",
        values: { subject, content }
      });
    }
  },
};