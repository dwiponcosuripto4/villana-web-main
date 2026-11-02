import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { hash } from "@node-rs/argon2";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "$lib/server/auth";
import { eq } from "drizzle-orm";
import { encodeBase64url } from "@oslojs/encoding";
import { validateUsernameForRegistration } from "$lib/server/validation";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const PUBLIC_TURNSTILE_SITE_KEY = process.env.PUBLIC_TURNSTILE_SITE_KEY || "";

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<boolean> {
  const formData = new FormData();
  formData.append("secret", TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  if (ip) {
    formData.append("remoteip", ip);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const data: TurnstileResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return errors;
}

function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true; // Optional field

  // Basic international phone format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
}

// generateUserId function removed - using serial integer IDs now

export const load: PageServerLoad = async () => {
  return {
    turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const fullName = formData.get("fullName") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const turnstileToken = formData.get("cf-turnstile-response") as string;
    const termsAccepted = formData.get("termsAccepted") as string;

    // Validate required fields
    if (!fullName || fullName.length < 2) {
      return fail(400, {
        message: "Full name must be at least 2 characters long",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Validate terms acceptance
    if (!termsAccepted || termsAccepted !== "on") {
      return fail(400, {
        message: "Anda harus menyetujui Syarat dan Ketentuan untuk melanjutkan",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Validate username
    if (!username) {
      return fail(400, {
        message: "Username is required",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    if (!validateUsernameForRegistration(username)) {
      return fail(400, {
        message: "Username must be 3-31 characters and contain only lowercase letters, numbers, and underscore",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    if (!email || !validateEmail(email)) {
      return fail(400, {
        message: "Please enter a valid email address",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    if (!password) {
      return fail(400, {
        message: "Password is required",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return fail(400, {
        message: passwordErrors.join(". "),
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        message: "Passwords do not match",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return fail(400, {
        message:
          "Please enter a valid phone number with country code (e.g., +1234567890)",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      return fail(400, {
        message: "Please complete the security verification",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    const turnstileValid = await verifyTurnstileToken(
      turnstileToken,
      event.getClientAddress(),
    );

    if (!turnstileValid) {
      return fail(400, {
        message: "Security verification failed. Please try again.",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    try {
      // Check if email already exists
      const existingUserByEmail = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        return fail(400, {
          message: "An account with this email already exists",
          fullName,
          username,
          email,
          phone,
          address,
        });
      }

      // Check if username already exists
      const existingUserByUsername = await db
        .select()
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

      if (existingUserByUsername.length > 0) {
        return fail(400, {
          message: "This username is already taken. Please choose another one.",
          fullName,
          username,
          email,
          phone,
          address,
        });
      }

      // Hash password
      const passwordHash = await hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      // Create user (ID will be auto-generated by database serial)
      const newUser = await db.insert(user).values({
        username,
        email,
        fullName,
        phone: phone || null,
        address: address || null,
        passwordHash,
        registrationMethod: "email",
        emailVerified: false, // For future email verification
        role: "viewer",
      }).returning();

      // Create session
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, newUser[0].id);

      // Set session cookie using the auth system's cookie setting
      setSessionTokenCookie(event, sessionToken, session.expiresAt);

      // Return success data for the client
      return {
        success: true,
        user: {
          fullName,
          email,
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      return fail(500, {
        message: "An error occurred during registration. Please try again.",
        fullName,
        username,
        email,
        phone,
        address,
      });
    }

    // Success - don't redirect so we can show success message
  },
};
