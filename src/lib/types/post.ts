import type { Post, Category, Tag } from "$lib/server/db/schema";

export interface PostWithRelations extends Post {
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  author?: {
    id: number;
    fullName: string;
    profilePicture?: string | null;
  } | null;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  city?: {
    id: string;
    name: string;
    province?: {
      id: string;
      name: string;
    };
  } | null;
}

export interface CategoryWithCount extends Category {
  postCount: number;
}

export interface TagWithCount extends Tag {
  postCount: number;
}

export interface CreatePostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  categoryId?: number | null;
  authorId?: number;
  cityId?: string | null;
  status?: "draft" | "published" | "archived";
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  tagIds?: number[];
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: number;
}

export interface PostSearchParams {
  query?: string;
  categoryId?: number;
  categorySlug?: string;
  tagId?: number;
  tagSlug?: string;
  status?: "draft" | "published" | "archived";
  authorId?: number;
  page?: number;
  limit?: number;
  sortBy?: "newest" | "oldest" | "popular" | "alphabetical";
}

export interface PostSearchResult {
  posts: PostWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  orderIndex?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: number;
}

export interface CreateTagInput {
  name: string;
  slug?: string;
}

export interface UpdateTagInput extends Partial<CreateTagInput> {
  id: number;
}
