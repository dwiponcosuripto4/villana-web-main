import { getAbsoluteUrl } from "$lib/config/site";

/**
 * Generate a short villa URL path (relative)
 * Example: /v/123
 */
export function getShortVillaUrl(villaId: number): string {
  return `/v/${villaId}`;
}

/**
 * Generate an absolute short villa URL
 * Example: https://www.villana.id/v/123
 */
export function getAbsoluteShortVillaUrl(villaId: number): string {
  let url = getAbsoluteUrl(getShortVillaUrl(villaId));
  if (url.includes("www.")) {
    url = url.replace("www.", "");
  }
  return url;
}
