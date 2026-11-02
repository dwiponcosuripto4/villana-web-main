import * as fs from "fs";
import * as path from "path";

/**
 * Loads environment variables from a .env file into process.env.
 *
 * - No dependencies, pure TypeScript.
 * - Handles quoted values, comments, and escaped characters.
 * - Skips invalid lines safely.
 * - Returns an object of parsed key-value pairs.
 */
export function loadEnv(envFilePath = ".env"): Record<string, string> {
  const absPath = path.resolve(process.cwd(), envFilePath);

  if (!fs.existsSync(absPath)) {
    console.warn(`[loadEnv] No .env file found at ${absPath}`);
    return {};
  }

  const content = fs.readFileSync(absPath, "utf8");
  const lines = content.split(/\r?\n/);
  const result: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith("#")) continue;

    // Match KEY=VALUE with optional quotes
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;

    let [, key, value] = match;

    if (!value) value = "";

    // Remove inline comments (only if not inside quotes)
    if (!/^['"]/.test(value)) {
      const hashIndex = value.indexOf("#");
      if (hashIndex !== -1) {
        value = value.slice(0, hashIndex).trim();
      }
    }

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Replace escaped newlines and quotes
    value = value
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t");

    // Set in result and process.env (if not already set)
    result[key] = value;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return result;
}
