<script lang="ts">
  import CityAutocomplete from "./CityAutocomplete.svelte";
  import PlaceAutocomplete from "./PlaceAutocomplete.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";

  interface Place {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
  }

  interface Props {
    filters?: {
      search?: string;
      priceRange?: string;
      bedroomRange?: string;
      cityId?: string;
      placeId?: string;
      nearbyRadius?: number;
      hasBathtub?: boolean;
      hasPool?: boolean;
      hasBreakfast?: boolean;
      isPetFriendly?: boolean;
      isKidFriendly?: boolean;
      isSeniorFriendly?: boolean;
      isSyaria?: boolean;
    };
    selectedCity?: CityWithProvince | null;
    onApply?: (filters: any) => void;
    onClear?: () => void;
  }

  let { filters = {}, selectedCity = null, onApply, onClear }: Props = $props();

  // Price options (values are stored in database divided by 1000)
  const minPriceOptions = [
    { value: "", label: "Any" },
    { value: 300, label: "300k" },
    { value: 500, label: "500k" },
    { value: 700, label: "700k" },
    { value: 1000, label: "1jt" },
    { value: 1200, label: "1.2jt" },
    { value: 1500, label: "1.5jt" },
    { value: 2000, label: "2jt" },
    { value: 2500, label: "2.5jt" },
    { value: 3000, label: "3jt" },
    { value: 4000, label: "4jt" },
    { value: 5000, label: "5jt" },
  ];

  const maxPriceOptions = [
    { value: "", label: "Any" },
    { value: 700, label: "700k" },
    { value: 1000, label: "1jt" },
    { value: 1200, label: "1.2jt" },
    { value: 1500, label: "1.5jt" },
    { value: 2000, label: "2jt" },
    { value: 2500, label: "2.5jt" },
    { value: 3000, label: "3jt" },
    { value: 4000, label: "4jt" },
    { value: 5000, label: "5jt" },
    { value: 7000, label: "7jt" },
    { value: 10000, label: "10jt+" },
  ];

  // Bedroom range options
  const bedroomRanges = [
    { value: "", label: "Any Bedrooms" },
    { value: "0-0", label: "Studio" },
    { value: "1-1", label: "1 Bedroom" },
    { value: "2-2", label: "2 Bedrooms" },
    { value: "3-3", label: "3 Bedrooms" },
    { value: "4+", label: "4+ Bedrooms" },
  ];

  // Radius options for nearby place search
  const radiusOptions = [
    { value: 1, label: "1 km" },
    { value: 3, label: "3 km" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
  ];

  // Convert current filters to component format
  function getCurrentBedroomRange() {
    if (!filters.bedroomMin && !filters.bedroomMax) return "";
    if (filters.bedroomMin && !filters.bedroomMax) {
      return filters.bedroomMin >= 4 ? "4+" : "";
    }
    if (filters.bedroomMin === filters.bedroomMax) {
      return `${filters.bedroomMin}-${filters.bedroomMax}`;
    }
    return "";
  }

  // State management
  let searchText = $state(filters.search || "");
  let minPrice = $state(filters.priceMin || "");
  let maxPrice = $state(filters.priceMax || "");
  let bedroomRange = $state(getCurrentBedroomRange());
  let city = $state<CityWithProvince | null>(selectedCity);
  let selectedPlace = $state<Place | null>(null);
  let nearbyRadius = $state(filters.nearbyRadius || 5);

  // Search handling
  let previousSearchText = $state(filters.search || "");
  let searchDebounceTimeout: ReturnType<typeof setTimeout> | undefined;

  // Amenity filters
  let hasBathtub = $state(filters.hasBathtub || false);
  let hasPool = $state(filters.hasPool || false);
  let hasBreakfast = $state(filters.hasBreakfast || false);
  let isPetFriendly = $state(filters.isPetFriendly || false);
  let isKidFriendly = $state(filters.isKidFriendly || false);
  let isSeniorFriendly = $state(filters.isSeniorFriendly || false);
  let isSyaria = $state(filters.isSyaria || false);

  // Validation state
  let priceError = $state("");

  // Track if component has been interacted with (to prevent auto-apply on mount)
  let hasUserInteracted = $state(false);

  // Price validation
  $effect(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    if (minPrice && maxPrice && min > max) {
      priceError = "Min price cannot be higher than max price";
    } else {
      priceError = "";
    }
  });

  // Handle search text separately (only on Enter key)
  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      hasUserInteracted = true;
      applySearchFilter();
    }
  }

  function applySearchFilter() {
    // Update the previous search text to trigger filter application
    previousSearchText = searchText;

    // Trigger the filter application
    const { bedroomMin, bedroomMax } = parseBedroomRange(bedroomRange);
    const filterData: any = {};

    // Add search text
    if (searchText && searchText.trim()) {
      filterData.search = searchText.trim();
    }

    // Add all other current filters
    if (minPrice) filterData.priceMin = Number(minPrice);
    if (maxPrice) filterData.priceMax = Number(maxPrice);
    if (bedroomMin !== undefined) filterData.bedroomMin = bedroomMin;
    if (bedroomMax !== undefined) filterData.bedroomMax = bedroomMax;
    if (city) filterData.cityId = city.id;
    if (selectedPlace) {
      filterData.placeId = selectedPlace.id;
      filterData.nearbyRadius = nearbyRadius;
    }
    if (hasBathtub) filterData.hasBathtub = true;
    if (hasPool) filterData.hasPool = true;
    if (hasBreakfast) filterData.hasBreakfast = true;
    if (isPetFriendly) filterData.isPetFriendly = true;
    if (isKidFriendly) filterData.isKidFriendly = true;
    if (isSeniorFriendly) filterData.isSeniorFriendly = true;
    if (isSyaria) filterData.isSyaria = true;

    onApply?.(filterData);
  }

  // Parse bedroom range into min/max values
  function parseBedroomRange(range: string) {
    if (!range) return { bedroomMin: undefined, bedroomMax: undefined };

    if (range.endsWith("+")) {
      const min = parseInt(range.replace("+", ""));
      return { bedroomMin: min, bedroomMax: undefined };
    }

    const [min, max] = range.split("-").map((v) => parseInt(v));
    return { bedroomMin: min, bedroomMax: max };
  }

  // Check if any filters are active
  let hasActiveFilters = $derived(
    !!(
      searchText ||
      minPrice ||
      maxPrice ||
      bedroomRange ||
      city ||
      selectedPlace ||
      hasBathtub ||
      hasPool ||
      hasBreakfast ||
      isPetFriendly ||
      isKidFriendly ||
      isSeniorFriendly ||
      isSyaria
    ),
  );

  // Check if form is valid (no validation errors)
  let isFormValid = $derived(!priceError);

  // Count active amenity filters
  let activeAmenityCount = $derived(
    [
      hasBathtub,
      hasPool,
      hasBreakfast,
      isPetFriendly,
      isKidFriendly,
      isSeniorFriendly,
      isSyaria,
    ].filter(Boolean).length,
  );

  function handleApply(event: Event) {
    event.preventDefault();
    hasUserInteracted = true;
    applySearchFilter();
  }

  function handleClear() {
    // Reset all filters
    searchText = "";
    previousSearchText = "";
    minPrice = "";
    maxPrice = "";
    bedroomRange = "";
    city = null;
    selectedPlace = null;
    nearbyRadius = 5;
    hasBathtub = false;
    hasPool = false;
    hasBreakfast = false;
    isPetFriendly = false;
    isKidFriendly = false;
    isSeniorFriendly = false;
    isSyaria = false;

    onClear?.();
  }
