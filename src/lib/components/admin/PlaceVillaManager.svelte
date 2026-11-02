<script lang="ts">
  import AutocompleteInput from "$lib/components/AutocompleteInput.svelte";
  import NearbyPlacesModal from "$lib/components/admin/NearbyPlacesModal.svelte";
  import { showToast } from "$lib/utils/toast.js";

  interface LinkedPlace {
    id: string;
    name: string;
    slug: string;
    type: string;
    category: string;
    status: string;
    mainImage?: string;
    distanceKm: string;
    accessType: string;
    travelTimeMinutes?: number;
    notes?: string;
    address?: string;
    cityName?: string;
    provinceName?: string;
  }

  interface Props {
    villa: {
      id: number;
      title: string;
      latitude?: string;
      longitude?: string;
    };
    onUpdate: () => void;
  }

  let { villa, onUpdate }: Props = $props();

  let linkedPlaces = $state<LinkedPlace[]>([]);
  let showAddForm = $state(false);
  let isLoading = $state(false);
  let showNearbyModal = $state(false);

  // Form state for adding new place link
  let formData = $state({
    placeId: "",
    distanceKm: "",
    accessType: "walking",
    travelTimeMinutes: "",
    notes: "",
    orderIndex: 0,
  });

  let selectedPlace = $state<{ id: string; label: string } | null>(null);

  const accessTypes = [
    { value: "walking", label: "Walking" },
    { value: "driving", label: "Driving" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "bicycle", label: "Bicycle" },
    { value: "public_transport", label: "Public Transport" },
    { value: "boat", label: "Boat" },
    { value: "mixed", label: "Mixed" },
  ];

  async function loadPlaces() {
    isLoading = true;
    try {
      const response = await fetch(`/admin/villas/${villa.id}/places`);

      if (response.ok) {
        const data = await response.json();
        linkedPlaces = data.places || [];
      }
    } catch (error) {
      console.error("Failed to load places:", error);
    } finally {
      isLoading = false;
    }
  }

  async function searchPlaces(query: string) {
    if (query.length < 2) return [];

    try {
      // Get linked place IDs to exclude from search
      const linkedPlaceIds = linkedPlaces.map((p) => p.id);
      const excludeParam =
        linkedPlaceIds.length > 0 ? `&exclude=${linkedPlaceIds.join(",")}` : "";

      const response = await fetch(
        `/admin/api/places/search?q=${encodeURIComponent(query)}&limit=20${excludeParam}`,
      );

      if (response.ok) {
        const data = await response.json();
        return data.places.map((place: any) => ({
          id: place.id,
          label:
            place.label ||
            `${place.name} - ${place.address || place.type || "Place"}`,
          value: place.id,
        }));
      }
    } catch (error) {
      console.error("Place search error:", error);
    }

    return [];
  }

  function handlePlaceSelect(option: any) {
    if (option) {
      selectedPlace = option;
      formData.placeId = option.id;
    } else {
      selectedPlace = null;
      formData.placeId = "";
    }
  }

  async function handleAddPlace() {
    if (!selectedPlace || !formData.distanceKm || !formData.accessType) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`/admin/villas/${villa.id}/places`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: formData.placeId,
          distanceKm: parseFloat(formData.distanceKm),
          accessType: formData.accessType,
          travelTimeMinutes: formData.travelTimeMinutes
            ? parseInt(formData.travelTimeMinutes)
            : null,
          notes: formData.notes,
          orderIndex: formData.orderIndex,
        }),
      });

      if (response.ok) {
        // Reset form
        formData = {
          placeId: "",
          distanceKm: "",
          accessType: "walking",
          travelTimeMinutes: "",
          notes: "",
          orderIndex: 0,
        };
        selectedPlace = null;
        showAddForm = false;
        await loadPlaces();
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Failed to link place: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error linking place:", error);
      alert("An error occurred while linking the place.");
    }
  }

  async function handleRemovePlace(placeId: string, placeName: string) {
    if (!confirm(`Remove "${placeName}" from this villa?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/villas/${villa.id}/places/${placeId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await loadPlaces();
        onUpdate();
      } else {
        alert("Failed to remove place link");
      }
    } catch (error) {
      console.error("Error removing place link:", error);
      alert("An error occurred while removing the place link.");
    }
  }

  async function handleNearbyPlacesSelected(places: any[]) {
    if (places.length === 0) return;

    isLoading = true;
    try {
      const response = await fetch(`/admin/villas/${villa.id}/places/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          places: places.map((place) => ({
            id: place.id,
            distanceKm: place.distanceKm,
            suggestedAccessType: place.suggestedAccessType,
            suggestedTravelTime: place.suggestedTravelTime,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Show success message
        if (result.added > 0) {
          showToast.success(
            `Successfully linked ${result.added} place${result.added > 1 ? "s" : ""}${result.skipped > 0 ? ` (${result.skipped} already linked)` : ""}`,
          );
        } else if (result.skipped > 0) {
          showToast.error(
            `All ${result.skipped} selected place${result.skipped > 1 ? "s were" : " was"} already linked to this villa`,
          );
        }

        // Refresh the list and update parent component
        await loadPlaces();
        onUpdate();
      } else {
        const error = await response.json();
        console.error("Failed to batch link places:", error);
        alert(`Failed to link places: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error batch linking places:", error);
      alert("An error occurred while linking places. Please try again.");
    } finally {
      isLoading = false;
    }
  }

  // Load places when component mounts
  loadPlaces();
</script>

<div class="space-y-6">
  <!-- Add Place Form -->
  <div class="border-b border-gray-200 pb-4">
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-md font-medium text-gray-900">Place Relationships</h4>
      <div class="flex gap-2">
        <button
          onclick={() => (showNearbyModal = true)}
          class="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          <svg
            class="w-4 h-4 mr-2"
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
          Detect Nearby Places
        </button>
        <button
          onclick={() => (showAddForm = !showAddForm)}
          class="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          {showAddForm ? "Cancel" : "Add Place"}
        </button>
      </div>
    </div>

    {#if showAddForm}
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Place *</label
            >
            <AutocompleteInput
              options={[]}
              searchFunction={searchPlaces}
              onSelect={handlePlaceSelect}
              selectedValue={selectedPlace?.id}
              placeholder="Type to search for places..."
              required={true}
            />
            {#if selectedPlace}
              <p class="text-xs text-gray-600 mt-1">
                Selected: {selectedPlace.label}
              </p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Distance (km) *</label
            >
            <input
              type="number"
              step="0.1"
              min="0"
              bind:value={formData.distanceKm}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Access Type *</label
            >
            <select
              bind:value={formData.accessType}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {#each accessTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Travel Time (minutes)</label
            >
            <input
              type="number"
              min="0"
              bind:value={formData.travelTimeMinutes}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Notes</label
          >
          <textarea
            bind:value={formData.notes}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Additional notes about this relationship..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-2 mt-4">
          <button
            onclick={() => (showAddForm = false)}
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onclick={handleAddPlace}
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Relationship
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Linked Places List -->
  {#if isLoading}
    <div class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
      <p class="mt-2 text-sm text-gray-500">Loading places...</p>
    </div>
  {:else if linkedPlaces.length > 0}
    <div class="space-y-3">
      <h5 class="text-sm font-medium text-gray-900">
        Linked Places ({linkedPlaces.length})
      </h5>
      {#each linkedPlaces as place}
        <div
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <div>
                <h6 class="text-sm font-medium text-gray-900">{place.name}</h6>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-xs text-blue-600">{place.distanceKm}km</span
                  >
                  <span class="text-xs px-2 py-1 bg-gray-200 rounded-full">
                    {accessTypes.find((t) => t.value === place.accessType)
                      ?.label || place.accessType}
                  </span>
                  {#if place.travelTimeMinutes}
                    <span class="text-xs text-gray-500"
                      >{place.travelTimeMinutes} min</span
                    >
                  {/if}
                  <span
                    class={`text-xs px-2 py-1 rounded-full ${
                      place.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {place.status}
                  </span>
                  {#if place.type}
                    <span
                      class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      {place.type}
                    </span>
                  {/if}
                </div>
                {#if place.address}
                  <p class="text-xs text-gray-500 mt-1">
                    {place.address}
                    {#if place.cityName}
                      • {place.cityName}{#if place.provinceName}, {place.provinceName}{/if}
                    {/if}
                  </p>
                {/if}
                {#if place.notes}
                  <p class="text-xs text-gray-600 mt-1">{place.notes}</p>
                {/if}
              </div>
            </div>
          </div>
          <div class="flex space-x-2">
            <a
              href="/admin/places/{place.id}"
              class="text-sm text-indigo-600 hover:text-indigo-700"
              title="Edit place"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </a>
            <button
              onclick={() => handleRemovePlace(place.id, place.name)}
              class="text-sm text-red-600 hover:text-red-700"
              title="Remove link"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500">
      <svg
        class="mx-auto h-12 w-12 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <h3 class="text-sm font-medium text-gray-900 mb-2">No linked places</h3>
      <p class="text-sm text-gray-500 mb-4">
        This villa is not linked to any places yet.
      </p>
      <button
        onclick={() => (showAddForm = true)}
        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Add First Place
      </button>
    </div>
  {/if}
</div>

<!-- Nearby Places Modal -->
{#if showNearbyModal}
  <NearbyPlacesModal
    bind:isOpen={showNearbyModal}
    villaLatitude={villa.latitude}
    villaLongitude={villa.longitude}
    villaName={villa.title}
    excludePlaceIds={Array.isArray(linkedPlaces)
      ? linkedPlaces.map((p) => p.id)
      : []}
    onClose={() => (showNearbyModal = false)}
    onPlacesSelected={handleNearbyPlacesSelected}
  />
{/if}

