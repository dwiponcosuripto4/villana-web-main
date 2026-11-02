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
  import Footer from "$lib/components/Footer.svelte";
  import { formatPlaceType } from "$lib/utils/format";
  import type { SearchResult } from "$lib/server/services/search.service";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const user = $derived($page.data.user);

  const { totalCount } = data;

  // Filter states
  let selectedType = $state(data.filters.type || "");
  let selectedCategory = $state(data.filters.category || "");
  let searchQuery = $state(data.filters.search || "");
  let sortBy = $state(data.filters.sortBy || "popular");

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
    if (selectedType) params.set("type", selectedType);
    if (selectedCategory) params.set("category", selectedCategory);
    if (sortBy !== "popular") params.set("sortBy", sortBy);

    goto(`?${params.toString()}`);
  }

  function clearFilters() {
    selectedType = "";
    selectedCategory = "";
    searchQuery = "";
    sortBy = "popular";
    goto(window.location.pathname);
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

  function handleFullScreenSearchBlur() {
    navbarSearchFocused = false;
  }

  function handleSortChange(newSortBy: string) {
    sortBy = newSortBy;
    applyFilters();
  }

  // Check if any filters are active
  const hasActiveFilters = $derived(
    !!(searchQuery || selectedType || selectedCategory || sortBy !== "popular"),
  );

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
  title={data.seoContent.title}
  description={data.seoContent.description}
  keywords={data.seoContent.keywords}
  canonical={data.seoContent.canonical}
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
            Tempat Wisata di {data.displayName}
          </div>
        </div>

        <!-- Search Bar -->
        {#if !navbarSearchFocused}
          <SearchBar
            onselect={handleSearchSelect}
            onsubmit={handleSearchSubmit}
            onfreetext={handleFreeTextSearch}
            placeholder="Cari tempat wisata..."
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
        placeholder="Cari tempat wisata..."
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
    <Breadcrumbs items={data.breadcrumbs} className="mb-6" />

    <!-- SEO H1 Title Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl mb-3">
          {data.seoContent.h1}
        </h1>
        <p class="text-lg text-gray-600 max-w-4xl mx-auto mb-4">
          {data.seoContent.descriptionParagraph}
        </p>

        <!-- Area Information Card -->
        <div
          class="inline-flex items-center bg-blue-50 rounded-lg px-4 py-3 text-sm"
        >
          <svg
            class="h-4 w-4 text-blue-500 mr-2"
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
          <span class="text-blue-700">
            <strong>{data.displayName}</strong>
            {#if data.isMultiArea}
              • Kawasan Multi-Kota
            {/if}
          </span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
      >
        <!-- <h2 class="text-lg font-semibold text-gray-900">Filter & Pencarian</h2> -->

        <!-- Sort Dropdown (always visible) -->
        <div class="flex items-center space-x-2">
          <label
            for="sort-select"
            class="text-sm text-gray-700 whitespace-nowrap"
          >
            Urut berdasarkan:
          </label>
          <select
            id="sort-select"
            bind:value={sortBy}
            onchange={(e) => handleSortChange(e.currentTarget.value)}
            class="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="popular">Paling Populer</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="name">Nama (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Mobile filter toggle -->
      <div class="sm:hidden mb-4">
        <button
          onclick={() => (showFilters = !showFilters)}
          class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          <span>{showFilters ? "Sembunyikan" : "Tampilkan"} Filter</span>
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

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 {showFilters
          ? 'block'
          : 'hidden sm:grid'}"
      >
        <!-- Type Filter -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-1"
            >Jenis Tempat</label
          >
          <select
            id="type"
            bind:value={selectedType}
            onchange={applyFilters}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Semua Jenis</option>
            {#each data.placeTypes as type}
              <option value={type}>{formatTypeForDisplay(type)}</option>
            {/each}
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <label
            for="category"
            class="block text-sm font-medium text-gray-700 mb-1">Kategori</label
          >
          <select
            id="category"
            bind:value={selectedCategory}
            onchange={applyFilters}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {#each data.placeCategories as category}
              <option value={category}
                >{formatCategoryForDisplay(category)}</option
              >
            {/each}
          </select>
        </div>

        <!-- Search Input -->
        <div>
          <label
            for="search"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Pencarian</label
          >
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            onkeydown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Cari nama tempat..."
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Clear Filters -->
      {#if hasActiveFilters}
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            onclick={clearFilters}
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Hapus semua filter
          </button>
        </div>
      {/if}
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
              href="?{new URLSearchParams(
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
              Sebelumnya
            </a>
          {/if}

          <span class="text-sm text-gray-700">
            Halaman {data.pagination.page}
          </span>

          {#if data.pagination.hasMore}
            <a
              href="?{new URLSearchParams(
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
              Selanjutnya
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          Tidak ada tempat wisata ditemukan
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Coba ubah filter pencarian Anda atau hapus beberapa filter.
        </p>
        {#if hasActiveFilters}
          <div class="mt-6">
            <button
              onclick={clearFilters}
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Hapus filter
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- CTA Section -->
    <section class="bg-indigo-50 rounded-lg p-8 mt-12">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 sm:text-3xl">
          Cari Tempat Wisata di Daerah Lain?
        </h2>
        <p class="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Jelajahi ribuan tempat wisata menarik di seluruh Indonesia. Temukan
          destinasi impian Anda dengan informasi lengkap dan rating terpercaya.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/places"
            class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <svg
              class="-ml-1 mr-3 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Jelajahi Semua Tempat Wisata
          </a>
          <a
            href="/explore"
            class="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg
              class="-ml-1 mr-3 h-5 w-5"
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
            Cari Villa Menginap
          </a>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <Footer {user} />

  <!-- Mobile Sidebar -->
  <MobileSidebar
    isOpen={mobileMenuOpen}
    user={data.user}
    onClose={() => (mobileMenuOpen = false)}
  />
</div>
