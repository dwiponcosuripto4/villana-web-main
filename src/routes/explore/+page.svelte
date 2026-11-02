<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import SavedVillasBadge from "$lib/components/SavedVillasBadge.svelte";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import InfiniteVillaList from "$lib/components/InfiniteVillaList.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import AdvancedSearch from "$lib/components/AdvancedSearch.svelte";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";
  import type { SearchResult } from "$lib/server/services/search.service";
  import MobileSidebar from "$lib/components/MobileSidebar.svelte";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const user = $derived(data.user);

  // Track actual loaded villa count from InfiniteVillaList
  let loadedVillasCount = $state(data.villas.length);
  let stillHasMore = $state(data.hasMore || false);

  // Check if this is a location-based search
  const isLocationSearch = $derived(data.filters?.isLocationSearch === true);

  // Canonical URL - derived from $page for consistency between SSR and client
  const canonicalUrl = $derived(`/explore${$page.url.search}`);

  // Helper function to clean location names
  function cleanLocationName(name: string): string {
    return name
      .replace(/^KABUPATEN\s+/i, "")
      .replace(/^KOTA\s+/i, "")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Helper function to format price in Indonesian rupiah
  function formatPrice(price: number): string {
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `Rp${millions.toFixed(millions >= 10 ? 0 : 1)}jt`;
    } else if (price >= 1000) {
      const thousands = price / 1000;
      return `Rp${thousands.toFixed(0)}rb`;
    }
    return `Rp${price.toLocaleString("id-ID")}`;
  }

  // Dynamic SEO content generation using $derived.by for SSR compatibility
  const seoContent = $derived.by(() => {
    const cityName = data.selectedCity?.name;
    const provinceName = data.selectedCity?.province?.name;
    const searchTerm = data.filters?.search;
    const priceMin = data.filters?.priceMin;
    const bedroomMin = data.filters?.bedroomMin;
    const villaCount = data.total || data.villas.length;

    if (cityName) {
      const cleanCityName = cleanLocationName(cityName);
      const cleanProvinceName = provinceName
        ? cleanLocationName(provinceName)
        : "";
      const locationDisplay = cleanProvinceName
        ? `${cleanCityName}, ${cleanProvinceName}`
        : cleanCityName;

      // City search with specific filters
      if (bedroomMin && priceMin) {
        return {
          title: `Villa ${bedroomMin} Kamar di ${cleanCityName} mulai ${formatPrice(priceMin)} - Villana`,
          description: `Temukan ${villaCount || "berbagai"} villa ${bedroomMin} kamar di ${locationDisplay} mulai dari ${formatPrice(priceMin)}. Filter berdasarkan fasilitas dan lokasi untuk villa liburan yang sempurna.`,
          h1: `Villa ${bedroomMin} Kamar di ${cleanCityName}`,
          descriptionParagraph: `Berikut adalah daftar villa ${bedroomMin} kamar terbaik di daerah ${cleanCityName} mulai dari ${formatPrice(priceMin)} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Nikmati pengalaman liburan yang lebih hemat dan personal.`,
        };
      } else if (priceMin) {
        return {
          title: `Villa Murah di ${cleanCityName} mulai ${formatPrice(priceMin)} - Villana`,
          description: `Temukan ${villaCount || "berbagai"} villa terjangkau di ${locationDisplay} mulai dari ${formatPrice(priceMin)}. Pilihan lengkap dengan berbagai fasilitas premium.`,
          h1: `Villa Murah di ${cleanCityName}`,
          descriptionParagraph: `Berikut adalah daftar villa terjangkau terbaik di daerah ${cleanCityName} mulai dari ${formatPrice(priceMin)} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Hemat lebih banyak untuk liburan Anda.`,
        };
      } else if (bedroomMin) {
        return {
          title: `Villa ${bedroomMin} Kamar di ${cleanCityName} - Villana`,
          description: `Temukan ${villaCount || "berbagai"} villa ${bedroomMin} kamar di ${locationDisplay}. Filter berdasarkan harga dan fasilitas untuk villa yang sempurna.`,
          h1: `Villa ${bedroomMin} Kamar di ${cleanCityName}`,
          descriptionParagraph: `Berikut adalah daftar villa ${bedroomMin} kamar terbaik di daerah ${cleanCityName} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Cocok untuk liburan keluarga dengan fasilitas lengkap dan harga terbaik.`,
        };
      } else {
        return {
          title: `Villa Terbaik di ${cleanCityName} - Villana`,
          description: `Temukan ${villaCount || "berbagai"} villa mewah di ${locationDisplay}. Filter berdasarkan harga, fasilitas, dan lokasi untuk menemukan villa liburan yang sempurna.`,
          h1: `Villa Terbaik di ${cleanCityName}`,
          descriptionParagraph: `Berikut adalah daftar villa terbaik di daerah ${cleanCityName} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Nikmati pengalaman liburan yang lebih personal dan hemat.`,
        };
      }
    } else if (searchTerm) {
      // Text search
      return {
        title: "",
        description: "",
        h1: "",
        descriptionParagraph: "",
      };
    } else if (isLocationSearch) {
      // Location radius search
      const radius = data.searchRadius || 5;
      return {
        title: `Daftar Villa Terbaik di Indonesia - Villana`,
        description: `Villa terbaik dalam radius ${radius}km dari lokasi Anda. ${villaCount || "Berbagai"} pilihan villa dengan fasilitas premium.`,
        h1: "Villa di Sekitar Lokasi Anda",
        descriptionParagraph: `Berikut adalah daftar villa terdekat dalam radius ${radius}km dari lokasi Anda yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Akses mudah dan harga terbaik untuk kenyamanan Anda.`,
      };
    } else if (priceMin) {
      // Price filter only
      return {
        title: `Villa mulai ${formatPrice(priceMin)} - Villana`,
        description: `Villa terjangkau mulai dari ${formatPrice(priceMin)}. ${villaCount || "Berbagai"} pilihan dengan berbagai fasilitas premium di seluruh Indonesia.`,
        h1: `Villa Mulai ${formatPrice(priceMin)}`,
        descriptionParagraph: `Berikut adalah daftar villa terbaik mulai dari ${formatPrice(priceMin)} yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Hemat lebih banyak untuk liburan impian Anda.`,
      };
    } else if (bedroomMin) {
      // Bedroom filter only
      return {
        title: `Villa ${bedroomMin} Kamar Terbaik - Villana`,
        description: `Villa ${bedroomMin} kamar terbaik di seluruh Indonesia. ${villaCount || "Berbagai"} pilihan dengan fasilitas lengkap dan lokasi strategis.`,
        h1: `Villa ${bedroomMin} Kamar Terbaik`,
        descriptionParagraph: `Berikut adalah daftar villa ${bedroomMin} kamar terbaik yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Cocok untuk liburan keluarga dengan fasilitas lengkap dan harga terbaik.`,
      };
    } else {
      // Default
      return {
        title: "Jelajahi Villa Terbaik - Villana",
        description:
          "Jelajahi koleksi villa mewah terbaik di Indonesia. Filter berdasarkan lokasi, harga, dan fasilitas untuk pengalaman liburan tak terlupakan.",
        h1: "Jelajahi Villa Terbaik",
        descriptionParagraph:
          "Berikut adalah daftar villa terbaik di Indonesia yang bisa Anda pesan langsung ke owner dengan harga murni tanpa fee OTA. Nikmati pengalaman liburan yang lebih personal dan hemat di berbagai destinasi pilihan.",
      };
    }
  });

  // Check if any filters are active
  const hasActiveFilters = $derived(
    !!(
      data.filters.search ||
      data.filters.cityId ||
      data.filters.provinceId ||
      data.filters.priceMin ||
      data.filters.priceMax ||
      data.filters.bedroomMin ||
      data.filters.bedroomMax ||
      data.filters.hasBathtub ||
      data.filters.hasPool ||
      data.filters.hasBreakfast ||
      data.filters.isPetFriendly ||
      data.filters.isKidFriendly ||
      data.filters.isSeniorFriendly ||
      data.filters.isSyaria ||
      data.filters.placeId ||
      isLocationSearch
    ),
  );

  // Callback to update count from InfiniteVillaList
  function onVillasUpdate(count: number, hasMore: boolean) {
    loadedVillasCount = count;
    stillHasMore = hasMore;
  }

  onMount(() => {
    if (user) {
      // Load saved villas from server for authenticated user
      savedVillas.loadFromServer(user);
    } else {
      // For anonymous users, the store already loads from localStorage
    }

    // Set up scroll listener to show/hide navbar search
    const handleScroll = () => {
      if (mainSearchElement) {
        const rect = mainSearchElement.getBoundingClientRect();
        showNavbarSearch = rect.bottom < 0; // Main search is above viewport
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  let showAdvancedFilters = $state(false);
  let selectedSearchResult: SearchResult | null = $state(null);
  let sortBy = $state(data.filters.sortBy || "pvr");
  let mobileMenuOpen = $state(false);
  let showNavbarSearch = $state(false);
  let mainSearchElement: HTMLElement;
  let navbarSearchFocused = $state(false);
  let fullScreenSearchElement: HTMLElement;

  function handleSearchSelect(result: SearchResult) {
    selectedSearchResult = result;
  }

  function handleSearchSubmit(result: SearchResult) {
    if (result.type === "city" && result.data.cityId) {
      // Apply city filter and clear search
      const params = new URLSearchParams();
      params.set("city", result.data.cityId);

      // Preserve existing filters
      if (data.filters.priceMin)
        params.set("priceMin", data.filters.priceMin.toString());
      if (data.filters.priceMax)
        params.set("priceMax", data.filters.priceMax.toString());
      if (data.filters.bedroomMin)
        params.set("bedroomMin", data.filters.bedroomMin.toString());
      if (data.filters.bedroomMax)
        params.set("bedroomMax", data.filters.bedroomMax.toString());
      if (data.filters.provinceId)
        params.set("province", data.filters.provinceId);

      // Preserve amenity filters
      if (data.filters.hasBathtub) params.set("hasBathtub", "true");
      if (data.filters.hasPool) params.set("hasPool", "true");
      if (data.filters.hasBreakfast) params.set("hasBreakfast", "true");
      if (data.filters.isPetFriendly) params.set("isPetFriendly", "true");
      if (data.filters.isKidFriendly) params.set("isKidFriendly", "true");
      if (data.filters.isSeniorFriendly) params.set("isSeniorFriendly", "true");
      if (data.filters.isSyaria) params.set("isSyaria", "true");

      // Preserve nearby place filters
      if (data.filters.placeId) params.set("placeId", data.filters.placeId);
      if (data.filters.nearbyRadius)
        params.set("nearbyRadius", data.filters.nearbyRadius.toString());

      if (sortBy !== "pvr") params.set("sortBy", sortBy);
      goto(`?${params.toString()}`);
    } else if (
      result.type === "villa" &&
      (result.data.villa || result.data.villaId)
    ) {
      // Navigate directly to villa page
      const identifier = result.data.villa?.slug || result.data.villaId;
      goto(`/villa/${identifier}`);
    }
  }

  function handleFreeTextSearch(searchTerm: string) {
    // Handle free text search when user doesn't select from suggestions
    // Note: For free text search, we only preserve price/bedroom/amenity filters but clear location filters
    // to give broader search results across all locations
    if (searchTerm && searchTerm.trim().length >= 2) {
      const params = new URLSearchParams();
      params.set("search", searchTerm.trim());

      // Preserve price and bedroom filters
      if (data.filters.priceMin)
        params.set("priceMin", data.filters.priceMin.toString());
      if (data.filters.priceMax)
        params.set("priceMax", data.filters.priceMax.toString());
      if (data.filters.bedroomMin)
        params.set("bedroomMin", data.filters.bedroomMin.toString());
      if (data.filters.bedroomMax)
        params.set("bedroomMax", data.filters.bedroomMax.toString());

      // Preserve amenity filters
      if (data.filters.hasBathtub) params.set("hasBathtub", "true");
      if (data.filters.hasPool) params.set("hasPool", "true");
      if (data.filters.hasBreakfast) params.set("hasBreakfast", "true");
      if (data.filters.isPetFriendly) params.set("isPetFriendly", "true");
      if (data.filters.isKidFriendly) params.set("isKidFriendly", "true");
      if (data.filters.isSeniorFriendly) params.set("isSeniorFriendly", "true");
      if (data.filters.isSyaria) params.set("isSyaria", "true");

      if (sortBy !== "pvr") params.set("sortBy", sortBy);
      // Don't include cityId, provinceId, placeId for free text search to allow broader results
      goto(`?${params.toString()}`);
    }
  }

  function handleSearchClear() {
    // Reset to all villas mode (clear all filters)
    goto("/explore");
  }

  function applyAdvancedFilters(filters: any) {
    const params = new URLSearchParams();

    // Add search from filters if present
    if (filters.search) params.set("search", filters.search);

    // Add all filter parameters
    if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    if (filters.bedroomMin)
      params.set("bedroomMin", filters.bedroomMin.toString());
    if (filters.bedroomMax)
      params.set("bedroomMax", filters.bedroomMax.toString());
    if (filters.cityId) params.set("city", filters.cityId);
    if (filters.provinceId) params.set("province", filters.provinceId);

    // Add amenity filters
    if (filters.hasBathtub) params.set("hasBathtub", "true");
    if (filters.hasPool) params.set("hasPool", "true");
    if (filters.hasBreakfast) params.set("hasBreakfast", "true");
    if (filters.isPetFriendly) params.set("isPetFriendly", "true");
    if (filters.isKidFriendly) params.set("isKidFriendly", "true");
    if (filters.isSeniorFriendly) params.set("isSeniorFriendly", "true");
    if (filters.isSyaria) params.set("isSyaria", "true");

    // Add nearby place filters
    if (filters.placeId) params.set("placeId", filters.placeId);
    if (filters.nearbyRadius)
      params.set("nearbyRadius", filters.nearbyRadius.toString());

    if (sortBy !== "pvr") params.set("sortBy", sortBy);

    goto(`?${params.toString()}`);
  }

  function clearAllFilters() {
    goto("/explore");
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function handleNavbarSearchFocus() {
    navbarSearchFocused = true;
    // Focus the full-screen search after a short delay
    setTimeout(() => {
      if (fullScreenSearchElement) {
        const input = fullScreenSearchElement.querySelector("input");
        if (input) {
          input.focus();
        }
      }
    }, 100);
  }

  function handleNavbarSearchBlur(event?: FocusEvent) {
    // Only close if we're not clicking on the full-screen search
    const target = event?.relatedTarget as HTMLElement;
    if (target && fullScreenSearchElement?.contains(target)) {
      return;
    }

    setTimeout(() => {
      navbarSearchFocused = false;
    }, 150);
  }

  function handleFullScreenSearchBlur() {
    navbarSearchFocused = false;
  }

  function handleSortChange(newSortBy: string) {
    sortBy = newSortBy as typeof sortBy;
    const params = new URLSearchParams();

    // Preserve all existing filters
    if (data.filters.search) params.set("search", data.filters.search);
    if (data.filters.priceMin)
      params.set("priceMin", data.filters.priceMin.toString());
    if (data.filters.priceMax)
      params.set("priceMax", data.filters.priceMax.toString());
    if (data.filters.bedroomMin)
      params.set("bedroomMin", data.filters.bedroomMin.toString());
    if (data.filters.bedroomMax)
      params.set("bedroomMax", data.filters.bedroomMax.toString());
    if (data.filters.cityId) params.set("city", data.filters.cityId);
    if (data.filters.provinceId)
      params.set("province", data.filters.provinceId);

    // Preserve amenity filters
    if (data.filters.hasBathtub) params.set("hasBathtub", "true");
    if (data.filters.hasPool) params.set("hasPool", "true");
    if (data.filters.hasBreakfast) params.set("hasBreakfast", "true");
    if (data.filters.isPetFriendly) params.set("isPetFriendly", "true");
    if (data.filters.isKidFriendly) params.set("isKidFriendly", "true");
    if (data.filters.isSeniorFriendly) params.set("isSeniorFriendly", "true");
    if (data.filters.isSyaria) params.set("isSyaria", "true");

    // Preserve nearby place filters
    if (data.filters.placeId) params.set("placeId", data.filters.placeId);
    if (data.filters.nearbyRadius)
      params.set("nearbyRadius", data.filters.nearbyRadius.toString());

    if (sortBy !== "pvr") params.set("sortBy", sortBy);
    goto(`?${params.toString()}`);
  }
</script>

<!-- Dynamic SEO Head -->
<SEOHead
  title={seoContent.title || "Jelajahi Villa Terbaik"}
  description={seoContent.description ||
    "Jelajahi koleksi villa mewah terbaik di Indonesia. Filter berdasarkan lokasi, harga, dan fasilitas untuk pengalaman liburan tak terlupakan."}
  canonical={canonicalUrl}
  type="website"
/>

<svelte:head>
  <GoogleAnalytics />
  <ClarityCode />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header
    class="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="relative">
            <a href="/" class="flex items-center hover:opacity-90">
              <img
                src="/images/logo-villana-with-name-beta.svg"
                alt="Villana Logo"
                class="w-[64px] md:w-[96px] md:max-w-[128px]"
              />
            </a>
          </div>
          {#if isLocationSearch}
            <div class="hidden sm:flex items-center text-sm text-white/90">
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
              Villa dalam radius {data.searchRadius || 5}km dari lokasi Anda
            </div>
          {:else if data.selectedCity}
            <div class="hidden sm:flex items-center text-sm text-white/90">
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
              {data.selectedCity.name}, {data.selectedCity.province.name}
            </div>
          {/if}
        </div>
        <!-- Navbar Search (shown when main search is not visible) -->
        <div
          class="relative flex-1 mx-4 transition-all duration-300 {showNavbarSearch
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'}"
        >
          {#if showNavbarSearch && !navbarSearchFocused}
            <!-- Regular search bar in navbar -->
            <SearchBar
              placeholder="Search villas..."
              initialValue={data.filters.search || ""}
              onselect={handleSearchSelect}
              onsubmit={handleSearchSubmit}
              onfreetext={handleFreeTextSearch}
              onclear={handleSearchClear}
              class="w-full max-w-lg mx-auto"
              onfocus={handleNavbarSearchFocus}
            />
          {/if}
        </div>
        <div class="flex items-center space-x-4">
          <div class="hidden lg:block">
            <SavedVillasBadge variant="white" />
          </div>
          <!-- Mobile hamburger menu button -->
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
          <!-- Desktop menu items (hidden on mobile) -->
          <div class="hidden lg:flex lg:items-center lg:space-x-4">
            {#if user}
              <!-- Authenticated user menu -->
              {#if user.role === "admin"}
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
              <!-- Non-authenticated user menu -->
              <a
                href="/admin/login"
                class="text-sm text-white/80 hover:text-white">Login</a
              >
              <a
                href="/register"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Register
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Full-screen search overlay (when navbar search is focused) -->
  {#if navbarSearchFocused && showNavbarSearch}
    <!-- Background overlay -->
    <div
      class="fixed inset-0 bg-black/20 z-40"
      onclick={handleFullScreenSearchBlur}
    ></div>

    <!-- Full-width search container positioned exactly at navbar level -->
    <div
      class="fixed left-0 right-0 z-50 px-4 flex items-center"
      style="top: 0; height: 4rem;"
      bind:this={fullScreenSearchElement}
    >
      <SearchBar
        placeholder="Search villas..."
        initialValue={data.filters.search || ""}
        onselect={handleSearchSelect}
        onsubmit={handleSearchSubmit}
        onfreetext={handleFreeTextSearch}
        onclear={handleSearchClear}
        class="w-full shadow-xl"
        onblur={handleFullScreenSearchBlur}
        autoFocus={true}
      />
    </div>
  {/if}

  <!-- Main Search Section -->
  <div class="border-b border-gray-300 bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Primary Search Bar (hidden when advanced search is active) -->
      {#if !showAdvancedFilters}
        <div class="mb-4" bind:this={mainSearchElement}>
          <SearchBar
            placeholder="Search villas..."
            initialValue={data.filters.search || ""}
            onselect={handleSearchSelect}
            onsubmit={handleSearchSubmit}
            onfreetext={handleFreeTextSearch}
            onclear={handleSearchClear}
            class="w-full"
          />
        </div>
      {/if}

      <!-- Advanced Search Toggle and Clear Filters -->
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-between w-full space-x-4">
          <button
            type="button"
            onclick={() => (showAdvancedFilters = !showAdvancedFilters)}
            class="inline-flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-sm"
            aria-expanded={showAdvancedFilters}
            aria-controls="advanced-filters"
          >
            <span>Advanced Search</span>
            <svg
              class="h-4 w-4 transform transition-transform duration-200 {showAdvancedFilters
                ? 'rotate-180'
                : ''}"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {#if hasActiveFilters}
            <a
              href="/explore"
              class="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Clear Filters
            </a>
          {/if}
        </div>
      </div>

      <!-- Advanced Filters Panel -->
      {#if showAdvancedFilters}
        <div class="mt-4">
          <AdvancedSearch
            filters={{
              search: data.filters.search,
              priceMin: data.filters.priceMin,
              priceMax: data.filters.priceMax,
              bedroomMin: data.filters.bedroomMin,
              bedroomMax: data.filters.bedroomMax,
              cityId: data.filters.cityId,
              hasBathtub: data.filters.hasBathtub,
              hasPool: data.filters.hasPool,
              hasBreakfast: data.filters.hasBreakfast,
              isPetFriendly: data.filters.isPetFriendly,
              isKidFriendly: data.filters.isKidFriendly,
              isSeniorFriendly: data.filters.isSeniorFriendly,
              isSyaria: data.filters.isSyaria,
              placeId: data.filters.placeId,
              nearbyRadius: data.filters.nearbyRadius,
            }}
            selectedCity={data.selectedCity}
            onApply={applyAdvancedFilters}
            onClear={clearAllFilters}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- SEO H1 Title Section -->
  {#if data.villas.length > 0 && seoContent.h1}
    <div class="bg-white border-b border-gray-100">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
            {seoContent.h1 || "Jelajahi Villa Terbaik"}
          </h1>
          <p class="mt-3 text-lg text-gray-600 max-w-4xl mx-auto">
            {seoContent.descriptionParagraph ||
              "Temukan pengalaman menginap terbaik dengan koleksi villa premium di Indonesia. Setiap villa telah dikurasi khusus untuk memberikan kenyamanan maksimal selama liburan Anda."}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main>
    <!-- Results Summary and Sort Controls -->
    {#if data.villas.length > 0}
      <div class="bg-white border-b border-gray-200">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div
            class="flex flex-col md:flex-row gap-4 items-center justify-between"
          >
            <div class="flex items-center space-x-2">
              {#if hasActiveFilters}
                {#if data.filters.search}
                  <span class="text-sm text-gray-600">
                    "{data.filters.search}"
                  </span>
                {:else if isLocationSearch}
                  <span class="text-sm text-gray-600">
                    Radius {data.searchRadius || 5}km dari lokasi Anda
                  </span>
                {:else if data.selectedCity}
                  <span class="text-sm text-gray-600">
                    {data.selectedCity.name}
                  </span>
                {:else}
                  <span class="text-sm text-gray-600"> Filtered results </span>
                {/if}
                <span class="text-sm text-gray-500">•</span>
              {/if}
            </div>
            <div class="flex items-center space-x-3">
              <!-- Radius Selector for Location Search -->
              {#if isLocationSearch}
                <div class="flex items-center space-x-2">
                  <label
                    for="radius-select"
                    class="text-sm text-gray-700 whitespace-nowrap"
                  >
                    Radius:
                  </label>
                  <select
                    id="radius-select"
                    value={(data.searchRadius || 5).toString()}
                    onchange={(e) => {
                      const newRadius = e.currentTarget.value;
                      const params = new URLSearchParams(
                        window.location.search,
                      );
                      params.set("radius", newRadius);
                      goto(`?${params.toString()}`);
                    }}
                    class="block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    <option value="5">5km</option>
                    <option value="10">10km</option>
                    <option value="20">20km</option>
                    <option value="50">50km</option>
                  </select>
                </div>
              {/if}

              <!-- Sort Dropdown -->
              <div class="flex items-center space-x-2">
                <label
                  for="sort-select"
                  class="text-sm text-gray-700 whitespace-nowrap"
                >
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  bind:value={sortBy}
                  onchange={(e) => handleSortChange(e.currentTarget.value)}
                  class="block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="pvr">Best Value (PVR)</option>
                  <option value="google_rating">Highest Rated</option>
                  <option value="most_viewed">Most Viewed</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if data.villas.length === 0}
      <div class="py-12 text-center">
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No villas found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {#if data.filters.search}
            No villas found for "{data.filters.search}". Try a different search
            term or check your spelling.
          {:else if data.selectedCity}
            No villas available in {data.selectedCity.name}. Try selecting a
            different city or adjusting your filters.
          {:else}
            Try adjusting your filters or check back later.
          {/if}
        </p>
      </div>
    {:else}
      <!-- Infinite Villa List with Mobile and Desktop Variants -->
      <InfiniteVillaList
        initialVillas={data.villas}
        initialHasMore={data.hasMore || false}
        initialNextCursor={data.nextCursor || null}
        filters={{
          priceMin: data.filters.priceMin,
          priceMax: data.filters.priceMax,
          bedroomMin: data.filters.bedroomMin,
          bedroomMax: data.filters.bedroomMax,
          search: data.filters.search,
          cityId: data.filters.cityId,
          provinceId: data.filters.provinceId,
          status: "published",
          sortBy: data.filters.sortBy,
          // Amenity filters
          hasBathtub: data.filters.hasBathtub,
          hasPool: data.filters.hasPool,
          hasBreakfast: data.filters.hasBreakfast,
          isPetFriendly: data.filters.isPetFriendly,
          isKidFriendly: data.filters.isKidFriendly,
          isSeniorFriendly: data.filters.isSeniorFriendly,
          isSyaria: data.filters.isSyaria,
          // Nearby place filters
          placeId: data.filters.placeId,
          nearbyRadius: data.filters.nearbyRadius,
        }}
        autoLoadOnScroll={true}
        itemsPerLoad={10}
        enableVirtualScroll={false}
        showDistance={isLocationSearch}
        showPhoneNumber={true}
        onUpdate={onVillasUpdate}
      />
    {/if}
  </main>

  <!-- Mobile Sidebar -->
  <MobileSidebar isOpen={mobileMenuOpen} {user} onClose={closeMobileMenu} />
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
