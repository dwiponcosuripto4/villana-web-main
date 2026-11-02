import { db } from "$lib/server/db";
import {
  savedVilla,
  villa,
  villaImage,
  villaAmenity,
  villaBedSize,
  type SavedVilla,
  type Villa,
  type VillaImage,
  type VillaAmenity,
  type VillaBedSize,
} from "$lib/server/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import type { VillaWithRelations } from "./villa.service";

export interface SavedVillaWithDetails extends SavedVilla {
  villa: VillaWithRelations;
}

export class SavedVillaService {
  static async countSavedVillas(id: string) {
    try {
      const [rv] = await db
        .select({
          count: count(),
        })
        .from(savedVilla)
        .where(eq(savedVilla.userId, id));
      return Number(rv.count);
    } catch (error) {
      console.error("Database error counting saved villas:", error);
      return 0;
    }
  }

  static async save(userId: string, villaId: number): Promise<SavedVilla> {
    try {
      const [saved] = await db
        .insert(savedVilla)
        .values({
          userId,
          villaId,
        })
        .returning();
      return saved;
    } catch (error: any) {
      // Handle unique constraint violation (already saved)
      if (error.code === "23505") {
        const [existing] = await db
          .select()
          .from(savedVilla)
          .where(
            and(eq(savedVilla.userId, userId), eq(savedVilla.villaId, villaId)),
          );
        return existing;
      }
      throw error;
    }
  }

  static async remove(userId: string, villaId: number): Promise<boolean> {
    const result = await db
      .delete(savedVilla)
      .where(
        and(eq(savedVilla.userId, userId), eq(savedVilla.villaId, villaId)),
      );
    return true;
  }

  static async getSavedVillas(
    userId: string,
  ): Promise<SavedVillaWithDetails[]> {
    const saved = await db
      .select()
      .from(savedVilla)
      .where(eq(savedVilla.userId, userId))
      .orderBy(desc(savedVilla.createdAt));

    if (saved.length === 0) {
      return [];
    }

    // Get villa details for all saved villas
    const villaIds = saved.map((s) => s.villaId);
    const villas = await db
      .select()
      .from(villa)
      .where(inArray(villa.id, villaIds));

    // Get images for all villas
    const images = await db
      .select()
      .from(villaImage)
      .where(inArray(villaImage.villaId, villaIds))
      .orderBy(villaImage.orderIndex);

    // Get amenities for all villas
    const amenities = await db
      .select()
      .from(villaAmenity)
      .where(inArray(villaAmenity.villaId, villaIds));

    // Get bed sizes for all villas
    const bedSizes = await db
      .select()
      .from(villaBedSize)
      .where(inArray(villaBedSize.villaId, villaIds));

    // Map villas with their complete relations
    const villaMap = new Map(
      villas.map((v) => [
        v.id,
        {
          ...v,
          images: images.filter((img) => img.villaId === v.id),
          amenities: amenities.filter((amenity) => amenity.villaId === v.id),
          videos: [], // Videos are not used in VillaCard, so empty array is fine
          bedSizes: bedSizes.filter((bedSize) => bedSize.villaId === v.id),
        },
      ]),
    );

    // Combine saved records with villa details
    return saved
      .map((s) => ({
        ...s,
        villa: villaMap.get(s.villaId)!,
      }))
      .filter((s) => s.villa); // Filter out any villas that may have been deleted
  }

  static async getSavedVillaIds(userId: string): Promise<number[]> {
    const saved = await db
      .select({ villaId: savedVilla.villaId })
      .from(savedVilla)
      .where(eq(savedVilla.userId, userId));

    return saved.map((s) => s.villaId);
  }

  static async isSaved(userId: string, villaId: number): Promise<boolean> {
    const [result] = await db
      .select({ id: savedVilla.id })
      .from(savedVilla)
      .where(
        and(eq(savedVilla.userId, userId), eq(savedVilla.villaId, villaId)),
      );

    return !!result;
  }

  static async countSaved(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(savedVilla)
      .where(eq(savedVilla.userId, userId));

    return result.length;
  }

  static async bulkSave(userId: string, villaIds: number[]): Promise<void> {
    if (villaIds.length === 0) return;

    // Get existing saved villas
    const existing = await db
      .select({ villaId: savedVilla.villaId })
      .from(savedVilla)
      .where(
        and(
          eq(savedVilla.userId, userId),
          inArray(savedVilla.villaId, villaIds),
        ),
      );

    const existingIds = new Set(existing.map((e) => e.villaId));
    const toSave = villaIds.filter((id) => !existingIds.has(id));

    if (toSave.length > 0) {
      await db.insert(savedVilla).values(
        toSave.map((villaId) => ({
          userId,
          villaId,
        })),
      );
    }
  }
}
