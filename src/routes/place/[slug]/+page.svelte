<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import BackIcon from "$lib/components/icons/BackIcon.svelte";
  import MapPinIcon from "$lib/components/icons/MapPinIcon.svelte";
  import RatingView from "$lib/components/RatingView.svelte";
  import GoogleIcon from "$lib/components/icons/GoogleIcon.svelte";
  import PlaceImagePlaceholder from "$lib/components/PlaceImagePlaceholder.svelte";
  import ImageLightbox from "$lib/components/ImageLightbox.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";
  import type { SearchResult } from "$lib/server/services/search.service";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
  import {
    generatePlaceSchema,
    generateOrganizationSchema,
  } from "$lib/utils/schema";
  import { formatCityName } from "$lib/utils/format";
  import FlagIcon from "$lib/components/icons/FlagIcon.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let selectedResult: SearchResult | null = $state(null);
  let navbarSearchFocused = $state(false);
  let isLightboxOpen = $state(false);
  let lightboxImageIndex = $state(0);

  const place = $derived(data.place);
  const nearbyPlaces = $derived(data.nearbyPlaces || []);

  // Sort management
  let sortBy = $state(data.sortBy || "pvr");

  // Sorting function
  function sortVillas(villasToSort: any[], sortType: string) {
    if (!villasToSort || villasToSort.length === 0) return [];

    switch (sortType) {
      case "distance":
        return [...villasToSort].sort(
          (a, b) =>
            parseFloat(a.distanceKm || "0") - parseFloat(b.distanceKm || "0"),
        );
      case "pvr":
        return [...villasToSort].sort((a, b) => (b.pvr || 0) - (a.pvr || 0));
      case "google_rating":
        return [...villasToSort].sort((a, b) => {
          const scoreA =
            (a.googleRating || 0) * Math.log((a.googleRatingCount || 0) + 1);
          const scoreB =
            (b.googleRating || 0) * Math.log((b.googleRatingCount || 0) + 1);
          return scoreB - scoreA;
        });
      case "newest":
        return [...villasToSort].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
      default:
        return villasToSort;
    }
  }

  // Sorted villas derived from place data
  const villas = $derived(sortVillas(place.villas || [], sortBy));

  const pageTitle = $derived(data.meta.title);
  const pageDescription = $derived(data.meta.description);
  const pageUrl = $derived(getAbsoluteUrl($page.url.pathname));
  const hasRealImages = $derived(
    place.images?.length &&
      place.images.some(
        (img) => img?.imageUrl && img.imageUrl !== "/images/default-place.jpg",
      ),
  );
  const primaryImage = $derived(
    data.ogImageUrl ||
      (hasRealImages
        ? place.images[0]?.imageUrl
        : place.mainImage && place.mainImage !== "/images/default-place.jpg"
          ? place.mainImage
          : null),
  );

  const images = $derived(
    hasRealImages ? place.images?.map((img) => img.imageUrl) : [],
  );

  // Convert place images to MediaItem format for lightbox
  const mediaItems = $derived(
    hasRealImages
      ? place.images?.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          thumbnailUrl: img.thumbnailUrl || img.imageUrl,
          altText: img.altText,
          type: "image" as const,
          orderIndex: img.orderIndex,
        }))
      : [],
  );

  const placeTypeDisplay = $derived(
    place.type
      ? place.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : "Place",
  );

  // SEO data preparation
  let seoTitle = $derived(`${place.name} - ${placeTypeDisplay}`);
  let seoDescription = $derived(data.meta.description);

  // Breadcrumb navigation
  let breadcrumbs = $derived([
    { name: "Home", url: "/" },
    { name: "Places", url: "/places" },
    ...(place.city
      ? [
          {
            name: formatCityName(place.city.name),
            url: `/places?city=${place.city.id}`,
          },
        ]
      : []),
    { name: place.name, url: `/place/${place.slug}`, current: true },
  ]);

  // Schema.org structured data
  let placeSchema = $derived(generatePlaceSchema(place));
  let organizationSchema = $derived(generateOrganizationSchema());

  // Keywords for SEO
  let keywords = $derived(
    [
      place.name,
      placeTypeDisplay,
      "attraction",
      "place",
      place.address,
      place.city?.name,
      place.province?.name,
      "Indonesia",
      "tourism",
      "travel",
    ]
      .filter(Boolean)
      .join(", "),
  );

  function handleSearchSelect(result: SearchResult) {
    selectedResult = result;
    if (result.type === "villa") {
      goto(`/villa/${result.slug}`);
    } else if (result.type === "city") {
      goto(`/explore?city=${result.slug}`);
    } else if (result.type === "place") {
      goto(`/place/${result.slug}`);
    }
  }

  function handleSearchSubmit(query: string) {
    goto(`/explore?q=${encodeURIComponent(query)}`);
  }

  function handleEnterInSearch(query: string) {
    goto(`/explore?q=${encodeURIComponent(query)}`);
  }

  function handleNavbarSearchFocus(focused: boolean) {
    navbarSearchFocused = focused;
  }

  function openLightbox(index: number = 0) {
    lightboxImageIndex = index;
    isLightboxOpen = true;
  }

  function closeLightbox() {
    isLightboxOpen = false;
  }

  function getPlaceTypeIcon(type: string) {
    const iconMap: Record<string, string> = {
      restaurant: "🍽️",
      beach: "🏖️",
      temple: "🛕",
      museum: "🏛️",
      park: "🌳",
      shopping: "🛍️",
      waterfall: "💧",
      mountain: "⛰️",
      lake: "🏞️",
      market: "🏪",
      tourist_attraction: "🎯",
      airport: "✈️",
      train_station: "🚂",
      bus_station: "🚌",
      hospital: "🏥",
      place_of_worship: "🕌",
    };
    return iconMap[type] || "📍";
  }

  function handleSortChange(newSortBy: string) {
    sortBy = newSortBy;
    const params = new URLSearchParams($page.url.searchParams);
    if (newSortBy !== "pvr") {
      params.set("sortBy", newSortBy);
    } else {
      params.delete("sortBy");
    }
    goto(`${$page.url.pathname}?${params.toString()}`, {
      replaceState: true,
      noScroll: true,
    });
  }

  onMount(() => {
    // Track page view analytics if needed
  });
