<script lang="ts">
  import type { VillaNearbyPlace } from "$lib/server/db/schema";
  import type { PlaceWithRelations } from "$lib/types/place";
  import LazyImage from "$lib/components/LazyImage.svelte";
  import * as m from "$lib/paraglide/messages.js";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";

  interface VillaPlaceWithDetails extends PlaceWithRelations {
    distanceKm: string;
    accessType: string;
    travelTimeMinutes?: number;
    notes?: string;
    orderIndex: number;
  }

  interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    hasPrevious: boolean;
  }

  interface Props {
    // Support both old and new structure during transition
    villa?: VillaWithRelations;
    nearbyPlaces?: VillaNearbyPlace[];
    villaPlaces?: VillaPlaceWithDetails[];
    paginationInfo?: PaginationInfo | null;
    currentPath?: string; // Current villa path for pagination links
  }

  let { villa, nearbyPlaces, villaPlaces, paginationInfo, currentPath }: Props =
    $props();

  // Determine which data structure to use
  let places = $state<any[]>([]);
  let isLoading = $state(false);

  // Track the current page from URL
  let currentPageFromUrl = $derived(Number($page.url.searchParams.get('nearbyPage')) || 1);

  // Handle pagination navigation
  async function handlePagination(newPage: number) {
    if (isLoading) return; // Prevent double clicks

    isLoading = true;

    // Navigate without scrolling
    await goto(`${currentPath}?nearbyPage=${newPage}`, {
      noScroll: true,
      keepFocus: true,
      replaceState: false
    });
  }

  // Reset loading state when data changes
  let previousPlaces = places;
  $effect(() => {
    // When places data actually changes, clear loading state
    if (places !== previousPlaces && places.length > 0) {
      previousPlaces = places;
      // Small delay for smooth transition
      setTimeout(() => {
        isLoading = false;
      }, 100);
    }
  });

  // Update places whenever villaPlaces or nearbyPlaces change
  $effect(() => {
    if (villaPlaces && villaPlaces.length > 0) {
      // Use new structure
      places = villaPlaces.map((place) => ({
        id: place.id,
        name: place.name,
        description: place.description,
        distanceKm: place.distanceKm,
        accessType: place.accessType,
        placeType: place.type,
        slug: place.slug,
        isNewStructure: true,
        travelTimeMinutes: place.travelTimeMinutes,
        notes: place.notes,
        mainImage: place.mainImage,
      }));
    } else if (nearbyPlaces && nearbyPlaces.length > 0) {
      // Use old structure
      places = nearbyPlaces.map((place) => ({
        id: place.id,
        name: place.name,
        description: place.description,
        distanceKm: place.distanceKm,
        accessType: place.accessType,
        placeType: place.placeType,
        slug: null,
        isNewStructure: false,
        travelTimeMinutes: null,
        notes: null,
        mainImage: null,
      }));
    } else {
      places = [];
    }
  });

  // Access type display labels and icons
  const accessTypeConfig = {
    walking: {
      label: "Walking Distance",
      icon: "🚶",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      badgeColor: "bg-green-100 text-green-800",
    },
    walk: {
      label: "Walking Distance",
      icon: "🚶",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      badgeColor: "bg-green-100 text-green-800",
    },
    driving: {
      label: "By Car",
      icon: "🚗",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    car: {
      label: "By Car",
      icon: "🚗",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    motorcycle: {
      label: "By Motorcycle",
      icon: "🏍️",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      badgeColor: "bg-orange-100 text-orange-800",
    },
    car_motorcycle: {
      label: "Car / Motorcycle",
      icon: "🚗🏍️",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    walk_car: {
      label: "Walking / Car",
      icon: "🚶🚗",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    mixed: {
      label: "Mixed Transport",
      icon: "🚇",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-600",
      badgeColor: "bg-gray-100 text-gray-800",
    },
    all: {
      label: "All Access",
      icon: "⭐",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-600",
      badgeColor: "bg-gray-100 text-gray-800",
    },
  };

  // Place type icons and colors
  const placeTypeConfig: Record<string, { icon: string; color: string }> = {
    tourist_attraction: { icon: "🎭", color: "text-pink-600" },
    restaurant: { icon: "🍽️", color: "text-red-600" },
    beach: { icon: "🏖️", color: "text-cyan-600" },
    mountain: { icon: "⛰️", color: "text-stone-600" },
    temple: { icon: "🛕", color: "text-amber-600" },
    lake: { icon: "🏞️", color: "text-blue-600" },
    waterfall: { icon: "💧", color: "text-blue-500" },
    market: { icon: "🏪", color: "text-orange-600" },
    shopping: { icon: "🛍️", color: "text-purple-600" },
    hospital: { icon: "🏥", color: "text-red-500" },
    gas_station: { icon: "⛽", color: "text-yellow-600" },
    bank: { icon: "🏦", color: "text-green-600" },
    museum: { icon: "🏛️", color: "text-purple-600" },
    park: { icon: "🌳", color: "text-green-600" },
    airport: { icon: "✈️", color: "text-blue-600" },
    train_station: { icon: "🚂", color: "text-gray-600" },
    bus_station: { icon: "🚌", color: "text-gray-600" },
    default: { icon: "📍", color: "text-gray-600" },
  };

  function getPlaceTypeConfig(placeType?: string | null) {
    if (!placeType) return placeTypeConfig.default;
    return placeTypeConfig[placeType] || placeTypeConfig.default;
  }

  function getAccessConfig(accessType: string) {
    return (
      accessTypeConfig[accessType as keyof typeof accessTypeConfig] ||
      accessTypeConfig.mixed
    );
  }

  function formatDistance(distanceKm: string): string {
    const distance = parseFloat(distanceKm);
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  function formatPlaceType(placeType?: string | null): string {
    if (!placeType) return "";
    return placeType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatTravelTime(minutes?: number | null): string {
    if (!minutes) return "";
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
</script>

{#if places && places.length > 0}
  <div class="mb-6">
    <h3 class="mb-4 text-lg font-semibold text-gray-900">
      {m.nearby_places({ count: paginationInfo?.total || places.length })}
    </h3>

    {#if villa}
      <p class="mb-2 text-gray-500 text-sm lg:text-md">
        Berikut adalah {paginationInfo?.total || places.length} tempat / wisata terdekat dengan
        <strong>{villa.title}</strong>:
      </p>
    {/if}

    <!-- Skeleton Loader -->
    {#if isLoading}
      <div class="space-y-3 animate-pulse">
        {#each Array(Math.min(5, paginationInfo?.limit || 5)) as _}
          <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
            <div class="flex-shrink-0 w-16 h-16 bg-gray-300 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div class="flex space-x-2 mt-2">
                <div class="h-6 bg-gray-200 rounded w-20"></div>
                <div class="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div class="flex-shrink-0">
              <div class="h-4 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Actual Places List -->
    <div
      class="space-y-3 transition-opacity duration-300 {isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
      in:fade={{ duration: 300, delay: 100 }}
      out:fade={{ duration: 200 }}>
      {#each places as place}
        {@const placeConfig = getPlaceTypeConfig(place.placeType)}
        {@const accessConfig = getAccessConfig(place.accessType)}

        <!-- Render as link if it's a new structure place with slug, otherwise just a div -->
        {#if place.isNewStructure && place.slug}
          <a
            href="/place/{place.slug}"
            class="flex shadow-sm items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <!-- Thumbnail or Place Icon -->
            {#if place.mainImage}
              <div
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
              >
                <LazyImage
                  src={place.mainImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  placeholderClassName="bg-gray-200"
                />
              </div>
            {:else}
              <span class="text-xl flex-shrink-0 mt-0.5"
                >{placeConfig.icon}</span
              >
            {/if}

            <!-- Place Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{place.name}</h4>
                  {#if place.description}
                    <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                      {place.description}
                    </p>
                  {/if}

                  {#if place.notes}
                    <p class="text-xs text-blue-600 mt-1 italic">
                      {place.notes}
                    </p>
                  {/if}

                  <!-- Tags -->
                  <div class="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                    {#if place.placeType}
                      <span
                        class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {formatPlaceType(place.placeType)}
                      </span>
                    {/if}
                    {#if accessConfig}
                      <span
                        class="px-2 py-1 text-xs font-medium {accessConfig.badgeColor} rounded"
                      >
                        {accessConfig.label}
                      </span>
                    {/if}
                    {#if place.travelTimeMinutes}
                      <span
                        class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                      >
                        {formatTravelTime(place.travelTimeMinutes)}
                      </span>
                    {/if}
                  </div>
                </div>

                <!-- Distance -->
                <div class="text-right ml-3 flex-shrink-0">
                  <span class="text-sm font-semibold text-blue-600"
                    >{formatDistance(place.distanceKm)}</span
                  >
                  {#if place.isNewStructure}
                    <div class="text-xs text-green-600 mt-1">View Details</div>
                  {/if}
                </div>
              </div>
            </div>
          </a>
        {:else}
          <div
            class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
          >
            <!-- Thumbnail or Place Icon -->
            {#if place.mainImage}
              <div
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
              >
                <LazyImage
                  src={place.mainImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  placeholderClassName="bg-gray-200"
                />
              </div>
            {:else}
              <span class="text-xl flex-shrink-0 mt-0.5"
                >{placeConfig.icon}</span
              >
            {/if}

            <!-- Place Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{place.name}</h4>
                  {#if place.description}
                    <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                      {place.description}
                    </p>
                  {/if}

                  {#if place.notes}
                    <p class="text-xs text-blue-600 mt-1 italic">
                      {place.notes}
                    </p>
                  {/if}

                  <!-- Tags -->
                  <div class="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                    {#if place.placeType}
                      <span
                        class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {formatPlaceType(place.placeType)}
                      </span>
                    {/if}
                    {#if accessConfig}
                      <span
                        class="px-2 py-1 text-xs font-medium {accessConfig.badgeColor} rounded"
                      >
                        {accessConfig.label}
                      </span>
                    {/if}
                    {#if place.travelTimeMinutes}
                      <span
                        class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                      >
                        {formatTravelTime(place.travelTimeMinutes)}
                      </span>
                    {/if}
                  </div>
                </div>

                <!-- Distance -->
                <div class="text-right ml-3 flex-shrink-0">
                  <span class="text-sm font-semibold text-blue-600"
                    >{formatDistance(place.distanceKm)}</span
                  >
                  {#if place.isNewStructure}
                    <div class="text-xs text-green-600 mt-1">View Details</div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Pagination Controls -->
    {#if paginationInfo && paginationInfo.total > paginationInfo.limit}
      <div class="mt-4 pt-3">
        <!-- Mobile: Stack vertically -->
        <div class="flex flex-col space-y-3 sm:hidden">
          <!-- Page Info -->
          <div class="text-sm text-gray-600 text-center">
            Showing {(paginationInfo.page - 1) * paginationInfo.limit +
              1}-{Math.min(
              paginationInfo.page * paginationInfo.limit,
              paginationInfo.total,
            )} of {paginationInfo.total} nearby places
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-center space-x-3">
            {#if paginationInfo.hasPrevious}
              <button
                onclick={() => handlePagination(paginationInfo.page - 1)}
                disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isLoading}
                  <span class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Loading...
                  </span>
                {:else}
                  Previous
                {/if}
              </button>
            {:else}
              <span
                class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
              >
                Previous
              </span>
            {/if}

            <span class="text-sm text-gray-700 px-2">
              Page {paginationInfo.page}
            </span>

            {#if paginationInfo.hasMore}
              <button
                onclick={() => handlePagination(paginationInfo.page + 1)}
                disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isLoading}
                  <span class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Loading...
                  </span>
                {:else}
                  Next
                {/if}
              </button>
            {:else}
              <span
                class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
              >
                Next
              </span>
            {/if}
          </div>
        </div>

        <!-- Desktop: Side by side -->
        <div class="hidden sm:flex sm:items-center sm:justify-between">
          <!-- Page Info -->
          <div class="text-sm text-gray-600">
            Showing {(paginationInfo.page - 1) * paginationInfo.limit +
              1}-{Math.min(
              paginationInfo.page * paginationInfo.limit,
              paginationInfo.total,
            )} of {paginationInfo.total} nearby places
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center space-x-3">
            {#if paginationInfo.hasPrevious}
              <button
                onclick={() => handlePagination(paginationInfo.page - 1)}
                disabled={isLoading}
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {#if isLoading}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                {/if}
                Previous
              </button>
            {:else}
              <span
                class="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
              >
                Previous
              </span>
            {/if}

            <span class="text-sm text-gray-700">
              Page {paginationInfo.page}
            </span>

            {#if paginationInfo.hasMore}
              <button
                onclick={() => handlePagination(paginationInfo.page + 1)}
                disabled={isLoading}
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Next
                {#if isLoading}
                  <svg class="animate-spin ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                {/if}
              </button>
            {:else}
              <span
                class="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
              >
                Next
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
