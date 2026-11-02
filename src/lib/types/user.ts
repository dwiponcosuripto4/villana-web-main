import type { User } from "$lib/server/db/schema";

// Safe user type that excludes passwordHash for client-side use
export type SafeUser = Omit<User, "passwordHash">;

export interface UserSearchParams {
  query?: string;
  role?: "admin" | "viewer" | "all";
  sortBy?: "newest" | "oldest" | "alphabetical";
  page?: number;
  limit?: number;
}

export interface UserSearchResult {
  users: SafeUser[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface UserWithAdmin extends SafeUser {
  isAdmin: boolean;
}