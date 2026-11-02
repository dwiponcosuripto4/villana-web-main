<script lang="ts">
  import { goto } from "$app/navigation";
  import SearchBar from "./SearchBar.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import type { SearchResult } from "$lib/server/services/search.service";
  import { m } from "$lib/paraglide/messages.js";

  let selectedResult: SearchResult | null = $state(null);

  function handleSearchSelect(result: SearchResult) {
    console.log("Search result selected:", result);
    selectedResult = result;
  }

  function handleFreeSearch(searchTerm: string) {
    if (searchTerm && searchTerm.trim().length >= 2) {
      const params = new URLSearchParams();
      params.set("search", searchTerm.trim());
      goto(`/explore?${params.toString()}`);
    }
  }

  function handleSearchSubmit(result: SearchResult) {
    console.log("Search result submitted:", result);
    if (result.type === "city" && result.data.cityId) {
      goto(`/explore?city=${result.data.cityId}`);
    } else if (result.type === "villa" && result.data.villaId) {
      goto(`/villa/${result.data.villa?.slug || result.data.villaId}`);
    }
  }

  function handleButtonClick() {
    console.log("Button clicked, selectedResult:", selectedResult);
    if (selectedResult) {
      handleSearchSubmit(selectedResult);
    }
  }

  function handleLocationSuccess(data: {
    city: CityWithProvince;
    coordinates: { latitude: number; longitude: number };
    locationData: any;
  }) {
    selectedResult = {
      id: data.city.id,
      type: "city",
      title: data.city.name,
      subtitle: data.city.province.name,
      data: {
        cityId: data.city.id,
        city: data.city,
      },
    };
    // Automatically navigate to explore page
    goto(`/explore?city=${data.city.id}`);
  }

  function handleLocationError(error: { code: number; message: string }) {
    console.error("Location detection error:", error);
    // Error handling is now done within SearchBar component
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && selectedResult) {
      handleButtonClick();
    }
  }
</script>

<div class="relative bg-white">
  <!-- Hero Background -->
  <div class="absolute inset-0">
    <div
      class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 mix-blend-multiply"
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"
    ></div>
  </div>

  <!-- Hero Content -->
  <div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
    <div class="text-center">
      <!-- Main Headline -->
      <h1
        class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
      >
        Temukan <span class="text-yellow-400">Villa</span>
        Terbaik Anda
      </h1>

      <div id="LandingPageSearch" class="mx-auto mt-12 max-w-lg">
        <div class="rounded-lg bg-white p-6 shadow-xl">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Di mana Anda ingin menginap?
          </h2>

          <div class="space-y-4">
            <!-- Search Bar and Button Group -->
            <div class="space-y-3">
              <label for="search-bar" class="sr-only"
                >Cari kota atau villa</label
              >

              <!-- Grouped Search Input and Button -->
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1">
                  <SearchBar
                    onselect={handleSearchSelect}
                    onclear={() => {
                      selectedResult = null;
                    }}
                    onfreetext={handleFreeSearch}
                    onsubmit={handleSearchSubmit}
                    onnearby={() => {
                      console.log("Nearby search triggered");
                    }}
                    onlocationsuccess={handleLocationSuccess}
                    onlocationerror={handleLocationError}
                    placeholder={m.search_villa_placeholder()}
                    class="w-full"
                  />
                </div>
                <button
                  type="button"
                  onclick={handleButtonClick}
                  onkeypress={handleKeyPress}
                  disabled={!selectedResult}
                  class="px-6 py-3 rounded-md bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {#if selectedResult}
                    {#if selectedResult.type === "city"}
                      Cari
                    {:else}
                      Lihat
                    {/if}
                  {:else}
                    Cari
                  {/if}
                </button>
              </div>
            </div>

            <!-- Browse All Button -->
            <div class="flex items-center justify-center">
              <div class="flex items-center space-x-3">
                <div class="h-px flex-1 bg-gray-300"></div>
                <span class="text-sm text-gray-500">atau</span>
                <div class="h-px flex-1 bg-gray-300"></div>
              </div>
            </div>

            <a
              href="/explore"
              class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 text-center block"
            >
              Jelajahi
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="relative bg-gray-50 py-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Mengapa Villana?
        </h2>
        <!-- <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600"> -->
        <!--   We make finding and booking your perfect villa simple and secure. -->
        <!-- </p> -->
      </div>

      <div class="mt-12 grid gap-8 lg:grid-cols-3">
        <!-- Feature 1 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-semibold text-gray-900">
            Bisa Lebih Murah
          </h3>
          <p class="mt-2 text-gray-600">
            Cari villa bisa lebih murah, karena bisa terhubung langsung dengan
            pemilik atau pengelola villa. Sehingga terhindar dari biaya fee OTA.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-semibold text-gray-900">
            Pembanding Canggih
          </h3>
          <p class="mt-2 text-gray-600">
            Villana memiliki sistem pembanding canggih. Bisa membandingkan villa
            secara <i>side-to-side</i> mulai dari fasilitas, harga, dan ulasan antar
            villa.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-semibold text-gray-900">
            Aman dan Terpercaya
          </h3>
          <p class="mt-2 text-gray-600">
            Semua listing villa terverifikasi dan diperbarui secara berkala.
            Mencari villa hidden gem tidak perlu lagi di sosial media, di sini
            lebih aman dan mudah.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
