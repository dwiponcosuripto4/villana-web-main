<script lang="ts">
  import type { VillaNearbyPlace } from "$lib/server/db/schema";
  import TrashIcon from "$lib/components/icons/TrashIcon.svelte";
  import PencilEditIcon from "$lib/components/icons/PencilEditIcon.svelte";

  interface Props {
    villaId: number;
    nearbyPlaces: VillaNearbyPlace[];
    onUpdate: () => void;
  }

  let { villaId, nearbyPlaces, onUpdate }: Props = $props();

  let showAddForm = $state(false);
  let editingPlace = $state<VillaNearbyPlace | null>(null);
  let showJsonImport = $state(false);
  let jsonImportText = $state("");

  // Form state
  let formData = $state({
    name: "",
    description: "",
    distanceKm: "",
    accessType: "walk",
    placeType: ""
  });

  // Access type options
  const accessTypes = [
    { value: "walk", label: "Walking Distance" },
    { value: "car", label: "By Car" },
    { value: "motorcycle", label: "By Motorcycle" },
    { value: "car_motorcycle", label: "Car / Motorcycle" },
    { value: "walk_car", label: "Walking / Car" },
    { value: "all", label: "All Access" }
  ];

  // Place type options
  const placeTypes = [
    { value: "tourist_attraction", label: "Tourist Attraction" },
    { value: "restaurant", label: "Restaurant" },
    { value: "beach", label: "Beach" },
    { value: "mountain", label: "Mountain" },
    { value: "temple", label: "Temple" },
    { value: "lake", label: "Lake" },
    { value: "waterfall", label: "Waterfall" },
    { value: "market", label: "Market" },
    { value: "shopping", label: "Shopping" },
    { value: "hospital", label: "Hospital" },
    { value: "gas_station", label: "Gas Station" },
    { value: "bank", label: "Bank" }
  ];

  function resetForm() {
    formData = {
      name: "",
      description: "",
      distanceKm: "",
      accessType: "walk",
      placeType: ""
    };
    editingPlace = null;
    showAddForm = false;
  }

  function startEdit(place: VillaNearbyPlace) {
    formData = {
      name: place.name,
      description: place.description || "",
      distanceKm: place.distanceKm,
      accessType: place.accessType,
      placeType: place.placeType || ""
    };
    editingPlace = place;
    showAddForm = true;
  }

  async function handleSubmit() {
    try {
      const url = editingPlace
        ? `/admin/villas/${villaId}/nearby-places/${editingPlace.id}`
        : `/admin/villas/${villaId}/nearby-places`;

      const method = editingPlace ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        onUpdate();
      } else {
        console.error("Failed to save nearby place");
      }
    } catch (error) {
      console.error("Error saving nearby place:", error);
    }
  }

  async function handleDelete(placeId: string) {
    if (!confirm("Are you sure you want to delete this nearby place?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/villas/${villaId}/nearby-places/${placeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
      } else {
        console.error("Failed to delete nearby place");
      }
    } catch (error) {
      console.error("Error deleting nearby place:", error);
    }
  }

  async function handleJsonImport() {
    try {
      const places = JSON.parse(jsonImportText);

      if (!Array.isArray(places)) {
        alert("Invalid JSON: Expected an array of places");
        return;
      }

      const response = await fetch(`/admin/villas/${villaId}/nearby-places/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ places }),
      });

      if (response.ok) {
        jsonImportText = "";
        showJsonImport = false;
        onUpdate();
      } else {
        console.error("Failed to import nearby places");
      }
    } catch (error) {
      alert("Invalid JSON format");
      console.error("Error importing nearby places:", error);
    }
  }

  function exportToJson() {
    const exportData = nearbyPlaces.map(place => ({
      name: place.name,
      description: place.description,
      distanceKm: parseFloat(place.distanceKm),
      accessType: place.accessType,
      placeType: place.placeType
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `villa-${villaId}-nearby-places.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="mb-8">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">Nearby Places</h3>
    <div class="flex space-x-2">
      <button
        onclick={() => showJsonImport = true}
        class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
      >
        Import JSON
      </button>
      {#if nearbyPlaces.length > 0}
        <button
          onclick={exportToJson}
          class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Export JSON
        </button>
      {/if}
      <button
        onclick={() => showAddForm = true}
        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Add Place
      </button>
    </div>
  </div>

  <!-- Nearby Places List -->
  {#if nearbyPlaces.length > 0}
    <div class="space-y-2 mb-4">
      {#each nearbyPlaces as place}
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="font-medium text-gray-900">{place.name}</span>
              <span class="text-sm text-blue-600">{place.distanceKm}km</span>
              <span class="text-xs px-2 py-1 bg-gray-200 rounded-full">
                {place.accessType}
              </span>
              {#if place.placeType}
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {place.placeType}
                </span>
              {/if}
            </div>
            {#if place.description}
              <p class="text-sm text-gray-600 mt-1">{place.description}</p>
            {/if}
          </div>
          <div class="flex space-x-2">
            <button
              onclick={() => startEdit(place)}
              class="p-1 text-gray-400 hover:text-gray-600"
            >
              <PencilEditIcon className="h-4 w-4" />
            </button>
            <button
              onclick={() => handleDelete(place.id)}
              class="p-1 text-gray-400 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-gray-500 text-center py-4">No nearby places added yet.</p>
  {/if}

  <!-- Add/Edit Form -->
  {#if showAddForm}
    <div class="border border-gray-200 rounded-lg p-4 bg-white">
      <h4 class="font-medium text-gray-900 mb-3">
        {editingPlace ? "Edit" : "Add"} Nearby Place
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            bind:value={formData.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Distance (km) *
          </label>
          <input
            type="number"
            step="0.1"
            bind:value={formData.distanceKm}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Access Type *
          </label>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Place Type
          </label>
          <select
            bind:value={formData.placeType}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a type...</option>
            {#each placeTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          bind:value={formData.description}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        ></textarea>
      </div>

      <div class="flex justify-end space-x-2 mt-4">
        <button
          onclick={resetForm}
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onclick={handleSubmit}
          class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {editingPlace ? "Update" : "Add"} Place
        </button>
      </div>
    </div>
  {/if}

  <!-- JSON Import Modal -->
  {#if showJsonImport}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Import Nearby Places from JSON</h3>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            JSON Data (Array of places)
          </label>
          <textarea
            bind:value={jsonImportText}
            rows="10"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder={`[
  {
    "name": "Telaga Menjer",
    "description": "Beautiful lake with mountain views",
    "distanceKm": 0.5,
    "accessType": "walk",
    "placeType": "lake"
  }
]`}
          ></textarea>
        </div>

        <div class="flex justify-end space-x-2">
          <button
            onclick={() => { showJsonImport = false; jsonImportText = ""; }}
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onclick={handleJsonImport}
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Import Places
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>