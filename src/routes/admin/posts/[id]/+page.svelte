<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { goto, invalidateAll } from "$app/navigation";
  import { renderMarkdown } from "$lib/utils/markdown";
  import { showToast } from "$lib/utils/toast";
  import {
    ArrowLeft,
    Save,
    Eye,
    FileText,
    Image,
    Settings,
    Tag,
    Trash2,
    ExternalLink,
    MapPin,
  } from "lucide-svelte";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Form state initialized from loaded data
  let title = $state(data.post.title);
  let slug = $state(data.post.slug);
  let excerpt = $state(data.post.excerpt || "");
  let content = $state(data.post.content);
  let featuredImage = $state(data.post.featuredImage || "");
  let featuredImageAlt = $state(data.post.featuredImageAlt || "");
  let categoryId = $state(data.post.categoryId?.toString() || "");
  let selectedCity = $state<CityWithProvince | null>(data.city || null);
  let status = $state(data.post.status);
  let metaTitle = $state(data.post.metaTitle || "");
  let metaDescription = $state(data.post.metaDescription || "");
  let selectedTagIds = $state<number[]>(data.post.tags?.map((t) => t.id) || []);

  let isSubmitting = $state(false);
  let activeTab = $state<"content" | "media" | "seo" | "preview">("content");
  let showDeleteConfirm = $state(false);

  // Rendered markdown preview
  let renderedContent = $derived(renderMarkdown(content));

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
  }

  function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <a
        href="/admin/posts"
        class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft class="h-4 w-4 mr-1" />
        Back to Posts
      </a>
      <h2 class="text-2xl font-bold text-gray-900">Edit Post</h2>
    </div>
    {#if data.post.status === "published"}
      <a
        href="/post/{data.post.slug}"
        target="_blank"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <ExternalLink class="h-4 w-4 mr-2" />
        View Public
      </a>
    {/if}
  </div>

  <!-- Error Message -->
  {#if form?.error}
    <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        isSubmitting = false;
        if (result.type === "success") {
          showToast.success("Post saved successfully!");
          // Don't reset form, just update without resetting
          await update({ reset: false });
        } else if (result.type === "failure") {
          showToast.error(result.data?.error || "Failed to save post");
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
    <input type="hidden" name="cityId" value={selectedCity?.id || ""} />
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
                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText class="h-4 w-4 inline mr-2" />
                Content
              </button>
              <button
                type="button"
                onclick={() => (activeTab = "preview")}
                class={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "preview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Eye class="h-4 w-4 inline mr-2" />
                Preview
              </button>
              <button
                type="button"
                onclick={() => (activeTab = "media")}
                class={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "media"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
                ></textarea>
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
                ></textarea>
              </div>
            {:else if activeTab === "preview"}
              <div class="prose prose-indigo max-w-none">
                {@html renderedContent}
              </div>
              {#if !content}
                <p class="text-gray-500 text-center py-8">No content to preview</p>
              {/if}
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
                  />
                </div>
              </div>
            {:else if activeTab === "seo"}
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
                  />
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
                  ></textarea>
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

          <div class="text-sm text-gray-600 mb-4 space-y-1">
            <p>Status: <span class="font-medium capitalize">{data.post.status}</span></p>
            <p>Created: {formatDate(data.post.createdAt)}</p>
            {#if data.post.publishedAt}
              <p>Published: {formatDate(data.post.publishedAt)}</p>
            {/if}
            <p>Views: {data.post.viewCount?.toLocaleString() || 0}</p>
          </div>

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
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {#if isSubmitting}
              Saving...
            {:else}
              <Save class="h-4 w-4 mr-2" />
              Save Changes
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
        </div>

        <!-- Location -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            <MapPin class="h-4 w-4 inline mr-2" />
            Location
          </h3>
          <p class="text-sm text-gray-500 mb-3">
            Set a city to show top villas from that location below the article.
          </p>
          <CityAutocomplete
            bind:selectedCity={selectedCity}
            placeholder="Search for a city..."
          />
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
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white shadow rounded-lg p-6 border-2 border-red-200">
          <h3 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
          {#if !showDeleteConfirm}
            <button
              type="button"
              onclick={() => (showDeleteConfirm = true)}
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Delete Post
            </button>
          {:else}
            <p class="text-sm text-gray-600 mb-4">
              Are you sure? This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <form method="POST" action="?/delete" class="flex-1">
                <button
                  type="submit"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </form>
              <button
                type="button"
                onclick={() => (showDeleteConfirm = false)}
                class="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </form>
</div>
