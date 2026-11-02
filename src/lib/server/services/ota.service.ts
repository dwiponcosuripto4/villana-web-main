import { db } from "$lib/server/db";
import {
  villaOtaLink,
  villaOtaClick,
  villa as villaTable,
  type VillaOtaLink,
  type VillaOtaClick,
} from "$lib/server/db/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";

export type OtaProvider =
  | "agoda"
  | "traveloka"
  | "tiket_com"
  | "booking_com"
  | "airbnb"
  | "trip_com"
  | "expedia"
  | "other";

export type PriceMode = "auto_fetch" | "manual" | "none";

export interface CreateOtaLinkInput {
  villaId: number;
  provider: OtaProvider;
  affiliateUrl: string;
  customLabel?: string;
  priceMode?: PriceMode;
  manualPrice?: string;
  priceCurrency?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface UpdateOtaLinkInput {
  provider?: OtaProvider;
  affiliateUrl?: string;
  customLabel?: string;
  priceMode?: PriceMode;
  manualPrice?: string;
  priceCurrency?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface OtaLinkWithPrice extends VillaOtaLink {
  displayPrice: string | null;
}

export class OtaService {
  /**
   * Create a new OTA link for a villa
   */
  static async createOtaLink(input: CreateOtaLinkInput): Promise<VillaOtaLink> {
    const [otaLink] = await db
      .insert(villaOtaLink)
      .values({
        villaId: input.villaId,
        provider: input.provider,
        affiliateUrl: input.affiliateUrl,
        customLabel: input.customLabel,
        priceMode: input.priceMode || "none",
        manualPrice: input.manualPrice,
        priceCurrency: input.priceCurrency || "IDR",
        isActive: input.isActive ?? true,
        orderIndex: input.orderIndex ?? 0,
      })
      .returning();

    return otaLink;
  }

  /**
   * Update an existing OTA link
   */
  static async updateOtaLink(
    id: string,
    input: UpdateOtaLinkInput
  ): Promise<VillaOtaLink | null> {
    const [otaLink] = await db
      .update(villaOtaLink)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(villaOtaLink.id, id))
      .returning();

    return otaLink || null;
  }

  /**
   * Delete an OTA link
   */
  static async deleteOtaLink(id: string): Promise<boolean> {
    await db.delete(villaOtaLink).where(eq(villaOtaLink.id, id));
    return true;
  }

  /**
   * Get a single OTA link by ID
   */
  static async getOtaLinkById(id: string): Promise<VillaOtaLink | null> {
    const [otaLink] = await db
      .select()
      .from(villaOtaLink)
      .where(eq(villaOtaLink.id, id));

    return otaLink || null;
  }

  /**
   * Get all OTA links for a villa (for admin)
   */
  static async getOtaLinksByVillaId(villaId: number): Promise<VillaOtaLink[]> {
    const otaLinks = await db
      .select()
      .from(villaOtaLink)
      .where(eq(villaOtaLink.villaId, villaId))
      .orderBy(asc(villaOtaLink.orderIndex));

    return otaLinks;
  }

  /**
   * Get active OTA links for a villa (for public display)
   */
  static async getActiveOtaLinksByVillaId(
    villaId: number
  ): Promise<OtaLinkWithPrice[]> {
    const otaLinks = await db
      .select()
      .from(villaOtaLink)
      .where(
        and(eq(villaOtaLink.villaId, villaId), eq(villaOtaLink.isActive, true))
      )
      .orderBy(asc(villaOtaLink.orderIndex));

    // Add display price based on price mode
    return otaLinks.map((link) => ({
      ...link,
      displayPrice: this.getDisplayPrice(link),
    }));
  }

  /**
   * Get the display price based on price mode
   */
  static getDisplayPrice(link: VillaOtaLink): string | null {
    if (link.priceMode === "none") {
      return null;
    }
    if (link.priceMode === "manual" && link.manualPrice) {
      return link.manualPrice;
    }
    if (link.priceMode === "auto_fetch" && link.fetchedPrice) {
      return link.fetchedPrice;
    }
    return null;
  }

  /**
   * Update the order of OTA links
   */
  static async updateOtaLinksOrder(
    villaId: number,
    otaLinkIds: string[]
  ): Promise<void> {
    const updates = otaLinkIds.map((id, index) =>
      db
        .update(villaOtaLink)
        .set({ orderIndex: index, updatedAt: new Date() })
        .where(and(eq(villaOtaLink.id, id), eq(villaOtaLink.villaId, villaId)))
    );

    await Promise.all(updates);
  }

  /**
   * Track an OTA link click
   */
  static async trackOtaClick(
    otaLinkId: string,
    userId: number | null = null,
    userIp?: string,
    userAgent?: string,
    referer?: string
  ): Promise<{ success: boolean; affiliateUrl: string | null }> {
    try {
      // Get the OTA link
      const otaLink = await this.getOtaLinkById(otaLinkId);
      if (!otaLink) {
        return { success: false, affiliateUrl: null };
      }

      // Insert click event
      await db.insert(villaOtaClick).values({
        villaId: otaLink.villaId,
        otaLinkId: otaLink.id,
        provider: otaLink.provider,
        userId,
        userIp,
        userAgent,
        referer,
        clickedAt: new Date(),
      });

      // Increment click counter
      await db
        .update(villaOtaLink)
        .set({
          clickCount: sql`${villaOtaLink.clickCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(villaOtaLink.id, otaLinkId));

      return { success: true, affiliateUrl: otaLink.affiliateUrl };
    } catch (error) {
      console.error(`Error tracking OTA click for link ${otaLinkId}:`, error);
      return { success: false, affiliateUrl: null };
    }
  }

  /**
   * Get OTA click analytics for a villa
   */
  static async getOtaAnalytics(villaId: number): Promise<{
    totalClicks: number;
    clicksByProvider: Record<string, number>;
    recentClicks: VillaOtaClick[];
    linkStats: Array<{
      id: string;
      provider: string;
      clickCount: number;
      customLabel: string | null;
    }>;
  }> {
    try {
      // Get all OTA links for the villa with their click counts
      const otaLinks = await db
        .select({
          id: villaOtaLink.id,
          provider: villaOtaLink.provider,
          clickCount: villaOtaLink.clickCount,
          customLabel: villaOtaLink.customLabel,
        })
        .from(villaOtaLink)
        .where(eq(villaOtaLink.villaId, villaId))
        .orderBy(desc(villaOtaLink.clickCount));

      // Calculate totals
      let totalClicks = 0;
      const clicksByProvider: Record<string, number> = {};

      for (const link of otaLinks) {
        totalClicks += link.clickCount;
        clicksByProvider[link.provider] =
          (clicksByProvider[link.provider] || 0) + link.clickCount;
      }

      // Get recent clicks (last 50)
      const recentClicks = await db
        .select()
        .from(villaOtaClick)
        .where(eq(villaOtaClick.villaId, villaId))
        .orderBy(desc(villaOtaClick.clickedAt))
        .limit(50);

      return {
        totalClicks,
        clicksByProvider,
        recentClicks,
        linkStats: otaLinks,
      };
    } catch (error) {
      console.error(`Error getting OTA analytics for villa ${villaId}:`, error);
      return {
        totalClicks: 0,
        clicksByProvider: {},
        recentClicks: [],
        linkStats: [],
      };
    }
  }

  /**
   * Update fetched price (for auto-fetch mode)
   * This will be called by the price fetching service/cron job
   */
  static async updateFetchedPrice(
    id: string,
    price: string,
    currency: string = "IDR"
  ): Promise<VillaOtaLink | null> {
    const [otaLink] = await db
      .update(villaOtaLink)
      .set({
        fetchedPrice: price,
        priceCurrency: currency,
        priceUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(villaOtaLink.id, id))
      .returning();

    return otaLink || null;
  }

  /**
   * Get all OTA links that need price fetching
   */
  static async getLinksNeedingPriceFetch(): Promise<VillaOtaLink[]> {
    // Get links with auto_fetch price mode that haven't been updated in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const links = await db
      .select()
      .from(villaOtaLink)
      .where(
        and(
          eq(villaOtaLink.priceMode, "auto_fetch"),
          eq(villaOtaLink.isActive, true)
        )
      );

    // Filter to only those that need updating
    return links.filter(
      (link) => !link.priceUpdatedAt || link.priceUpdatedAt < oneDayAgo
    );
  }
}
