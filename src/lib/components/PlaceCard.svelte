<script lang="ts">
  import type { PlaceWithRelations } from "$lib/types/place";
  import LazyImage from "$lib/components/LazyImage.svelte";
  import { formatPlaceType, formatCityName } from "$lib/utils/format";

  interface Props {
    place: PlaceWithRelations & {
      nearbyVillasCount?: number;
      mainImage?: string;
      distanceKm?: number;
    };
    variant?: "default" | "compact";
  }

  let { place, variant = "default" }: Props = $props();

  // Place type icons
  const placeTypeIcons: Record<string, string> = {
    tourist_attraction: "🎭",
    restaurant: "🍽️",
    beach: "🏖️",
    mountain: "⛰️",
    temple: "🛕",
    lake: "🏞️",
    waterfall: "💧",
    market: "🏪",
    shopping: "🛍️",
    hospital: "🏥",
    gas_station: "⛽",
    bank: "🏦",
    museum: "🏛️",
    park: "🌳",
    airport: "✈️",
    train_station: "🚂",
    bus_station: "🚌",
    default: "📍",
  };

  const getPlaceIcon = (type?: string | null) => {
    if (!type) return placeTypeIcons.default;
    return placeTypeIcons[type] || placeTypeIcons.default;
  };

  const formatPlaceCategory = (category?: string | null): string => {
    if (!category) return '';
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
</script>

<a
  href="/place/{place.slug}"
  class="group block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
>
  <!-- Image -->
  <div class="aspect-video w-full bg-gray-100 relative overflow-hidden">
    {#if place.mainImage}
      <LazyImage
        src={place.mainImage}
        alt={place.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        placeholderClassName="bg-gray-200"
      />
    {:else}
      <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span class="text-4xl opacity-60">{getPlaceIcon(place.type)}</span>
      </div>
    {/if}

    <!-- Type badge -->
    {#if place.type}
      <div class="absolute top-3 left-3">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 backdrop-blur-sm">
          <span class="mr-1">{getPlaceIcon(place.type)}</span>
          {formatPlaceType(place.type)}
        </span>
      </div>
    {/if}

    <!-- Villa count badge -->
    {#if place.nearbyVillasCount && place.nearbyVillasCount > 0}
      <div class="absolute top-3 right-3">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {place.nearbyVillasCount} villa{place.nearbyVillasCount > 1 ? 's' : ''} nearby
        </span>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="p-4">
    <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
      {place.name}
    </h3>

    {#if place.description}
      <p class="text-sm text-gray-600 mt-1 line-clamp-2">
        {place.description}
      </p>
    {/if}

    <!-- Location -->
    {#if place.address || place.city?.name}
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center text-sm text-gray-500 flex-1">
          <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="line-clamp-1">
            {place.city?.name ? formatCityName(place.city.name) : place.address || 'Location not specified'}
          </span>
        </div>

        {#if place.distanceKm !== undefined}
          <div class="flex items-center ml-2 text-xs text-blue-600 font-medium">
            <span>{place.distanceKm} km away</span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Category and Rating -->
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center space-x-2">
        {#if place.category}
          <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {formatPlaceCategory(place.category)}
          </span>
        {/if}
      </div>

      {#if place.googleRating}
        <div class="flex items-center text-sm text-gray-600">
          <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="font-medium">{place.googleRating}</span>
          {#if place.googleRatingCount}
            <span class="text-gray-400 ml-1">({place.googleRatingCount})</span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</a>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>