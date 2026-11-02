<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import PlaceCard from "$lib/components/PlaceCard.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import MobileSidebar from "$lib/components/MobileSidebar.svelte";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import { siteConfig } from "$lib/config/site";
  import type { SearchResult } from "$lib/server/services/search.service";
  import { formatPlaceType } from "$lib/utils/format";
  import * as m from "$lib/paraglide/messages.js";
  import Footer from "$lib/components/Footer.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const user = $derived($page.data.user);

  // Filter states
  let selectedCity = $state(null);
  let selectedType = $state(data.filters.type || "");
  let selectedCategory = $state(data.filters.category || "");
  let searchQuery = $state(data.filters.search || "");
  let sortBy = $state(data.filters.sortBy || "popular");

  // Location search states
  const isLocationSearch = $derived(data.filters?.isLocationSearch === true);
  let locationError = $state("");
  let isGettingLocation = $state(false);

  // Initialize selected city from data if available
  $effect(() => {
    if (data.selectedCity) {
      selectedCity = data.selectedCity;
    }
  });

  // UI states
  let showFilters = $state(false);
  let mobileMenuOpen = $state(false);
  let navbarSearchFocused = $state(false);
  let fullScreenSearchElement: HTMLElement;

  // Handle search
  function handleSearchSelect(result: SearchResult) {
    if (result.type === "place") {
      goto(`/place/${result.data.place?.slug}`);
    }
  }

  function handleSearchSubmit(result: SearchResult) {
    handleSearchSelect(result);
  }

  function handleFreeTextSearch(query: string) {
    searchQuery = query;
    applyFilters();
  }

  // Apply filters
  function applyFilters() {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (selectedCity) params.set("city", selectedCity.id);
    if (selectedType) params.set("type", selectedType);
    if (selectedCategory) params.set("category", selectedCategory);
    if (sortBy !== "popular") params.set("sortBy", sortBy);

    goto(`/places?${params.toString()}`);
  }

  function clearFilters() {
    selectedCity = null;
    selectedType = "";
    selectedCategory = "";
    searchQuery = "";
    sortBy = "popular";
    goto("/places");
  }

  // Handle location search
  async function searchNearby() {
    isGettingLocation = true;
    locationError = "";

    if (!navigator.geolocation) {
      locationError = "Geolocation is not supported by your browser";
      isGettingLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        goto(`/places?lat=${latitude}&lng=${longitude}&radius=5`);
        isGettingLocation = false;
      },
      (error) => {
        isGettingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            locationError =
              "Location access was denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            locationError = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            locationError = "Location request timed out.";
            break;
          default:
            locationError = "An unknown error occurred getting your location.";
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function handleNavbarSearchFocus() {
    navbarSearchFocused = true;
    setTimeout(() => {
      if (fullScreenSearchElement) {
        const input = fullScreenSearchElement.querySelector("input");
        if (input) input.focus();
      }
    }, 100);
  }
  //
  // function handleNavbarSearchBlur(event?: Event) {
  //   const target = event?.relatedTarget as HTMLElement;
  //   if (target && fullScreenSearchElement?.contains(target)) {
  //     return;
  //   }
  //   setTimeout(() => {
  //     navbarSearchFocused = false;
  //   }, 150);
  // }

  function handleFullScreenSearchBlur() {
    navbarSearchFocused = false;
  }

  // Check if any filters are active
  const hasActiveFilters = $derived(
    !!(
      searchQuery ||
      selectedCity ||
      selectedType ||
      selectedCategory ||
      sortBy !== "popular" ||
      isLocationSearch
    ),
  );

  function handleCitySelect(city: any) {
    selectedCity = city;
    applyFilters();
  }

  function handleCityClear() {
    selectedCity = null;
    applyFilters();
  }

  // SEO data
  let seoTitle = $derived(
    data.selectedCity
      ? `Places in ${data.selectedCity.name} - Tourist Attractions & Points of Interest`
      : "Popular Places - Tourist Attractions & Points of Interest in Indonesia",
  );

  let seoDescription = $derived(
    data.selectedCity
      ? `Discover ${data.places.length}+ popular places and tourist attractions in ${data.selectedCity.name}. Find restaurants, beaches, temples, museums, and more points of interest.`
      : `Explore ${data.places.length}+ popular places and tourist attractions across Indonesia. Discover restaurants, beaches, temples, museums, and other points of interest.`,
  );

  let keywords = $derived(
    [
      "places Indonesia",
      "tourist attractions",
      "points of interest",
      "restaurants",
      "beaches",
      "temples",
      "museums",
      data.selectedCity?.name,
      "travel guide",
      "things to do",
    ]
      .filter(Boolean)
      .join(", "),
  );

  // Breadcrumbs
  let breadcrumbs = $derived([
    { name: "Home", url: "/" },
    { name: "Places", url: "/places", current: !data.selectedCity },
    ...(data.selectedCity
      ? [
          {
            name: data.selectedCity.name,
            url: `/places?city=${data.selectedCity.id}`,
            current: true,
          },
        ]
      : []),
  ]);

  // Format place type for display
  const formatTypeForDisplay = (type: string): string => {
    return formatPlaceType(type);
  };

  const formatCategoryForDisplay = (category: string): string => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };
</script>

<!-- SEO Head -->
<SEOHead
  title={seoTitle}
  description={seoDescription}
  {keywords}
  image={siteConfig.openGraph.defaultImage}
  imageAlt="Popular places and attractions"
  type="website"
/>

<svelte:head>
  <GoogleAnalytics />
  <ClarityCode />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header
    class="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex gap-4 h-16 items-center justify-between">
        <!-- Brand -->
        <div class="flex items-center space-x-4 relative">
          <a href="/" class="flex items-center hover:opacity-90">
            <img
              src="/images/logo-villana-with-name-beta.svg"
              alt="Villana Logo"
              class="w-[64px] md:w-[96px] md:max-w-[128px]"
            />
          </a>
        </div>

        <!-- Search Bar -->
        {#if !navbarSearchFocused}
          <SearchBar
            onselect={handleSearchSelect}
            onsubmit={handleSearchSubmit}
            onfreetext={handleFreeTextSearch}
            placeholder="Search places..."
            class="w-64 lg:w-96"
            onfocus={handleNavbarSearchFocus}
          />
        {/if}

        <!-- Menu -->
        <div class="flex items-center space-x-3">
          <button
            onclick={toggleMobileMenu}
            class="lg:hidden text-white/80 hover:text-white cursor-pointer"
            aria-label="Open menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div class="hidden lg:flex lg:items-center lg:space-x-3">
            <a href="/explore" class="text-sm text-white/80 hover:text-white"
              >Explore Villas</a
            >
            {#if data.user}
              {#if data.user.role === "admin"}
                <a href="/admin" class="text-sm text-white/80 hover:text-white"
                  >Admin</a
                >
              {/if}
              <a
                href="/dashboard"
                class="text-sm text-white/80 hover:text-white">Dashboard</a
              >
              <a
                href="/auth/logout"
                class="text-sm text-white/80 hover:text-white">Logout</a
              >
            {:else}
              <a
                href="/admin/login"
                class="text-sm text-white/80 hover:text-white">Login</a
              >
              <a
                href="/register"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
              >
                Register
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Full-screen search overlay -->
  {#if navbarSearchFocused}
    <div
      class="fixed inset-0 bg-black/20 z-40"
      onclick={handleFullScreenSearchBlur}
    ></div>
    <div
      class="fixed left-0 right-0 z-50 px-4 flex items-center"
      style="top: 0; height: 4rem;"
      bind:this={fullScreenSearchElement}
    >
      <SearchBar
        placeholder="Search places..."
        onselect={handleSearchSelect}
        onsubmit={handleSearchSubmit}
        onfreetext={handleFreeTextSearch}
        class="w-full shadow-xl"
        onblur={handleFullScreenSearchBlur}
        autoFocus={true}
      />
    </div>
  {/if}

  <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <!-- Breadcrumbs -->
    <Breadcrumbs items={breadcrumbs} className="mb-6" />

    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        {#if isLocationSearch}
          Tempat-tempat di sekitar Anda
        {:else if data.selectedCity}
          Tempat-tempat populer di {data.selectedCity.name}
        {:else}
          Tempat-tempat populer
        {/if}
      </h1>
      <p class="text-gray-600">
        {#if isLocationSearch}
          Menampilkan tempat-tempat dalam radius {data.searchRadius || 5}km dari
          lokasi Anda
        {:else if data.selectedCity}
          Jelajahi destinasi wisata, kuliner, dan tempat-tempat menarik di {data
            .selectedCity.name}
        {:else}
          Jelajahi destinasi wisata, kuliner, dan tempat-tempat menarik di
          Indonesia
        {/if}
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <!-- Mobile: Stack vertically, Desktop: Side by side -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
      >
        <h2 class="text-lg font-semibold text-gray-900">Filters</h2>

        <!-- Button group -->
        <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
          <!-- Search Nearby Button -->
          {#if !isLocationSearch}
            <button
              onclick={searchNearby}
              disabled={isGettingLocation}
              class="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {#if isGettingLocation}
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Getting location...
              {:else}
                <svg
                  class="mr-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Search Nearby
              {/if}
            </button>
          {/if}

          <!-- Show/Hide Filters button (mobile only) -->
          <button
            onclick={() => (showFilters = !showFilters)}
            class="lg:hidden inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50 w-full sm:w-auto"
          >
            <span>{showFilters ? "Hide" : "Show"} Filters</span>
            <svg
              class="ml-1 w-4 h-4 transform {showFilters ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {#if locationError}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{locationError}</p>
        </div>
      {/if}

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 {showFilters
          ? 'block'
          : 'hidden lg:grid'}"
      >
        <!-- Radius Selector for Location Search -->
        {#if isLocationSearch}
          <div>
            <label
              for="radius"
              class="block text-sm font-medium text-gray-700 mb-1">Radius</label
            >
            <select
              id="radius"
              value={(data.searchRadius || 5).toString()}
              onchange={(e) => {
                const newRadius = e.currentTarget.value;
                const params = new URLSearchParams(window.location.search);
                params.set("radius", newRadius);
                goto(`?${params.toString()}`);
              }}
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        {:else}
          <!-- City Filter (only when not in location mode) -->
          <div>
            <label
              for="city"
              class="block text-sm font-medium text-gray-700 mb-1">City</label
            >
            <CityAutocomplete
              bind:selectedCity
              onselect={handleCitySelect}
              onclear={handleCityClear}
              placeholder="Search for a city..."
              class="w-full"
            />
          </div>
        {/if}

        <!-- Type Filter -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-1"
            >Type</label
          >
          <select
            id="type"
            bind:value={selectedType}
            onchange={applyFilters}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {#each data.placeTypes as type}
              <option value={type}>{formatTypeForDisplay(type)}</option>
            {/each}
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <label
            for="category"
            class="block text-sm font-medium text-gray-700 mb-1">Category</label
          >
          <select
            id="category"
            bind:value={selectedCategory}
            onchange={applyFilters}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {#each data.placeCategories as category}
              <option value={category}
                >{formatCategoryForDisplay(category)}</option
              >
            {/each}
          </select>
        </div>

        <!-- Sort Filter -->
        <div>
          <label for="sort" class="block text-sm font-medium text-gray-700 mb-1"
            >Sort By</label
          >
          <select
            id="sort"
            bind:value={sortBy}
            onchange={applyFilters}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Clear Filters -->
      {#if hasActiveFilters}
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            onclick={clearFilters}
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all filters
          </button>
        </div>
      {/if}
    </div>

    <!-- Results -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <p class="text-gray-600">
          {data.places.length} place{data.places.length !== 1 ? "s" : ""} found
          {#if isLocationSearch}
            within {data.searchRadius || 5}km of your location
          {:else if data.selectedCity}
            in {data.selectedCity.name}
          {/if}
        </p>
        {#if isLocationSearch}
          <div class="flex items-center text-sm text-gray-500">
            <svg
              class="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Location-based search
          </div>
        {/if}
      </div>
    </div>

    <!-- Places Grid -->
    {#if data.places.length > 0}
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      >
        {#each data.places as place}
          <PlaceCard {place} />
        {/each}
      </div>

      <!-- Pagination -->
      {#if data.pagination.hasMore || data.pagination.page > 1}
        <div class="flex items-center justify-center space-x-4">
          {#if data.pagination.page > 1}
            <a
              href="/places?{new URLSearchParams(
                Object.entries(data.filters)
                  .filter(
                    ([_, value]) =>
                      value !== null && value !== undefined && value !== '',
                  )
                  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {
                    page: (data.pagination.page - 1).toString(),
                  }),
              ).toString()}"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </a>
          {/if}

          <span class="text-sm text-gray-700">
            Page {data.pagination.page}
          </span>

          {#if data.pagination.hasMore}
            <a
              href="/places?{new URLSearchParams(
                Object.entries(data.filters)
                  .filter(
                    ([_, value]) =>
                      value !== null && value !== undefined && value !== '',
                  )
                  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {
                    page: (data.pagination.page + 1).toString(),
                  }),
              ).toString()}"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </a>
          {/if}
        </div>
      {/if}
    {:else}
      <!-- No Results -->
      <div class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No places found</h3>
        <p class="mt-1 text-sm text-gray-500">
          Try adjusting your search criteria or filters.
        </p>
        {#if hasActiveFilters}
          <div class="mt-6">
            <button
              onclick={clearFilters}
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Clear filters
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </main>

  <!-- Mobile Sidebar -->
  <MobileSidebar
    isOpen={mobileMenuOpen}
    user={data.user}
    onClose={() => (mobileMenuOpen = false)}
  />
</div>

<Footer />
