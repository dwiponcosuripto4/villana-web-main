<script lang="ts">
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { DropdownMenu } from "bits-ui";
  import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Tag,
    Folder,
  } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set("page", pageNum.toString());
    goto(`/admin/posts?${params.toString()}`);
  }

  function handleSortChange(newSortBy: string) {
    const params = new URLSearchParams($page.url.searchParams);
    if (newSortBy === "newest") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", newSortBy);
    }
    params.delete("page");
    goto(`/admin/posts?${params.toString()}`);
  }

  function handleCategoryChange(categoryId: string) {
    const params = new URLSearchParams($page.url.searchParams);
    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }
    params.delete("page");
    goto(`/admin/posts?${params.toString()}`);
  }

  function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleDelete(postId: number, postTitle: string) {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    const response = await fetch(`/admin/posts/${postId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      goto("/admin/posts", { invalidateAll: true });
    }
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="sm:flex sm:items-center sm:justify-between mb-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Posts</h2>
      <p class="mt-1 text-sm text-gray-600">Manage blog posts and articles</p>
    </div>
    <div class="mt-4 sm:mt-0 flex gap-2">
      <a
        href="/admin/posts/categories"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Folder class="h-4 w-4 mr-2" />
        Categories
      </a>
      <a
        href="/admin/posts/tags"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Tag class="h-4 w-4 mr-2" />
        Tags
      </a>
      <a
        href="/admin/posts/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus class="h-4 w-4 mr-2" />
        New Post
      </a>
    </div>
  </div>

  <!-- Filters -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <form method="get" class="flex gap-2">
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        />
        <input
          type="search"
          name="search"
          value={data.filters.search || ""}
          placeholder="Search posts..."
          class="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        Search
      </button>
    </form>

    <!-- Status Filter -->
    <div class="flex gap-2">
      <a
        href="/admin/posts"
        class={`px-3 py-2 text-sm font-medium rounded-md ${!data.filters.status ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        All
      </a>
      <a
        href="/admin/posts?status=published"
        class={`px-3 py-2 text-sm font-medium rounded-md ${data.filters.status === "published" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        Published
      </a>
      <a
        href="/admin/posts?status=draft"
        class={`px-3 py-2 text-sm font-medium rounded-md ${data.filters.status === "draft" ? "bg-yellow-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        Drafts
      </a>
    </div>

    <!-- Category Filter -->
    <div class="flex items-center gap-2">
      <label for="category-select" class="text-sm text-gray-700 whitespace-nowrap">
        Category:
      </label>
      <select
        id="category-select"
        value={data.filters.categoryId || ""}
        onchange={(e) => handleCategoryChange(e.currentTarget.value)}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">All Categories</option>
        {#each data.categories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>

    <!-- Sort Dropdown -->
    <div class="flex items-center gap-2">
      <label for="sort-select" class="text-sm text-gray-700 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={data.filters.sortBy || "newest"}
        onchange={(e) => handleSortChange(e.currentTarget.value)}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="newest">Recently Added</option>
        <option value="oldest">Oldest First</option>
        <option value="popular">Most Viewed</option>
        <option value="alphabetical">Title (A-Z)</option>
      </select>
    </div>
  </div>

  <!-- Results Count -->
  <div class="mb-4 text-sm text-gray-600">
    Showing {data.posts.length > 0
      ? (data.pagination.page - 1) * data.pagination.limit + 1
      : 0} - {Math.min(
      data.pagination.page * data.pagination.limit,
      data.pagination.total,
    )} of {data.pagination.total} posts
  </div>

  <!-- Post List -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul class="divide-y divide-gray-200">
      {#each data.posts as post}
        <li class="hover:bg-gray-50 transition-colors">
          <div class="px-4 py-4 flex items-center justify-between sm:px-6">
            <div class="flex items-center flex-1">
              {#if post.featuredImage}
                <a
                  href="/admin/posts/{post.id}"
                  class="block h-16 w-24 mr-4 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all flex-shrink-0"
                >
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
                    class="h-full w-full object-cover"
                  />
                </a>
              {:else}
                <div class="h-16 w-24 mr-4 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-gray-400 text-xs">No image</span>
                </div>
              {/if}
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="text-lg font-medium text-indigo-600 truncate">
                      <a href="/admin/posts/{post.id}">
                        {post.title}
                      </a>
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      {#if post.category}
                        <span class="flex items-center">
                          <Folder class="w-4 h-4 mr-1" />
                          {post.category.name}
                        </span>
                        <span>•</span>
                      {/if}
                      <span class="flex items-center">
                        <Eye class="w-4 h-4 mr-1" />
                        {post.viewCount?.toLocaleString() || 0} views
                      </span>
                      <span>•</span>
                      <span>
                        {post.status === "published" ? formatDate(post.publishedAt) : `Created ${formatDate(post.createdAt)}`}
                      </span>
                    </div>
                    {#if post.tags && post.tags.length > 0}
                      <div class="mt-1 flex flex-wrap gap-1">
                        {#each post.tags.slice(0, 3) as tag}
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {tag.name}
                          </span>
                        {/each}
                        {#if post.tags.length > 3}
                          <span class="text-xs text-gray-400">+{post.tags.length - 3} more</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <div class="flex items-center space-x-3 ml-4">
                    <span
                      class={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : post.status === "archived"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.status}
                    </span>

                    <!-- Action Dropdown -->
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger
                        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal class="h-5 w-5" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          class="z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                          sideOffset={5}
                          align="end"
                        >
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onSelect={() => goto(`/admin/posts/${post.id}`)}
                          >
                            <Pencil class="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenu.Item>
                          {#if post.status === "published"}
                            <DropdownMenu.Item
                              class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                              onSelect={() => window.open(`/post/${post.slug}`, "_blank")}
                            >
                              <ExternalLink class="h-4 w-4 mr-2" />
                              View Public
                            </DropdownMenu.Item>
                          {/if}
                          <DropdownMenu.Separator class="my-1 border-t border-gray-200" />
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                            onSelect={() => handleDelete(post.id, post.title)}
                          >
                            <Trash2 class="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      {:else}
        <li class="px-4 py-8 text-center text-gray-500">
          {#if data.filters.search || data.filters.status || data.filters.categoryId}
            No posts found matching your filters.
          {:else}
            No posts yet. <a
              href="/admin/posts/new"
              class="text-indigo-600 hover:text-indigo-500"
            >Create your first post</a>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              onclick={() => goToPage(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onclick={() => goToPage(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Page <span class="font-medium">{data.pagination.page}</span> of
                <span class="font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onclick={() => goToPage(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="h-5 w-5" />
                </button>

                {#each Array(Math.min(7, data.pagination.totalPages)) as _, i}
                  {@const pageNumber = (() => {
                    if (data.pagination.totalPages <= 7) return i + 1;
                    if (data.pagination.page <= 4) return i + 1;
                    if (data.pagination.page >= data.pagination.totalPages - 3)
                      return data.pagination.totalPages - 6 + i;
                    return data.pagination.page - 3 + i;
                  })()}
                  {#if pageNumber > 0 && pageNumber <= data.pagination.totalPages}
                    <button
                      onclick={() => goToPage(pageNumber)}
                      class={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNumber === data.pagination.page
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  {/if}
                {/each}

                <button
                  onclick={() => goToPage(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
