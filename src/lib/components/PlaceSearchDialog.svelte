<script lang="ts">
  import { GoogleMapsService, type TextSearchPlace } from '$lib/utils/google-maps';

  let { isOpen = $bindable(false), initialQuery = '', onPlaceSelect } = $props<{
    isOpen: boolean;
    initialQuery?: string;
    onPlaceSelect: (place: TextSearchPlace) => void;
  }>();

  let searchQuery = $state('');
  let searchResults = $state<TextSearchPlace[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let searchTimeoutId: number | null = null;

  function closeDialog() {
    isOpen = false;
    searchQuery = '';
    searchResults = [];
    error = null;
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
      searchTimeoutId = null;
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      closeDialog();
    }
  }

  async function performSearch(query: string) {
    if (!query.trim()) {
      searchResults = [];
      return;
    }

    isLoading = true;
    error = null;

    try {
      const results = await GoogleMapsService.searchPlacesByText(query.trim());
      searchResults = results;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to search places';
      searchResults = [];
    } finally {
      isLoading = false;
    }
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;

    // Clear previous timeout
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }

    // Set new timeout for debounced search
    searchTimeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }

  function handlePlaceClick(place: TextSearchPlace) {
    onPlaceSelect(place);
    closeDialog();
  }

  function handleSearchSubmit(event: Event) {
    event.preventDefault();
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }
    performSearch(searchQuery);
  }

  // Only initialize search query when dialog opens
  $effect(() => {
    if (isOpen && initialQuery) {
      searchQuery = initialQuery;
      // Perform initial search
      performSearch(initialQuery);
    }
  });
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
  <!-- Overlay -->
  <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background-color: rgba(0, 0, 0, 0.5);">
    <!-- Modal content -->
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Search for Place</h3>
        </div>
        <button
          type="button"
          onclick={closeDialog}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Search Input -->
      <div class="p-6 border-b border-gray-200">
        <form onsubmit={handleSearchSubmit}>
          <div>
            <label for="place-search" class="block text-sm font-medium text-gray-700 mb-2">
              Search for places by name
            </label>
            <div class="relative">
              <input
                type="text"
                id="place-search"
                value={searchQuery}
                oninput={handleSearchInput}
                placeholder="Enter place name to search..."
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                autocomplete="off"
              />
              {#if isLoading}
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg class="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              {/if}
            </div>
          </div>
        </form>
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if error}
          <div class="text-center py-8">
            <div class="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-red-600 font-medium">Search Error</p>
            <p class="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        {:else if isLoading}
          <div class="text-center py-8">
            <div class="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg class="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-gray-600">Searching places...</p>
          </div>
        {:else if searchResults.length === 0}
          <div class="text-center py-8">
            <div class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <p class="text-gray-500">
              {searchQuery.trim() ? 'No places found for your search.' : 'Enter a place name to start searching.'}
            </p>
          </div>
        {:else}
          <div class="space-y-2">
            <p class="text-sm text-gray-600 mb-4">Found {searchResults.length} places. Click to select:</p>
            {#each searchResults as place}
              <button
                type="button"
                onclick={() => handlePlaceClick(place)}
                class="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 group-hover:text-indigo-900 truncate">
                      {place.name}
                    </h4>
                    <p class="text-sm text-gray-500 mt-1">
                      {place.address}
                    </p>
                    <p class="text-xs text-gray-400 mt-1 font-mono">
                      Place ID: {place.placeId}
                    </p>
                  </div>
                  <div class="ml-3 flex-shrink-0">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          onclick={closeDialog}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}