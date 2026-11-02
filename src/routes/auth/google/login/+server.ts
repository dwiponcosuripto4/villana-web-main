import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { google } from "$lib/server/auth/google";
import { generateState, generateCodeVerifier } from "arctic";

export const GET: RequestHandler = async ({ cookies }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(
    state,
    codeVerifier,
    ["profile", "email"]
  );

  // Store both state and code verifier in secure, HTTP-only cookies
  cookies.set("google_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  cookies.set("google_code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  throw redirect(302, url.toString());
};
