<script lang="ts">
  import type { SearchResult } from "$lib/server/services/search.service";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import { formatCityName, toTitleCase } from "$lib/utils/format";
  import { onMount } from "svelte";
  import { m } from "$lib/paraglide/messages.js";
  import { showToast } from "$lib/utils/toast";
  import { goto } from "$app/navigation";

  interface Props {
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    excludeCity?: boolean;
    autoFocus?: boolean;
    initialValue?: string;
    withNearbyOption?: boolean;
    filter?: (result: SearchResult) => boolean;
    onselect?: (result: SearchResult) => void;
    onclear?: () => void;
    onsubmit?: (result: SearchResult) => void;
    onfreetext?: (searchTerm: string) => void;
    onfocus?: () => void;
    onblur?: (event?: Event) => void;
    onnearby?: () => void;
    onlocationsuccess?: (data: {
      city: CityWithProvince;
      coordinates: { latitude: number; longitude: number };
      locationData: any;
    }) => void;
    onlocationerror?: (error: { code: number; message: string }) => void;
  }

  let {
    placeholder = m.search_villa_placeholder(),
    disabled = false,
    class: className = "",
    excludeCity = false,
    autoFocus = false,
    initialValue = "",
    withNearbyOption = true,
    filter,
    onselect,
    onclear,
    onsubmit,
    onfreetext,
    onfocus,
    onblur,
    onnearby,
    onlocationsuccess,
    onlocationerror,
  }: Props = $props();

  let searchTerm = $state(initialValue);
  let isOpen = $state(false);
  let isLoading = $state(false);
  let results = $state<SearchResult[]>([]);
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  let selectedIndex = $state(-1);
  let selectedResult = $state<SearchResult | null>(null);
  let inputElement: HTMLInputElement;
  let isFocused = $state(false);
  let showNearbyOption = $state(false);
  let isDetectingLocation = $state(false);

  /**
   * Parse city search text to extract proper title and subtitle
   * Handles cases with KABUPATEN/KOTA prefixes and applies title case
   */
  function parseCitySearchText(text: string): {
    title: string;
    subtitle: string;
  } {
    // Find the comma to split correctly between city and province
    const commaIndex = text.indexOf(", ");
    if (commaIndex <= 0) {
      // Fallback if no comma found
      return { title: formatCityName(text), subtitle: "" };
    }

    const beforeComma = text.substring(0, commaIndex);
    const afterComma = text.substring(commaIndex + 2);

    // Extract the actual city name from before comma (may contain duplicated text)
    // Format: "CityName ProvinceName CityName" -> we want the first "CityName"
    const parts = beforeComma.split(" ");
    let cityName = parts[0];

    // If the first part is KABUPATEN or KOTA, include the next part too
    if (
      cityName.toUpperCase() === "KABUPATEN" ||
      cityName.toUpperCase() === "KOTA"
    ) {
      cityName = parts.slice(0, 2).join(" ");
    }

    // Format both city and province names with proper title case
    const formattedCityName = formatCityName(cityName);

    // For province, keep DI and DKI uppercase, otherwise apply title case
    let formattedProvinceName = afterComma;
    if (
      !formattedProvinceName.startsWith("DI ") &&
      !formattedProvinceName.startsWith("DKI ")
    ) {
      formattedProvinceName = toTitleCase(formattedProvinceName);
    }

    return {
      title: formattedCityName + ", " + formattedProvinceName,
      subtitle: `Search villa in ${formattedCityName}`,
    };
  }

  function parseVillaAddress(address: string): string {
    // split by commas, remove "indonesia", and get last 3 parts
    const s = address
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.toLowerCase() !== "indonesia" && part.length > 0);
    return s.slice(-3).join(", ");
  }

  async function searchItems(term: string, excludeCity: boolean = false) {
    if (term.length < 2) {
      results = [];
      isOpen = false;
      return;
    }

    isLoading = true;

    try {
      // Use lightweight search suggestions API for faster autocomplete
      const params = new URLSearchParams();
      params.set("q", term);
      if (excludeCity) {
        params.set("excludeCity", "true");
      }
      const response = await fetch(
        `/api/search-suggestions?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();

        // Transform lightweight suggestions into SearchResult format for display
        results = data.suggestions.map(
          (
            suggestion: {
              idx_type: "city" | "villa";
              text: string;
              subText: string;
              cityId?: string;
              villaId?: number;
              slug?: string;
            },
            index: number,
          ) => {
            // Parse the text to extract title and subtitle
            const textParts = suggestion.text.split(", ");
            let title = textParts[0] || suggestion.text;
            let subtitle = (suggestion.subText || "").trim();

            if (suggestion.idx_type === "city") {
              // Parse city text properly using the dedicated function
              const parsed = parseCitySearchText(suggestion.text);
              title = parsed.title;
              subtitle = parsed.subtitle;
            } else {
              // For villas, apply title case to title
              title = toTitleCase(title);
              subtitle = toTitleCase(parseVillaAddress(subtitle));
            }

            return {
              id: `${suggestion.idx_type}-${suggestion.cityId || suggestion.villaId}`,
              type: suggestion.idx_type,
              title,
              subtitle,
              data: {
                // Use actual IDs and slug from the suggestions API
                cityId: suggestion.cityId,
                villaId: suggestion.villaId,
                villa:
                  suggestion.slug && suggestion.idx_type === "villa"
                    ? { slug: suggestion.slug }
                    : undefined,
              },
            } as SearchResult;
          },
        );
        if (results.length > 0 && filter) {
          results = results.filter(filter);
        }

        isOpen = results.length > 0 || showNearbyOption;
        selectedIndex = -1;
      }
    } catch (error) {
      console.error("Search failed:", error);
      results = [];
    } finally {
      isLoading = false;
    }
  }

  function handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    searchTerm = value;
    selectedResult = null;

    clearTimeout(searchTimeout);

    if (value.length === 0) {
      results = [];
      isOpen = false;
      onclear?.();
      return;
    }

    searchTimeout = setTimeout(() => {
      searchItems(value, excludeCity);
    }, 300);
  }

  function selectResult(result: SearchResult) {
    selectedResult = result;
    searchTerm = result.title + (result.subtitle ? `, ${result.subtitle}` : "");
    isOpen = false;

    // Trigger onselect for any additional handling
    onselect?.(result);

    // Automatically submit for better UX - no need to click button again
    // Villa -> go directly to villa page
    // City -> go to explore page with city filter
    onsubmit?.(result);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Handle Enter key for search
    if (event.key === "Enter") {
      event.preventDefault();

      // If dropdown is open and user has selected a suggestion with arrow keys
      if (isOpen && selectedIndex >= 0 && selectedIndex < results.length) {
        selectResult(results[selectedIndex]);
        return;
      }

      // If nearby option is selected
      if (isOpen && showNearbyOption && selectedIndex === results.length) {
        handleNearbySearch();
        return;
      }

      // Otherwise, do free text search if search term is long enough
      if (searchTerm.trim().length >= 2) {
        onfreetext?.(searchTerm);
      }
      return;
    }

    // Handle other keys only if dropdown is open
    if (!isOpen || (results.length === 0 && !showNearbyOption)) {
      return;
    }

    const maxIndex = results.length + (showNearbyOption ? 1 : 0) - 1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, maxIndex);
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case "Escape":
        event.preventDefault();
        isOpen = false;
        selectedIndex = -1;
        showNearbyOption = false;
        break;
    }
  }

  function handleBlur(event: Event) {
    isFocused = false;

    // Delay hiding the nearby option and closing dropdown to allow click events to complete
    // Don't close if location detection is in progress
    setTimeout(() => {
      if (!isDetectingLocation) {
        showNearbyOption = false;
        isOpen = false;
      }
    }, 300);

    // Delay the onblur callback to allow for click events on dropdown items
    setTimeout(() => {
      onblur?.(event);
    }, 350);
  }

  function handleFocus() {
    console.log("SearchBar focused");
    isFocused = true;
    showNearbyOption = true;
    if (searchTerm.length >= 2 && results.length > 0) {
      isOpen = true;
    } else if (showNearbyOption) {
      isOpen = true;
    }
    console.log("showNearbyOption:", showNearbyOption, "isOpen:", isOpen);
    onfocus?.();
  }

  async function handleNearbySearch() {
    console.log("handleNearbySearch called");

    if (!navigator.geolocation) {
      showToast.error("Geolocation tidak didukung oleh browser Anda");
      isDetectingLocation = false;
      return;
    }

    isDetectingLocation = true;
    console.log("Location detection started");

    // Show loading toast
    const loadingToast = showToast.loading("Mencari lokasi Anda...");

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          console.log("Location obtained:", latitude, longitude);
          showToast.dismiss(loadingToast);
          showToast.success("Lokasi ditemukan! Mencari villa terdekat...");

          // Close the search dropdown
          isDetectingLocation = false;
          isOpen = false;
          showNearbyOption = false;

          // Navigate directly to explore page with coordinates and default 5km radius
          await goto(`/explore?lat=${latitude}&lng=${longitude}&radius=5`);
        } catch (error) {
          console.error("Error processing location:", error);
          showToast.dismiss(loadingToast);
          showToast.error("Terjadi kesalahan. Silakan coba lagi.");
          isDetectingLocation = false;
          isOpen = false;
          showNearbyOption = false;
        }
      },
      (error) => {
        console.log("Geolocation error:", error);
        showToast.dismiss(loadingToast);
        isDetectingLocation = false;
        let toastMessage = "";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toastMessage =
              "Akses lokasi ditolak. Silakan izinkan akses lokasi di browser Anda dan coba lagi.";
            break;
          case error.POSITION_UNAVAILABLE:
            toastMessage =
              "Informasi lokasi tidak tersedia. Silakan pilih kota secara manual.";
            break;
          case error.TIMEOUT:
            toastMessage = "Pencarian lokasi timeout. Silakan coba lagi.";
            break;
          default:
            toastMessage = "Terjadi kesalahan saat mendapatkan lokasi Anda.";
            break;
        }

        showToast.error(toastMessage);
        isOpen = false;
        showNearbyOption = false;
      },
      options,
    );

    // Call the original onnearby callback if provided for backward compatibility
    onnearby?.();
  }

  function clearSearch() {
    searchTerm = "";
    selectedResult = null;
    results = [];
    isOpen = false;
    selectedIndex = -1;
    showNearbyOption = false;
    onclear?.();
    inputElement?.focus();
  }

  function getIcon(type: "city" | "villa") {
    return type === "city" ? "🏙️" : "🏠";
  }

  onMount(() => {
    if (autoFocus) {
      inputElement?.focus();
    }
  });
</script>

<div id="SearchBar" class="relative {className}">
  <div class="relative">
    <!-- Search icon -->
    <div
      class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
    >
      <svg
        class="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>

    <input
      bind:this={inputElement}
      type="text"
      value={searchTerm}
      {placeholder}
      {disabled}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      onblur={handleBlur}
      onfocus={handleFocus}
      class="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-300"
      aria-label="Search"
      aria-autocomplete="list"
      aria-expanded={isOpen}
      aria-controls="search-listbox"
      role="combobox"
    />

    {#if searchTerm && !disabled}
      <button
        type="button"
        onclick={clearSearch}
        class="absolute inset-y-0 right-0 flex items-center pr-3"
        aria-label="Clear search"
      >
        <svg
          class="h-5 w-5 text-gray-400 hover:text-gray-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    {:else if isLoading}
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          class="h-5 w-5 animate-spin text-gray-400"
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
      </div>
    {/if}
  </div>

  {#if isOpen && (results.length > 0 || (showNearbyOption && withNearbyOption))}
    <div
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <ul id="search-listbox" class="py-1" role="listbox">
        {#each results as result, index}
          <li
            role="option"
            aria-selected={selectedIndex === index}
            class="relative cursor-pointer select-none px-4 py-3 hover:bg-gray-50 {selectedIndex ===
            index
              ? 'bg-gray-50'
              : ''}"
          >
            <button
              type="button"
              onclick={() => selectResult(result)}
              class="w-full text-left focus:outline-none"
            >
              <div class="flex items-start space-x-3">
                <span
                  class="text-lg flex-shrink-0"
                  aria-label={result.type === "city" ? "City" : "Villa"}
                >
                  {getIcon(result.type)}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  {#if result.subtitle}
                    <p class="text-sm text-gray-500 truncate">
                      {result.subtitle}
                    </p>
                  {/if}
                </div>
              </div>
            </button>
          </li>
        {/each}

        {#if showNearbyOption}
          <!-- Nearby search option -->
          <li
            role="option"
            aria-selected={selectedIndex === results.length}
            class="relative cursor-pointer select-none px-4 py-3 hover:bg-gray-50 {selectedIndex ===
            results.length
              ? 'bg-gray-50'
              : ''} {results.length > 0 ? 'border-t border-gray-100' : ''}"
          >
            <button
              type="button"
              onclick={() => {
                console.log("Nearby search button clicked");
                handleNearbySearch();
              }}
              class="w-full text-left focus:outline-none"
              disabled={isDetectingLocation}
            >
              <div class="flex items-start space-x-3">
                <span class="text-lg flex-shrink-0" aria-label="Nearby search">
                  {#if isDetectingLocation}
                    <svg
                      class="animate-spin h-5 w-5 text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
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
                  {:else}
                    📍
                  {/if}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-indigo-600 truncate">
                    {isDetectingLocation
                      ? "Mencari lokasi..."
                      : "Cari terdekat"}
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    {isDetectingLocation
                      ? "Menggunakan lokasi Anda"
                      : "Gunakan lokasi Anda untuk mencari villa terdekat"}
                  </p>
                </div>
              </div>
            </button>
          </li>
        {/if}
      </ul>
    </div>
  {:else if isOpen && searchTerm.length >= 2 && !isLoading && !showNearbyOption}
    <div
      class="absolute z-10 mt-1 w-full rounded-md bg-white py-3 px-4 shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <p class="text-sm text-gray-500">No results found</p>
    </div>
  {/if}
</div>
