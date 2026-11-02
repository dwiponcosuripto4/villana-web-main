<script lang="ts">
  import type { PageData } from "./$types";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import MobileSidebar from "$lib/components/MobileSidebar.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let user = $derived($page.data.user);
  let mobileMenuOpen = $state(false);

  // For client-side rendering and cached villas
  let clientSavedVillas = $state<any[]>([]);
  let villas = $state<any[]>([]);
  let isLoading = $state(false);
  let isBackgroundSyncing = $state(false);
  let searchTerm = $state("");

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
      if (data.isAuthenticated && !data.dbError && user) {
        try {
          const response = await fetch("/api/villas/saved");
          if (response.ok) {
            const serverData = await response.json();

            // Get current local state before overwriting
            const currentLocalIds = $savedVillas.villaIds;

            // Get server villa IDs (could be empty array if user has no saved villas)
            const serverVillaIds = serverData.villas
              ? serverData.villas.map((v: any) => v.villaId)
              : [];

            // Only update if server data is different from local data
            // This prevents overwriting recent local changes
            const serverIdsSet = new Set(serverVillaIds);
            const localIdsSet = new Set(currentLocalIds);

            // Check if the sets are different (either size or content)
            const isDifferent =
              serverIdsSet.size !== localIdsSet.size ||
              !currentLocalIds.every((id) => serverIdsSet.has(id));

            if (isDifferent) {
              savedVillas.clear();
              serverVillaIds.forEach((id: number) => {
                savedVillas.add(id, user);
              });

              // Cache villa details from server if available
              if (serverData.villas && serverData.villas.length > 0) {
                const serverVillas = serverData.villas
                  .map((savedVilla: any) => savedVilla.villa)
                  .filter(Boolean);
                serverVillas.forEach((villa: any) => {
                  savedVillas.cacheVillaDetails(villa.id, villa, "api");
                });

                // Update the display with fresh server data - removed to avoid state mutation
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

        // Fresh villas are now cached and will be picked up by computedVillas
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
      // Store server villas in cache
      data.villas.forEach((villa: any) => {
        savedVillas.cacheVillaDetails(villa.id, villa, "api");
      });
    }

    // 2. BACKGROUND: Handle authentication sync if needed
    if (
      data.isAuthenticated &&
      !data.dbError &&
      data.villas.length === 0 &&
      $savedVillas.villaIds.length > 0
    ) {
      try {
        await savedVillas.syncToServer($page.data.user);
        // Refresh after sync
        const refreshed = loadFromCache();
        if (refreshed.length > 0) {
          clientSavedVillas = refreshed;
        }
      } catch (error) {
        console.error("Sync failed:", error);
      }
    } else if (cached.length > 0) {
      // Set initial client saved villas from cache
      clientSavedVillas = cached;
    }

    // 3. BACKGROUND: Start background sync for fresh data
    backgroundSync();
  });

  // Compute villas based on saved villas store
  let computedVillas = $derived(() => {
    // Get current saved villa IDs from the store
    const currentSavedIds = $savedVillas.villaIds;

    // Load from cache
    const cached = loadFromCache();

    if (cached.length > 0) {
      // Reorder cached villas to match the order in savedVillas.villaIds
      const idToVilla = new Map(cached.map((villa) => [villa.id, villa]));
      return currentSavedIds
        .map((id) => idToVilla.get(id))
        .filter((villa) => villa !== undefined);
    } else if (data.isAuthenticated && !data.dbError) {
      // Use server data filtered by current saved IDs
      return data.villas.filter((villa) => currentSavedIds.includes(villa.id));
    }

    return [];
  });

  // Ensure villas are ordered by most recent first (for client-side/localStorage users)
  let orderedVillas = $derived(
    data.isAuthenticated && !data.dbError
      ? computedVillas() // Server data is already ordered correctly
      : [...computedVillas()].reverse(), // For localStorage, reverse to show most recent first
  );

  // Filter villas based on search term
  let filteredVillas = $derived(
    searchTerm.trim()
      ? orderedVillas.filter((villa) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            villa.name?.toLowerCase().includes(searchLower) ||
            villa.title?.toLowerCase().includes(searchLower) ||
            villa.city?.toLowerCase().includes(searchLower) ||
            villa.province?.toLowerCase().includes(searchLower) ||
            villa.address?.toLowerCase().includes(searchLower) ||
            villa.description?.toLowerCase().includes(searchLower)
          );
        })
      : orderedVillas,
  );

  let hasVillas = $derived(filteredVillas.length > 0);
  let showLoading = $derived(
    (!data.isAuthenticated ||
      data.dbError ||
      (data.isAuthenticated && data.villas.length === 0)) &&
      isLoading,
  );
  let villaCount = $derived(filteredVillas.length);
  let totalVillaCount = $derived(orderedVillas.length);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<svelte:head>
  <title>Saved Villas - Villana</title>

  <ClarityCode />
  <GoogleAnalytics />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header
    class="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center space-x-4">
          <a href="/" class="flex items-center hover:opacity-90">
            <img
              src="/images/logo-villana-with-name-beta.svg"
              alt="Villana Logo"
              class="w-[64px] md:w-[96px] md:max-w-[128px]"
            />
          </a>
          <h1 class="text-lg font-semibold text-white">Saved Villas</h1>
          <span class="pl-3 text-white">
            ({villaCount}{searchTerm.trim() ? ` of ${totalVillaCount}` : ""})
          </span>
          {#if isBackgroundSyncing}
            <div class="ml-3 flex items-center text-sm text-white/70">
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
        <div class="flex items-center space-x-3">
          <!-- Mobile hamburger menu button -->
          <button
            onclick={toggleMobileMenu}
            class="lg:hidden text-white/80 hover:text-white cursor-pointer"
            aria-label="Open menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <!-- Desktop menu items (hidden on mobile) -->
          <div class="hidden lg:flex lg:items-center lg:space-x-3">
            {#if user}
              <!-- Authenticated user menu -->
              {#if user.role === "admin"}
                <a href="/admin" class="text-sm text-white/80 hover:text-white"
                  >Admin</a
                >
              {/if}
              <a
                href="/dashboard"
                class="text-sm text-white/80 hover:text-white">Dashboard</a
              >
              <a
                href="/auth/logout"
                class="text-sm text-white/80 hover:text-white">Logout</a
              >
            {:else}
              <!-- Non-authenticated user menu -->
              <a
                href="/admin/login"
                class="text-sm text-white/80 hover:text-white">Login</a
              >
              <a
                href="/register"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Register
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Search Section -->
  {#if orderedVillas.length > 0}
    <div class="bg-white border-b border-gray-200">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
          >
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search your saved villas..."
            class="block w-full rounded-lg border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-300"
            aria-label="Search saved villas"
          />
          {#if searchTerm}
            <button
              type="button"
              onclick={() => (searchTerm = "")}
              class="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label="Clear search"
            >
              <svg
                class="h-5 w-5 text-gray-400 hover:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main>
    {#if showLoading}
      <div class="py-12 text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
        ></div>
        <p class="mt-2 text-sm text-gray-500">Loading saved villas...</p>
      </div>
    {:else if orderedVillas.length === 0}
      <div class="py-12 text-center">
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
        <a
          href="/explore"
          class="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Browse Villas
        </a>
      </div>
    {:else if !hasVillas && searchTerm.trim()}
      <div class="py-12 text-center">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No villas found</h3>
        <p class="mt-1 text-sm text-gray-500">
          No saved villas match your search for "{searchTerm}". Try a different
          search term.
        </p>
        <button
          onclick={() => (searchTerm = "")}
          class="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Clear Search
        </button>
      </div>
    {:else}
      <!-- Mobile Feed (Instagram/TikTok style) -->
      <div class="md:hidden">
        {#each filteredVillas as villa}
          <VillaCard {villa} variant="mobile" />
        {/each}
      </div>

      <!-- Desktop Grid (Pinterest style) -->
      <div class="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 md:block lg:px-8">
        <div class="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {#each filteredVillas as villa}
            <VillaCard {villa} variant="desktop" />
          {/each}
        </div>
      </div>
    {/if}
  </main>

  <!-- Mobile Sidebar -->
  <MobileSidebar isOpen={mobileMenuOpen} {user} onClose={closeMobileMenu} />
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
