<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import SavedVillasBadge from "$lib/components/SavedVillasBadge.svelte";
  import InfiniteVillaList from "$lib/components/InfiniteVillaList.svelte";
  import { savedVillas } from "$lib/stores/savedVillas";
  import MobileSidebar from "$lib/components/MobileSidebar.svelte";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const user = $derived($page.data.user);

  // Track actual loaded villa count from InfiniteVillaList
  let loadedVillasCount = $state(data.villas.length);
  let stillHasMore = $state(data.hasMore || false);

  let sortBy = $state(data.filters.sortBy || "pvr");
  let mobileMenuOpen = $state(false);

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
  });

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function handleSortChange(newSortBy: string) {
    sortBy = newSortBy as typeof sortBy;
    const params = new URLSearchParams();

    // Preserve existing filters
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
    goto(`?${params.toString()}`);
  }
</script>

<!-- Dynamic SEO Head -->
<SEOHead
  title={data.seoContent.title}
  description={data.seoContent.description}
  canonical={data.seoContent.canonical}
  type="website"
/>

<svelte:head>
  <ClarityCode />
  <GoogleAnalytics />
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
            <a href="/" class="text-xl font-bold text-white hover:text-blue-100"
              >Villana</a
            >
            <span
              class="text-white absolute"
              style="top: -11px; right: -2px; font-size: 10px;">[beta]</span
            >
          </div>
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
            Villa dekat {data.place.name}
          </div>
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

  <!-- Breadcrumb Section -->
  <div class="bg-white border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <nav class="flex" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-4">
          <li>
            <div>
              <a href="/" class="text-gray-400 hover:text-gray-500">
                <svg
                  class="h-5 w-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="sr-only">Home</span>
              </a>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <svg
                class="h-5 w-5 flex-shrink-0 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <a
                href="/explore"
                class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >Explore</a
              >
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <svg
                class="h-5 w-5 flex-shrink-0 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <span
                class="ml-4 text-sm font-medium text-gray-900"
                aria-current="page"
              >
                Villa dekat {data.place.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  </div>

  <!-- SEO H1 Title Section -->
  {#if data.villas.length > 0}
    <div class="bg-white border-b border-gray-100">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
            {data.seoContent.h1}
          </h1>
          <p class="mt-3 text-lg text-gray-600 max-w-4xl mx-auto">
            {data.seoContent.descriptionParagraph}
          </p>
          <!-- Place Information Card -->
          <div
            class="mt-6 inline-flex items-center bg-blue-50 rounded-lg px-4 py-3 text-sm"
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
              <strong>{data.place.name}</strong>
              {#if data.place.city && data.place.province}
                • {data.place.city.name}, {data.place.province.name}
              {:else if data.place.city}
                • {data.place.city.name}
              {:else if data.place.province}
                • {data.place.province.name}
              {/if}
            </span>
          </div>
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
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- Sort Dropdown -->
              <div class="flex items-center space-x-2">
                <label
                  for="sort-select"
                  class="text-sm text-gray-700 whitespace-nowrap"
                >
                  Urut Berdasarkan:
                </label>
                <select
                  id="sort-select"
                  bind:value={sortBy}
                  onchange={(e) => handleSortChange(e.currentTarget.value)}
                  class="block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="pvr">Best Value (PVR)</option>
                  <option value="distance">Jarak Terdekat</option>
                  <option value="google_rating">Rating Tertinggi</option>
                  <option value="newest">Terbaru</option>
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          Tidak ada villa ditemukan
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Belum ada villa yang tersedia dekat {data.place.name}. Coba cek
          kembali nanti atau jelajahi villa di lokasi lain.
        </p>
        <div class="mt-6">
          <a
            href="/explore"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Jelajahi Villa Lain
          </a>
        </div>
      </div>
    {:else}
      <!-- Infinite Villa List using VillaCard -->
      <InfiniteVillaList
        initialVillas={data.villas}
        initialHasMore={data.hasMore || false}
        initialNextCursor={data.nextCursor || null}
        filters={{
          priceMin: data.filters.priceMin,
          priceMax: data.filters.priceMax,
          bedroomMin: data.filters.bedroomMin,
          bedroomMax: data.filters.bedroomMax,
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
          // Place-specific filters
          placeId: data.filters.placeId,
          nearbyRadius: data.filters.nearbyRadius,
        }}
        autoLoadOnScroll={true}
        itemsPerLoad={10}
        enableVirtualScroll={false}
        showDistance={true}
        showPhoneNumber={true}
        onUpdate={onVillasUpdate}
      />
    {/if}
  </main>

  <!-- CTA Section -->
  <section class="bg-indigo-50 border-t border-gray-200">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">
          Cari Villa di Lokasi Lain?
        </h2>
        <p class="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Jelajahi ribuan villa terbaik di seluruh Indonesia dengan sistem P/V
          Ratio inovatif. Temukan villa impian Anda dengan harga terbaik tanpa
          biaya tersembunyi.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/explore"
            class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
            Jelajahi Semua Villa
          </a>
          <a
            href="/places"
            class="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Lihat Tempat Wisata
          </a>
        </div>
        <p class="mt-4 text-sm text-gray-500">
          100% gratis • Tanpa biaya tersembunyi • Booking langsung ke owner
        </p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <Footer {user} />

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
