<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { dev } from "$app/environment";
  import { generateSlug } from "$lib/utils/slug";
  import PlaceSearchDialog from "$lib/components/PlaceSearchDialog.svelte";
  import LocationSearchDialog from "$lib/components/LocationSearchDialog.svelte";
  import PlaceJSONImportModal from "$lib/components/admin/PlaceJSONImportModal.svelte";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import type { TextSearchPlace } from "$lib/utils/google-maps";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import { toast } from "svelte-5-french-toast";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Form state
  let formData = $state({
    name: "",
    slug: "",
    description: "",
    type: "",
    category: "",
    latitude: "",
    longitude: "",
    address: "",
    cityId: "",
    provinceId: "",
    googlePlaceId: "",
    mainImage: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
  });

  let isSubmitting = $state(false);
  let showSlugEdit = $state(false);
  let validationErrors = $state<string[]>([]);

  // Place search dialog state
  let showPlaceSearchDialog = $state(false);
  let showLocationSearchDialog = $state(false);

  // JSON import modal state
  let showImportModal = $state(false);

  // City selection state
  let selectedCity: CityWithProvince | null = $state(null);

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

  // Auto-generate slug from name
  $effect(() => {
    if (formData.name && !showSlugEdit) {
      formData.slug = generateSlug(formData.name);
    }
  });

  // Auto-generate meta title from name
  $effect(() => {
    if (formData.name && !formData.metaTitle) {
      formData.metaTitle = formData.name;
    }
  });

  function handleCitySelect(city: CityWithProvince) {
    selectedCity = city;
    formData.provinceId = city.province.id;
    formData.cityId = city.id;
    console.log("City selected:", {
      cityId: formData.cityId,
      provinceId: formData.provinceId,
      cityName: city.name,
      provinceName: city.province.name,
    });
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
    // Clear previous errors
    validationErrors = [];

    // Normalize coordinates before validation
    if (formData.latitude) {
      formData.latitude = normalizeCoordinate(formData.latitude.toString());
    }
    if (formData.longitude) {
      formData.longitude = normalizeCoordinate(formData.longitude.toString());
    }

    // Client-side validation
    const errors: string[] = [];

    if (!formData.name?.trim()) {
      errors.push("Name is required");
    }

    if (!formData.latitude?.toString().trim()) {
      errors.push("Latitude is required");
    } else if (isNaN(Number(formData.latitude.replace(",", ".")))) {
      errors.push("Latitude must be a valid number");
    } else {
      const lat = Number(formData.latitude.replace(",", "."));
      if (lat < -90 || lat > 90) {
        errors.push("Latitude must be between -90 and 90");
      }
    }

    if (!formData.longitude?.toString().trim()) {
      errors.push("Longitude is required");
    } else if (isNaN(Number(formData.longitude.replace(",", ".")))) {
      errors.push("Longitude must be a valid number");
    } else {
      const lng = Number(formData.longitude.replace(",", "."));
      if (lng < -180 || lng > 180) {
        errors.push("Longitude must be between -180 and 180");
      }
    }

    if (formData.name && formData.name.length > 255) {
      errors.push("Name must be 255 characters or less");
    }

    if (formData.description && formData.description.length > 2000) {
      errors.push("Description must be 2000 characters or less");
    }

    if (errors.length > 0) {
      validationErrors = errors;
      return;
    }

    isSubmitting = true;

    try {
      const payload = {
        ...formData,
        latitude: Number(formData.latitude.replace(",", ".")),
        longitude: Number(formData.longitude.replace(",", ".")),
      };

      const response = await fetch("/admin/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Place created successfully!");
        // Redirect to edit page using the place ID
        goto(`/admin/places/${result.place.id}`);
      } else {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          showErrorDialog(errorData.details.join("\n"));
        } else {
          showErrorDialog(errorData.error || "Failed to create place");
        }
      }
    } catch (error) {
      console.error("Error creating place:", error);
      showErrorDialog(
        "An error occurred while creating the place. Please try again.",
      );
    } finally {
      isSubmitting = false;
    }
  }


  function fillDummyData() {
    const dummyPlaces = [
      {
        name: "Tanah Lot Temple",
        description:
          "A stunning ancient sea temple perched on a rock formation, offering breathtaking sunset views and cultural significance. One of Bali's most iconic landmarks.",
        type: "temple",
        category: "culture",
        latitude: "-8.621212",
        longitude: "115.086807",
        address: "Beraban, Kediri, Tabanan Regency, Bali 82121",
        googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        mainImage:
          "https://images.unsplash.com/photo-1559628233-100c798642d4?w=800",
        metaDescription:
          "Visit Tanah Lot Temple, Bali's iconic sea temple with stunning sunset views and rich cultural heritage.",
      },
      {
        name: "Seminyak Beach Club",
        description:
          "Premium beachfront destination with world-class dining, refreshing cocktails, and spectacular ocean views. Perfect for sunset sessions and beach parties.",
        type: "restaurant",
        category: "culinary",
        latitude: "-8.693268",
        longitude: "115.168633",
        address: "Jl. Petitenget No.51B, Seminyak, Bali 80361",
        googlePlaceId: "ChIJv1r3BTU22y0RwVkzY5X7-Ag",
        mainImage:
          "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
        metaDescription:
          "Experience luxury dining and beach vibes at Seminyak Beach Club with ocean views and gourmet cuisine.",
      },
      {
        name: "Tegalalang Rice Terrace",
        description:
          "Spectacular tiered rice paddies showcasing traditional Balinese irrigation system with stunning valley views and photo opportunities.",
        type: "tourist_attraction",
        category: "nature",
        latitude: "-8.431402",
        longitude: "115.279406",
        address: "Tegallalang, Gianyar Regency, Bali 80561",
        googlePlaceId: "ChIJOX6hIon20i0R8BamKpJYpKE",
        mainImage:
          "https://images.unsplash.com/photo-1574755393849-623942496936?w=800",
        metaDescription:
          "Explore Tegalalang Rice Terrace, Bali's famous terraced rice fields with breathtaking valley views.",
      },
      {
        name: "Sacred Monkey Forest Sanctuary",
        description:
          "A nature reserve and Hindu temple complex home to over 700 grey long-tailed macaques in a lush jungle setting.",
        type: "park",
        category: "nature",
        latitude: "-8.518561",
        longitude: "115.258763",
        address: "Jl. Monkey Forest, Ubud, Bali 80571",
        googlePlaceId: "ChIJn8o2UZ1H0i0RkT8qBXPYOHE",
        mainImage:
          "https://images.unsplash.com/photo-1581889470536-467bdbe30cd0?w=800",
        metaDescription:
          "Visit Sacred Monkey Forest Sanctuary in Ubud, home to hundreds of playful macaques and ancient temples.",
      },
      {
        name: "Nusa Dua Beach Resort",
        description:
          "Pristine white sand beach with luxury resorts, crystal clear waters perfect for swimming and water sports activities.",
        type: "beach",
        category: "nature",
        latitude: "-8.803041",
        longitude: "115.233642",
        address: "Nusa Dua, Benoa, South Kuta, Badung Regency, Bali",
        googlePlaceId: "ChIJbedQwD1G0i0RjLW6LLaE8fQ",
        mainImage:
          "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800",
        metaDescription:
          "Relax at Nusa Dua Beach Resort with pristine beaches, luxury amenities, and crystal clear waters.",
      },
    ];

    const randomPlace =
      dummyPlaces[Math.floor(Math.random() * dummyPlaces.length)];

    // Fill form with dummy data
    formData.name = randomPlace.name + " " + Date.now();
    formData.description = randomPlace.description;
    formData.type = randomPlace.type;
    formData.category = randomPlace.category;
    formData.latitude = randomPlace.latitude;
    formData.longitude = randomPlace.longitude;
    formData.address = randomPlace.address;
    formData.googlePlaceId = randomPlace.googlePlaceId;
    formData.mainImage = randomPlace.mainImage;
    formData.metaDescription = randomPlace.metaDescription;

    // Select random province and city if available
    if (data.provinces.length > 0) {
      const randomProvince =
        data.provinces[Math.floor(Math.random() * data.provinces.length)];
      formData.provinceId = randomProvince.id;

      // After setting province, set a random city from that province
      const provinceCities = data.cities.filter(
        (city) => city.provinceId === randomProvince.id,
      );
      if (provinceCities.length > 0) {
        const randomCity =
          provinceCities[Math.floor(Math.random() * provinceCities.length)];
        formData.cityId = randomCity.id;
        selectedCity = randomCity; // Set selectedCity for the autocomplete
      }
    }

    toast.success("Form filled with dummy data!");
  }

  function handleJSONImport() {
    showImportModal = true;
  }

  function handleImportedJSON(jsonData: any) {
    fillWithJSONData(jsonData);
  }

  async function fillWithJSONData(jsonData: any) {
    // Handle the place data directly (not wrapped in 'villa' like in villa import)
    const place = jsonData;

    // Fill form fields using reactive state variables
    if (place.name) formData.name = place.name;
    if (place.title) formData.name = place.title; // Support both name and title
    if (place.description) formData.description = place.description;
    if (place.type) formData.type = place.type;
    if (place.category) formData.category = place.category;
    if (place.address) formData.address = place.address;
    if (place.googlePlaceId) formData.googlePlaceId = place.googlePlaceId;
    if (place.mainImage) formData.mainImage = place.mainImage;
    if (place.metaTitle) formData.metaTitle = place.metaTitle;
    if (place.metaDescription) formData.metaDescription = place.metaDescription;
    if (place.status) formData.status = place.status;

    // Handle coordinates - convert string to string if needed
    if (place.latitude) {
      formData.latitude = place.latitude.toString();
    }
    if (place.longitude) {
      formData.longitude = place.longitude.toString();
    }

    // Handle province and city if provided in JSON
    if (place.province || place.city || place.provinceId || place.cityId) {
      try {
        // If direct IDs are provided
        if (place.provinceId && place.cityId) {
          formData.provinceId = place.provinceId;
          formData.cityId = place.cityId;

          // Try to find the city in the data to set selectedCity
          const foundCity = data.cities.find(city => city.id === place.cityId);
          if (foundCity) {
            selectedCity = foundCity;
          }
        } else if (place.province || place.city) {
          // Try fuzzy matching for province/city names
          const response = await fetch("/api/cities/fuzzy-match", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cityName: place.city || "",
              provinceName: place.province || "",
            }),
          });

          if (response.ok) {
            const matchResult = await response.json();
            if (matchResult.cityId && matchResult.provinceId) {
              // Create a CityWithProvince object for the autocomplete
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
              formData.provinceId = matchResult.provinceId;
              formData.cityId = matchResult.cityId;

              console.log("Location matched:", {
                original: { city: place.city, province: place.province },
                matched: {
                  cityName: matchResult.cityName,
                  provinceName: matchResult.provinceName,
                },
                confidence: matchResult.confidence,
                exact: matchResult.exact,
              });

              if (matchResult.confidence < 0.8) {
                console.warn("Low confidence match for location:", {
                  original: { city: place.city, province: place.province },
                  matched: {
                    cityName: matchResult.cityName,
                    provinceName: matchResult.provinceName,
                  },
                  confidence: matchResult.confidence,
                });
              }
            } else {
              console.warn("Could not match location from JSON:", {
                city: place.city,
                province: place.province,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error matching location from JSON:", error);
      }
    }

    toast.success("Place data imported from JSON!");
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Create New Place</h1>
        <p class="mt-2 text-sm text-gray-600">Add a new place to the system</p>
      </div>
      <div class="flex items-center gap-3">
        {#if true}
          <button
            type="button"
            onclick={fillDummyData}
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Fill Dummy Data (Dev)
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

  <!-- Form -->
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
        <!-- Validation Errors -->
        {#if validationErrors.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
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
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Please correct the following errors:
                </h3>
                <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
                  {#each validationErrors as error}
                    <li>{error}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        {/if}

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
                {showSlugEdit ? "Auto-generate" : "Edit"}
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
              Start typing to search for a city. This will help categorize your
              place by location.
            </p>

            <!-- Hidden inputs for form submission -->
            <input type="hidden" bind:value={formData.provinceId} />
            <input type="hidden" bind:value={formData.cityId} />
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

            <div>
              <label
                for="mainImage"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Main Image URL
              </label>
              <input
                type="url"
                id="mainImage"
                bind:value={formData.mainImage}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com/image.jpg"
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
            {isSubmitting ? "Creating..." : "Create Place"}
          </button>
        </div>
      </div>
    </form>
  </div>
</div>

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

<!-- JSON Import Modal -->
<PlaceJSONImportModal bind:isOpen={showImportModal} onImport={handleImportedJSON} />

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
