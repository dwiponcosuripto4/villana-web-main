<script lang="ts">
  import type { VillaNearbyPlace } from "$lib/server/db/schema";

  interface Props {
    nearbyPlaces: VillaNearbyPlace[];
  }

  let { nearbyPlaces }: Props = $props();

  // Group nearby places by access type for better organization
  let groupedPlaces = $derived.by(() => {
    if (!nearbyPlaces || !Array.isArray(nearbyPlaces)) {
      return {};
    }

    const groups: Record<string, VillaNearbyPlace[]> = {};

    nearbyPlaces.forEach(place => {
      if (!groups[place.accessType]) {
        groups[place.accessType] = [];
      }
      groups[place.accessType].push(place);
    });

    return groups;
  });

  // Access type display labels and icons
  const accessTypeConfig = {
    walk: {
      label: "Walking Distance",
      icon: "M13 1L13 7L15 9L13 13L15 15L13 19L11 19L11 15L9 13L11 9L9 7L11 1Z",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      badgeColor: "bg-green-100 text-green-800"
    },
    car: {
      label: "By Car",
      icon: "M5 11L6.5 6.5H17.5L19 11M12 17.5A1.5 1.5 0 1 0 12 14.5A1.5 1.5 0 0 0 12 17.5ZM18.5 17.5A1.5 1.5 0 1 0 18.5 14.5A1.5 1.5 0 0 0 18.5 17.5Z",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    motorcycle: {
      label: "By Motorcycle",
      icon: "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5Z",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      badgeColor: "bg-orange-100 text-orange-800"
    },
    car_motorcycle: {
      label: "Car / Motorcycle",
      icon: "M19 7H18.18L16.43 2.55C16.16 1.96 15.54 1.5 14.83 1.5H9.17C8.46 1.5 7.84 1.96 7.57 2.55L5.82 7H5C3.34 7 2 8.34 2 10V15H4C4 16.66 5.34 18 7 18S10 16.66 10 15H14C14 16.66 15.34 18 17 18S20 16.66 20 15H22V10C22 8.34 20.66 7 19 7Z",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      badgeColor: "bg-purple-100 text-purple-800"
    },
    walk_car: {
      label: "Walking / Car",
      icon: "M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M10.5 7H13.5C14.3 7 15 7.7 15 8.5V10.5L17 12.5V23H15V14L13.5 12.5V23H10.5V10.5C10.5 9.7 11.2 9 12 9S13.5 9.7 13.5 10.5",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600",
      badgeColor: "bg-indigo-100 text-indigo-800"
    },
    all: {
      label: "All Access",
      icon: "M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-600",
      badgeColor: "bg-gray-100 text-gray-800"
    }
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
    default: { icon: "📍", color: "text-gray-600" }
  };

  function getPlaceTypeConfig(placeType?: string | null) {
    if (!placeType) return placeTypeConfig.default;
    return placeTypeConfig[placeType] || placeTypeConfig.default;
  }

  function formatDistance(distanceKm: string): string {
    const distance = parseFloat(distanceKm);
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  function formatPlaceType(placeType?: string | null): string {
    if (!placeType) return '';
    return placeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

{#if nearbyPlaces && nearbyPlaces.length > 0}
  <div class="mb-6">
    <h3 class="mb-4 text-lg font-semibold text-gray-900">
      Nearby Places
    </h3>

    <div class="space-y-3">
      {#each nearbyPlaces as place}
        {@const placeConfig = getPlaceTypeConfig(place.placeType)}
        {@const accessConfig = accessTypeConfig[place.accessType as keyof typeof accessTypeConfig]}

        <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <!-- Place Icon -->
          <span class="text-xl flex-shrink-0 mt-0.5">{placeConfig.icon}</span>

          <!-- Place Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{place.name}</h4>
                {#if place.description}
                  <p class="text-sm text-gray-600 mt-1">{place.description}</p>
                {/if}

                <!-- Tags -->
                <div class="flex items-center space-x-2 mt-2">
                  {#if place.placeType}
                    <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {formatPlaceType(place.placeType)}
                    </span>
                  {/if}
                  {#if accessConfig}
                    <span class="px-2 py-1 text-xs font-medium {accessConfig.badgeColor} rounded">
                      {accessConfig.label}
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Distance -->
              <div class="text-right ml-3 flex-shrink-0">
                <span class="text-sm font-semibold text-blue-600">{formatDistance(place.distanceKm)}</span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}