<script lang="ts">
  import type { PlaceWithRelations } from "$lib/types/place";
  import AutocompleteInput from "$lib/components/AutocompleteInput.svelte";
  import NearbyVillasModal from "$lib/components/admin/NearbyVillasModal.svelte";

  interface Props {
    place: PlaceWithRelations;
    onUpdate: () => void;
  }

  let { place, onUpdate }: Props = $props();

  let linkedVillas = $state([]);
  let availableVillas = $state([]);
  let showAddForm = $state(false);
  let isLoading = $state(false);
  let showNearbyModal = $state(false);

  // Form state for adding new villa link
  let formData = $state({
    villaId: "",
    distanceKm: "",
    accessType: "walking",
    travelTimeMinutes: "",
    notes: "",
    orderIndex: 0,
  });

  let selectedVilla = $state<{ id: number; label: string } | null>(null);

  const accessTypes = [
    { value: "walking", label: "Walking" },
    { value: "driving", label: "Driving" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "bicycle", label: "Bicycle" },
    { value: "public_transport", label: "Public Transport" },
    { value: "boat", label: "Boat" },
    { value: "mixed", label: "Mixed" },
  ];

  async function loadVillas() {
    isLoading = true;
    try {
      const linkedResponse = await fetch(`/admin/places/${place.id}/villas`);

      if (linkedResponse.ok) {
        const linkedData = await linkedResponse.json();
        linkedVillas = linkedData.villas || [];
      }
    } catch (error) {
      console.error("Failed to load villas:", error);
    } finally {
      isLoading = false;
    }
  }

  async function searchVillas(query: string) {
    if (query.length < 2) return [];

    try {
      // Get linked villa IDs to exclude from search
      const linkedVillaIds = linkedVillas.map((v) => v.id);
      const excludeParam =
        linkedVillaIds.length > 0 ? `&exclude=${linkedVillaIds.join(",")}` : "";

      const response = await fetch(
        `/admin/api/villas/search?q=${encodeURIComponent(query)}&limit=20${excludeParam}`,
      );

      if (response.ok) {
        const data = await response.json();
        return data.villas.map((villa: any) => ({
          id: villa.id,
          label: villa.label,
          value: villa.value,
        }));
      }
    } catch (error) {
      console.error("Villa search error:", error);
    }

    return [];
  }

  function handleVillaSelect(option: any) {
    if (option) {
      selectedVilla = option;
      formData.villaId = option.id.toString();
    } else {
      selectedVilla = null;
      formData.villaId = "";
    }
  }

  async function handleAddVilla() {
    if (!selectedVilla || !formData.distanceKm || !formData.accessType) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`/admin/places/${place.id}/villas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaId: parseInt(formData.villaId),
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
          villaId: "",
          distanceKm: "",
          accessType: "walking",
          travelTimeMinutes: "",
          notes: "",
          orderIndex: 0,
        };
        selectedVilla = null;
        showAddForm = false;
        await loadVillas();
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Failed to link villa: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error linking villa:", error);
      alert("An error occurred while linking the villa.");
    }
  }

  async function handleRemoveVilla(villaId: number, villaTitle: string) {
    if (!confirm(`Remove "${villaTitle}" from this place?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/places/${place.id}/villas/${villaId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await loadVillas();
        onUpdate();
      } else {
        alert("Failed to remove villa link");
      }
    } catch (error) {
      console.error("Error removing villa link:", error);
      alert("An error occurred while removing the villa link.");
    }
  }

  async function handleNearbyVillasSelected(villas: any[]) {
    // Add multiple villas in sequence
    for (const villa of villas) {
      try {
        const response = await fetch(`/admin/places/${place.id}/villas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            villaId: villa.id,
            distanceKm: villa.distanceKm,
            accessType: villa.suggestedAccessType,
            travelTimeMinutes: villa.suggestedTravelTime,
            orderIndex: 0,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to link villa ${villa.title}:`, error);
          alert(
            `Failed to link villa "${villa.title}": ${error.error || "Unknown error"}`,
          );
        }
      } catch (error) {
        console.error(`Error linking villa ${villa.title}:`, error);
        alert(`An error occurred while linking villa "${villa.title}".`);
      }
    }

    // Refresh the list and update parent component
    await loadVillas();
    onUpdate();
  }

  // Load villas when component mounts
  loadVillas();
</script>

<div class="space-y-6">
  <!-- Add Villa Form -->
  <div class="border-b border-gray-200 pb-4">
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-md font-medium text-gray-900">Villa Relationships</h4>
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
          Detect Nearby Villas
        </button>
        <button
          onclick={() => (showAddForm = !showAddForm)}
          class="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          {showAddForm ? "Cancel" : "Add Villa"}
        </button>
      </div>
    </div>

    {#if showAddForm}
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Villa *</label
            >
            <AutocompleteInput
              options={[]}
              searchFunction={searchVillas}
              onSelect={handleVillaSelect}
              selectedValue={selectedVilla?.id}
              placeholder="Type to search for villas..."
              required={true}
            />
            {#if selectedVilla}
              <p class="text-xs text-gray-600 mt-1">
                Selected: {selectedVilla.label}
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
            onclick={handleAddVilla}
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Relationship
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Linked Villas List -->
  {#if isLoading}
    <div class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
      <p class="mt-2 text-sm text-gray-500">Loading villas...</p>
    </div>
  {:else if linkedVillas.length > 0}
    <div class="space-y-3">
      <h5 class="text-sm font-medium text-gray-900">
        Linked Villas ({linkedVillas.length})
      </h5>
      {#each linkedVillas as villa}
        <div
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <div>
                <h6 class="text-sm font-medium text-gray-900">{villa.title}</h6>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-xs text-blue-600">{villa.distanceKm}km</span
                  >
                  <span class="text-xs px-2 py-1 bg-gray-200 rounded-full">
                    {accessTypes.find((t) => t.value === villa.accessType)
                      ?.label || villa.accessType}
                  </span>
                  {#if villa.travelTimeMinutes}
                    <span class="text-xs text-gray-500"
                      >{villa.travelTimeMinutes} min</span
                    >
                  {/if}
                  <span
                    class={`text-xs px-2 py-1 rounded-full ${
                      villa.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {villa.status}
                  </span>
                </div>
                {#if villa.notes}
                  <p class="text-xs text-gray-600 mt-1">{villa.notes}</p>
                {/if}
              </div>
            </div>
          </div>
          <div class="flex space-x-2">
            <a
              href="/admin/villas/{villa.id}"
              class="text-sm text-indigo-600 hover:text-indigo-700"
              title="Edit villa"
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
              onclick={() => handleRemoveVilla(villa.id, villa.title)}
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
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <h3 class="text-sm font-medium text-gray-900 mb-2">No linked villas</h3>
      <p class="text-sm text-gray-500 mb-4">
        This place is not linked to any villas yet.
      </p>
      <button
        onclick={() => (showAddForm = true)}
        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Add First Villa
      </button>
    </div>
  {/if}
</div>

<!-- Nearby Villas Modal -->
<NearbyVillasModal
  bind:isOpen={showNearbyModal}
  placeLatitude={place.latitude}
  placeLongitude={place.longitude}
  placeName={place.name}
  excludeVillaIds={linkedVillas.map((v) => v.id)}
  onClose={() => (showNearbyModal = false)}
  onVillasSelected={handleNearbyVillasSelected}
/>

