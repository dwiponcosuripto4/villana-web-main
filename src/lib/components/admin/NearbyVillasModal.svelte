<script lang="ts">
  interface Villa {
    id: number;
    title: string;
    address: string;
    latitude: string;
    longitude: string;
    status: string;
    priceMin: string;
    priceMax: string;
    bedroomMin: number;
    bedroomMax: number;
    cityName: string | null;
    provinceName: string | null;
    distanceKm: number;
    suggestedAccessType: string;
    suggestedTravelTime: number;
  }

  interface Props {
    isOpen: boolean;
    placeLatitude: string | null;
    placeLongitude: string | null;
    placeName: string;
    excludeVillaIds?: number[];
    onClose: () => void;
    onVillasSelected: (villas: Villa[]) => void;
  }

  let {
    isOpen = $bindable(false),
    placeLatitude,
    placeLongitude,
    placeName,
    excludeVillaIds = [],
    onClose,
    onVillasSelected,
  }: Props = $props();

  let searchRadius = $state(5);
  let nearbyVillas = $state<Villa[]>([]);
  let selectedVillas = $state<Set<number>>(new Set());
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let searchCenter = $state<{ latitude: number; longitude: number } | null>(
    null,
  );
  let totalFound = $state(0);

  function closeModal() {
    isOpen = false;
    selectedVillas = new Set();
    error = null;
    onClose();
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && isOpen) {
      closeModal();
    }
  }

  async function searchNearbyVillas() {
    if (!placeLatitude || !placeLongitude) {
      error = "Place coordinates are required for nearby search";
      return;
    }

    const lat = parseFloat(placeLatitude);
    const lng = parseFloat(placeLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      error = "Invalid place coordinates";
      return;
    }

    isLoading = true;
    error = null;

    try {
      const excludeParam =
        excludeVillaIds.length > 0
          ? `&exclude=${excludeVillaIds.join(",")}`
          : "";
      const response = await fetch(
        `/admin/api/villas/nearby?lat=${lat}&lng=${lng}&radius=${searchRadius}&limit=50${excludeParam}`,
      );

      if (response.ok) {
        const data = await response.json();
        nearbyVillas = data.villas || [];
        searchCenter = data.searchCenter;
        totalFound = data.totalFound;
      } else {
        const errorData = await response.json();
        error = errorData.error || "Failed to search nearby villas";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Network error occurred";
    } finally {
      isLoading = false;
    }
  }

  function toggleVillaSelection(villaId: number) {
    const newSelected = new Set(selectedVillas);
    if (newSelected.has(villaId)) {
      newSelected.delete(villaId);
    } else {
      newSelected.add(villaId);
    }
    selectedVillas = newSelected;
  }

  function selectAllVillas() {
    selectedVillas = new Set(nearbyVillas.map((v) => v.id));
  }

  function clearSelection() {
    selectedVillas = new Set();
  }

  function handleAddSelected() {
    const villasToAdd = nearbyVillas.filter((villa) =>
      selectedVillas.has(villa.id),
    );
    onVillasSelected(villasToAdd);
    closeModal();
  }

  function formatBedrooms(bedroomMin: number, bedroomMax: number): string {
    if (bedroomMin === bedroomMax) {
      return `${bedroomMin} BR`;
    }
    return `${bedroomMin}-${bedroomMax} BR`;
  }

  // Debounced search when modal opens or radius changes
  let radiusTimeout: any;
  $effect(() => {
    if (isOpen && placeLatitude && placeLongitude) {
      clearTimeout(radiusTimeout);
      radiusTimeout = setTimeout(() => {
        searchNearbyVillas();
      }, 300);
    }
    searchRadius; // Include searchRadius in dependencies
  });
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style="background-color: rgba(0, 0, 0, 0.5);"
  >
    <!-- Modal content -->
    <div
      class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <div class="flex items-center">
          <div
            class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3"
          >
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              Detect Nearby Villas
            </h3>
            <p class="text-sm text-gray-500">Find villas near "{placeName}"</p>
          </div>
        </div>
        <button
          type="button"
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Search Controls -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label
              for="search-radius"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Radius: {searchRadius} km
            </label>
            <input
              type="range"
              id="search-radius"
              min="1"
              max="20"
              step="0.5"
              bind:value={searchRadius}
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 km</span>
              <span>20 km</span>
            </div>
          </div>
          <div class="text-sm text-gray-600">
            {#if searchCenter}
              <div>
                Center: {searchCenter.latitude.toFixed(4)}, {searchCenter.longitude.toFixed(
                  4,
                )}
              </div>
            {/if}
            {#if totalFound > 0}
              <div class="font-medium text-green-600">
                {totalFound} villas found
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if error}
          <div class="text-center py-8">
            <div
              class="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <p class="text-red-600 font-medium">Search Error</p>
            <p class="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        {:else if isLoading}
          <div class="text-center py-8">
            <div
              class="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4"
            >
              <svg
                class="animate-spin w-6 h-6 text-blue-600"
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
            </div>
            <p class="text-gray-600">Searching for nearby villas...</p>
          </div>
        {:else if !placeLatitude || !placeLongitude}
          <div class="text-center py-8">
            <div
              class="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            </div>
            <p class="text-yellow-600 font-medium">Missing Coordinates</p>
            <p class="text-gray-500 text-sm mt-1">
              This place needs latitude and longitude coordinates to detect
              nearby villas.
            </p>
          </div>
        {:else if nearbyVillas.length === 0}
          <div class="text-center py-8">
            <div
              class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <p class="text-gray-500">
              No villas found within {searchRadius} km radius.
            </p>
            <p class="text-gray-400 text-sm mt-1">
              Try increasing the search radius to find more villas.
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            <!-- Selection Controls -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <p class="text-sm text-gray-600">
                  {selectedVillas.size} of {nearbyVillas.length} villas selected
                </p>
                <div class="flex gap-2">
                  <button
                    onclick={selectAllVillas}
                    class="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onclick={clearSelection}
                    class="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <!-- Villas List -->
            <div class="space-y-3">
              {#each nearbyVillas as villa}
                <div
                  class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors {selectedVillas.has(
                    villa.id,
                  )
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white'}"
                >
                  <div class="flex items-start gap-4">
                    <div class="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedVillas.has(villa.id)}
                        onchange={() => toggleVillaSelection(villa.id)}
                        class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-900 truncate">
                            {villa.title}
                          </h4>
                          <p class="text-sm text-gray-500 mt-1">
                            {villa.address}
                            {#if villa.cityName}
                              • {villa.cityName}
                              {#if villa.provinceName}
                                , {villa.provinceName}
                              {/if}
                            {/if}
                          </p>
                          <div class="flex items-center gap-4 mt-2 text-xs">
                            <span
                              class="inline-flex items-center px-2 py-1 rounded-full text-blue-700 bg-blue-100 font-medium"
                            >
                              📍 {villa.distanceKm} km
                            </span>
                            <span class="text-gray-600">
                              {formatBedrooms(
                                villa.bedroomMin,
                                villa.bedroomMax,
                              )}
                            </span>
                            <span
                              class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                villa.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {villa.status}
                            </span>
                          </div>
                          <div class="text-xs text-gray-500 mt-1">
                            Suggested: {villa.suggestedAccessType} • ~{villa.suggestedTravelTime}
                            min
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-gray-200 flex justify-between items-center"
      >
        <button
          type="button"
          onclick={closeModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleAddSelected}
          disabled={selectedVillas.size === 0}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add {selectedVillas.size} Selected Villa{selectedVillas.size !== 1
            ? "s"
            : ""}
        </button>
      </div>
    </div>
  </div>
{/if}

