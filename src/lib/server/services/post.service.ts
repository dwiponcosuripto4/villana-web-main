import { db } from "$lib/server/db";
import { post, postTag, category, tag, user, city, province } from "$lib/server/db/schema";
import { eq, and, or, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import type {
  CreatePostInput,
  UpdatePostInput,
  PostSearchParams,
  PostSearchResult,
  PostWithRelations,
} from "$lib/types/post";
import { generateSlug } from "$lib/utils/slug";

export class PostService {
  async create(input: CreatePostInput) {
    const slug = input.slug || generateSlug(input.title);

    const [newPost] = await db
      .insert(post)
      .values({
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        featuredImage: input.featuredImage,
        featuredImageAlt: input.featuredImageAlt,
        categoryId: input.categoryId,
        authorId: input.authorId,
        cityId: input.cityId,
        status: input.status || "draft",
        publishedAt: input.status === "published" ? new Date() : input.publishedAt,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
      })
      .returning();

    // Add tags if provided
    if (input.tagIds && input.tagIds.length > 0) {
      await this.setTags(newPost.id, input.tagIds);
    }

    return newPost;
  }

  async update(id: number, input: UpdatePostInput) {
    const updateData: any = { ...input };
    delete updateData.id;
    delete updateData.tagIds;

    // If publishing for the first time, set publishedAt
    if (input.status === "published") {
      const existing = await this.findById(id);
      if (existing && existing.status !== "published" && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(post)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(post.id, id))
      .returning();

    // Update tags if provided
    if (input.tagIds !== undefined) {
      await this.setTags(id, input.tagIds || []);
    }

    return updated;
  }

  async delete(id: number) {
    // postTag entries will cascade delete
    await db.delete(post).where(eq(post.id, id));
  }

  async findById(id: number): Promise<PostWithRelations | null> {
    const result = await db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
      })
      .from(post)
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .where(eq(post.id, id))
      .limit(1);

    if (!result[0]) return null;

    const { post: postData, category: categoryData, author: authorData } = result[0];

    // Get tags
    const tags = await this.getPostTags(id);

    return {
      ...postData,
      category: categoryData || null,
      author: authorData || null,
      tags,
    };
  }

  async findBySlug(slug: string): Promise<PostWithRelations | null> {
    const result = await db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
        city: {
          id: city.id,
          name: city.name,
        },
        province: {
          id: province.id,
          name: province.name,
        },
      })
      .from(post)
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .leftJoin(city, eq(post.cityId, city.id))
      .leftJoin(province, eq(city.provinceId, province.id))
      .where(eq(post.slug, slug))
      .limit(1);

    if (!result[0]) return null;

    const { post: postData, category: categoryData, author: authorData, city: cityData, province: provinceData } = result[0];

    // Get tags
    const tags = await this.getPostTags(postData.id);

    // Increment view count
    await db
      .update(post)
      .set({ viewCount: sql`${post.viewCount} + 1` })
      .where(eq(post.id, postData.id));

    return {
      ...postData,
      category: categoryData || null,
      author: authorData || null,
      tags,
      city: cityData ? {
        id: cityData.id,
        name: cityData.name,
        province: provinceData ? {
          id: provinceData.id,
          name: provinceData.name,
        } : undefined,
      } : null,
    };
  }

  async search(params: PostSearchParams): Promise<PostSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [eq(post.status, "published")];

    if (params.query) {
      conditions.push(
        or(
          ilike(post.title, `%${params.query}%`),
          ilike(post.excerpt, `%${params.query}%`),
          ilike(post.content, `%${params.query}%`)
        )!
      );
    }

    if (params.categoryId) {
      conditions.push(eq(post.categoryId, params.categoryId));
    }

    if (params.authorId) {
      conditions.push(eq(post.authorId, params.authorId));
    }

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(post)
      .where(and(...conditions));

    // Get posts
    let query = db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
      })
      .from(post)
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .where(and(...conditions));

    // Sorting
    switch (params.sortBy) {
      case "oldest":
        query = query.orderBy(asc(post.publishedAt));
        break;
      case "popular":
        query = query.orderBy(desc(post.viewCount));
        break;
      case "alphabetical":
        query = query.orderBy(asc(post.title));
        break;
      case "newest":
      default:
        query = query.orderBy(desc(post.publishedAt));
        break;
    }

    const results = await query.limit(limit).offset(offset);

    // Get tags for all posts
    const postIds = results.map((r) => r.post.id);
    const tagsMap = await this.getTagsForPosts(postIds);

    const posts: PostWithRelations[] = results.map(
      ({ post: postData, category: categoryData, author: authorData }) => ({
        ...postData,
        category: categoryData || null,
        author: authorData || null,
        tags: tagsMap[postData.id] || [],
      })
    );

    return {
      posts,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async adminSearch(params: PostSearchParams): Promise<PostSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (params.query) {
      conditions.push(
        or(
          ilike(post.title, `%${params.query}%`),
          ilike(post.excerpt, `%${params.query}%`)
        )
      );
    }

    if (params.status) {
      conditions.push(eq(post.status, params.status));
    }

    if (params.categoryId) {
      conditions.push(eq(post.categoryId, params.categoryId));
    }

    if (params.authorId) {
      conditions.push(eq(post.authorId, params.authorId));
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(post);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: total }] = await countQuery;

    // Get posts
    let query = db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
      })
      .from(post)
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sorting
    switch (params.sortBy) {
      case "oldest":
        query = query.orderBy(asc(post.createdAt));
        break;
      case "popular":
        query = query.orderBy(desc(post.viewCount));
        break;
      case "alphabetical":
        query = query.orderBy(asc(post.title));
        break;
      case "newest":
      default:
        query = query.orderBy(desc(post.createdAt));
        break;
    }

    const results = await query.limit(limit).offset(offset);

    // Get tags for all posts
    const postIds = results.map((r) => r.post.id);
    const tagsMap = await this.getTagsForPosts(postIds);

    const posts: PostWithRelations[] = results.map(
      ({ post: postData, category: categoryData, author: authorData }) => ({
        ...postData,
        category: categoryData || null,
        author: authorData || null,
        tags: tagsMap[postData.id] || [],
      })
    );

    return {
      posts,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async publish(id: number) {
    const [updated] = await db
      .update(post)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(post.id, id))
      .returning();

    return updated;
  }

  async unpublish(id: number) {
    const [updated] = await db
      .update(post)
      .set({
        status: "draft",
        updatedAt: new Date(),
      })
      .where(eq(post.id, id))
      .returning();

    return updated;
  }

  async setTags(postId: number, tagIds: number[]) {
    // Remove existing tags
    await db.delete(postTag).where(eq(postTag.postId, postId));

    // Add new tags
    if (tagIds.length > 0) {
      await db.insert(postTag).values(
        tagIds.map((tagId) => ({
          postId,
          tagId,
        }))
      );
    }
  }

  async getPostTags(postId: number) {
    const results = await db
      .select({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })
      .from(postTag)
      .innerJoin(tag, eq(postTag.tagId, tag.id))
      .where(eq(postTag.postId, postId))
      .orderBy(asc(tag.name));

    return results;
  }

  async getTagsForPosts(postIds: number[]) {
    if (postIds.length === 0) return {};

    const results = await db
      .select({
        postId: postTag.postId,
        tagId: tag.id,
        tagName: tag.name,
        tagSlug: tag.slug,
      })
      .from(postTag)
      .innerJoin(tag, eq(postTag.tagId, tag.id))
      .where(inArray(postTag.postId, postIds))
      .orderBy(asc(tag.name));

    const tagsMap: Record<number, Array<{ id: number; name: string; slug: string }>> = {};

    results.forEach((row) => {
      if (!tagsMap[row.postId]) {
        tagsMap[row.postId] = [];
      }
      tagsMap[row.postId].push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
      });
    });

    return tagsMap;
  }

  async getRecentPosts(limit: number = 5): Promise<PostWithRelations[]> {
    const results = await db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
      })
      .from(post)
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .where(eq(post.status, "published"))
      .orderBy(desc(post.publishedAt))
      .limit(limit);

    const postIds = results.map((r) => r.post.id);
    const tagsMap = await this.getTagsForPosts(postIds);

    return results.map(({ post: postData, category: categoryData, author: authorData }) => ({
      ...postData,
      category: categoryData || null,
      author: authorData || null,
      tags: tagsMap[postData.id] || [],
    }));
  }

  async getPostsByCategory(
    categorySlug: string,
    params: PostSearchParams
  ): Promise<PostSearchResult> {
    // Find category
    const cat = await db
      .select()
      .from(category)
      .where(eq(category.slug, categorySlug))
      .limit(1);

    if (!cat[0]) {
      return { posts: [], total: 0, page: 1, limit: 10, hasMore: false };
    }

    return this.search({
      ...params,
      categoryId: cat[0].id,
    });
  }

  async getPostsByTag(
    tagSlug: string,
    params: PostSearchParams
  ): Promise<PostSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Find tag
    const t = await db
      .select()
      .from(tag)
      .where(eq(tag.slug, tagSlug))
      .limit(1);

    if (!t[0]) {
      return { posts: [], total: 0, page: 1, limit: 10, hasMore: false };
    }

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(DISTINCT ${post.id})::int` })
      .from(post)
      .innerJoin(postTag, eq(postTag.postId, post.id))
      .where(and(eq(postTag.tagId, t[0].id), eq(post.status, "published")));

    // Get posts
    const results = await db
      .select({
        post: post,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        },
      })
      .from(post)
      .innerJoin(postTag, eq(postTag.postId, post.id))
      .leftJoin(category, eq(post.categoryId, category.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .where(and(eq(postTag.tagId, t[0].id), eq(post.status, "published")))
      .orderBy(desc(post.publishedAt))
      .limit(limit)
      .offset(offset);

    const postIds = results.map((r) => r.post.id);
    const tagsMap = await this.getTagsForPosts(postIds);

    const posts: PostWithRelations[] = results.map(
      ({ post: postData, category: categoryData, author: authorData }) => ({
        ...postData,
        category: categoryData || null,
        author: authorData || null,
        tags: tagsMap[postData.id] || [],
      })
    );

    return {
      posts,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async incrementViewCount(id: number) {
    await db
      .update(post)
      .set({ viewCount: sql`${post.viewCount} + 1` })
      .where(eq(post.id, id));
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const result = await db
      .select({ id: post.id })
      .from(post)
      .where(eq(post.slug, slug))
      .limit(1);

    if (result.length === 0) return false;
    if (excludeId && result[0].id === excludeId) return false;
    return true;
  }

  async countPosts(status?: "draft" | "published" | "archived"): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)::int` }).from(post);

    if (status) {
      query = query.where(eq(post.status, status));
    }

    const [{ count }] = await query;
    return count;
  }
}

export const postService = new PostService();
