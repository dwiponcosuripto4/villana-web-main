<script lang="ts">
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { extractExcerpt } from "$lib/utils/markdown";
  import { Calendar, Eye, ChevronLeft, ChevronRight, Tag, Folder, ArrowLeft } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  function formatDate(date: Date | string | null): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set("page", pageNum.toString());
    goto(`/post/tag/${data.tag.slug}?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>#{data.tag.name} | Blog | Villana</title>
  <meta name="description" content={`Browse articles tagged with ${data.tag.name}`} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <a
        href="/post"
        class="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
      >
        <ArrowLeft class="h-4 w-4 mr-1" />
        Back to Blog
      </a>
      <div class="flex items-center gap-3">
        <Tag class="h-8 w-8 text-indigo-600" />
        <h1 class="text-3xl font-bold text-gray-900">#{data.tag.name}</h1>
      </div>
      <p class="mt-2 text-sm text-gray-500">
        {data.pagination.total} {data.pagination.total === 1 ? "article" : "articles"} with this tag
      </p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-3">
        {#if data.posts.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each data.posts as post}
              <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {#if post.featuredImage}
                  <a href="/post/{post.slug}" class="block aspect-video overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                {:else}
                  <div class="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span class="text-indigo-300 text-6xl font-bold">{post.title.charAt(0)}</span>
                  </div>
                {/if}

                <div class="p-6">
                  {#if post.category}
                    <a
                      href="/post/category/{post.category.slug}"
                      class="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
                    >
                      <Folder class="h-3 w-3 mr-1" />
                      {post.category.name}
                    </a>
                  {/if}

                  <h2 class="text-xl font-bold text-gray-900 mb-2">
                    <a href="/post/{post.slug}" class="hover:text-indigo-600 transition-colors">
                      {post.title}
                    </a>
                  </h2>

                  <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt || extractExcerpt(post.content, 120)}
                  </p>

                  <div class="flex items-center justify-between text-sm text-gray-500">
                    <span class="flex items-center">
                      <Calendar class="h-4 w-4 mr-1" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span class="flex items-center">
                      <Eye class="h-4 w-4 mr-1" />
                      {post.viewCount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </article>
            {/each}
          </div>

          <!-- Pagination -->
          {#if data.pagination.totalPages > 1}
            <div class="mt-8 flex justify-center">
              <nav class="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onclick={() => goToPage(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  class="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="h-5 w-5" />
                </button>

                {#each Array(Math.min(5, data.pagination.totalPages)) as _, i}
                  {@const pageNumber = (() => {
                    if (data.pagination.totalPages <= 5) return i + 1;
                    if (data.pagination.page <= 3) return i + 1;
                    if (data.pagination.page >= data.pagination.totalPages - 2)
                      return data.pagination.totalPages - 4 + i;
                    return data.pagination.page - 2 + i;
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
                  class="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="h-5 w-5" />
                </button>
              </nav>
            </div>
          {/if}
        {:else}
          <div class="bg-white rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500 text-lg">No posts with this tag yet.</p>
            <a href="/post" class="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
              Browse all posts
            </a>
          </div>
        {/if}
      </div>

      <!-- Sidebar -->
      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Popular Tags</h3>
          <div class="flex flex-wrap gap-2">
            {#each data.popularTags as t}
              <a
                href="/post/tag/{t.slug}"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors {t.id === data.tag.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'}"
              >
                <Tag class="h-3 w-3 mr-1" />
                {t.name}
              </a>
            {/each}
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>
