<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { generateSlug } from "$lib/utils/slug";
  import VillaPlaceManager from "$lib/components/admin/VillaPlaceManager.svelte";
  import MultiImageUpload from "$lib/components/MultiImageUpload.svelte";
  import SortableImageGrid from "$lib/components/SortableImageGrid.svelte";
  import BatchImageEditor from "$lib/components/BatchImageEditor.svelte";
  import ImageLightbox from "$lib/components/ImageLightbox.svelte";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "svelte-5-french-toast";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import PlaceSearchDialog from "$lib/components/PlaceSearchDialog.svelte";
  import LocationSearchDialog from "$lib/components/LocationSearchDialog.svelte";
  import type { TextSearchPlace } from "$lib/utils/google-maps";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Form state - Initialize with place data
  let formData = $state({
    name: data.place.name || "",
    slug: data.place.slug || "",
    description: data.place.description || "",
    type: data.place.type || "",
    category: data.place.category || "",
    latitude: data.place.latitude || "",
    longitude: data.place.longitude || "",
    address: data.place.address || "",
    cityId: data.place.cityId || "",
    provinceId: data.place.provinceId || "",
    googlePlaceId: data.place.googlePlaceId || "",
    mainImage: data.place.mainImage || "",
    metaTitle: data.place.metaTitle || "",
    metaDescription: data.place.metaDescription || "",
    status: data.place.status || "draft",
  });

  let isSubmitting = $state(false);
  let showSlugEdit = $state(false);
  let activeTab = $state("details"); // details, villas, images

  // City selection state
  let selectedCity: CityWithProvince | null = $state(null);

  // Main image upload state
  let mainImageFileInput: HTMLInputElement;
  let isUploadingMainImage = $state(false);

  // Image management state
  let showBatchUpload = $state(false);
  let showBatchEditor = $state(false);
  let selectedImages = $state([]);
  let isLightboxOpen = $state(false);
  let lightboxCurrentIndex = $state(0);

  // Place search dialog state
  let showPlaceSearchDialog = $state(false);
  let showLocationSearchDialog = $state(false);
  let isUploading = $state(false);
  let isImageOperationInProgress = $state(false);

  // Error modal state
  let showErrorModal = $state(false);
  let errorModalMessage = $state("");

  const placeTypes = [
    { value: "", label: "Select Type" },
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
    { value: "", label: "Select Category" },
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

  // Initialize selectedCity from place data
  async function initializeLocationData() {
    if (data.place.cityId && data.place.provinceId) {
      try {
        // Find the city from the provided data
        const city = data.cities.find((c) => c.id === data.place.cityId);
        const province = data.provinces.find(
          (p) => p.id === data.place.provinceId,
        );

        if (city && province) {
          selectedCity = {
            ...city,
            province: province,
          };
        }
      } catch (error) {
        console.error("Error initializing location data:", error);
      }
    }
  }

  // Initialize on mount
  initializeLocationData();

  function handleCitySelect(city: CityWithProvince) {
    selectedCity = city;
    formData.provinceId = city.province.id;
    formData.cityId = city.id;
  }

  function handleCityClear() {
    selectedCity = null;
    formData.provinceId = "";
    formData.cityId = "";
  }

  function handlePlaceSelect(place: TextSearchPlace) {
    formData.googlePlaceId = place.placeId;
    toast.success(`Selected: ${place.name}`);
  }

  function handleLocationSelect(place: TextSearchPlace) {
    formData.googlePlaceId = place.placeId;

    if (place.latitude !== undefined && place.longitude !== undefined) {
      formData.latitude = place.latitude.toFixed(9);
      formData.longitude = place.longitude.toFixed(9);
      toast.success(
        `Updated location data for: ${place.name}. Please save the form to apply changes.`,
      );
    } else {
      toast.warning(
        `Updated Place ID only for: ${place.name} (no coordinates available). Please save the form to apply changes.`,
      );
    }
  }

  function showErrorDialog(message: string) {
    errorModalMessage = message;
    showErrorModal = true;
  }

  // Function to normalize latitude/longitude by replacing dots with commas
  function normalizeCoordinate(coord: string): string {
    return coord.replace(/\./g, ",");
  }

  async function handleSubmit() {
    // Normalize coordinates before validation
    if (formData.latitude) {
      formData.latitude = normalizeCoordinate(formData.latitude.toString());
    }
    if (formData.longitude) {
      formData.longitude = normalizeCoordinate(formData.longitude.toString());
    }

    // Basic validation
    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.latitude?.toString().trim()) {
      toast.error("Latitude is required");
      return;
    } else if (isNaN(Number(formData.latitude.replace(",", ".")))) {
      toast.error("Latitude must be a valid number");
      return;
    } else {
      const lat = Number(formData.latitude.replace(",", "."));
      if (lat < -90 || lat > 90) {
        toast.error("Latitude must be between -90 and 90");
        return;
      }
    }

    if (!formData.longitude?.toString().trim()) {
      toast.error("Longitude is required");
      return;
    } else if (isNaN(Number(formData.longitude.replace(",", ".")))) {
      toast.error("Longitude must be a valid number");
      return;
    } else {
      const lng = Number(formData.longitude.replace(",", "."));
      if (lng < -180 || lng > 180) {
        toast.error("Longitude must be between -180 and 180");
        return;
      }
    }

    isSubmitting = true;

    try {
      const payload = {
        ...formData,
        latitude: Number(formData.latitude.replace(",", ".")),
        longitude: Number(formData.longitude.replace(",", ".")),
      };

      const response = await fetch(`/admin/places/${data.place.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Place updated successfully");
        // goto("/admin/places");
      } else {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          showErrorDialog(errorData.details.join("\n"));
        } else {
          showErrorDialog(errorData.error || "Failed to update place");
        }
      }
    } catch (error) {
      console.error("Error updating place:", error);
      showErrorDialog(
        "An error occurred while updating the place. Please try again.",
      );
    } finally {
      isSubmitting = false;
    }
  }

  async function handleMainImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("Image size must be less than 10MB");
      return;
    }

    isUploadingMainImage = true;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch(
        `/admin/places/${data.place.id}/upload-main-image`,
        {
          method: "POST",
          body: uploadFormData,
        },
      );

      const result = await response.json();

      if (response.ok && result.type === "success") {
        formData.mainImage = result.data.imageUrl;
        toast.success("Main image uploaded successfully");
        await invalidateAll();
      } else {
        toast.error(result.data?.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      isUploadingMainImage = false;
      // Reset the file input
      if (mainImageFileInput) {
        mainImageFileInput.value = "";
      }
    }
  }

  function triggerMainImageUpload() {
    mainImageFileInput?.click();
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{data.place.name}</h1>
      </div>
      <div class="flex space-x-3">
        {#if formData.status === "published"}
          <a
            href="/place/{data.place.slug}"
            target="_blank"
            class="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
          >
            <svg
              class="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Live
          </a>
        {:else}
          <span
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
          >
            <svg
              class="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
            Not Public
          </span>
        {/if}
        <a
          href="/admin/places"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            class="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Places
        </a>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="mb-6 flex justify-between">
    <nav class="flex space-x-8" aria-label="Tabs">
      <button
        onclick={() => (activeTab = "details")}
        class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === "details"
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Place Details
      </button>
      <button
        onclick={() => (activeTab = "images")}
        class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === "images"
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Images ({data.place.images?.length || 0})
      </button>
      <button
        onclick={() => (activeTab = "villas")}
        class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === "villas"
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Linked Villas ({data.linkedVillasCount || 0})
      </button>
    </nav>

    <div class="mt-2 flex items-center gap-4">
      <!-- Status Toggle -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">Status:</span>
        <button
          type="button"
          onclick={() => {
            formData.status =
              formData.status === "published" ? "draft" : "published";
            // Auto-save status change
            handleSubmit();
          }}
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 {formData.status ===
          'published'
            ? 'bg-green-600'
            : 'bg-gray-200'}"
          role="switch"
          aria-checked={formData.status === "published"}
        >
          <span class="sr-only">Toggle status</span>
          <span
            aria-hidden="true"
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {formData.status ===
            'published'
              ? 'translate-x-5'
              : 'translate-x-0'}"
          ></span>
        </button>
        <span
          class="text-sm font-medium {formData.status === 'published'
            ? 'text-green-700'
            : 'text-amber-600'}"
        >
          {formData.status === "published" ? "Published" : "Draft"}
        </span>
      </div>
    </div>
  </div>

  {#if activeTab === "details"}
    <!-- Place Details Form -->
    <div class="bg-white shadow rounded-lg">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Place Information</h3>
        </div>

        <div class="px-6 py-4 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                bind:value={formData.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter place name"
              />
            </div>

            <div>
              <label
                for="slug"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Slug
                <button
                  type="button"
                  onclick={() => (showSlugEdit = !showSlugEdit)}
                  class="ml-2 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  {showSlugEdit ? "Lock" : "Edit"}
                </button>
              </label>
              <input
                type="text"
                id="slug"
                bind:value={formData.slug}
                readonly={!showSlugEdit}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 {!showSlugEdit
                  ? 'bg-gray-50'
                  : ''}"
                placeholder="URL slug"
              />
            </div>
          </div>

          <div>
            <label
              for="description"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              bind:value={formData.description}
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe this place..."
            ></textarea>
          </div>

          <!-- Type and Category -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="type"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Type
              </label>
              <select
                id="type"
                bind:value={formData.type}
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
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                bind:value={formData.category}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {#each placeCategories as category}
                  <option value={category.value}>{category.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Location -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">Location</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  for="latitude"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Latitude *
                </label>
                <input
                  type="text"
                  id="latitude"
                  bind:value={formData.latitude}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="-8,409518"
                />
              </div>

              <div>
                <label
                  for="longitude"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Longitude *
                </label>
                <input
                  type="text"
                  id="longitude"
                  bind:value={formData.longitude}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="115,188919"
                />
              </div>
            </div>

            <div class="mt-4">
              <label
                for="address"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                bind:value={formData.address}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Full address"
              />
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                City and Province
              </label>
              <div class="mt-1">
                <CityAutocomplete
                  bind:selectedCity
                  onselect={handleCitySelect}
                  onclear={handleCityClear}
                  placeholder="Search for city and province..."
                />
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Start typing to search for a city. This will help categorize the
                place by location.
              </p>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">
              Additional Information
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  for="googlePlaceId"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Google Place ID
                </label>
                <div class="flex rounded-md">
                  <input
                    type="text"
                    id="googlePlaceId"
                    bind:value={formData.googlePlaceId}
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                  />
                  <button
                    type="button"
                    onclick={() => (showPlaceSearchDialog = true)}
                    class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <svg
                      class="h-4 w-4 mr-1"
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
                    Detect
                  </button>
                </div>
              </div>

              <div class="col-span-full">
                <label
                  for="mainImage"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Main Image
                </label>

                {#if formData.mainImage}
                  <div class="mt-2 relative group">
                    <img
                      src={formData.mainImage}
                      alt="Main image preview"
                      class="w-full h-48 object-cover rounded-lg border border-gray-300"
                      onerror={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/800x400?text=Image+Not+Found";
                      }}
                    />
                    <div
                      class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2"
                    >
                      <button
                        type="button"
                        onclick={triggerMainImageUpload}
                        disabled={isUploadingMainImage}
                        class="px-3 cursor-pointer py-1.5 bg-white text-gray-700 rounded-md hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
                      >
                        {#if isUploadingMainImage}
                          <svg
                            class="animate-spin h-4 w-4 inline-block mr-1"
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
                          Uploading...
                        {:else}
                          <svg
                            class="w-4 h-4 inline-block mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Change
                        {/if}
                      </button>
                      <button
                        type="button"
                        onclick={() => {
                          if (confirm("Remove main image?")) {
                            formData.mainImage = "";
                          }
                        }}
                        class="px-3 cursor-pointer py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                      >
                        <svg
                          class="w-4 h-4 inline-block mr-1"
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
                        Remove
                      </button>
                    </div>
                  </div>
                {:else}
                  <div
                    class="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                  >
                    <svg
                      class="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <p class="mt-2 text-sm text-gray-600">
                      {#if isUploadingMainImage}
                        <span class="animate-pulse">Uploading image...</span>
                      {:else}
                        No main image uploaded
                      {/if}
                    </p>
                    <button
                      type="button"
                      onclick={triggerMainImageUpload}
                      disabled={isUploadingMainImage}
                      class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {#if isUploadingMainImage}
                        <svg
                          class="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Uploading...
                      {:else}
                        <svg
                          class="-ml-1 mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload Image
                      {/if}
                    </button>
                    <p class="mt-2 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                {/if}

                <!-- Hidden file input -->
                <input
                  type="file"
                  accept="image/*"
                  bind:this={mainImageFileInput}
                  onchange={handleMainImageUpload}
                  class="hidden"
                />
              </div>
            </div>
          </div>

          <!-- SEO -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">SEO</h4>

            <div class="space-y-4">
              <div>
                <label
                  for="metaTitle"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Meta Title
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  bind:value={formData.metaTitle}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="SEO title for this place"
                />
              </div>

              <div>
                <label
                  for="metaDescription"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  bind:value={formData.metaDescription}
                  rows="3"
                  maxlength="160"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="SEO description for this place"
                ></textarea>
                <div class="mt-1 text-sm text-gray-500 text-right">
                  {formData.metaDescription?.length || 0}/160 characters
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div
          class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center"
        >
          <button
            type="button"
            onclick={() => (showLocationSearchDialog = true)}
            class="inline-flex items-center px-4 py-2 border border-indigo-300 bg-indigo-50 text-sm font-medium text-indigo-700 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <svg
              class="h-4 w-4 mr-2"
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
            Get Location Data
          </button>
          <div class="flex space-x-3">
            <a
              href="/admin/places"
              class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Place"}
            </button>
          </div>
        </div>
      </form>
    </div>
  {:else if activeTab === "images"}
    <!-- Images Tab -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Place Images</h3>
            <p class="text-sm text-gray-600 mt-1">
              Manage images for this place
            </p>
          </div>
          <div class="flex space-x-3">
            {#if data.place.images && data.place.images.length > 0}
              <button
                onclick={() => (showBatchEditor = true)}
                disabled={isImageOperationInProgress}
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <svg
                  class="-ml-0.5 mr-2 h-4 w-4"
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
                Batch Edit
              </button>
            {/if}
            <button
              onclick={() => (showBatchUpload = true)}
              disabled={isImageOperationInProgress}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg
                class="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Upload Images
            </button>
          </div>
        </div>
      </div>

      <div class="px-6 py-6">
        {#if data.place.images && data.place.images.length > 0}
          <SortableImageGrid
            images={data.place.images}
            onReorder={async (imageIds) => {
              isImageOperationInProgress = true;
              try {
                const formData = new FormData();
                formData.append("placeId", data.place.id);
                formData.append("imageIds", JSON.stringify(imageIds));

                const response = await fetch(`?/updateImageOrder`, {
                  method: "POST",
                  body: formData,
                });

                if (response.ok) {
                  await invalidateAll();
                  toast.success("Image order updated successfully");
                } else {
                  toast.error("Failed to update image order");
                }
              } catch (error) {
                console.error("Error updating image order:", error);
                toast.error("Error updating image order");
              } finally {
                isImageOperationInProgress = false;
              }
            }}
            onDelete={async (imageId) => {
              if (!confirm("Are you sure you want to delete this image?"))
                return;

              isImageOperationInProgress = true;
              try {
                const formData = new FormData();
                formData.append("imageId", imageId);

                const response = await fetch(`?/deleteImage`, {
                  method: "POST",
                  body: formData,
                });

                if (response.ok) {
                  await invalidateAll();
                  toast.success("Image deleted successfully");
                } else {
                  toast.error("Failed to delete image");
                }
              } catch (error) {
                console.error("Error deleting image:", error);
                toast.error("Error deleting image");
              } finally {
                isImageOperationInProgress = false;
              }
            }}
            onImageClick={(index) => {
              lightboxCurrentIndex = index;
              isLightboxOpen = true;
            }}
            onEdit={async (imageId, altText) => {
              isImageOperationInProgress = true;
              try {
                const formData = new FormData();
                formData.append("imageId", imageId);
                formData.append("altText", altText);

                const response = await fetch(`?/updateImageAltText`, {
                  method: "POST",
                  body: formData,
                });

                if (response.ok) {
                  await invalidateAll();
                  toast.success("Alt text updated successfully");
                } else {
                  toast.error("Failed to update alt text");
                }
              } catch (error) {
                console.error("Error updating alt text:", error);
                toast.error("Error updating alt text");
              } finally {
                isImageOperationInProgress = false;
              }
            }}
            isDisabled={isImageOperationInProgress}
          />
        {:else}
          <div class="text-center py-12">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No images</h3>
            <p class="mt-1 text-sm text-gray-500">
              Get started by uploading your first image.
            </p>
            <div class="mt-6">
              <button
                onclick={() => (showBatchUpload = true)}
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg
                  class="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Images
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else if activeTab === "villas"}
    <!-- Villa Relationships Tab -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Linked Villas</h3>
        <p class="text-sm text-gray-600 mt-1">
          Manage which villas are linked to this place
        </p>
      </div>
      <div class="px-6 py-6">
        <VillaPlaceManager
          place={data.place}
          onUpdate={() => {
            // Placeholder for any updates needed
            console.log("Villa relationships updated");
          }}
        />
      </div>
    </div>
  {/if}
</div>

<!-- Batch Upload Modal -->
{#if showBatchUpload}
  <MultiImageUpload
    title="Upload Place Images"
    maxFiles={10}
    onUpload={async (files) => {
      isUploading = true;
      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("images", file);
        });

        const response = await fetch(`?/uploadImages`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          showBatchUpload = false;
          await invalidateAll();
          toast.success(
            `Successfully uploaded ${result.uploadedCount} image${result.uploadedCount !== 1 ? "s" : ""}`,
          );
        } else {
          const result = await response.json();
          toast.error(`Upload failed: ${result.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        isUploading = false;
      }
    }}
    onCancel={() => (showBatchUpload = false)}
    {isUploading}
  />
{/if}

<!-- Batch Editor Modal -->
{#if showBatchEditor && data.place.images && data.place.images.length > 0}
  <BatchImageEditor
    images={data.place.images}
    onSave={async (updates) => {
      isImageOperationInProgress = true;
      try {
        // Update alt text for all changed images
        const promises = updates.map((update) => {
          const formData = new FormData();
          formData.append("imageId", update.id);
          formData.append("altText", update.altText || "");

          return fetch(`?/updateImageAltText`, {
            method: "POST",
            body: formData,
          });
        });

        const responses = await Promise.all(promises);
        const allSuccessful = responses.every((response) => response.ok);

        if (allSuccessful) {
          showBatchEditor = false;
          await invalidateAll();
          toast.success(
            `Successfully updated alt text for ${updates.length} image${updates.length !== 1 ? "s" : ""}`,
          );
        } else {
          toast.error("Some updates failed. Please try again.");
        }
      } catch (error) {
        console.error("Batch update error:", error);
        toast.error("Update failed. Please try again.");
      } finally {
        isImageOperationInProgress = false;
      }
    }}
    onCancel={() => (showBatchEditor = false)}
    isLoading={isImageOperationInProgress}
  />
{/if}

<!-- Image Lightbox -->
{#if isLightboxOpen && data.place.images && data.place.images.length > 0}
  <ImageLightbox
    mediaItems={data.place.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl,
      altText: img.altText,
      type: 'image' as const
    }))}
    currentIndex={lightboxCurrentIndex}
    isOpen={isLightboxOpen}
    onClose={() => (isLightboxOpen = false)}
  />
{/if}

<!-- Place Search Dialog -->
<PlaceSearchDialog
  bind:isOpen={showPlaceSearchDialog}
  initialQuery={formData.name}
  onPlaceSelect={handlePlaceSelect}
/>

<!-- Location Search Dialog -->
<LocationSearchDialog
  bind:isOpen={showLocationSearchDialog}
  initialQuery={formData.name}
  onLocationSelect={handleLocationSelect}
/>

<!-- Error Modal -->
{#if showErrorModal}
  <div
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
    >
      <div class="mt-3 text-center">
        <div
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"
        >
          <svg
            class="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Error</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 whitespace-pre-line">
            {errorModalMessage}
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            onclick={() => (showErrorModal = false)}
            class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
