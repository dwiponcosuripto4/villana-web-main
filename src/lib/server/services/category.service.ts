import { db } from "$lib/server/db";
import { category, post } from "$lib/server/db/schema";
import { eq, asc, sql, desc } from "drizzle-orm";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithCount,
} from "$lib/types/post";
import { generateSlug } from "$lib/utils/slug";

export class CategoryService {
  async create(input: CreateCategoryInput) {
    const slug = input.slug || generateSlug(input.name);

    const [newCategory] = await db
      .insert(category)
      .values({
        name: input.name,
        slug,
        description: input.description,
        orderIndex: input.orderIndex ?? 0,
      })
      .returning();

    return newCategory;
  }

  async update(id: number, input: UpdateCategoryInput) {
    const updateData: Partial<typeof input> = { ...input };
    delete (updateData as any).id;

    const [updated] = await db
      .update(category)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(category.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    await db.delete(category).where(eq(category.id, id));
  }

  async findById(id: number) {
    const result = await db
      .select()
      .from(category)
      .where(eq(category.id, id))
      .limit(1);

    return result[0] || null;
  }

  async findBySlug(slug: string) {
    const result = await db
      .select()
      .from(category)
      .where(eq(category.slug, slug))
      .limit(1);

    return result[0] || null;
  }

  async getAll() {
    return db
      .select()
      .from(category)
      .orderBy(asc(category.orderIndex), asc(category.name));
  }

  async getWithPostCount(): Promise<CategoryWithCount[]> {
    const results = await db
      .select({
        category: category,
        postCount: sql<number>`count(${post.id})::int`,
      })
      .from(category)
      .leftJoin(
        post,
        sql`${post.categoryId} = ${category.id} AND ${post.status} = 'published'`
      )
      .groupBy(category.id)
      .orderBy(asc(category.orderIndex), asc(category.name));

    return results.map(({ category: cat, postCount }) => ({
      ...cat,
      postCount: postCount || 0,
    }));
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const conditions = [eq(category.slug, slug)];

    let query = db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.slug, slug))
      .limit(1);

    const result = await query;

    if (result.length === 0) return false;
    if (excludeId && result[0].id === excludeId) return false;
    return true;
  }
}

export const categoryService = new CategoryService();
