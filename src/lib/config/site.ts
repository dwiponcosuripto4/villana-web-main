export const siteConfig = {
  name: "Villana",
  url: "https://www.villana.id",
  description: "Temukan villa terbaik untuk liburan impian Anda di Villana.",
  locale: "en_US",
  twitter: {
    handle: "@villana",
    site: "@villana",
    cardType: "summary_large_image" as const,
  },
  openGraph: {
    type: "website",
    siteName: "Villana",
    defaultImage: "/og-default.jpg",
    imageWidth: 574,
    imageHeight: 418,
    imageType: "image/webp",
  },
};

export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

export function formatMetaDescription(
  description: string | null | undefined,
  fallback: string,
): string {
  if (description && description.trim()) {
    // Truncate to 160 characters for optimal SEO
    return description.length > 160
      ? description.substring(0, 157) + "..."
      : description;
  }
  return fallback;
}
