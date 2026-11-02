import { db } from "$lib/server/db";
import { tag, postTag, post } from "$lib/server/db/schema";
import { eq, asc, sql, desc, inArray } from "drizzle-orm";
import type { CreateTagInput, UpdateTagInput, TagWithCount } from "$lib/types/post";
import { generateSlug } from "$lib/utils/slug";

export class TagService {
  async create(input: CreateTagInput) {
    const slug = input.slug || generateSlug(input.name);

    const [newTag] = await db
      .insert(tag)
      .values({
        name: input.name,
        slug,
      })
      .returning();

    return newTag;
  }

  async update(id: number, input: UpdateTagInput) {
    const updateData: Partial<typeof input> = { ...input };
    delete (updateData as any).id;

    const [updated] = await db
      .update(tag)
      .set(updateData)
      .where(eq(tag.id, id))
      .returning();

    return updated;
  }

  async delete(id: number) {
    // postTag entries will be cascade deleted
    await db.delete(tag).where(eq(tag.id, id));
  }

  async findById(id: number) {
    const result = await db.select().from(tag).where(eq(tag.id, id)).limit(1);
    return result[0] || null;
  }

  async findBySlug(slug: string) {
    const result = await db.select().from(tag).where(eq(tag.slug, slug)).limit(1);
    return result[0] || null;
  }

  async getAll() {
    return db.select().from(tag).orderBy(asc(tag.name));
  }

  async getPopular(limit: number = 20): Promise<TagWithCount[]> {
    const results = await db
      .select({
        tag: tag,
        postCount: sql<number>`count(${postTag.postId})::int`,
      })
      .from(tag)
      .leftJoin(postTag, eq(postTag.tagId, tag.id))
      .leftJoin(
        post,
        sql`${post.id} = ${postTag.postId} AND ${post.status} = 'published'`
      )
      .groupBy(tag.id)
      .orderBy(desc(sql`count(${postTag.postId})`), asc(tag.name))
      .limit(limit);

    return results.map(({ tag: t, postCount }) => ({
      ...t,
      postCount: postCount || 0,
    }));
  }

  async getWithPostCount(): Promise<TagWithCount[]> {
    const results = await db
      .select({
        tag: tag,
        postCount: sql<number>`count(CASE WHEN ${post.status} = 'published' THEN 1 END)::int`,
      })
      .from(tag)
      .leftJoin(postTag, eq(postTag.tagId, tag.id))
      .leftJoin(post, eq(post.id, postTag.postId))
      .groupBy(tag.id)
      .orderBy(asc(tag.name));

    return results.map(({ tag: t, postCount }) => ({
      ...t,
      postCount: postCount || 0,
    }));
  }

  async findOrCreate(name: string) {
    const slug = generateSlug(name);

    // Check if exists
    const existing = await db
      .select()
      .from(tag)
      .where(eq(tag.slug, slug))
      .limit(1);

    if (existing[0]) return existing[0];

    // Create new
    const [newTag] = await db
      .insert(tag)
      .values({ name, slug })
      .returning();

    return newTag;
  }

  async findByIds(ids: number[]) {
    if (ids.length === 0) return [];
    return db.select().from(tag).where(inArray(tag.id, ids));
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const result = await db
      .select({ id: tag.id })
      .from(tag)
      .where(eq(tag.slug, slug))
      .limit(1);

    if (result.length === 0) return false;
    if (excludeId && result[0].id === excludeId) return false;
    return true;
  }
}

export const tagService = new TagService();
