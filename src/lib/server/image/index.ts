import { env } from "$env/dynamic/private";
import type { ImageOptimizationService } from "./types";
import { ThumborService } from "./thumbor";
import { ImgproxyService } from "./imgproxy";
import { NoopImageService } from "./noop";

export type { ImageOptimizationService, ImageOptimizationOptions, ProfilePhotoSize } from "./types";

export type ImageOptimizer = "thumbor" | "imgproxy" | "none";

/**
 * Get the configured image optimizer type
 * Defaults to 'none' if not configured
 */
function getImageOptimizerType(): ImageOptimizer {
  const optimizer = env.IMAGE_OPTIMIZER?.toLowerCase();

  if (optimizer === "thumbor") {
    return "thumbor";
  }
  if (optimizer === "imgproxy") {
    return "imgproxy";
  }

  // Default to 'none' if not configured or invalid
  return "none";
}

/**
 * Create the appropriate image optimization service based on configuration
 */
function createImageService(): ImageOptimizationService {
  const optimizerType = getImageOptimizerType();

  switch (optimizerType) {
    case "thumbor":
      console.log("Image optimizer: Using Thumbor");
      return new ThumborService();
    case "imgproxy":
      console.log("Image optimizer: Using Imgproxy");
      return new ImgproxyService();
    case "none":
    default:
      console.log("Image optimizer: None (passthrough)");
      return new NoopImageService();
  }
}

// Export singleton instance
export const imageService = createImageService();

// Also export individual services for direct use if needed
export { ThumborService, thumborService } from "./thumbor";
export { ImgproxyService, imgproxyService } from "./imgproxy";
export { NoopImageService, noopImageService } from "./noop";
