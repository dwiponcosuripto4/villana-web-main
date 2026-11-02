/**
 * Server-side validation utilities
 */
import { encodeBase32LowerCase } from "@oslojs/encoding";

export function validateUsername(username: unknown): username is string {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[A-Za-z0-9_-]+$/.test(username)
  );
}

export function validateUsernameForRegistration(username: unknown): username is string {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[a-z0-9_]+$/.test(username)
  );
}

export function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 255
  );
}

// generateUserId function removed - using serial integer IDs now
