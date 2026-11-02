import crypto from "crypto";
import { env } from "$env/dynamic/private";
import { env as envPublic } from "$env/dynamic/public";
import type {
  ImageOptimizationService,
  ImageOptimizationOptions,
  ProfilePhotoSize,
} from "./types";

/**
 * Thumbor utility for generating secure image URLs
 */
export class ThumborService implements ImageOptimizationService {
  private thumborUrl: string;
  private securityKey: string;
  private publicAssetBaseUrl: string;

  constructor() {
    this.thumborUrl = env.THUMBOR_URL || "http://localhost:8888";
    this.securityKey = env.THUMBOR_SECURITY_KEY || "";
    this.publicAssetBaseUrl = envPublic.PUBLIC_ASSET_BASE_URL || "";
  }

  /**
   * Generate a secure Thumbor URL for an image
   */
  generateUrl(imageUrl: string, options: ImageOptimizationOptions = {}): string {
    const {
      width = 0,
      height = 0,
      smart = true,
      quality,
      format,
      filters = [],
    } = options;

    // Build filters array from options
    const allFilters = [...filters];
    if (quality) {
      allFilters.push(`quality(${quality})`);
    }
    if (format) {
      allFilters.push(`format(${format})`);
    }
    let _imageUrl = imageUrl;

    if (!imageUrl.startsWith("http")) {
      // Prepend public asset base URL for relative paths
      // E.g. "/images/photo.jpg" -> "https://cdn.example.com/images/photo.jpg"
      _imageUrl =
        this.publicAssetBaseUrl +
        (imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl);
    }

    // encode the image URL
    _imageUrl = encodeURIComponent(_imageUrl);

    // Build the operation path (without the image URL)
    let operationParts = [];

    // Add dimensions
    if (width || height) {
      operationParts.push(`${width}x${height}`);
    }

    // Add smart cropping
    if (smart) {
      operationParts.push("smart");
    }

    // Add filters
    if (allFilters.length > 0) {
      operationParts.push(`filters:${allFilters.join(":")}`);
    }

    // Build operation path with trailing slash if not empty
    const operationPath =
      operationParts.length > 0 ? operationParts.join("/") + "/" : "";

    // The full path for URL construction
    const fullPath = operationPath + _imageUrl;

    // Generate signature if security key is provided
    if (this.securityKey && this.securityKey !== "") {
      // Sign the operation + image path (matching the reference implementation)
      const signaturePath = operationPath + _imageUrl;
      const signature = this.generateSignature(signaturePath);
      const fullUrl = `${this.thumborUrl}/${signature}/${fullPath}`;
      return fullUrl;
    }

    // Return unsafe URL (for development)
    const unsafeUrl = `${this.thumborUrl}/unsafe/${fullPath}`;
    console.log("Thumbor unsafe URL:", unsafeUrl);
    console.log("No security key provided, using unsafe mode");
    return unsafeUrl;
  }

  /**
   * Generate profile photo URL with standard dimensions
   */
  getProfilePhotoUrl(
    imageUrl: string,
    size: ProfilePhotoSize = "medium",
  ): string {
    const dimensions = {
      small: { width: 100, height: 100 },
      medium: { width: 200, height: 200 },
      large: { width: 400, height: 400 },
    };

    const { width, height } = dimensions[size];

    return this.generateUrl(imageUrl, {
      width,
      height,
      smart: true,
      quality: 85,
      format: "webp",
    });
  }

  /**
   * Generate optimized thumbnail URL for VillaCard (512x512, smart crop, WebP)
   */
  getVillaCardThumbnailUrl(imageUrl: string): string {
    return this.generateUrl(imageUrl, {
      width: 512,
      height: 512,
      smart: true,
      quality: 80,
      format: "webp",
    });
  }

  /**
   * Generate optimized Open Graph image URL (1200x630, smart crop, JPEG)
   * Uses JPEG format for better compatibility with social media platforms
   */
  getOgImageUrl(imageUrl: string): string {
    return this.generateUrl(imageUrl, {
      width: 1200,
      height: 630,
      smart: true,
      filters: ["quality(80)", "format(jpeg)"],
    });
  }

  /**
   * Generate HMAC signature for secure URLs
   */
  private generateSignature(path: string): string {
    const hmac = crypto.createHmac("sha1", this.securityKey);
    hmac.update(path, "utf8");

    // Get base64 digest and make it URL-safe
    let signature = hmac.digest("base64");
    signature = signature.replace(/\+/g, "-").replace(/\//g, "_");
    // Note: Do NOT remove padding (=) characters

    return signature;
  }

  /**
   * Validate if a URL is from our Thumbor instance
   */
  isValidThumborUrl(url: string): boolean {
    return url.startsWith(this.thumborUrl);
  }
}

// Export singleton instance
export const thumborService = new ThumborService();
