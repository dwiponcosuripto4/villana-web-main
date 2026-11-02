<script lang="ts">
  import type { ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import {
    generateVillaDummyData,
    generateCustomAmenities,
  } from "$lib/utils/dummyDataGenerator";
  import { dev } from "$app/environment";
  import {
    AMENITY_CATEGORIES,
    CATEGORY_DISPLAY_NAMES,
  } from "$lib/utils/amenity-categories";
  import ErrorModal from "$lib/components/ErrorModal.svelte";
  import JSONImportModal from "$lib/components/admin/JSONImportModal.svelte";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import PlaceSearchDialog from "$lib/components/PlaceSearchDialog.svelte";
  import LocationSearchDialog from "$lib/components/LocationSearchDialog.svelte";
  import type { TextSearchPlace } from "$lib/utils/google-maps";
  import {
    validatePhoneNumber,
    getPhoneValidationPattern,
    getPhoneInputTitle,
    getPhoneInputPlaceholder,
    getPhoneInputHelperText,
    getLatLonValidationPattern,
  } from "$lib/utils/validation";
  import {
    saveFormData,
    loadFormData,
    clearFormData,
    cleanupOldFormData,
    migrateFromPerVillaStorage,
    type VillaFormData,
  } from "$lib/utils/formAutoSave";
  import { onMount, onDestroy } from "svelte";
  import { showToast, toastMessages } from "$lib/utils/toast";
  import { goto } from "$app/navigation";

  export let form: ActionData;

  // Custom amenities state
  let customAmenities: Array<{
    name: string;
    description: string;
    category: string;
    score: number;
  }> = [];

  // Error modal state
  let showErrorModal = false;
  let errorMessage = "";
  let creationSuccess = false;
  let nextUrl = "";

  // JSON import state
  let showImportModal = false;
  let importedImages: Array<any> = [];
  let importedVideos: Array<any> = [];
  let importedBedSizes: Array<any> = [];

  // Place search dialog state
  let showPlaceSearchDialog = false;
  let showLocationSearchDialog = false;

  // Location state
  let selectedCity: CityWithProvince | null = null;
  let provinceId: string = "";
  let cityId: string = "";

  // Form fields for auto-save
  let title = "";
  let priceMin = "";
  let priceMax = "";
  let unitsCount = 1;
  let bedroomMin = 0;
  let bedroomMax = 0;
  let personCapacityMin = 0;
  let personCapacityMax = 0;
  let hasAc = false;
  let hasBathtub = false;
  let hasTv = false;
  let hasBreakfast = false;
  let hasPool = false;
  let isKidFriendly = false;
  let isPetFriendly = false;
  let isSeniorFriendly = false;
  let isSyaria = false;
  let description = "";
  let address = "";
  let latitude = "";
  let longitude = "";
  let googleMapsLink = "";
  let googlePlaceId = "";
  let phoneNumber = "";
  let status = "draft";
  let keywords = "";

  // Auto-save functionality
  onMount(() => {
    // Migrate from old per-villa storage system
    migrateFromPerVillaStorage();

    // Clean up old form data on mount
    cleanupOldFormData();

    // Load saved form data
    const savedData = loadFormData("new");
    if (savedData) {
      // Restore form fields
      title = savedData.title || "";
      priceMin = savedData.priceMin || "";
      priceMax = savedData.priceMax || "";
      unitsCount = savedData.unitsCount || 1;
      bedroomMin = savedData.bedroomMin || 0;
      bedroomMax = savedData.bedroomMax || 0;
      personCapacityMin = savedData.personCapacityMin || 0;
      personCapacityMax = savedData.personCapacityMax || 0;
      hasAc = savedData.hasAc || false;
      hasBathtub = savedData.hasBathtub || false;
      hasTv = savedData.hasTv || false;
      hasBreakfast = savedData.hasBreakfast || false;
      hasPool = savedData.hasPool || false;
      description = savedData.description || "";
      address = savedData.address || "";
      latitude = savedData.latitude || "";
      longitude = savedData.longitude || "";
      googleMapsLink = savedData.googleMapsLink || "";
      googlePlaceId = savedData.googlePlaceId || "";
      phoneNumber = savedData.phoneNumber || "";
      status = savedData.status || "draft";
      provinceId = savedData.provinceId || "";
      cityId = savedData.cityId || "";
      keywords = savedData.keywords || "";

      // Restore custom amenities
      if (savedData.customAmenities) {
        customAmenities = savedData.customAmenities;
      }

      // Restore selected city
      if (savedData.selectedCity) {
        selectedCity = savedData.selectedCity;
      }

      console.log("Restored auto-saved form data");
    }
  });

  // Auto-save when form data changes
  $: if (typeof window !== "undefined") {
    const formData: VillaFormData = {
      title,
      priceMin,
      priceMax,
      unitsCount,
      bedroomMin,
      bedroomMax,
      personCapacityMin,
      personCapacityMax,
      hasAc,
      hasBathtub,
      hasTv,
      hasBreakfast,
      hasPool,
      description,
      address,
      latitude,
      longitude,
      googleMapsLink,
      googlePlaceId,
      phoneNumber,
      status,
      provinceId,
      cityId,
      selectedCity,
      customAmenities,
      keywords,
    };
    saveFormData("new", formData);
  }

  // Clear form function
  function clearForm() {
    // Confirm before clearing
    if (
      confirm("Are you sure you want to clear the form? All data will be lost.")
    ) {
      // Reset all form fields
      title = "";
      priceMin = "";
      priceMax = "";
      unitsCount = 1;
      bedroomMin = 0;
      bedroomMax = 0;
      hasAc = false;
      hasBathtub = false;
      hasTv = false;
      hasBreakfast = false;
      hasPool = false;
      description = "";
      address = "";
      latitude = "";
      longitude = "";
      googleMapsLink = "";
      googlePlaceId = "";
      phoneNumber = "";
      status = "draft";
      customAmenities = [];
      selectedCity = null;
      provinceId = "";
      cityId = "";
      keywords = "";

      // Clear localStorage
      clearFormData("new");

      console.log("Form cleared");
    }
  }

  // Watch for form errors and show modal
  $: if (form?.error) {
    console.log("Form error detected:", form.error);
    errorMessage = form.error;
    showErrorModal = true;
    showToast.error(form.error);
  }
  // Watch for form success and show toast
  $: if (form?.success && typeof window !== "undefined") {
    clearFormData("new");
    creationSuccess = true;
    nextUrl = form.nextUrl || "";
    console.log(`nextUrl set to: ${nextUrl}`);
    showToast.success(toastMessages.admin.villaCreated);
    if (window && nextUrl) {
      setTimeout(() => {
        goto(nextUrl);
      }, 1500);
    }
  }

  // Phone number validation is now imported from validation utility

  function handleCitySelect(city: CityWithProvince) {
    selectedCity = city;
    provinceId = city.province.id;
    cityId = city.id;
    console.log("City selected:", {
      cityId,
      provinceId,
      cityName: city.name,
      provinceName: city.province.name,
    });
  }

  function handleCityClear() {
    selectedCity = null;
    provinceId = "";
    cityId = "";
  }

  function handlePlaceSelect(place: TextSearchPlace) {
    googlePlaceId = place.placeId;
    showToast.success(`Selected: ${place.name}`);
  }

  function handleLocationSelect(place: TextSearchPlace) {
    googlePlaceId = place.placeId;

    if (place.latitude !== undefined && place.longitude !== undefined) {
      latitude = place.latitude.toFixed(9);
      longitude = place.longitude.toFixed(9);
      showToast.success(
        `Updated location data for: ${place.name}. Please save the form to apply changes.`,
      );
    } else {
      showToast.error(
        `Updated Place ID only for: ${place.name} (no coordinates available). Please save the form to apply changes.`,
      );
    }
  }

  function addAmenity() {
    customAmenities = [
      ...customAmenities,
      { name: "", description: "", category: "additional", score: 1 },
    ];
  }

  function removeAmenity(index: number) {
    customAmenities = customAmenities.filter((_, i) => i !== index);
  }

  function handleJSONImport() {
    showImportModal = true;
  }

  function handleImportedJSON(jsonData: any) {
    fillWithJSONData(jsonData);
  }

  async function fillWithJSONData(jsonData: any) {
    const villa = jsonData.villa;

    // Clear existing auto-save before importing
    clearFormData("new");

    // Fill form fields using reactive variables
    if (villa.title) title = villa.title;
    if (villa.priceMin) priceMin = villa.priceMin;
    if (villa.priceMax) priceMax = villa.priceMax;

    // Continue filling with reactive variables
    if (villa.unitsCount !== undefined) unitsCount = villa.unitsCount;
    if (villa.bedroomMin !== undefined) bedroomMin = villa.bedroomMin;
    if (villa.bedroomMax !== undefined) bedroomMax = villa.bedroomMax;
    if (villa.personCapacityMin !== undefined)
      personCapacityMin = villa.personCapacityMin;
    if (villa.personCapacityMax !== undefined)
      personCapacityMax = villa.personCapacityMax;
    if (villa.description) description = villa.description;
    if (villa.address) address = villa.address;
    if (villa.latitude) latitude = villa.latitude;
    if (villa.longitude) longitude = villa.longitude;
    if (villa.googleMapsLink) googleMapsLink = villa.googleMapsLink;
    if (villa.googlePlaceId) googlePlaceId = villa.googlePlaceId;
    if (villa.phoneNumber) phoneNumber = villa.phoneNumber;
    if (villa.status) status = villa.status;

    console.log("Google Maps Link imported:", googleMapsLink);

    // Set checkboxes
    if (villa.hasAc !== undefined) hasAc = villa.hasAc;
    if (villa.hasBathtub !== undefined) hasBathtub = villa.hasBathtub;
    if (villa.hasTv !== undefined) hasTv = villa.hasTv;
    if (villa.hasBreakfast !== undefined) hasBreakfast = villa.hasBreakfast;
    if (villa.hasPool !== undefined) hasPool = villa.hasPool;
    if (villa.isKidFriendly !== undefined) isKidFriendly = villa.isKidFriendly;
    if (villa.isPetFriendly !== undefined) isPetFriendly = villa.isPetFriendly;
    if (villa.isSeniorFriendly !== undefined) isSeniorFriendly = villa.isSeniorFriendly;
    if (villa.isSyaria !== undefined) isSyaria = villa.isSyaria;

    // Fill custom amenities
    if (jsonData.amenities && Array.isArray(jsonData.amenities)) {
      customAmenities = jsonData.amenities.map((amenity: any) => ({
        name: amenity.name || "",
        description: amenity.description || "",
        category: amenity.category || "additional",
        score: amenity.score || 1,
      }));
    }

    // Store images, videos, and bed sizes for display
    if (jsonData.images && Array.isArray(jsonData.images)) {
      importedImages = jsonData.images;
    }

    if (jsonData.videos && Array.isArray(jsonData.videos)) {
      importedVideos = jsonData.videos;
    }

    if (jsonData.bedSizes && Array.isArray(jsonData.bedSizes)) {
      importedBedSizes = jsonData.bedSizes;
    }

    // Handle province and city with fuzzy matching
    if (villa.province || villa.city) {
      try {
        const response = await fetch("/api/cities/fuzzy-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cityName: villa.city || "",
            provinceName: villa.province || "",
          }),
        });

        if (response.ok) {
          const matchResult = await response.json();
          if (matchResult.cityId && matchResult.provinceId) {
            // Create a mock CityWithProvince object for the autocomplete
            const matchedCity: CityWithProvince = {
              id: matchResult.cityId,
              name: matchResult.cityName,
              provinceId: matchResult.provinceId,
              createdAt: new Date(),
              province: {
                id: matchResult.provinceId,
                name: matchResult.provinceName,
                createdAt: new Date(),
              },
            };

            selectedCity = matchedCity;
            provinceId = matchResult.provinceId;
            cityId = matchResult.cityId;

            console.log("Location matched:", {
              original: { city: villa.city, province: villa.province },
              matched: {
                cityName: matchResult.cityName,
                provinceName: matchResult.provinceName,
              },
              confidence: matchResult.confidence,
              exact: matchResult.exact,
            });

            if (matchResult.confidence < 0.8) {
              console.warn("Low confidence match for location:", {
                original: { city: villa.city, province: villa.province },
                matched: {
                  cityName: matchResult.cityName,
                  provinceName: matchResult.provinceName,
                },
                confidence: matchResult.confidence,
              });
            }
          } else {
            console.warn("Could not match location from JSON:", {
              city: villa.city,
              province: villa.province,
            });
          }
        }
      } catch (error) {
        console.error("Error matching location from JSON:", error);
      }
    }
  }

  function fillWithDummyData() {
    const dummyData = generateVillaDummyData();

    // Clear existing auto-save before filling dummy data
    clearFormData("new");

    // Fill form fields using reactive variables
    title = dummyData.title;

    priceMin = dummyData.priceMin;
    priceMax = dummyData.priceMax;
    unitsCount = dummyData.unitsCount;
    bedroomMin = dummyData.bedroomMin;
    bedroomMax = dummyData.bedroomMax;
    description = dummyData.description;
    address = dummyData.address;
    latitude = dummyData.latitude;
    longitude = dummyData.longitude;
    googleMapsLink = dummyData.googleMapsLink;
    googlePlaceId = dummyData.googlePlaceId;
    phoneNumber = dummyData.phoneNumber;
    status = dummyData.status;

    // Set checkboxes
    hasAc = dummyData.hasAc;
    hasBathtub = dummyData.hasBathtub;
    hasTv = dummyData.hasTv;
    hasBreakfast = dummyData.hasBreakfast;
    hasPool = dummyData.hasPool || false;
    isKidFriendly = dummyData.isKidFriendly || false;
    isPetFriendly = dummyData.isPetFriendly || false;
    isSeniorFriendly = dummyData.isSeniorFriendly || false;
    isSyaria = dummyData.isSyaria || false;

    // Fill custom amenities if available
    if (dummyData.amenities) {
      customAmenities = dummyData.amenities;
    }

    // Handle province and city from dummy data
    if (dummyData.province || dummyData.city) {
      fillLocationFromDummyData(dummyData);
    }
  }

  async function fillLocationFromDummyData(dummyData: any) {
    try {
      const response = await fetch("/api/cities/fuzzy-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cityName: dummyData.city || "",
          provinceName: dummyData.province || "",
        }),
      });

      if (response.ok) {
        const matchResult = await response.json();
        if (matchResult.cityId && matchResult.provinceId) {
          const matchedCity: CityWithProvince = {
            id: matchResult.cityId,
            name: matchResult.cityName,
            provinceId: matchResult.provinceId,
            createdAt: new Date(),
            province: {
              id: matchResult.provinceId,
              name: matchResult.provinceName,
              createdAt: new Date(),
            },
          };

          selectedCity = matchedCity;
          provinceId = matchResult.provinceId;
          cityId = matchResult.cityId;
        }
      }
    } catch (error) {
      console.error("Error matching dummy location data:", error);
    }
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Create New Villa</h1>
        <p class="mt-2 text-sm text-gray-600">Add a new villa to the system</p>
      </div>
      <div class="flex items-center gap-3">
        {#if dev}
          <button
            type="button"
            onclick={fillWithDummyData}
            class="inline-flex items-center px-4 py-2 border border-amber-300 shadow-sm text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100"
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
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
              />
            </svg>
            Fill with Dummy Data
          </button>
        {/if}
        <button
          type="button"
          onclick={handleJSONImport}
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          Import from JSON
        </button>
        <button
          type="button"
          onclick={clearForm}
          class="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear Form
        </button>
        <a
          href="/admin/villas"
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
          Back to Villas
        </a>
      </div>
    </div>
  </div>

  <!-- Temporary debug info -->
  {#if form?.error}
    <div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
      <p class="text-sm text-red-700">Form error: {form.error}</p>
      <p class="text-sm text-gray-500">
        Modal state: showErrorModal = {showErrorModal}
      </p>
    </div>
  {/if}

  <form method="post" class="space-y-8 divide-y divide-gray-200">
    <div class="space-y-8 divide-y divide-gray-200">
      <div>
        <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label for="title" class="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              bind:value={title}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label for="status" class="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label
              for="priceMin"
              class="block text-sm font-medium text-gray-700"
            >
              Price Min ($) *
            </label>
            <input
              type="number"
              name="priceMin"
              id="priceMin"
              bind:value={priceMin}
              step="0.01"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              for="priceMax"
              class="block text-sm font-medium text-gray-700"
            >
              Price Max ($) *
            </label>
            <input
              type="number"
              name="priceMax"
              id="priceMax"
              bind:value={priceMax}
              step="0.01"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              for="unitsCount"
              class="block text-sm font-medium text-gray-700"
            >
              Number of Units
            </label>
            <input
              type="number"
              name="unitsCount"
              id="unitsCount"
              min="1"
              value="1"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              for="bedroomMin"
              class="block text-sm font-medium text-gray-700"
            >
              Min Bedrooms *
            </label>
            <input
              type="number"
              name="bedroomMin"
              id="bedroomMin"
              min="0"
              bind:value={bedroomMin}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              for="bedroomMax"
              class="block text-sm font-medium text-gray-700"
            >
              Max Bedrooms *
            </label>
            <input
              type="number"
              name="bedroomMax"
              id="bedroomMax"
              min="0"
              bind:value={bedroomMax}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              for="personCapacityMin"
              class="block text-sm font-medium text-gray-700"
            >
              Min Person Capacity
            </label>
            <input
              type="number"
              name="personCapacityMin"
              id="personCapacityMin"
              min="0"
              bind:value={personCapacityMin}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500">Minimum number of guests</p>
          </div>

          <div class="sm:col-span-2">
            <label
              for="personCapacityMax"
              class="block text-sm font-medium text-gray-700"
            >
              Max Person Capacity
            </label>
            <input
              type="number"
              name="personCapacityMax"
              id="personCapacityMax"
              min="0"
              bind:value={personCapacityMax}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500">Maximum number of guests</p>
          </div>

          <div class="sm:col-span-6">
            <fieldset class="space-y-2">
              <legend class="text-sm font-medium text-gray-700"
                >Amenities</legend
              >
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="hasAc"
                    id="hasAc"
                    bind:checked={hasAc}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="hasAc" class="ml-2 block text-sm text-gray-700">
                    Air Conditioning
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="hasBathtub"
                    id="hasBathtub"
                    bind:checked={hasBathtub}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    for="hasBathtub"
                    class="ml-2 block text-sm text-gray-700"
                  >
                    Bathtub
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="hasTv"
                    id="hasTv"
                    bind:checked={hasTv}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="hasTv" class="ml-2 block text-sm text-gray-700">
                    TV
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="hasBreakfast"
                    id="hasBreakfast"
                    bind:checked={hasBreakfast}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    for="hasBreakfast"
                    class="ml-2 block text-sm text-gray-700"
                  >
                    Breakfast
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="hasPool"
                    id="hasPool"
                    bind:checked={hasPool}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="hasPool" class="ml-2 block text-sm text-gray-700">
                    Pool
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="isKidFriendly"
                    id="isKidFriendly"
                    bind:checked={isKidFriendly}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="isKidFriendly" class="ml-2 block text-sm text-gray-700">
                    Kid Friendly
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="isPetFriendly"
                    id="isPetFriendly"
                    bind:checked={isPetFriendly}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="isPetFriendly" class="ml-2 block text-sm text-gray-700">
                    Pet Friendly
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="isSeniorFriendly"
                    id="isSeniorFriendly"
                    bind:checked={isSeniorFriendly}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="isSeniorFriendly" class="ml-2 block text-sm text-gray-700">
                    Senior Friendly
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    name="isSyaria"
                    id="isSyaria"
                    bind:checked={isSyaria}
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="isSyaria" class="ml-2 block text-sm text-gray-700">
                    Syaria
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <div class="sm:col-span-6">
            <label
              for="description"
              class="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              bind:value={description}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            ></textarea>
          </div>

          <div class="sm:col-span-6">
            <label
              for="address"
              class="block text-sm font-medium text-gray-700"
            >
              Address *
            </label>
            <input
              type="text"
              name="address"
              id="address"
              bind:value={address}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-6">
            <label class="block text-sm font-medium text-gray-700">
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
              Start typing to search for a city. This will help categorize your
              villa by location.
            </p>

            <!-- Hidden inputs for form submission -->
            <input type="hidden" name="provinceId" bind:value={provinceId} />
            <input type="hidden" name="cityId" bind:value={cityId} />
          </div>

          <div class="sm:col-span-3">
            <label
              for="latitude"
              class="block text-sm font-medium text-gray-700"
            >
              Latitude
            </label>
            <input
              type="number"
              name="latitude"
              id="latitude"
              pattern={getLatLonValidationPattern()}
              step="0.00000001"
              bind:value={latitude}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-3">
            <label
              for="longitude"
              class="block text-sm font-medium text-gray-700"
            >
              Longitude
            </label>
            <input
              type="number"
              name="longitude"
              id="longitude"
              step="0.00000001"
              bind:value={longitude}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="sm:col-span-3">
            <label
              for="googleMapsLink"
              class="block text-sm font-medium text-gray-700"
            >
              Google Maps Link
            </label>
            <input
              type="url"
              name="googleMapsLink"
              id="googleMapsLink"
              bind:value={googleMapsLink}
              placeholder="https://maps.google.com/..."
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-sm text-gray-500">
              Paste the Google Maps link for this villa location
            </p>
          </div>

          <div class="sm:col-span-3">
            <label
              for="googlePlaceId"
              class="block text-sm font-medium text-gray-700"
            >
              Google Place ID
            </label>
            <div class="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="googlePlaceId"
                id="googlePlaceId"
                bind:value={googlePlaceId}
                placeholder="eg: ChIJN1t_tDeuEmsRUsoyG83xxxxxx"
                class="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                onclick={() => (showPlaceSearchDialog = true)}
                class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <p class="mt-1 text-sm text-gray-500">
              Paste Google Place ID for better tracking, or click "Detect" to
              search for places.
            </p>
          </div>

          <div class="sm:col-span-3">
            <label
              for="phoneNumber"
              class="block text-sm font-medium text-gray-700"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              bind:value={phoneNumber}
              required
              pattern={getPhoneValidationPattern()}
              placeholder={getPhoneInputPlaceholder()}
              title={getPhoneInputTitle()}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-sm text-gray-500">
              {getPhoneInputHelperText()}
            </p>
          </div>

          <div class="sm:col-span-3">
            <label
              for="keywords"
              class="block text-sm font-medium text-gray-700"
            >
              Keywords (separated by commas):
            </label>
            <input
              type="text"
              name="keywords"
              id="keywords"
              bind:value={keywords}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-sm text-gray-500">
              Please enter keywords separated by commas. Example: jogja, family
            </p>
          </div>

          <div class="sm:col-span-6">
            <fieldset class="space-y-4">
              <div class="flex items-center justify-between">
                <legend class="text-sm font-medium text-gray-700"
                  >Custom Features & Additional Amenities</legend
                >
                <button
                  type="button"
                  onclick={addAmenity}
                  class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Amenity
                </button>
              </div>

              {#if customAmenities.length > 0}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Name</th
                        >
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Description</th
                        >
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Category</th
                        >
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Score</th
                        >
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Action</th
                        >
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each customAmenities as amenity, index}
                        <tr>
                          <td class="px-3 py-2">
                            <input
                              type="text"
                              name="amenityName"
                              bind:value={amenity.name}
                              placeholder="e.g., Private Pool"
                              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            />
                          </td>
                          <td class="px-3 py-2">
                            <textarea
                              name="amenityDescription"
                              bind:value={amenity.description}
                              placeholder="e.g., Every unit has private pool, in front of the main room"
                              rows="2"
                              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td class="px-3 py-2">
                            <select
                              name="amenityCategory"
                              bind:value={amenity.category}
                              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="additional"
                                >Additional Features</option
                              >
                              {#each Object.entries(CATEGORY_DISPLAY_NAMES) as [value, label]}
                                <option {value}>{label}</option>
                              {/each}
                            </select>
                          </td>
                          <td class="px-3 py-2">
                            <input
                              type="number"
                              name="amenityScore"
                              bind:value={amenity.score}
                              min="1"
                              max="3"
                              placeholder="1-3"
                              class="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            />
                          </td>
                          <td class="px-3 py-2">
                            <button
                              type="button"
                              onclick={() => removeAmenity(index)}
                              class="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <p class="text-sm text-gray-500">
                  No custom amenities added yet. Click "Add Amenity" to add one.
                </p>
              {/if}
            </fieldset>
          </div>

          <!-- Display imported data preview -->
          {#if importedImages.length > 0 || importedVideos.length > 0 || importedBedSizes.length > 0}
            <div class="sm:col-span-6">
              <fieldset class="space-y-4">
                <legend class="text-sm font-medium text-gray-700"
                  >Imported Data Preview</legend
                >
                <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p class="text-sm text-blue-800 mb-3">
                    The following data has been imported from the JSON file.
                    These items will be added after the villa is created.
                  </p>

                  {#if importedImages.length > 0}
                    <div class="mb-3">
                      <h4 class="text-sm font-semibold text-gray-700 mb-1">
                        Images ({importedImages.length})
                      </h4>
                      <ul class="text-sm text-gray-600 space-y-1">
                        {#each importedImages as image}
                          <li>• {image.altText || image.imageUrl}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if importedVideos.length > 0}
                    <div class="mb-3">
                      <h4 class="text-sm font-semibold text-gray-700 mb-1">
                        Videos ({importedVideos.length})
                      </h4>
                      <ul class="text-sm text-gray-600 space-y-1">
                        {#each importedVideos as video}
                          <li>• {video.altText || video.videoUrl}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if importedBedSizes.length > 0}
                    <div>
                      <h4 class="text-sm font-semibold text-gray-700 mb-1">
                        Bed Sizes
                      </h4>
                      <ul class="text-sm text-gray-600 space-y-1">
                        {#each importedBedSizes as bedSize}
                          <li>• {bedSize.quantity}x {bedSize.bedSize}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              </fieldset>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="pt-5">
      <div class="flex justify-between items-center">
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
        <div class="flex">
          <a
            href="/admin/villas"
            class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </a>
          <button
            type="submit"
            class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Villa
          </button>
        </div>
      </div>
    </div>
  </form>
</div>

<!-- Error Modal -->
<ErrorModal
  bind:isOpen={showErrorModal}
  title="Villa Creation Error"
  message={errorMessage}
/>

<!-- JSON Import Modal -->
<JSONImportModal bind:isOpen={showImportModal} onImport={handleImportedJSON} />

<!-- Place Search Dialog -->
<PlaceSearchDialog
  bind:isOpen={showPlaceSearchDialog}
  initialQuery={title}
  onPlaceSelect={handlePlaceSelect}
/>

<!-- Location Search Dialog -->
<LocationSearchDialog
  bind:isOpen={showLocationSearchDialog}
  initialQuery={title}
  onLocationSelect={handleLocationSelect}
/>
