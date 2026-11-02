/**
 * Common types and interface for image optimization services
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  smart?: boolean;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
  filters?: string[];
}

export type ProfilePhotoSize = "small" | "medium" | "large";

export interface ImageOptimizationService {
  /**
   * Generate an optimized image URL
   */
  generateUrl(imageUrl: string, options?: ImageOptimizationOptions): string;

  /**
   * Generate profile photo URL with standard dimensions
   */
  getProfilePhotoUrl(imageUrl: string, size?: ProfilePhotoSize): string;

  /**
   * Generate optimized thumbnail URL for VillaCard (512x512, smart crop, WebP)
   */
  getVillaCardThumbnailUrl(imageUrl: string): string;

  /**
   * Generate optimized Open Graph image URL (1200x630, JPEG for compatibility)
   */
  getOgImageUrl(imageUrl: string): string;
}
