<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { generateSlug } from "$lib/utils/slug";
  import { showToast } from "$lib/utils/toast";
  import {
    ArrowLeft,
    Save,
    Eye,
    FileText,
    Image,
    Tag,
    Settings,
  } from "lucide-svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Form state
  let title = $state("");
  let slug = $state("");
  let excerpt = $state("");
  let content = $state("");
  let featuredImage = $state("");
  let featuredImageAlt = $state("");
  let categoryId = $state("");
  let status = $state<"draft" | "published">("draft");
  let metaTitle = $state("");
  let metaDescription = $state("");
  let selectedTagIds = $state<number[]>([]);

  let slugEdited = $state(false);
  let isSubmitting = $state(false);
  let activeTab = $state<"content" | "media" | "seo">("content");

  // Auto-generate slug from title
  $effect(() => {
    if (!slugEdited && title) {
      slug = generateSlug(title);
    }
  });

  function handleSlugInput() {
    slugEdited = true;
  }

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-6">
    <a
      href="/admin/posts"
      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
    >
      <ArrowLeft class="h-4 w-4 mr-1" />
      Back to Posts
    </a>
    <h2 class="text-2xl font-bold text-gray-900">Create New Post</h2>
  </div>

  <!-- Error Message -->
  {#if form?.error}
    <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        isSubmitting = false;
        if (result.type === "success" && result.data?.nextUrl) {
          showToast.success("Post created successfully!");
          goto(result.data.nextUrl);
        } else if (result.type === "failure") {
          showToast.error(result.data?.error || "Failed to create post");
          await update({ reset: false });
        } else {
          await update({ reset: false });
        }
      };
    }}
    class="space-y-6"
  >
    <!-- Hidden inputs to ensure values are always submitted regardless of active tab -->
    <input type="hidden" name="title" value={title} />
    <input type="hidden" name="content" value={content} />
    <input type="hidden" name="excerpt" value={excerpt} />
    <input type="hidden" name="featuredImage" value={featuredImage} />
    <input type="hidden" name="featuredImageAlt" value={featuredImageAlt} />
    <input type="hidden" name="metaTitle" value={metaTitle} />
    <input type="hidden" name="metaDescription" value={metaDescription} />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content Area -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Title -->
        <div class="bg-white shadow rounded-lg p-6">
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            bind:value={title}
            required
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg"
            placeholder="Enter post title..."
          />

          <!-- Slug -->
          <div class="mt-4">
            <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-sm">/post/</span>
              <input
                type="text"
                id="slug"
                name="slug"
                bind:value={slug}
                oninput={handleSlugInput}
                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="post-slug"
              />
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white shadow rounded-lg">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              <button
                type="button"
                onclick={() => (activeTab = "content")}
                class={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "content"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText class="h-4 w-4 inline mr-2" />
                Content
              </button>
              <button
                type="button"
                onclick={() => (activeTab = "media")}
                class={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "media"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Image class="h-4 w-4 inline mr-2" />
                Media
              </button>
              <button
                type="button"
                onclick={() => (activeTab = "seo")}
                class={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "seo"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Settings class="h-4 w-4 inline mr-2" />
                SEO
              </button>
            </nav>
          </div>

          <div class="p-6">
            {#if activeTab === "content"}
              <!-- Excerpt -->
              <div class="mb-6">
                <label for="excerpt" class="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  bind:value={excerpt}
                  rows={3}
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Brief summary of the post (optional)..."
                ></textarea>
                <p class="mt-1 text-xs text-gray-500">
                  A short summary that appears in post listings.
                </p>
              </div>

              <!-- Content -->
              <div>
                <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
                  Content (Markdown) <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  bind:value={content}
                  required
                  rows={20}
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="Write your post content in Markdown..."
                ></textarea>
                <p class="mt-1 text-xs text-gray-500">
                  Supports Markdown formatting: **bold**, *italic*, # headings, [links](url), etc.
                </p>
              </div>
            {:else if activeTab === "media"}
              <!-- Featured Image -->
              <div>
                <label for="featuredImage" class="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  id="featuredImage"
                  bind:value={featuredImage}
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
                {#if featuredImage}
                  <div class="mt-4">
                    <img
                      src={featuredImage}
                      alt="Featured image preview"
                      class="max-w-xs rounded-lg shadow"
                      onerror={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                {/if}

                <div class="mt-4">
                  <label for="featuredImageAlt" class="block text-sm font-medium text-gray-700 mb-2">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    id="featuredImageAlt"
                    bind:value={featuredImageAlt}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Describe the image for accessibility..."
                  />
                </div>
              </div>
            {:else if activeTab === "seo"}
              <!-- SEO Fields -->
              <div class="space-y-6">
                <div>
                  <label for="metaTitle" class="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    bind:value={metaTitle}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Custom title for search engines (optional)"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Leave empty to use post title. Recommended: 50-60 characters.
                  </p>
                </div>

                <div>
                  <label for="metaDescription" class="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    bind:value={metaDescription}
                    rows={3}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Description for search engine results (optional)"
                  ></textarea>
                  <p class="mt-1 text-xs text-gray-500">
                    Leave empty to use excerpt. Recommended: 150-160 characters.
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Publish Box -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Publish</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === "draft"}
                  onchange={() => (status = "draft")}
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700">Draft</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === "published"}
                  onchange={() => (status = "published")}
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {#if isSubmitting}
              <span class="animate-spin mr-2">⏳</span>
              Saving...
            {:else}
              <Save class="h-4 w-4 mr-2" />
              {status === "published" ? "Publish" : "Save Draft"}
            {/if}
          </button>
        </div>

        <!-- Category -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Category</h3>
          <select
            name="categoryId"
            bind:value={categoryId}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">No category</option>
            {#each data.categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
          <a href="/admin/posts/categories" class="mt-2 text-xs text-indigo-600 hover:text-indigo-500 inline-block">
            Manage categories
          </a>
        </div>

        <!-- Tags -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            <Tag class="h-4 w-4 inline mr-2" />
            Tags
          </h3>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each data.tags as tag}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  checked={selectedTagIds.includes(tag.id)}
                  onchange={() => toggleTag(tag.id)}
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{tag.name}</span>
              </label>
            {/each}
            {#if data.tags.length === 0}
              <p class="text-sm text-gray-500">No tags available.</p>
            {/if}
          </div>
          <a href="/admin/posts/tags" class="mt-2 text-xs text-indigo-600 hover:text-indigo-500 inline-block">
            Manage tags
          </a>
        </div>
      </div>
    </div>
  </form>
</div>
