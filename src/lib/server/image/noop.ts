import type {
  ImageOptimizationService,
  ImageOptimizationOptions,
  ProfilePhotoSize,
} from "./types";

/**
 * No-op image service that returns original URLs unchanged
 * Used when IMAGE_OPTIMIZER is set to 'none' or not configured
 */
export class NoopImageService implements ImageOptimizationService {
  /**
   * Returns the original image URL unchanged
   */
  generateUrl(imageUrl: string, _options?: ImageOptimizationOptions): string {
    return imageUrl;
  }

  /**
   * Returns the original image URL unchanged
   */
  getProfilePhotoUrl(imageUrl: string, _size?: ProfilePhotoSize): string {
    return imageUrl;
  }

  /**
   * Returns the original image URL unchanged
   */
  getVillaCardThumbnailUrl(imageUrl: string): string {
    return imageUrl;
  }

  /**
   * Returns the original image URL unchanged
   */
  getOgImageUrl(imageUrl: string): string {
    return imageUrl;
  }
}

// Export singleton instance
export const noopImageService = new NoopImageService();
