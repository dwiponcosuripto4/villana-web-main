import crypto from "crypto";
import { env } from "$env/dynamic/private";
import { env as envPublic } from "$env/dynamic/public";
import type {
  ImageOptimizationService,
  ImageOptimizationOptions,
  ProfilePhotoSize,
} from "./types";

/**
 * Imgproxy utility for generating secure image URLs
 * https://docs.imgproxy.net/
 */
export class ImgproxyService implements ImageOptimizationService {
  private imgproxyUrl: string;
  private key: Buffer | null;
  private salt: Buffer | null;
  private publicAssetBaseUrl: string;

  constructor() {
    this.imgproxyUrl = env.IMGPROXY_URL || "http://localhost:8080";
    this.publicAssetBaseUrl = envPublic.PUBLIC_ASSET_BASE_URL || "";

    // Key and salt should be hex-encoded strings
    const keyHex = env.IMGPROXY_KEY || "";
    const saltHex = env.IMGPROXY_SALT || "";

    this.key = keyHex ? Buffer.from(keyHex, "hex") : null;
    this.salt = saltHex ? Buffer.from(saltHex, "hex") : null;
  }

  /**
   * Generate a secure Imgproxy URL for an image
   */
  generateUrl(
    imageUrl: string,
    options: ImageOptimizationOptions = {},
  ): string {
    const {
      width = 0,
      height = 0,
      smart = true,
      quality = 80,
      format = "webp",
    } = options;

    let sourceUrl = imageUrl;

    if (!imageUrl.startsWith("http")) {
      // Prepend public asset base URL for relative paths
      sourceUrl =
        this.publicAssetBaseUrl +
        (imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl);
    }

    // Build processing options
    const processingOptions: string[] = [];

    // Resize option: rs:type:width:height
    // Using "fill" for smart-like behavior with aspect ratio
    if (width || height) {
      const resizeType = smart ? "fill" : "fit";
      processingOptions.push(`rs:${resizeType}:${width}:${height}`);
    }

    // Gravity for smart cropping
    if (smart) {
      processingOptions.push("g:sm"); // sm = smart
    }

    // Quality
    if (quality) {
      processingOptions.push(`q:${quality}`);
    }

    //console.log("Imgproxy: url:", sourceUrl);

    // Encode source URL as URL-safe Base64
    const encodedUrl = this.encodeSourceUrl(sourceUrl);

    // Build the path: /processing_options/encoded_url.extension
    const processingPath =
      processingOptions.length > 0 ? processingOptions.join("/") + "/" : "";

    const path = `/${processingPath}${encodedUrl}.${format}`;

    // Generate signature
    const signature = this.generateSignature(path);

    return `${this.imgproxyUrl}/${signature}${path}`;
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
      // width: 1200,
      // height: 630,
      width: 512,
      height: 512,
      smart: true,
      quality: 80,
      format: "jpeg",
    });
  }

  /**
   * Encode source URL as URL-safe Base64
   */
  private encodeSourceUrl(url: string): string {
    return Buffer.from(url)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // Remove padding
  }

  /**
   * Generate HMAC-SHA256 signature for secure URLs
   */
  private generateSignature(path: string): string {
    if (!this.key || !this.salt) {
      // No signing configured - use "insecure" mode
      console.log("Imgproxy: No key/salt provided, using insecure mode");
      return "insecure";
    }

    // Create HMAC with salt prepended to path
    const hmac = crypto.createHmac("sha256", this.key);
    hmac.update(this.salt);
    hmac.update(path);

    // Get URL-safe Base64 digest
    let signature = hmac.digest("base64");
    signature = signature
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return signature;
  }
}

// Export singleton instance
export const imgproxyService = new ImgproxyService();
