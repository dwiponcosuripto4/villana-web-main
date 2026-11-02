<script lang="ts">
  import type { PageData } from "./$types";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { onMount } from "svelte";

  export let data: PageData;

  // For client-side rendering and cached villas
  let clientSavedVillas: any[] = [];
  let villas: any[] = [];
  let isLoading = false;
  let isBackgroundSyncing = false;
  let viewMode: "grid" | "list" = "grid";

  // Function to load from cache immediately
  function loadFromCache() {
    const savedVillaIds = $savedVillas.villaIds;

    if (savedVillaIds.length > 0) {
      const cachedVillas = savedVillaIds
        .map((id) => savedVillas.getCachedVillaDetails(id))
        .filter((villa) => villa !== null);

      return cachedVillas;
    }
    return [];
  }

  // Function to sync with server in background
  async function backgroundSync() {
    if (isBackgroundSyncing) return;

    isBackgroundSyncing = true;
    const savedVillaIds = $savedVillas.villaIds;

    try {
      // For authenticated users, try to get fresh server data
      if (data.isAuthenticated && !data.dbError) {
        try {
          const response = await fetch("/api/villas/saved");
          if (response.ok) {
            const serverData = await response.json();

            if (serverData.villas && serverData.villas.length > 0) {
              // Update local storage with server villa IDs
              const serverVillaIds = serverData.villas.map(
                (v: any) => v.villaId,
              );
              savedVillas.clear();
              serverVillaIds.forEach((id: number) => {
                savedVillas.add(id, { id: data.user?.id });
              });

              // Cache villa details from server if available
              const serverVillas = serverData.villas
                .map((savedVilla: any) => savedVilla.villa)
                .filter(Boolean);
              serverVillas.forEach((villa: any) => {
                savedVillas.cacheVillaDetails(villa.id, villa, "api");
              });

              // Update the display with fresh server data
              if (serverVillas.length > 0) {
                clientSavedVillas = serverVillas;
              }
            }
          }
        } catch (serverError) {
          console.warn(
            "Server sync failed, continuing with cache:",
            serverError,
          );
        }
      }

      // Identify missing or stale villa data
      const currentIds = $savedVillas.villaIds;
      const missingIds = currentIds.filter(
        (id) =>
          !savedVillas.getCachedVillaDetails(id) ||
          savedVillas.isCachedDataStale(id),
      );

      if (missingIds.length > 0) {
        // Fetch missing villa details in the background
        const villaPromises = missingIds.map(async (id) => {
          try {
            // Try API first
            const response = await fetch(`/api/villas/${id}`);
            if (response.ok) {
              const villaData = await response.json();
              savedVillas.cacheVillaDetails(id, villaData, "api");
              return villaData;
            }
          } catch (apiError) {
            console.warn(`API failed for villa ${id}, trying static files`);
          }

          // Fallback to static files
          try {
            const staticResponse = await fetch(`/data/villas/${id}.json`);
            if (staticResponse.ok) {
              const data = await staticResponse.json();
              // Transform static data structure to match VillaWithRelations
              const villaData = {
                id,
                ...data.villa,
                images: data.images || [],
                amenities: [], // Empty array for amenities
                videos: [], // Empty array for videos
                bedSizes: [], // Empty array for bed sizes
                // Ensure required fields exist
                bathroomsIndoor: data.villa.bathroomsIndoor || 2,
                bathroomsOutdoor: data.villa.bathroomsOutdoor || 1,
              };
              savedVillas.cacheVillaDetails(id, villaData, "static");
              return villaData;
            }
          } catch (staticError) {
            console.error(
              `Failed to load villa ${id} from static files:`,
              staticError,
            );
          }

          return null;
        });

        const freshVillaResults = await Promise.all(villaPromises);
        const freshVillas = freshVillaResults.filter(
          (result) => result && !result.error,
        );

        // Update display if we got new data
        if (freshVillas.length > 0) {
          // Get all current cached villas (including newly fetched ones)
          const allCurrentVillas = currentIds
            .map((id) => savedVillas.getCachedVillaDetails(id))
            .filter((villa) => villa !== null);

          clientSavedVillas = allCurrentVillas;
        }
      }
    } catch (error) {
      console.error("Error during background sync:", error);
    } finally {
      isBackgroundSyncing = false;
    }
  }

  onMount(async () => {
    // 1. IMMEDIATE: Load from cache first for instant display
    const cached = loadFromCache();

    // If we have server data and no cache, use server data
    if (
      cached.length === 0 &&
      data.isAuthenticated &&
      !data.dbError &&
      data.villas.length > 0
    ) {
      clientSavedVillas = data.villas;
    }

    // 2. BACKGROUND: Handle authentication sync if needed
    if (
      data.isAuthenticated &&
      !data.dbError &&
      data.villas.length === 0 &&
      $savedVillas.villaIds.length > 0
    ) {
      try {
        await savedVillas.syncToServer({ id: data.user?.id });
        // Refresh after sync
        const refreshed = loadFromCache();
        if (refreshed.length > 0) {
          clientSavedVillas = refreshed;
        }
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }

    // 3. BACKGROUND: Start background sync for fresh data
    backgroundSync();
  });

  // React to changes in saved villas store and update display
  $: {
    // Get current saved villa IDs from the store
    const currentSavedIds = $savedVillas.villaIds;

    // Filter clientSavedVillas to only include villas that are still saved
    clientSavedVillas = clientSavedVillas.filter((villa) =>
      currentSavedIds.includes(villa.id),
    );

    // Also reload from cache to get any newly added villas
    const cached = loadFromCache();

    // Merge cached villas that aren't already in clientSavedVillas
    const existingIds = new Set(clientSavedVillas.map((v) => v.id));
    cached.forEach((villa) => {
      if (!existingIds.has(villa.id) && currentSavedIds.includes(villa.id)) {
        clientSavedVillas.push(villa);
      }
    });

    // Determine which villas to show - always prioritize clientSavedVillas for real-time updates
    villas =
      clientSavedVillas.length > 0
        ? clientSavedVillas
        : data.isAuthenticated && !data.dbError
          ? data.villas.filter((villa) => currentSavedIds.includes(villa.id))
          : [];
  }
  $: hasVillas = villas.length > 0;
  $: showLoading =
    (!data.isAuthenticated ||
      data.dbError ||
      (data.isAuthenticated && data.villas.length === 0)) &&
    isLoading;
  $: villaCount = villas.length;
</script>

<svelte:head>
  <title>Saved Villas - Dashboard - Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="sm:flex sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        Saved Villas
        <span class="ml-2 text-lg font-normal text-gray-500"
          >({villaCount})</span
        >
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        Your favorite villas saved for future reference
      </p>
      {#if isBackgroundSyncing}
        <div class="mt-2 flex items-center text-sm text-gray-500">
          <svg
            class="h-4 w-4 mr-1 animate-spin"
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
          Syncing...
        </div>
      {/if}
    </div>
    {#if hasVillas}
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <div class="flex items-center space-x-2">
          <button
            on:click={() => (viewMode = "grid")}
            class="p-2 rounded-md {viewMode === 'grid'
              ? 'bg-indigo-100 text-indigo-600'
              : 'text-gray-400 hover:text-gray-500'}"
            title="Grid view"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            on:click={() => (viewMode = "list")}
            class="p-2 rounded-md {viewMode === 'list'
              ? 'bg-indigo-100 text-indigo-600'
              : 'text-gray-400 hover:text-gray-500'}"
            title="List view"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Content -->
  {#if showLoading}
    <div class="py-12 text-center">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
      <p class="mt-2 text-sm text-gray-500">Loading saved villas...</p>
    </div>
  {:else if !hasVillas}
    <div class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No saved villas</h3>
      <p class="mt-1 text-sm text-gray-500">
        Start exploring villas and save your favorites to see them here.
      </p>
      <div class="mt-6">
        <a
          href="/explore"
          class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            class="-ml-1 mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Browse Villas
        </a>
      </div>
    </div>
  {:else}
    <!-- Villa Grid/List -->
    {#if viewMode === "grid"}
      <div
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {#each villas as villa}
          <VillaCard {villa} variant="desktop" />
        {/each}
      </div>
    {:else}
      <div class="space-y-4">
        {#each villas as villa}
          <VillaCard {villa} variant="list" />
        {/each}
      </div>
    {/if}
  {/if}
</div>

