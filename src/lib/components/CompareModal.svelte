<script lang="ts">
  import { onMount } from "svelte";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import VillaCompareCard from "./VillaCompareCard.svelte";
  import type { SearchResult } from "$lib/server/services/search.service";
  import SearchBar from "./SearchBar.svelte";

  export let currentVillaSlug: string;
  export let onClose: () => void;

  $: user = $page.data.user;

  let savedVillasList: any[] = [];
  let loading = true;

  onMount(async () => {
    loading = true;
    console.log("CompareModal: Starting to load saved villas");
    console.log("Current villa slug:", currentVillaSlug);
    console.log("User:", user);
    console.log("Saved villa IDs from store:", $savedVillas.villaIds);

    try {
      // Get current villa ID to exclude it
      let currentVillaId: number | null = null;
      try {
        const currentVillaResponse = await fetch(
          `/api/villas/by-slug/${currentVillaSlug}`,
        );
        if (currentVillaResponse.ok) {
          const currentVilla = await currentVillaResponse.json();
          currentVillaId = currentVilla?.id;
          console.log("Current villa ID:", currentVillaId);
        }
      } catch (error) {
        console.error("Failed to get current villa ID:", error);
      }

      const savedIds = $savedVillas.villaIds.filter(
        (id) => id !== currentVillaId,
      );
      console.log("Filtered saved IDs (excluding current):", savedIds);

      if (savedIds.length === 0) {
        console.log("No saved villas to compare");
        savedVillasList = [];
        loading = false;
        return;
      }

      // First try to get cached villa details
      const villaPromises = savedIds.map(async (id) => {
        // Try cache first
        const cachedVilla = savedVillas.getCachedVillaDetails(id);
        if (cachedVilla && !savedVillas.isCachedDataStale(id)) {
          console.log(`Using cached data for villa ${id}`);
          return cachedVilla;
        }

        // If not cached or stale, fetch from API
        try {
          console.log(`Fetching villa ${id} from API`);
          const response = await fetch(`/api/villas/${id}`);
          if (response.ok) {
            const villa = await response.json();
            // Cache the result
            savedVillas.cacheVillaDetails(id, villa, "api");
            return villa;
          } else {
            console.error(`API returned ${response.status} for villa ${id}`);
          }
        } catch (error) {
          console.error(`Error fetching villa ${id}:`, error);
        }
        return null;
      });

      const villas = await Promise.all(villaPromises);
      savedVillasList = villas.filter((villa) => villa !== null);
      console.log("Final saved villas list:", savedVillasList);
    } catch (error) {
      console.error("Error loading saved villas:", error);
      savedVillasList = [];
    }
    loading = false;
  });

  function handleCompare(villaSlug: string) {
    // Navigate to the comparison page using slugs
    goto(`/villa/comparison/${villaSlug}/${currentVillaSlug}`);
  }

  function handleClose(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  $: selectedResult = null as SearchResult | null;
  $: showLocationError = false;

  function handleSearchSelect(result: SearchResult) {
    console.log("Search result selected:", result);
    selectedResult = result;
    showLocationError = false;
  }

  function handleSearchSubmit(result: SearchResult) {
    console.log("Search result submitted:", result);
    if (result.type === "city" && result.data.cityId) {
      goto(`/explore?city=${result.data.cityId}`);
    } else if (result.type === "villa" && result.data.villa) {
      console.log(
        "Navigating to comparison for villa slug:",
        result.data.villa.slug,
      );
      goto(`/villa/comparison/${result.data.villa.slug}/${currentVillaSlug}`);
    }
  }
</script>

<div
  class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4 w-full"
  onclick={handleClose}
  role="dialog"
  aria-modal="true"
>
  <div
    class="relative lg:max-h-[80vh] w-full overflow-hidden rounded-lg bg-white shadow-xl h-full lg:h-3/4 lg:w-1/2"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 border-b bg-white px-6 py-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">
          Choose a Villa to Compare With
        </h2>
        <button
          onclick={onClose}
          class="rounded-full p-1 hover:bg-gray-100"
          aria-label="Close"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="px-6 py-4" style="max-height: calc(80vh - 140px);">
      <SearchBar
        onselect={handleSearchSelect}
        onclear={() => {
          selectedResult = null;
        }}
        onsubmit={handleSearchSubmit}
        placeholder="Search for a city or villa..."
        excludeCity={true}
        class="w-full mb-3"
        autoFocus={true}
        filter={(villa) => villa.data.villa?.slug !== currentVillaSlug}
        withNearbyOption={false}
      />
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg
              class="mx-auto h-8 w-8 animate-spin text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p class="mt-2 text-gray-500">Loading saved villas...</p>
          </div>
        </div>
      {:else if savedVillasList.length === 0}
        <div class="py-12 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p class="mt-4 text-lg font-medium text-gray-900">
            No saved villas to compare
          </p>
          <p class="mt-2 text-gray-500">
            Save at least one more villa to start comparing
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#each savedVillasList as villa}
            <VillaCompareCard
              {villa}
              onClick={() => handleCompare(villa.slug)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
