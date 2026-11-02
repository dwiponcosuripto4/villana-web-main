<script lang="ts">
  import { onMount } from "svelte";
  import { formatPrice } from "$lib/utils/format";
  import { goto } from "$app/navigation";
  import {
    CATEGORY_DISPLAY_NAMES,
    getAllAmenityNamesForCategory,
    getOrderedCategoriesWithAmenities,
    formatAmenitiesForDisplay,
    areAmenitiesDifferent,
  } from "$lib/utils/amenity-categories";
  import type { AmenityCategory } from "$lib/utils/amenity-categories";
  import CategoryIconMapper from "$lib/components/CategoryIconMapper.svelte";
  import RatingView from "./RatingView.svelte";
  import StarIcon from "$lib/components/icons/StarIcon.svelte";

  export let villaId1: number;
  export let villaId2: number;
  export let onClose: () => void = () => {
    goto("/explore");
  };

  let comparisonData: any = null;
  let loading = true;
  let error = "";

  const standardAmenities = [
    { key: "hasAc", label: "Air Conditioning", different: false },
    { key: "hasBathtub", label: "Bathtub", different: false },
    { key: "hasTv", label: "TV", different: false },
    { key: "hasBreakfast", label: "Breakfast", different: false },
  ];

  onMount(async () => {
    await loadComparison();
  });

  async function loadComparison() {
    loading = true;
    error = "";

    try {
      const response = await fetch(
        `/api/villas/compare?ids=${villaId1},${villaId2}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load comparison");
      }
      comparisonData = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load comparison";
      console.error("Error loading comparison:", err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-gray-50">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-white shadow">
    <div class="mx-auto max-w-7xl px-0 py-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <h1 class="font-bold text-center text-gray-900 px-5">
          {comparisonData
            ? `${comparisonData.villa1.title} vs ${comparisonData.villa2.title}`
            : "Villa Comparison"}
        </h1>
        <button
          onclick={onClose}
          class="rounded-full p-2 hover:bg-gray-100"
          aria-label="Close comparison"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Content -->
  {#if loading}
    <div class="flex h-screen items-center justify-center">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 animate-spin text-indigo-600"
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
        <p class="mt-4 text-gray-500">Loading comparison...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex h-screen items-center justify-center">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-red-500"
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
        <p class="mt-4 text-gray-900">{error}</p>
        <button
          onclick={onClose}
          class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    </div>
  {:else if comparisonData}
    <div class="mx-auto max-w-7xl px-0 py-6 lg:px-8">
      <!-- Mobile View (2 columns with labels below values) -->
      <div class="block lg:hidden">
        <!-- Villa Headers -->
        <div class="grid grid-cols-2 relative">
          <div class="relative border-r border-gray-300">
            {#if comparisonData.villa1.images.length > 0}
              <img
                src={comparisonData.villa1.images[0].imageUrl}
                alt={comparisonData.villa1.title}
                class="h-48 w-full object-cover"
              />
            {:else}
              <div
                class="flex h-48 w-full items-center justify-center bg-gray-200"
              >
                <span class="text-gray-400">No image</span>
              </div>
            {/if}
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            >
              <h3 class="text-lg font-bold text-white">
                {comparisonData.villa1.title}
              </h3>
            </div>
          </div>
          <div class="relative">
            {#if comparisonData.villa2.images.length > 0}
              <img
                src={comparisonData.villa2.images[0].imageUrl}
                alt={comparisonData.villa2.title}
                class="h-48 w-full object-cover"
              />
            {:else}
              <div
                class="flex h-48 w-full items-center justify-center bg-gray-200"
              >
                <span class="text-gray-400">No image</span>
              </div>
            {/if}
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            >
              <h3 class="text-lg font-bold text-white">
                {comparisonData.villa2.title}
              </h3>
            </div>
          </div>
        </div>

        <!-- Comparison Content -->
        <div class="space-y-4 mt-4 border-b-1 border-b-gray-300">
          <!-- Price -->
          <div class="grid grid-cols-2 gap-2 p-2 bg-white shadow-sm">
            <div class="text-center border-r border-gray-300">
              <div class="text-lg font-semibold text-indigo-600">
                {formatPrice(comparisonData.villa1.priceMin)} - {formatPrice(
                  comparisonData.villa1.priceMax,
                )}
              </div>
              <div class="text-sm text-gray-500 mt-1">Price Range</div>
            </div>
            <div class="text-center pl-2">
              <div class="text-lg font-semibold text-indigo-600">
                {formatPrice(comparisonData.villa2.priceMin)} - {formatPrice(
                  comparisonData.villa2.priceMax,
                )}
              </div>
              <div class="text-sm text-gray-500 mt-1">Price Range</div>
            </div>
          </div>

          <!-- Rating and PV Ratio -->
          <div
            class="sticky top-16 z-20 mb-4 mt-6 w-full border-b-1 border-b-gray-300"
          >
            <div class="bg-white py-2 px-4 margin-0 w-full">
              <div class="flex items-center justify-center space-x-2">
                <h3
                  class="text-lg flex items-center gap-2 font-semibold text-gray-900"
                >
                  <StarIcon /> Ratings
                </h3>
              </div>
            </div>
          </div>
          {#if comparisonData.villa1.googleRating && comparisonData.villa2.googleRating}
            <div class="grid grid-cols-2 gap-2 p-2 mb-2 rounded-lg">
              <div
                class="text-center margin-0 justify-center border-r border-gray-300 pr-2"
              >
                <div class="text-sm text-gray-900 flex flex-col gap-3">
                  <RatingView
                    rating={comparisonData.villa1.googleRating}
                    ratingCount={comparisonData.villa1.googleRatingCount}
                    className="m-0 justify-center"
                    countBottom={true}
                  />
                  <div class="text-gray-500">Google Rating</div>
                </div>
              </div>
              <div class="text-center pl-2">
                <div class="text-sm text-gray-900 flex flex-col gap-3">
                  <RatingView
                    rating={comparisonData.villa2.googleRating}
                    ratingCount={comparisonData.villa2.googleRatingCount}
                    className="m-0 justify-center"
                    countBottom={true}
                  />
                  <div class="text-gray-500">Google Rating</div>
                </div>
              </div>
            </div>
          {/if}

          {#if comparisonData.villa1.pvr && comparisonData.villa2.pvr && comparisonData.villa1.pvr !== "" && comparisonData.villa2.pvr !== ""}
            <div
              class="grid grid-cols-2 gap-2 p-2 mb-2 border-t-1 border-gray-300"
            >
              <div
                class="text-center margin-0 justify-center border-r border-gray-300 pr-2"
              >
                <div class="text-gray-900 flex flex-col gap-3">
                  <div class="text-xl font-semibold text-green-600 pt-3">
                    {comparisonData.villa1.pvr || "-"}
                  </div>
                  <div class="text-gray-500">P/V Ratio</div>
                </div>
              </div>
              <div class="text-center pl-2">
                <div class="text-gray-900 flex flex-col gap-3">
                  <div class="text-gray-900 flex flex-col gap-3">
                    <div class="text-xl font-semibold text-green-600 pt-3">
                      {comparisonData.villa2.pvr || "-"}
                    </div>
                    <div class="text-gray-500">P/V Ratio</div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Bedrooms -->
        <div class="grid grid-cols-2 gap-2 p-2 rounded-lg">
          <div class="text-center border-r border-gray-300 pr-2">
            <div class="text-lg font-semibold text-gray-900">
              {comparisonData.villa1.bedroomMin ===
              comparisonData.villa1.bedroomMax
                ? comparisonData.villa1.bedroomMin
                : `${comparisonData.villa1.bedroomMin}-${comparisonData.villa1.bedroomMax}`}
            </div>
            <div class="text-sm text-gray-500 mt-1">Bedrooms</div>
          </div>
          <div class="text-center pl-2">
            <div class="text-lg font-semibold text-gray-900">
              {comparisonData.villa2.bedroomMin ===
              comparisonData.villa2.bedroomMax
                ? comparisonData.villa2.bedroomMin
                : `${comparisonData.villa2.bedroomMin}-${comparisonData.villa2.bedroomMax}`}
            </div>
            <div class="text-sm text-gray-500 mt-1">Bedrooms</div>
          </div>
        </div>

        <!-- Units Available -->
        <div class="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg">
          <div class="text-center border-r border-gray-300 pr-2">
            <div class="text-lg font-semibold text-gray-900">
              {comparisonData.villa1.unitsCount}
            </div>
            <div class="text-sm text-gray-500 mt-1">Units Available</div>
          </div>
          <div class="text-center pl-2">
            <div class="text-lg font-semibold text-gray-900">
              {comparisonData.villa2.unitsCount}
            </div>
            <div class="text-sm text-gray-500 mt-1">Units Available</div>
          </div>
        </div>

        <!-- Standard Amenities Header -->
        <div class="sticky top-16 z-20 mb-4 mt-6 border-b-1 border-b-gray-300">
          <div class="bg-white py-2 px-4">
            <h3 class="text-lg font-semibold text-gray-900 text-center">
              Standard Amenities
            </h3>
          </div>
        </div>

        <!-- Standard Amenities -->
        {#each standardAmenities as amenity}
          {@const amenityWithDifference = {
            ...amenity,
            different:
              comparisonData.differences.standardAmenities[amenity.key],
          }}
          <div class="grid grid-cols-2 gap-2 p-2 bg-white shadow-sm">
            <div class="text-center border-r border-gray-300 pr-2">
              {#if comparisonData.villa1.standardAmenities[amenity.key]}
                <div class="text-3xl">✅</div>
                <div class="text-sm font-medium text-green-600 mt-1">
                  Available
                </div>
              {:else}
                <div class="text-3xl">❌</div>
                <div class="text-sm font-medium text-gray-400 mt-1">
                  Not Available
                </div>
              {/if}
              <div class="text-sm text-gray-500 mt-1">{amenity.label}</div>
            </div>
            <div class="text-center pl-2">
              {#if comparisonData.villa2.standardAmenities[amenity.key]}
                <div class="text-3xl">✅</div>
                <div class="text-sm font-medium text-green-600 mt-1">
                  Available
                </div>
              {:else}
                <div class="text-3xl">❌</div>
                <div class="text-sm font-medium text-gray-400 mt-1">
                  Not Available
                </div>
              {/if}
              <div class="text-sm text-gray-500 mt-1">{amenity.label}</div>
            </div>
          </div>
        {/each}

        <!-- Additional Amenities by Category -->
        {#each getOrderedCategoriesWithAmenities(comparisonData.villa1.amenities, comparisonData.villa2.amenities) as category}
          {@const amenities1 = comparisonData.villa1.amenities[category] || []}
          {@const amenities2 = comparisonData.villa2.amenities[category] || []}
          {@const areDifferent = areAmenitiesDifferent(amenities1, amenities2)}
          <div
            class="sticky top-16 z-20 mb-4 mt-6 w-full border-b-1 border-b-gray-300"
          >
            <div class="bg-white py-2 px-4 margin-0 w-full">
              <div class="flex items-center justify-center space-x-2">
                <CategoryIconMapper {category} size={24} className="h-5 w-6" />
                <h3 class="text-lg font-semibold text-gray-900">
                  {CATEGORY_DISPLAY_NAMES[category] || category}
                </h3>
              </div>
            </div>
          </div>
          <div
            class="grid grid-cols-2 gap-2 p-2 mb-2 rounded-lg"
            data-category={category}
          >
            <div class="text-center border-r border-gray-300 pr-2">
              <div class="text-sm text-gray-900 flex flex-col gap-3">
                {@html formatAmenitiesForDisplay(amenities1)}
              </div>
            </div>
            <div class="text-center pl-2">
              <div class="text-sm text-gray-900 flex flex-col gap-3">
                {@html formatAmenitiesForDisplay(amenities2)}
              </div>
            </div>
          </div>
        {/each}

        <!-- Final Divider -->
        <div class="my-8 border-t border-gray-300"></div>
      </div>

      <!-- Desktop View (3 columns table) -->
      <div class="hidden lg:block">
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <table class="min-w-full divide-y divide-gray-200">
            <!-- Villa Headers with Images -->
            <thead>
              <tr>
                <th class="w-1/3 bg-gray-50"></th>
                <th class="w-1/3 p-0 border-r border-gray-300">
                  <div class="relative">
                    {#if comparisonData.villa1.images.length > 0}
                      <img
                        src={comparisonData.villa1.images[0].imageUrl}
                        alt={comparisonData.villa1.title}
                        class="h-48 w-full object-cover"
                      />
                    {:else}
                      <div
                        class="flex h-48 w-full items-center justify-center bg-gray-200"
                      >
                        <span class="text-gray-400">No image</span>
                      </div>
                    {/if}
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4"
                    >
                      <h3 class="text-lg font-bold text-white">
                        {comparisonData.villa1.title}
                      </h3>
                    </div>
                  </div>
                </th>
                <th class="w-1/3 p-0">
                  <div class="relative">
                    {#if comparisonData.villa2.images.length > 0}
                      <img
                        src={comparisonData.villa2.images[0].imageUrl}
                        alt={comparisonData.villa2.title}
                        class="h-48 w-full object-cover"
                      />
                    {:else}
                      <div
                        class="flex h-48 w-full items-center justify-center bg-gray-200"
                      >
                        <span class="text-gray-400">No image</span>
                      </div>
                    {/if}
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4"
                    >
                      <h3 class="text-lg font-bold text-white">
                        {comparisonData.villa2.title}
                      </h3>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-200 bg-white">
              <!-- Price -->
              <tr>
                <td class="px-6 py-4 text-sm font-medium text-gray-900"
                  >Price Range</td
                >
                <td class="px-6 py-4 text-center border-r border-gray-300">
                  <span class="text-lg font-semibold text-indigo-600">
                    {formatPrice(comparisonData.villa1.priceMin)} - {formatPrice(
                      comparisonData.villa1.priceMax,
                    )}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-lg font-semibold text-indigo-600">
                    {formatPrice(comparisonData.villa2.priceMin)} - {formatPrice(
                      comparisonData.villa2.priceMax,
                    )}
                  </span>
                </td>
              </tr>

              {#if comparisonData.villa1.googleRating && comparisonData.villa2.googleRating}
                <tr class="bg-white sticky top-0 z-20 shadow-sm">
                  <td
                    colspan="3"
                    class="px-6 py-3 text-sm font-semibold text-gray-900 border-0 flex gap-2"
                  >
                    <StarIcon />
                    Ratings
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    <div class="flex items-center space-x-2">
                      <span>Google Rating</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center border-r border-gray-300">
                    <div class="text-gray-700 flex flex-col gap-3">
                      <RatingView
                        rating={comparisonData.villa1.googleRating}
                        ratingCount={comparisonData.villa1.googleRatingCount}
                        className="m-0 justify-center"
                        countBottom={true}
                      />
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="text-gray-700 flex flex-col gap-3">
                      <RatingView
                        rating={comparisonData.villa2.googleRating}
                        ratingCount={comparisonData.villa2.googleRatingCount}
                        className="m-0 justify-center"
                        countBottom={true}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    <div class="flex items-center space-x-2">
                      <span>P/V Ratio</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center border-r border-gray-300">
                    <div class="text-xl font-semibold text-green-600 py-3">
                      {comparisonData.villa1.pvr || "-"}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="text-xl font-semibold text-green-600 py-3">
                      {comparisonData.villa2.pvr || "-"}
                    </div>
                  </td>
                </tr>
              {/if}

              <!-- Bedrooms -->
              <tr>
                <td class="px-6 py-4 text-sm font-medium text-gray-900"
                  >Bedrooms</td
                >
                <td
                  class="px-6 py-4 text-center text-gray-700 border-r border-gray-300"
                  >{comparisonData.villa1.bedroomMin ===
                  comparisonData.villa1.bedroomMax
                    ? comparisonData.villa1.bedroomMin
                    : `${comparisonData.villa1.bedroomMin}-${comparisonData.villa1.bedroomMax}`}</td
                >
                <td class="px-6 py-4 text-center text-gray-700"
                  >{comparisonData.villa2.bedroomMin ===
                  comparisonData.villa2.bedroomMax
                    ? comparisonData.villa2.bedroomMin
                    : `${comparisonData.villa2.bedroomMin}-${comparisonData.villa2.bedroomMax}`}</td
                >
              </tr>

              <!-- Bed Sizes -->
              {#if comparisonData.villa1.bedSizes?.length > 0 || comparisonData.villa2.bedSizes?.length > 0}
                <tr>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900"
                    >Bed Sizes</td
                  >
                  <td
                    class="px-6 py-4 text-center text-gray-700 border-r border-gray-300"
                  >
                    {#if comparisonData.villa1.bedSizes?.length > 0}
                      {#each comparisonData.villa1.bedSizes as bedSize, i}
                        {bedSize.quantity > 1
                          ? `${bedSize.quantity}x `
                          : ""}{bedSize.bedSize}{i <
                        comparisonData.villa1.bedSizes.length - 1
                          ? ", "
                          : ""}
                      {/each}
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center text-gray-700">
                    {#if comparisonData.villa2.bedSizes?.length > 0}
                      {#each comparisonData.villa2.bedSizes as bedSize, i}
                        {bedSize.quantity > 1
                          ? `${bedSize.quantity}x `
                          : ""}{bedSize.bedSize}{i <
                        comparisonData.villa2.bedSizes.length - 1
                          ? ", "
                          : ""}
                      {/each}
                    {:else}
                      -
                    {/if}
                  </td>
                </tr>
              {/if}

              <!-- Units Available -->
              <tr>
                <td class="px-6 py-4 text-sm font-medium text-gray-900"
                  >Units Available</td
                >
                <td
                  class="px-6 py-4 text-center text-gray-700 border-r border-gray-300"
                  >{comparisonData.villa1.unitsCount}</td
                >
                <td class="px-6 py-4 text-center text-gray-700"
                  >{comparisonData.villa2.unitsCount}</td
                >
              </tr>

              <!-- Location -->
              <tr>
                <td class="px-6 py-4 text-sm font-medium text-gray-900"
                  >Alamat</td
                >
                <td
                  class="px-6 py-4 text-center text-gray-700 border-r border-gray-300"
                  >{comparisonData.villa1.address}</td
                >
                <td class="px-6 py-4 text-center text-gray-700"
                  >{comparisonData.villa2.address}</td
                >
              </tr>

              <!-- Standard Amenities Header -->
              <tr class="bg-white sticky top-0 z-20 shadow-sm">
                <td
                  colspan="3"
                  class="px-6 py-3 text-sm font-semibold text-gray-900 border-0"
                >
                  Standard Amenities
                </td>
              </tr>

              <!-- Standard Amenities -->
              {#each standardAmenities as amenity}
                {@const amenityWithDifference = {
                  ...amenity,
                  different:
                    comparisonData.differences.standardAmenities[amenity.key],
                }}
                <tr>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900"
                    >{amenity.label}</td
                  >
                  <td class="px-6 py-4 text-center border-r border-gray-300">
                    {#if comparisonData.villa1.standardAmenities[amenity.key]}
                      <div class="text-2xl">✅</div>
                    {:else}
                      <div class="text-2xl">❌</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if comparisonData.villa2.standardAmenities[amenity.key]}
                      <div class="text-2xl">✅</div>
                    {:else}
                      <div class="text-2xl">❌</div>
                    {/if}
                  </td>
                </tr>
              {/each}

              <tr class="bg-white sticky top-0 z-20 shadow-sm">
                <td
                  colspan="3"
                  class="px-6 py-3 text-sm font-semibold text-gray-900 border-0"
                >
                  Additional Features and Amenities
                </td>
              </tr>
              <!-- Additional Amenities by Category -->
              {#each getOrderedCategoriesWithAmenities(comparisonData.villa1.amenities, comparisonData.villa2.amenities) as category}
                {@const amenities1 =
                  comparisonData.villa1.amenities[category] || []}
                {@const amenities2 =
                  comparisonData.villa2.amenities[category] || []}
                {@const areDifferent = areAmenitiesDifferent(
                  amenities1,
                  amenities2,
                )}
                <!-- <tr class="bg-white sticky top-0 z-20 shadow-sm"> -->
                <!--   <td -->
                <!--     colspan="3" -->
                <!--     class="px-6 py-3 text-sm font-semibold text-gray-900 border-0" -->
                <!--   > -->
                <!--     {CATEGORY_DISPLAY_NAMES[category] || category} -->
                <!--   </td> -->
                <!-- </tr> -->
                <tr>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    <div class="flex items-center space-x-2">
                      <CategoryIconMapper {category} className="h-5 w-5" />
                      <span>{CATEGORY_DISPLAY_NAMES[category] || category}</span
                      >
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center border-r border-gray-300">
                    <div class="text-gray-700 flex flex-col gap-3">
                      {@html formatAmenitiesForDisplay(amenities1)}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="text-gray-700 flex flex-col gap-3">
                      {@html formatAmenitiesForDisplay(amenities2)}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="mt-6 flex flex-col lg:flex-row justify-center space-y-4 lg:space-y-0 lg:space-x-4 px-4"
      >
        <!-- Villa Buttons Row -->
        <div class="flex justify-center space-x-4">
          <a
            href="/villa/{comparisonData.villa1.slug}"
            class="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            View {comparisonData.villa1.title}
          </a>
          <a
            href="/villa/{comparisonData.villa2.slug}"
            class="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            View {comparisonData.villa2.title}
          </a>
        </div>
        <!-- Close Button Row -->
        <button
          onclick={onClose}
          class="w-full lg:w-auto rounded-lg border bg-red-700 border-gray-300 px-6 py-2 text-white hover:bg-red-800 cursor-pointer"
        >
          Close Comparison
        </button>
      </div>
    </div>
  {/if}
</div>
