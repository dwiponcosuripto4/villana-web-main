<script lang="ts">
  import type { PageData } from "./$types";
  import { formatPrice } from "$lib/utils/format";
  import VillaImagePlaceholder from "$lib/components/VillaImagePlaceholder.svelte";
  import { showToast, toastMessages } from "$lib/utils/toast";
  import { page } from "$app/stores";
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
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
    Copy,
  } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  // Bulk selection state
  let selectedVillas = $state<Set<string>>(new Set());
  let selectAll = $state(false);

  // Derived state for bulk actions
  let hasSelection = $derived(selectedVillas.size > 0);
  let allSelected = $derived(
    data.villas.length > 0 && selectedVillas.size === data.villas.length,
  );

  // Show success toast if villa was just created
  onMount(() => {
    if ($page.url.searchParams.get("created") === "true") {
      showToast.success(toastMessages.admin.villaCreated);
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url.toString());
    }
  });

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set("page", pageNum.toString());
    goto(`/admin/villas?${params.toString()}`);
  }

  function toggleSelectAll() {
    if (allSelected) {
      selectedVillas = new Set();
    } else {
      selectedVillas = new Set(data.villas.map((v) => v.id));
    }
  }

  function toggleVillaSelection(villaId: string) {
    const newSet = new Set(selectedVillas);
    if (newSet.has(villaId)) {
      newSet.delete(villaId);
    } else {
      newSet.add(villaId);
    }
    selectedVillas = newSet;
  }

  function clearSelection() {
    selectedVillas = new Set();
  }

  async function handleBulkPublish() {
    // TODO: Implement bulk publish
    showToast.success(`Publishing ${selectedVillas.size} villas...`);
    clearSelection();
  }

  async function handleBulkUnpublish() {
    // TODO: Implement bulk unpublish
    showToast.success(`Unpublishing ${selectedVillas.size} villas...`);
    clearSelection();
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedVillas.size} villas? This action cannot be undone.`,
      )
    ) {
      return;
    }
    // TODO: Implement bulk delete
    showToast.success(`Deleting ${selectedVillas.size} villas...`);
    clearSelection();
  }

  function handleSortChange(newSortBy: string) {
    const params = new URLSearchParams($page.url.searchParams);
    if (newSortBy === "newest") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", newSortBy);
    }
    // Reset to page 1 when sorting changes
    params.delete("page");
    goto(`/admin/villas?${params.toString()}`);
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="sm:flex sm:items-center sm:justify-between mb-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Villas</h2>
      <p class="mt-1 text-sm text-gray-600">Manage all villa listings</p>
    </div>
    <div class="mt-4 sm:mt-0">
      <a
        href="/admin/villas/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add New Villa
      </a>
    </div>
  </div>

  <!-- Filters -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <form method="get" class="flex gap-2">
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        />
        <input
          type="search"
          name="search"
          value={data.filters.search || ""}
          placeholder="Search villas..."
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
    <div class="flex gap-2">
      <a
        href="/admin/villas"
        class={`px-3 py-2 text-sm font-medium rounded-md ${!data.filters.status ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        All
      </a>
      <a
        href="/admin/villas?status=published"
        class={`px-3 py-2 text-sm font-medium rounded-md ${data.filters.status === "published" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        Published
      </a>
      <a
        href="/admin/villas?status=draft"
        class={`px-3 py-2 text-sm font-medium rounded-md ${data.filters.status === "draft" ? "bg-yellow-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        Drafts
      </a>
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
        <option value="most_viewed">Most Viewed</option>
        <option value="title_asc">Title (A-Z)</option>
        <option value="title_desc">Title (Z-A)</option>
      </select>
    </div>
  </div>

  <!-- Bulk Actions Bar -->
  {#if hasSelection}
    <div
      class="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-indigo-900">
          {selectedVillas.size} villa{selectedVillas.size > 1 ? "s" : ""} selected
        </span>
        <button
          onclick={clearSelection}
          class="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Clear selection
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick={handleBulkPublish}
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
        >
          Publish
        </button>
        <button
          onclick={handleBulkUnpublish}
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
        >
          Unpublish
        </button>
        <button
          onclick={handleBulkDelete}
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
        >
          <Trash2 class="h-4 w-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  {/if}

  <!-- Results Count -->
  <div class="mb-4 text-sm text-gray-600">
    Showing {data.villas.length > 0
      ? (data.pagination.page - 1) * data.pagination.limit + 1
      : 0} - {Math.min(
      data.pagination.page * data.pagination.limit,
      data.pagination.total,
    )} of {data.pagination.total} villas
  </div>

  <!-- Villa List -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <!-- Table Header with Select All -->
    {#if data.villas.length > 0}
      <div
        class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center"
      >
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            onchange={toggleSelectAll}
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="ml-2 text-sm text-gray-600">Select all</span>
        </label>
      </div>
    {/if}

    <ul class="divide-y divide-gray-200">
      {#each data.villas as villa}
        <li class="hover:bg-gray-50 transition-colors">
          <div class="px-4 py-4 flex items-center justify-between sm:px-6">
            <!-- Checkbox -->
            <div class="flex items-center mr-4">
              <input
                type="checkbox"
                checked={selectedVillas.has(villa.id)}
                onchange={() => toggleVillaSelection(villa.id)}
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div class="flex items-center flex-1">
              {#if villa.images.length > 0}
                <a
                  href="/admin/villas/{villa.id}"
                  class="block h-16 w-16 mr-4 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all flex-shrink-0"
                >
                  <img
                    src={villa.images[0].thumbnailUrl || villa.images[0].imageUrl}
                    alt={villa.title}
                    class="h-full w-full object-cover"
                  />
                </a>
              {:else}
                <VillaImagePlaceholder size="md" className="mr-4 flex-shrink-0" />
              {/if}
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="text-lg font-medium text-indigo-600 truncate">
                      <a href="/admin/villas/{villa.id}">
                        {villa.title}
                      </a>
                    </p>
                    <div
                      class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500"
                    >
                      <span
                        >{formatPrice(villa.priceMin)} - {formatPrice(
                          villa.priceMax,
                        )}</span
                      >
                      <span>•</span>
                      <span>{villa.bedroomMin}-{villa.bedroomMax} BR</span>
                      <span>•</span>
                      <span class="flex items-center">
                        <Eye class="w-4 h-4 mr-1" />
                        {villa.viewCount?.toLocaleString() || 0} views
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 truncate">
                      {villa.address}
                    </p>
                  </div>
                  <div class="flex items-center space-x-3 ml-4">
                    <span
                      class={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        villa.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {villa.status}
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
                            onSelect={() => goto(`/admin/villas/${villa.id}`)}
                          >
                            <Pencil class="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onSelect={() =>
                              window.open(`/villas/${villa.slug}`, "_blank")}
                          >
                            <ExternalLink class="h-4 w-4 mr-2" />
                            View Public
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onSelect={() => {
                              // TODO: Implement duplicate
                              showToast.success("Duplicating villa...");
                            }}
                          >
                            <Copy class="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator
                            class="my-1 border-t border-gray-200"
                          />
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                            onSelect={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this villa?",
                                )
                              ) {
                                // TODO: Implement delete
                                showToast.success("Deleting villa...");
                              }
                            }}
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
          {#if data.filters.search || data.filters.status}
            No villas found matching your filters.
          {:else}
            No villas yet. <a
              href="/admin/villas/new"
              class="text-indigo-600 hover:text-indigo-500"
              >Add your first villa</a
            >
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Pagination Controls -->
    {#if data.pagination.totalPages > 1}
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <!-- Mobile pagination -->
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
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-gray-700">
                Page <span class="font-medium">{data.pagination.page}</span> of
                <span class="font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <!-- Previous button -->
                <button
                  onclick={() => goToPage(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <ChevronLeft class="h-5 w-5" />
                </button>

                <!-- Page numbers -->
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

                <!-- Next button -->
                <button
                  onclick={() => goToPage(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
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