</script>

<div class="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
  <!-- Search Text -->
  <div>
    <label
      for="search-text"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      Search
    </label>
    <input
      id="search-text"
      type="text"
      bind:value={searchText}
      onkeydown={handleSearchKeydown}
      placeholder="Search villas by name, description, or keywords... (Press Enter to search)"
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

  <!-- Basic Filters -->
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <div>
      <label
        for="min-price"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        Min Price
      </label>
      <select
        id="min-price"
        bind:value={minPrice}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm {priceError
          ? 'border-red-300 ring-red-500 focus:border-red-500'
          : ''}"
      >
        {#each minPriceOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label
        for="max-price"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        Max Price
      </label>
      <select
        id="max-price"
        bind:value={maxPrice}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm {priceError
          ? 'border-red-300 ring-red-500 focus:border-red-500'
          : ''}"
      >
        {#each maxPriceOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label
        for="bedroom-range"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        Bedrooms
      </label>
      <select
        id="bedroom-range"
        bind:value={bedroomRange}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {#each bedroomRanges as range}
          <option value={range.value}>{range.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
        City
      </label>
      <CityAutocomplete
        placeholder="Search city..."
        bind:selectedCity={city}
        class="w-full"
      />
    </div>
  </div>

  <!-- Second row with Near Place and error message -->
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <div>
      <label
        for="nearby-place"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        Near Place
      </label>
      <PlaceAutocomplete
        placeholder="Search place..."
        bind:selectedPlace
        class="w-full"
      />
    </div>

    <!-- Price validation error -->
    {#if priceError}
      <div class="lg:col-span-3 flex items-end">
        <p class="text-sm text-red-600 pb-2">
          {priceError}
        </p>
      </div>
    {/if}
  </div>

  <!-- Radius selector (only show when place is selected) -->
  {#if selectedPlace}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div>
        <label
          for="radius"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Within Radius
        </label>
        <select
          id="radius"
          bind:value={nearbyRadius}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {#each radiusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      <div class="md:col-span-3 flex items-end">
        <p class="text-xs text-gray-500 pb-2">
          Showing villas within {nearbyRadius}km of {selectedPlace.name}
        </p>
      </div>
    </div>
  {/if}

  <!-- Amenities Section -->
  <div>
    <h3 class="text-sm font-medium text-gray-700 mb-2">
      Amenities
      {#if activeAmenityCount > 0}
        <span class="ml-1 text-xs text-indigo-600"
          >({activeAmenityCount} selected)</span
        >
      {/if}
    </h3>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={hasBathtub}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Has Bathtub</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={hasPool}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Has Pool</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={hasBreakfast}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Has Breakfast</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isPetFriendly}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Pet Friendly</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isSeniorFriendly}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Senior Friendly</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isSyaria}
          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Syaria</span>
      </label>
    </div>
  </div>

  <!-- Action Buttons -->
  <div
    class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3 pt-4 border-t"
  >
    <button
      type="button"
      onclick={(e) => handleApply(e)}
      disabled={!isFormValid}
      class="inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isFormValid
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}"
    >
      Apply Filters
    </button>

    {#if hasActiveFilters}
      <button
        type="button"
        onclick={handleClear}
        class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Clear All Filters
      </button>
    {/if}
  </div>
</div>