</script>

<!-- SEO Meta Tags -->
<SEOHead
  title={seoTitle}
  description={seoDescription}
  {keywords}
  image={primaryImage}
  imageAlt={`${place.name} - ${placeTypeDisplay}`}
  type="place"
  address={place.address}
  latitude={place.latitude}
  longitude={place.longitude}
  rating={place.googleRating}
  ratingCount={place.googleRatingCount}
  structuredData={[placeSchema, organizationSchema]}
/>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header
    class="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex gap-4 h-16 items-center justify-between">
        <div class="flex items-center">
          <a
            href="/explore"
            class="text-xl font-bold text-white hover:text-blue-100"
          >
            Villana
          </a>
        </div>

        {#if !navbarSearchFocused}
          <SearchBar
            onselect={handleSearchSelect}
            onclear={() => {
              selectedResult = null;
            }}
            onfreetext={handleEnterInSearch}
            onsubmit={handleSearchSubmit}
            placeholder="Search for a city or villa..."
            class="w-64 lg:w-96"
            onfocus={handleNavbarSearchFocus}
          />
        {/if}

        <div class="flex items-center space-x-4">
          <a href="/explore" class="text-white hover:text-blue-100">
            <BackIcon className="h-6 w-6" />
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumbs items={breadcrumbs} className="mb-6" />
    <!-- Place Header -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
      <!-- Hero Image -->
      <div class="relative h-64 sm:h-96">
        {#if place.mainImage}
          <!-- Main image as banner -->
          <img
            src={place.mainImage}
            alt={`${place.name} - Main image`}
            class="w-full h-full object-cover"
            onerror={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />

          <!-- Fallback for broken main image -->
          <div class="hidden w-full h-full">
            {#if images?.length > 0}
              <img
                src={images[0]}
                alt={place.images[0]?.altText ||
                  `${place.name} - Gallery image`}
                class="w-full h-full object-cover cursor-pointer"
                onclick={() => openLightbox(0)}
              />
            {:else}
              <PlaceImagePlaceholder size="xl" className="w-full h-full" />
            {/if}
          </div>

          <!-- View Gallery hint if there are additional images -->
          {#if images?.length > 0}
            <div
              class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm cursor-pointer"
              onclick={() => openLightbox(0)}
            >
              {images.length} gallery photo{images.length > 1 ? "s" : ""} • Click
              to view
            </div>
          {/if}
        {:else if images?.length > 0}
          <img
            src={images[0]}
            alt={place.images[0]?.altText || `${place.name} - Main image`}
            class="w-full h-full object-cover cursor-pointer"
            onclick={() => openLightbox(0)}
          />

          <!-- View Gallery hint -->
          <div
            class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm"
          >
            {#if images.length > 1}
              {images.length} photos • Click to view gallery
            {:else}
              Click to expand
            {/if}
          </div>
        {:else}
          <!-- Placeholder when no images -->
          <PlaceImagePlaceholder size="xl" className="w-full h-full" />
        {/if}
      </div>

      <!-- Place Info -->
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center mb-2">
              <h1 class="text-3xl font-bold text-gray-900">{place.name}</h1>
            </div>

            <div class="flex items-center text-gray-600 mb-2">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>
                {#if place.address}
                  {place.address}
                {:else}
                  {place.city?.name || ""}{place.province?.name
                    ? `, ${place.province.name}`
                    : ""}
                {/if}
              </span>
            </div>

            {#if place.type}
              <span
                class="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                {placeTypeDisplay}
              </span>
            {/if}
          </div>

          <!-- Google Rating -->
          {#if place.googleRating}
            <div class="flex items-center bg-gray-50 rounded-lg p-3">
              <GoogleIcon className="h-5 w-5 mr-2" />
              <div>
                <RatingView rating={place.googleRating} size="small" />
                <div class="text-xs text-gray-600 mt-1">
                  {place.googleRatingCount || 0} reviews
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Description -->
        {#if place.description}
          <div class="prose max-w-none mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">
              About {place.name}
            </h2>
            <p class="text-gray-700 leading-relaxed">{place.description}</p>
          </div>
        {/if}

        <!-- Google Maps Link -->
        {#if place.googleMapsLink}
          <a
            href={place.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <GoogleIcon className="h-4 w-4 mr-2" />
            View on Google Maps
          </a>
        {/if}
      </div>
    </div>

    <!-- Photo Gallery -->
    {#if images.length > 1}
      <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Photo Gallery
          </h2>
          <ImageGallery
            images={place.images}
            onImageClick={openLightbox}
            title={null}
            maxVisible={6}
          />
        </div>
      </div>
    {/if}

    <!-- Nearby Villas -->
    {#if villas.length > 0}
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          Villa dekat {place.name}
        </h2>

        <!-- Results Summary and Sort Controls -->
        <div class="bg-white border border-gray-200 rounded-lg mb-6">
          <div class="flex items-center justify-between px-4 py-3">
            <div class="text-sm text-gray-700">
              {villas.length} villa{villas.length !== 1 ? "s" : ""} found near {place.name}
            </div>
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
                <option value="distance">Distance (Nearest First)</option>
                <option value="pvr">Best Value (PVR)</option>
                <option value="google_rating">Highest Rated</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each villas as villa (villa.id)}
            <VillaCard {villa} showDistance={true} />
          {/each}
        </div>
      </section>
    {/if}

    <!-- Nearby Places -->
    {#if nearbyPlaces.length > 0}
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Nearby Places</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each nearbyPlaces as nearbyPlace}
            <a
              href="/place/{nearbyPlace.slug}"
              class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-200"
            >
              <div class="flex items-start">
                <span class="text-xl mr-3"
                  >{getPlaceTypeIcon(nearbyPlace.type || "")}</span
                >
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    {nearbyPlace.name}
                  </h3>
                  {#if nearbyPlace.distance}
                    <p class="text-sm text-gray-600">
                      {nearbyPlace.distance}km away
                    </p>
                  {/if}
                  {#if nearbyPlace.description}
                    <p class="text-sm text-gray-700 mt-2 line-clamp-2">
                      {nearbyPlace.description}
                    </p>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Report, Request Changes, and Claim Villa -->
    <div class="my-6 pt-6 border-t border-gray-200">
      <div class="flex items-center justify-center space-x-6 flex-wrap gap-y-2">
        {#if data.isAdmin}
          <a
            href="/admin/places/{place.id}"
            class="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Edit this villa (Admin)"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span class="text-sm">Admin Edit</span>
          </a>
        {/if}
      </div>
    </div>

    <!-- Call to Action -->
    <section class="bg-blue-50 rounded-lg p-8 text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        Looking for accommodation near {place.name}?
      </h2>
      <p class="text-gray-700 mb-6">
        Discover amazing villas and accommodation options in the area.
      </p>
      <a
        href="/explore{place.city?.id ? `?city=${place.city.id}` : ''}"
        class="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Explore Villas
      </a>
    </section>
  </main>

  <!-- Footer -->
  <Footer />
</div>

<!-- Image Lightbox -->
{#if isLightboxOpen && mediaItems.length > 0}
  <ImageLightbox
    {mediaItems}
    currentIndex={lightboxImageIndex}
    isOpen={isLightboxOpen}
    onClose={closeLightbox}
  />
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
