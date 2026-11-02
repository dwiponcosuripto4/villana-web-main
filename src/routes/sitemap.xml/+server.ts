/**
 * Dynamic Sitemap Generation
 *
 * Generates an XML sitemap containing all published villas, active places,
 * and static pages for better search engine discovery.
 */

import { VillaService } from "$lib/server/services/villa.service";
import { placeService } from "$lib/server/services/place.service";
import { siteConfig } from "$lib/config/site";
import type { RequestHandler } from "./$types";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate sitemap URL entry
 */
function createSitemapUrl(
  path: string,
  lastmod?: Date | string,
  changefreq: SitemapUrl["changefreq"] = "weekly",
  priority: number = 0.5
): SitemapUrl {
  const url: SitemapUrl = {
    loc: `${siteConfig.url}${path}`,
    changefreq,
    priority
  };

  if (lastmod) {
    url.lastmod = lastmod instanceof Date
      ? lastmod.toISOString().split('T')[0]
      : new Date(lastmod).toISOString().split('T')[0];
  }

  return url;
}

/**
 * Convert sitemap URLs to XML
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const xmlUrls = urls.map(url => {
    let xmlUrl = `  <url>\n    <loc>${url.loc}</loc>\n`;

    if (url.lastmod) {
      xmlUrl += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }

    if (url.changefreq) {
      xmlUrl += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }

    if (url.priority !== undefined) {
      xmlUrl += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }

    xmlUrl += `  </url>`;
    return xmlUrl;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

export const GET: RequestHandler = async () => {
  try {
    const urls: SitemapUrl[] = [];

    // Static pages with high priority
    const staticPages = [
      { path: "/", changefreq: "daily" as const, priority: 1.0 },
      { path: "/explore", changefreq: "daily" as const, priority: 0.9 },
      { path: "/places", changefreq: "daily" as const, priority: 0.9 },
      { path: "/about", changefreq: "monthly" as const, priority: 0.7 },
      { path: "/faq", changefreq: "monthly" as const, priority: 0.6 },
    ];

    staticPages.forEach(page => {
      urls.push(createSitemapUrl(page.path, new Date(), page.changefreq, page.priority));
    });

    // Get all published villas
    try {
      const villas = await VillaService.findAll({
        status: "published",
        limit: 10000 // Get all villas
      });

      villas.forEach(villa => {
        urls.push(createSitemapUrl(
          `/villa/${villa.slug}`,
          villa.updatedAt,
          "weekly",
          0.8
        ));
      });

      console.log(`Added ${villas.length} villas to sitemap`);
    } catch (error) {
      console.error("Error fetching villas for sitemap:", error);
    }

    // Get all active places
    try {
      const places = await placeService.findAll({
        isActive: true,
        limit: 10000 // Get all places
      });

      places.forEach(place => {
        urls.push(createSitemapUrl(
          `/place/${place.slug}`,
          place.updatedAt,
          "monthly",
          0.6
        ));
      });

      console.log(`Added ${places.length} places to sitemap`);
    } catch (error) {
      console.error("Error fetching places for sitemap:", error);
    }

    // Sort URLs by priority (highest first)
    urls.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const sitemapXML = generateSitemapXML(urls);

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(sitemapXML, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "X-Content-Type-Options": "nosniff", // Prevent MIME type sniffing
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return minimal sitemap with just the homepage if there's an error
    const fallbackSitemap = generateSitemapXML([
      createSitemapUrl("/", new Date(), "daily", 1.0)
    ]);

    return new Response(fallbackSitemap, {
      status: 500,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
};