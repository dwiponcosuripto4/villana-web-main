<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { DropdownMenu } from "bits-ui";
  import {
    Plus,
    Search,
    MapPin,
    Pencil,
    Trash2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    EyeOff,
    X,
  } from "lucide-svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let searchQuery = $state(data.searchParams.query);
  let selectedType = $state(data.searchParams.type);
  let selectedCategory = $state(data.searchParams.category);
  let selectedStatus = $state(data.searchParams.status);
  let selectedSort = $state(data.searchParams.sortBy);

  // Bulk selection state
  let selectedPlaces = $state<Set<string>>(new Set());
  let hasSelection = $derived(selectedPlaces.size > 0);
  let allSelected = $derived(
    data.places.length > 0 && selectedPlaces.size === data.places.length,
  );

  const placeTypes = [
    { value: "", label: "All Types" },
    { value: "restaurant", label: "Restaurant" },
    { value: "beach", label: "Beach" },
    { value: "temple", label: "Temple" },
    { value: "mosque", label: "Mosque" },
    { value: "museum", label: "Museum" },
    { value: "park", label: "Park" },
    { value: "shopping", label: "Shopping" },
    { value: "waterfall", label: "Waterfall" },
    { value: "mountain", label: "Mountain" },
    { value: "lake", label: "Lake" },
    { value: "market", label: "Market" },
    { value: "tourist_attraction", label: "Tourist Attraction" },
    { value: "airport", label: "Airport" },
    { value: "hospital", label: "Hospital" },
    { value: "other", label: "Other" },
  ];

  const placeCategories = [
    { value: "", label: "All Categories" },
    { value: "culinary", label: "Culinary" },
    { value: "nature", label: "Nature" },
    { value: "culture", label: "Culture" },
    { value: "shopping", label: "Shopping" },
    { value: "entertainment", label: "Entertainment" },
    { value: "transport", label: "Transport" },
    { value: "healthcare", label: "Healthcare" },
    { value: "place_of_worship", label: "Place of Worship" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
  ];

  const sortOptions = [
    { value: "", label: "Default (Newest)" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "alphabetical", label: "Alphabetical (A-Z)" },
  ];

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedType) params.set("type", selectedType);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedSort) params.set("sortBy", selectedSort);

    const queryString = params.toString();
    goto(`/admin/places${queryString ? `?${queryString}` : ""}`);
  }

  function clearFilters() {
    searchQuery = "";
    selectedType = "";
    selectedCategory = "";
    selectedStatus = "";
    selectedSort = "";
    goto("/admin/places");
  }

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedType) params.set("type", selectedType);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedSort) params.set("sortBy", selectedSort);
    params.set("page", page.toString());

    const queryString = params.toString();
    goto(`/admin/places${queryString ? `?${queryString}` : ""}`);
  }

  function toggleSelectAll() {
    if (allSelected) {
      selectedPlaces = new Set();
    } else {
      selectedPlaces = new Set(data.places.map((p) => p.id));
    }
  }

  function togglePlaceSelection(placeId: string) {
    const newSet = new Set(selectedPlaces);
    if (newSet.has(placeId)) {
      newSet.delete(placeId);
    } else {
      newSet.add(placeId);
    }
    selectedPlaces = newSet;
  }

  function clearSelection() {
    selectedPlaces = new Set();
  }

  async function deletePlace(placeId: string, placeName: string) {
    if (
      !confirm(
        `Are you sure you want to delete "${placeName}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/admin/places/${placeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        goto($page.url, { invalidateAll: true });
      } else {
        alert("Failed to delete place. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting place:", error);
      alert("An error occurred while deleting the place.");
    }
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedPlaces.size} places? This cannot be undone.`,
      )
    ) {
      return;
    }
    // TODO: Implement bulk delete
    alert(`Deleting ${selectedPlaces.size} places...`);
    clearSelection();
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Places Management</h1>
        <p class="mt-2 text-sm text-gray-600">
          Manage independent place entities and their relationships
        </p>
      </div>
      <a
        href="/admin/places/new"
        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus class="-ml-1 mr-2 h-5 w-5" />
        Add New Place
      </a>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white shadow rounded-lg p-6 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1"
          >Search</label
        >
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          />
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            placeholder="Search places..."
            class="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            onkeydown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>

      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 mb-1"
          >Type</label
        >
        <select
          id="type"
          bind:value={selectedType}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {#each placeTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label
          for="category"
          class="block text-sm font-medium text-gray-700 mb-1">Category</label
        >
        <select
          id="category"
          bind:value={selectedCategory}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {#each placeCategories as category}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-1"
          >Status</label
        >
        <select
          id="status"
          bind:value={selectedStatus}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {#each statusOptions as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="sort" class="block text-sm font-medium text-gray-700 mb-1"
          >Sort By</label
        >
        <select
          id="sort"
          bind:value={selectedSort}
          onchange={handleSearch}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {#each sortOptions as sort}
            <option value={sort.value}>{sort.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-end space-x-2">
        <button
          onclick={handleSearch}
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Search
        </button>
        <button
          onclick={clearFilters}
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear
        </button>
      </div>
    </div>
  </div>

  <!-- Bulk Actions Bar -->
  {#if hasSelection}
    <div
      class="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-indigo-900">
          {selectedPlaces.size} place{selectedPlaces.size > 1 ? "s" : ""} selected
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
          onclick={handleBulkDelete}
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
        >
          <Trash2 class="h-4 w-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  {/if}

  <!-- Places Table -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Places ({data.pagination.total} total)
        </h3>
        <div class="text-sm text-gray-500">
          Showing {Math.min(
            (data.pagination.page - 1) * data.pagination.limit + 1,
            data.pagination.total,
          )}-{Math.min(
            data.pagination.page * data.pagination.limit,
            data.pagination.total,
          )} of {data.pagination.total}
        </div>
      </div>
    </div>

    {#if data.places.length > 0}
      <!-- Table Header with Select All -->
      <div class="px-6 py-3 border-y border-gray-200 bg-gray-50 flex items-center">
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

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-10 px-3"></th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Place
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type & Category
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Stats
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each data.places as place}
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPlaces.has(place.id)}
                    onchange={() => togglePlaceSelection(place.id)}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <a href="/admin/places/{place.id}">
                    <div class="flex items-center">
                      {#if place.mainImage}
                        <img
                          src={place.mainImage}
                          alt={place.name}
                          class="h-12 w-12 rounded-lg object-cover mr-4"
                        />
                      {:else}
                        <div
                          class="h-12 w-12 rounded-lg bg-gray-200 mr-4 flex items-center justify-center"
                        >
                          <MapPin class="h-6 w-6 text-gray-400" />
                        </div>
                      {/if}
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {place.name}
                        </div>
                        <div class="text-sm text-gray-500">/{place.slug}</div>
                        {#if place.description}
                          <div
                            class="text-xs text-gray-400 mt-1 max-w-xs truncate"
                          >
                            {place.description}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="space-y-1">
                    {#if place.type}
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {placeTypes.find((t) => t.value === place.type)?.label ||
                          place.type}
                      </span>
                    {/if}
                    {#if place.category}
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {placeCategories.find((c) => c.value === place.category)
                          ?.label || place.category}
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    {#if place.city}
                      <div>{place.city.name}</div>
                    {/if}
                    {#if place.province}
                      <div class="text-xs text-gray-500">
                        {place.province.name}
                      </div>
                    {/if}
                    {#if place.address}
                      <div class="text-xs text-gray-400 max-w-xs truncate">
                        {place.address}
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="flex items-center gap-1 text-xs text-gray-500">
                    <Eye class="h-3 w-3" />
                    {place.viewCount}
                  </div>
                  {#if place.nearbyVillasCount !== undefined}
                    <div class="text-xs text-gray-500">
                      Villas: {place.nearbyVillasCount}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      place.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {place.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
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
                          onSelect={() => goto(`/admin/places/${place.id}`)}
                        >
                          <Pencil class="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenu.Item>
                        {#if place.status === "published"}
                          <DropdownMenu.Item
                            class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onSelect={() =>
                              window.open(`/place/${place.slug}`, "_blank")}
                          >
                            <ExternalLink class="h-4 w-4 mr-2" />
                            View Public
                          </DropdownMenu.Item>
                        {/if}
                        <DropdownMenu.Separator
                          class="my-1 border-t border-gray-200"
                        />
                        <DropdownMenu.Item
                          class="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          onSelect={() => deletePlace(place.id, place.name)}
                        >
                          <Trash2 class="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="px-4 py-8 text-center text-gray-500">
        <MapPin class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 class="text-sm font-medium text-gray-900 mb-2">No places found</h3>
        <p class="text-sm text-gray-500 mb-4">
          {searchQuery || selectedType || selectedCategory || selectedStatus
            ? "No places match your current filters."
            : "Get started by creating your first place."}
        </p>
        <a
          href="/admin/places/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus class="-ml-1 mr-2 h-5 w-5" />
          Add New Place
        </a>
      </div>
    {/if}

    <!-- Pagination Controls -->
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
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium"
                  >{Math.min(
                    (data.pagination.page - 1) * data.pagination.limit + 1,
                    data.pagination.total,
                  )}</span
                >
                to
                <span class="font-medium"
                  >{Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.total,
                  )}</span
                >
                of
                <span class="font-medium">{data.pagination.total}</span>
                results
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onclick={() => goToPage(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <ChevronLeft class="h-5 w-5" />
                </button>

                {#each Array.from({ length: Math.min(data.pagination.totalPages, 7) }, (_, i) => {
                  const totalPages = data.pagination.totalPages;
                  const currentPage = data.pagination.page;

                  if (totalPages <= 7) {
                    return i + 1;
                  } else if (currentPage <= 4) {
                    return i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    return totalPages - 6 + i;
                  } else {
                    return currentPage - 3 + i;
                  }
                }) as pageNum}
                  <button
                    onclick={() => goToPage(pageNum)}
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {data
                      .pagination.page === pageNum
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                  >
                    {pageNum}
                  </button>
                {/each}

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
