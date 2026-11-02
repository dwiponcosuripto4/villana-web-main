<script lang="ts">
  import type { PageData } from "./$types";
  import { renderMarkdown, extractExcerpt } from "$lib/utils/markdown";
  import { generateArticleSchema } from "$lib/utils/schema";
  import {
    Calendar,
    Eye,
    User,
    ArrowLeft,
    Tag,
    Folder,
    Home,
  } from "lucide-svelte";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import { toTitleCase } from "$lib/utils/format";

  let { data }: { data: PageData } = $props();

  let renderedContent = $derived(renderMarkdown(data.post.content));

  function formatDate(date: Date | string | null): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const pageTitle = data.post.metaTitle || data.post.title;
  const pageDescription =
    data.post.metaDescription ||
    data.post.excerpt ||
    extractExcerpt(data.post.content, 160);
  const pageUrl = `/post/${data.post.slug}`;

  const articleSchema = generateArticleSchema({
    title: data.post.title,
    description: pageDescription,
    url: pageUrl,
    publishedTime: data.post.publishedAt?.toISOString(),
    modifiedTime: data.post.updatedAt.toISOString(),
    author: data.post.author?.fullName,
    image: data.post.featuredImage || undefined,
  });
</script>

<svelte:head>
  <title>{pageTitle} | Villana</title>
  <meta name="description" content={pageDescription} />

  <!-- Open Graph -->
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={pageUrl} />
  {#if data.ogImageUrl}
    <meta property="og:image" content={data.ogImageUrl} />
  {:else if data.post.featuredImage}
    <meta property="og:image" content={data.post.featuredImage} />
  {/if}
  {#if data.post.publishedAt}
    <meta
      property="article:published_time"
      content={data.post.publishedAt.toISOString()}
    />
  {/if}
  <meta
    property="article:modified_time"
    content={data.post.updatedAt.toISOString()}
  />
  {#if data.post.author}
    <meta property="article:author" content={data.post.author.fullName} />
  {/if}
  {#if data.post.category}
    <meta property="article:section" content={data.post.category.name} />
  {/if}
  {#if data.post.tags}
    {#each data.post.tags as tag}
      <meta property="article:tag" content={tag.name} />
    {/each}
  {/if}

  <!-- Schema.org -->
  {@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`}
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Breadcrumb -->
  <div class="bg-white border-b">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <a
        href="/post"
        class="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft class="h-4 w-4 mr-1" />
        Back to Blog
      </a>
    </div>
  </div>

  <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <header class="mb-8">
      {#if data.post.category}
        <a
          href="/post/category/{data.post.category.slug}"
          class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <Folder class="h-4 w-4 mr-1" />
          {data.post.category.name}
        </a>
      {/if}

      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {data.post.title}
      </h1>

      <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <!-- {#if data.post.author} -->
        <!--   <span class="flex items-center"> -->
        <!--     <User class="h-4 w-4 mr-1" /> -->
        <!--     {data.post.author.fullName} -->
        <!--   </span> -->
        <!-- {/if} -->
        {#if data.post.publishedAt}
          <span class="flex items-center">
            <Calendar class="h-4 w-4 mr-1" />
            {formatDate(data.post.publishedAt)}
          </span>
        {/if}
        <!-- <span class="flex items-center"> -->
        <!--   <Eye class="h-4 w-4 mr-1" /> -->
        <!--   {data.post.viewCount?.toLocaleString() || 0} views -->
        <!-- </span> -->
      </div>
    </header>

    <!-- Featured Image -->
    {#if data.post.featuredImage}
      <div class="mb-8 overflow-hidden shadow-lg">
        <img
          src={data.post.featuredImage}
          alt={data.post.featuredImageAlt || data.post.title}
          class="w-full h-auto"
        />
      </div>
    {/if}

    <!-- Content -->
    <div class="bg-white shadow-sm p-6 md:p-10">
      <div class="prose prose-lg prose-indigo max-w-none">
        {@html renderedContent}
      </div>
    </div>

    <!-- Tags -->
    {#if data.post.tags && data.post.tags.length > 0}
      <div class="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Tag class="h-4 w-4 mr-2" />
          Tags
        </h3>
        <div class="flex flex-wrap gap-2">
          {#each data.post.tags as tag}
            <a
              href="/post/tag/{tag.slug}"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              {tag.name}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Top Villas in City -->
    {#if data.topVillas.length > 0 && data.post.city}
      <div class="mt-12">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
          Villa di {toTitleCase(data.post.city.name)}:
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {#each data.topVillas as villa (villa.id)}
            <VillaCard {villa} variant="desktop" />
          {/each}
        </div>
      </div>
    {/if}

    <!-- Related Posts -->
    {#if data.recentPosts.length > 0}
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">More Articles</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each data.recentPosts as post}
            <article
              class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {#if post.featuredImage}
                <a
                  href="/post/{post.slug}"
                  class="block aspect-video overflow-hidden"
                >
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </a>
              {/if}
              <div class="p-4">
                <h3 class="font-bold text-gray-900 mb-2">
                  <a
                    href="/post/{post.slug}"
                    class="hover:text-indigo-600 transition-colors"
                  >
                    {post.title}
                  </a>
                </h3>
                <p class="text-sm text-gray-500">
                  {formatDate(post.publishedAt)}
                </p>
              </div>
            </article>
          {/each}
        </div>
      </div>
    {/if}
  </article>
</div>
