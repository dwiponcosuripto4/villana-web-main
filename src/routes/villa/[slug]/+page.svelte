<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { formatCityName, formatPrice, toTitleCase } from "$lib/utils/format";
  import SaveButton from "$lib/components/SaveButton.svelte";
  import SavedVillasBadge from "$lib/components/SavedVillasBadge.svelte";
  import CompareModal from "$lib/components/CompareModal.svelte";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import { swipe } from "$lib/actions/swipe";
  import BedIcon from "$lib/components/icons/BedIcon.svelte";
  import HouseIcon from "$lib/components/icons/HouseIcon.svelte";
  import AirCondIcon from "$lib/components/icons/AirCondIcon.svelte";
  import BathtubIcon from "$lib/components/icons/BathtubIcon.svelte";
  import TvIcon from "$lib/components/icons/TvIcon.svelte";
  import PeopleIcon from "$lib/components/icons/PeopleIcon.svelte";
  import CategoryIconMapper from "$lib/components/CategoryIconMapper.svelte";
  import { groupAmenitiesByCategory } from "$lib/utils/amenity-categories";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { recentlyViewedVillas } from "$lib/stores/recentlyViewedVillas";
  import { page } from "$app/stores";
  import * as m from "$lib/paraglide/messages.js";
  import {
    siteConfig,
    getAbsoluteUrl,
    formatMetaDescription,
  } from "$lib/config/site";
  import moment from "moment";
  import BackIcon from "$lib/components/icons/BackIcon.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import type { SearchResult } from "$lib/server/services/search.service";
  import { goto } from "$app/navigation";
  import Footer from "$lib/components/Footer.svelte";
  import BreakfastIcon from "$lib/components/icons/BreakfastIcon.svelte";
  import RatingView from "$lib/components/RatingView.svelte";
  import FlagIcon from "$lib/components/icons/FlagIcon.svelte";
  import PencilEditIcon from "$lib/components/icons/PencilEditIcon.svelte";
  import GoogleIcon from "$lib/components/icons/GoogleIcon.svelte";
  import GemIcon from "$lib/components/icons/GemIcon.svelte";
  import MobileSidebar from "$lib/components/MobileSidebar.svelte";
  import PVRInfoModal from "$lib/components/PVRInfoModal.svelte";
  import NearbyPlaces from "$lib/components/NearbyPlaces.svelte";
  import VillaPlaces from "$lib/components/VillaPlaces.svelte";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import PoolIcon from "$lib/components/icons/PoolIcon.svelte";
  import { openWhatsAppForVilla } from "$lib/utils/whatsapp";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
  import {
    generateVillaSchema,
    generateOrganizationSchema,
  } from "$lib/utils/schema";
  import NearbyPlacesManager from "$lib/components/admin/NearbyPlacesManager.svelte";
  import ImageLightbox from "$lib/components/ImageLightbox.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";
  import OtaLinksSection from "$lib/components/OtaLinksSection.svelte";
  import SilverCheckIcon from "$lib/components/icons/SilverCheckIcon.svelte";
  import SyariahIcon from "$lib/components/icons/SyariahIcon.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let user = $derived($page.data.user);

  // Calculate relative time for last updated
  let lastUpdatedData = $derived(() => {
    const updatedMoment = moment(data.villa.updatedAt);
    const daysDiff = moment().diff(updatedMoment, "days");

    // Only show last updated if within 30 days
    const showLastUpdated = daysDiff <= 30;

    let lastUpdatedText = "";
    if (showLastUpdated) {
      if (daysDiff > 3) {
        // Show both relative time and actual date/time for older listings
        lastUpdatedText = `${updatedMoment.fromNow()} (${updatedMoment.format("MMM D, YYYY [at] h:mm A")})`;
      } else {
        // Show only relative time for recent listings
        lastUpdatedText = updatedMoment.fromNow();
      }
    }

    return { showLastUpdated, lastUpdatedText };
  });

  let showLastUpdated = $derived(lastUpdatedData.showLastUpdated);
  let lastUpdatedText = $derived(lastUpdatedData.lastUpdatedText);

  // Group amenities by category for display with icons
  let groupedAmenities = $derived(
    groupAmenitiesByCategory(data.villa.amenities),
  );

  let currentMediaIndex = $state(0);
  let showMediaModal = $state(false);
  let mapElement: HTMLDivElement;
  let showCompareModal = $state(false);
  let swipeOffset = $state(0);
  let isTransitioning = $state(false);
  let isDragging = $state(false);
  let isResetting = $state(false);
  let mobileMenuOpen = $state(false);
  let navbarSearchFocused = $state(false);
  let fullScreenSearchElement: HTMLElement;
  let showPVRInfoModal = $state(false);

  // Combine images and videos into a single media array sorted by orderIndex
  let mediaItems = $derived(
    [
      ...data.villa.images.map((img) => ({ ...img, type: "image" })),
      ...(data.villa.videos || []).map((vid) => ({ ...vid, type: "video" })),
    ].sort((a, b) => a.orderIndex - b.orderIndex),
  );

  // Track this villa as recently viewed
  $effect(() => {
    if (data.villa?.id) {
      recentlyViewedVillas.add(data.villa.id);
    }
  });

  // Ensure currentMediaIndex stays within bounds when mediaItems changes
  $effect(() => {
    if (mediaItems.length > 0 && currentMediaIndex >= mediaItems.length) {
      currentMediaIndex = 0;
      swipeOffset = 0;
    }
  });

  function nextMedia() {
    if (isTransitioning || isResetting || mediaItems.length === 0) return;

    isTransitioning = true;
    swipeOffset = 0;
    currentMediaIndex = (currentMediaIndex + 1) % mediaItems.length;

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function prevMedia() {
    if (isTransitioning || isResetting || mediaItems.length === 0) return;

    isTransitioning = true;
    swipeOffset = 0;
    currentMediaIndex =
      currentMediaIndex === 0 ? mediaItems.length - 1 : currentMediaIndex - 1;

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function handleSwipeStart() {
    if (isTransitioning || isResetting) {
      return;
    }

    isDragging = true;
    swipeOffset = 0;
  }

  function handleSwipeMove(event: CustomEvent) {
    const { deltaX } = event.detail;

    if (!isDragging) {
      return;
    }

    if (
      !isTransitioning &&
      !isResetting &&
      isDragging &&
      mediaItems.length > 1
    ) {
      // Limit swipe offset to prevent extreme movements
      const maxOffset = window.innerWidth * 0.5;
      swipeOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    }
  }

  function handleSwipeEnd(event: CustomEvent) {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    if (isTransitioning || isResetting) {
      swipeOffset = 0;
      return;
    }

    // If the swipe was not significant enough, treat as a tap
    const threshold = 30;
    const { deltaX = 0, deltaY = 0 } = event.detail || {};
    const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);

    if (Math.abs(swipeOffset) < threshold && totalMovement < 10) {
      // This was a tap, not a swipe - open the modal
      swipeOffset = 0;
      openMediaModal(currentMediaIndex);
    } else if (Math.abs(swipeOffset) < threshold) {
      resetCarouselPosition();
    } else {
      // The swipe gesture will trigger handleSwipeLeft/Right, so just reset offset
      swipeOffset = 0;
    }
  }

  function handleSwipeCancel() {
    const hadOffset = Math.abs(swipeOffset) > 0;

    // Force clean up all states on cancel
    isDragging = false;

    // If we had an offset when cancelled, smoothly reset to current position
    if (hadOffset && !isTransitioning && !isResetting) {
      resetCarouselPosition();
    } else {
      // Just clear the offset immediately if no animation needed
      swipeOffset = 0;
    }
  }

  function resetCarouselPosition() {
    if (isResetting) {
      return;
    }

    isResetting = true;

    setTimeout(() => {
      swipeOffset = 0;
      isResetting = false;
    }, 300);
  }

  // Track if swipe had significant movement (to distinguish tap from swipe)
  let hadSignificantSwipe = $state(false);

  function handleSwipeLeft() {
    if (isTransitioning || isResetting) {
      return;
    }

    hadSignificantSwipe = true;
    isDragging = false;
    swipeOffset = 0;
    nextMedia();
  }

  function handleSwipeRight() {
    if (isTransitioning || isResetting) {
      return;
    }

    hadSignificantSwipe = true;
    isDragging = false;
    swipeOffset = 0;
    prevMedia();
  }

  function openMediaModal(index: number) {
    if (index >= 0 && index < mediaItems.length) {
      currentMediaIndex = index;
      showMediaModal = true;
      // Reset any ongoing carousel state
      swipeOffset = 0;
      isDragging = false;
      isTransitioning = false;
      isResetting = false;
    }
  }

  function handleMediaTap(index: number) {
    // Only open modal if it was a tap, not a swipe
    if (!hadSignificantSwipe) {
      openMediaModal(index);
    }
    hadSignificantSwipe = false;
  }

  function closeMediaModal() {
    showMediaModal = false;
    // Reset carousel state when closing modal
    swipeOffset = 0;
    isDragging = false;
    isTransitioning = false;
    isResetting = false;
  }

  function shareVilla() {
    if (navigator.share) {
      navigator.share({
        title: data.villa.title,
        text: `Check out this villa: ${data.villa.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  }

  function callPhone() {
    window.location.href = `tel:${data.villa.phoneNumber}`;
  }

  let isLoadingWhatsApp = $state(false);

  async function _openWhatsApp(messageType: string) {
    if (isLoadingWhatsApp) return;

    try {
      isLoadingWhatsApp = true;

      // Call the message preparation API
      const response = await fetch("/api/message/whatsapp/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villa_id: data.villa.id,
          message_type: messageType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.whatsapp_url) {
        // Open WhatsApp with the prepared URL
        //window.open(result.whatsapp_url, "_blank");
        window.location.href = result.whatsapp_url;
      } else {
        throw new Error("Failed to prepare WhatsApp message");
      }
    } catch (error) {
      console.error("Error preparing WhatsApp message:", error);
      // Fallback to the direct method
      openWhatsAppForVilla(data.villa);
    } finally {
      isLoadingWhatsApp = false;
    }
  }

  // Handle scroll position on navigation
  afterNavigate(({ from, to }) => {
    // Don't scroll if only nearbyPage param changed (pagination)
    const fromNearbyPage = from?.url.searchParams.get("nearbyPage");
    const toNearbyPage = to.url.searchParams.get("nearbyPage");

    if (
      from?.url.pathname === to.url.pathname &&
      fromNearbyPage !== toNearbyPage
    ) {
      // This is just a pagination change, don't scroll
      return;
    }

    // Only scroll to top if coming from explore page, search, or direct access
    // Preserve scroll position for back navigation from similar villas
    const shouldScrollToTop =
      !from || // Direct access (e.g., page reload, external link)
      from.url.pathname === "/explore" || // From explore page
      from.url.pathname.startsWith("/search") || // From search pages
      from.url.searchParams.has("search") || // From search results
      // Also scroll to top if coming from a different domain/host
      from.url.origin !== to.url.origin;

    if (shouldScrollToTop) {
      // Use a small delay to ensure the page is fully rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
    // If coming from another villa page (similar villas), preserve scroll position
    // Browser will handle this automatically via default scroll restoration
  });

  onMount(async () => {
    // Initialize Google Map if coordinates are available
    if (
      data.villa.latitude &&
      data.villa.longitude &&
      typeof google !== "undefined"
    ) {
      const map = new google.maps.Map(mapElement, {
        center: {
          lat: Number(data.villa.latitude),
          lng: Number(data.villa.longitude),
        },
        zoom: 15,
      });
      new google.maps.Marker({
        position: {
          lat: Number(data.villa.latitude),
          lng: Number(data.villa.longitude),
        },
        map: map,
        title: data.villa.title,
      });
    }

    // Load saved villas for authenticated user
    if (user) {
      await savedVillas.loadFromServer(user);
    }
  });

  function openCompareModal() {
    showCompareModal = true;
  }

  function closeCompareModal() {
    showCompareModal = false;
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function openPVRInfoModal() {
    showPVRInfoModal = true;
  }

  function closePVRInfoModal() {
    showPVRInfoModal = false;
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

  function handleNavbarSearchBlur(event?: Event) {
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

  let selectedResult = $state<SearchResult | null>(null);
  let showLocationError = $state(false);

  function handleSearchSelect(result: SearchResult) {
    console.log("Search result selected:", result);
    selectedResult = result;
    showLocationError = false;
  }

  function handleSearchSubmit(result: SearchResult) {
    console.log("Search result submitted:", result);
    if (result.type === "city" && result.data.cityId) {
      goto(`/explore?city=${result.data.cityId}`);
    } else if (result.type === "villa" && result.data.villaId) {
      goto(`/villa/${result.data.villa?.slug || result.data.villaId}`);
    }
  }

  function handleEnterInSearch(searchTerm: string) {
    if (searchTerm && searchTerm.trim().length >= 2) {
      console.log("Free text search submitted:", searchTerm);
      const params = new URLSearchParams();
      params.set("search", searchTerm.trim());
      goto(`/explore?${params.toString()}`);
    }
  }

  function handleBackButton() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }

  function gotoGoogleMaps() {
    if (data.villa.googleMapsLink) {
      window.location.href = data.villa.googleMapsLink;
    }
  }

  // SEO data preparation
  let bedroomText = $derived(
    data.villa.bedroomMin === data.villa.bedroomMax
      ? `${data.villa.bedroomMin} bedroom${data.villa.bedroomMin > 1 ? "s" : ""}`
      : `${data.villa.bedroomMin}-${data.villa.bedroomMax} bedrooms`,
  );

  let seoTitle = $derived(`${data.villa.title} - ${bedroomText} Villa`);
  let seoDescription = $derived(
    formatMetaDescription(
      data.villa.description,
      `${data.villa.title} - ${bedroomText} villa in ${data.villa.address}. ${data.villa.unitsCount} units available from ${formatPrice(Number(data.villa.priceMin))}.`,
    ),
  );
  let primaryImage = $derived(
    data.ogImageUrl ||
      (data.villa.images?.length > 0
        ? data.villa.images[0].imageUrl
        : siteConfig.openGraph.defaultImage),
  );
  let imageAlt = $derived(
    data.villa.images?.length > 0 && data.villa.images[0].altText
      ? `${data.villa.images[0].altText} - ${data.villa.title}`
      : `${data.villa.title} - Villa in ${data.villa.address}`,
  );
  // When using Thumbor OG image, use its dimensions and JPEG format
  let imageType = $derived(
    data.ogImageUrl
      ? "image/jpeg"
      : data.villa.images?.length > 0 && data.villa.images[0].imageType
        ? getMimeTypeByName(data.villa.images[0])
        : "image/jpeg",
  );
  let imageWidth = $derived(data.ogImageUrl ? 1200 : undefined);
  let imageHeight = $derived(data.ogImageUrl ? 630 : undefined);

  // Breadcrumb navigation
  let breadcrumbs = $derived([
    { name: "Explore", url: "/explore" },
    ...(data.villa.city
      ? [
          {
            name: formatCityName(data.villa.city.name),
            url: `/explore?search=${encodeURIComponent(data.villa.city.name.toLowerCase())}`,
          },
        ]
      : []),
    { name: data.villa.title, url: `/villa/${data.villa.slug}`, current: true },
  ]);
  let cityId = $derived(data.villa.city?.id || null);
  let cityName = $derived(data.villa.city?.name || "");

  // Schema.org structured data
  let villaSchema = $derived(generateVillaSchema(data.villa));
  let organizationSchema = $derived(generateOrganizationSchema());

  // Keywords for SEO
  let keywords = $derived(
    [
      data.villa.title,
      "villa",
      "accommodation",
      "sewa villa jogja wonosobo",
      bedroomText,
      data.villa.address,
      "Indonesia",
      "vacation rental",
      "holiday villa",
      "liburan murah",
    ]
      .filter(Boolean)
      .join(", "),
  );

  function getMimeTypeByName(name: string): string {
    if (!name) return "image/jpeg";
    let s = name.split("?");
    s = s[0].split(".");
    const ext = s.pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return "image/jpeg";
    }
  }
</script>

<!-- SEO Meta Tags -->
<SEOHead
  title={seoTitle}
  description={seoDescription}
  {keywords}
  image={primaryImage}
  {imageAlt}
  {imageType}
  {imageWidth}
  {imageHeight}
  type="product"
  price={data.villa.priceMin?.toString()}
  currency="IDR"
  availability="https://schema.org/InStock"
  address={data.villa.address}
  latitude={data.villa.latitude?.toString()}
  longitude={data.villa.longitude?.toString()}
  rating={data.villa.googleRating}
  ratingCount={data.villa.googleRatingCount}
  structuredData={[villaSchema, organizationSchema]}
  modifiedTime={data.villa.updatedAt}
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
        <!-- Logo for all screen sizes -->
        <div class="flex items-center space-x-4">
          <a href="/" class="flex items-center hover:opacity-90">
            <img
              src="/images/logo-villana-with-name-beta.svg"
              alt="Villana Logo"
              class="w-[64px] md:w-[96px] md:max-w-[128px]"
            />
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
        <div class="flex items-center space-x-3">
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
          <div class="hidden lg:flex lg:items-center lg:space-x-3">
            {#if data.user}
              <!-- Authenticated user menu -->
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
  {#if navbarSearchFocused}
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
        placeholder="Search for a city or villa..."
        onselect={handleSearchSelect}
        onsubmit={handleSearchSubmit}
        onfreetext={handleEnterInSearch}
        class="w-full shadow-xl"
        onblur={handleFullScreenSearchBlur}
        autoFocus={true}
      />
    </div>
  {/if}

  <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumbs items={breadcrumbs} className="mb-6" />

    <div class="lg:grid lg:grid-cols-2 lg:gap-8">
      <!-- Media Gallery -->
      <div>
        {#if mediaItems.length > 0}
          <div class="relative overflow-hidden rounded-lg touch-none">
            <div
              class="carousel-container relative {isDragging && !isResetting
                ? ''
                : 'transition-transform duration-300 ease-out'}"
              style="transform: translateX(calc(-{currentMediaIndex *
                100}% + {swipeOffset}px))"
              use:swipe={{ threshold: 30, touchAction: "pan-y" }}
              onswipeleft={handleSwipeLeft}
              onswiperight={handleSwipeRight}
              onswipemove={handleSwipeMove}
              onswipestart={handleSwipeStart}
              onswipeend={handleSwipeEnd}
              onswipecancel={handleSwipeCancel}
            >
              <div class="flex">
                {#each mediaItems as mediaItem, index}
                  <div
                    id={`MediaItem-${index}`}
                    class="w-full flex-shrink-0 cursor-pointer"
                    style="min-width: 100%"
                    onclick={() => handleMediaTap(index)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) =>
                      e.key === "Enter" && handleMediaTap(index)}
                  >
                    {#if mediaItem.type === "image"}
                      <img
                        src={mediaItem.imageUrl}
                        alt={mediaItem.altText || data.villa.title}
                        class="h-96 w-full rounded-lg object-cover lg:h-[500px]"
                      />
                    {:else}
                      <div class="relative h-96 w-full rounded-lg lg:h-[500px]">
                        <img
                          src={mediaItem.thumbnailUrl ||
                            "/placeholder-video.jpg"}
                          alt={mediaItem.altText || data.villa.title}
                          class="h-full w-full rounded-lg object-cover"
                        />
                        <div
                          class="absolute inset-0 flex items-center justify-center"
                        >
                          <div class="bg-black bg-opacity-60 rounded-full p-4">
                            <svg
                              class="h-12 w-12 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            {#if mediaItems.length > 1}
              <button
                onclick={prevMedia}
                class="media-button absolute top-1/2 left-4 -translate-y-1/2 transform rounded-full p-2 text-white z-10"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onclick={nextMedia}
                class="media-button absolute top-1/2 right-4 -translate-y-1/2 transform rounded-full p-2 text-white z-10"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <div
                class="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2"
              >
                {#each mediaItems as _, index}
                  <button
                    onclick={() => {
                      if (
                        !isTransitioning &&
                        !isResetting &&
                        index >= 0 &&
                        index < mediaItems.length
                      ) {
                        swipeOffset = 0;
                        isDragging = false;
                        currentMediaIndex = index;
                      }
                    }}
                    class={`h-2 w-2 rounded-full ${currentMediaIndex === index ? "bg-white" : "bg-opacity-50 bg-white"}`}
                  />
                {/each}
              </div>
            {/if}
          </div>
          {#if mediaItems.length > 1}
            <div class="mt-4 grid grid-cols-4 gap-2">
              {#each mediaItems.slice(0, 4) as mediaItem, index}
                <button onclick={() => openMediaModal(index)} class="relative">
                  {#if mediaItem.type === "image"}
                    <img
                      src={mediaItem.thumbnailUrl || mediaItem.imageUrl}
                      alt={mediaItem.altText || data.villa.title}
                      class="h-20 w-full rounded object-cover"
                    />
                  {:else}
                    <div class="relative h-20 w-full">
                      <img
                        src={mediaItem.thumbnailUrl || "/placeholder-video.jpg"}
                        alt={mediaItem.altText || data.villa.title}
                        class="h-20 w-full rounded object-cover"
                      />
                      <div
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <div class="bg-black bg-opacity-60 rounded-full p-1">
                          <svg
                            class="h-4 w-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  {/if}
                  {#if index === 3 && mediaItems.length > 4}
                    <div
                      class="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded bg-black text-sm font-semibold text-white"
                    >
                      +{mediaItems.length - 4}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        {:else}
          <div
            class="flex h-96 w-full items-center justify-center rounded-lg bg-gray-200 lg:h-[500px]"
          >
            <span class="text-gray-400">No images available</span>
          </div>
        {/if}

        <!-- Description -->
        {#if data.villa.description}
          <div class="mb-6 mt-10 hidden lg:block">
            <h2 class="mb-3 text-lg font-semibold text-gray-900">
              About This Villa
            </h2>
            <p class="whitespace-pre-line text-gray-700">
              {data.villa.description}
            </p>
          </div>
        {/if}

        <!-- Nearby Places (Desktop - below description) -->
        <div class="hidden lg:block">
          <VillaPlaces
            villa={data.villa}
            villaPlaces={data.villaPlaces}
            nearbyPlaces={data.villa.nearbyPlaces}
            paginationInfo={data.villaPlacesPagination}
            currentPath="/villa/{data.villa.slug}"
          />
        </div>
      </div>

      <!-- Villa Details -->
      <div class="mt-6 lg:mt-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h1
              class="mb-2 text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1"
            >
              <span>{data.villa.title}</span>
              {#if data.villa.ownerId}
                <SilverCheckIcon />
              {/if}
              {#if data.villa.isSyaria}
                <SyariahIcon />
              {/if}
            </h1>
            {#if showLastUpdated}
              <p class="mb-3 text-sm text-gray-500">
                Last updated {lastUpdatedText}
              </p>
            {/if}

            {#if data.villa.googleRating}
              <div class="flex gap-2 justify-between">
                <div class="mb-6 border p-4 w-64 border-gray-200 rounded-lg">
                  <div class="flex gap-2">
                    <GoogleIcon />
                    <RatingView
                      rating={data.villa.googleRating}
                      ratingCount={data.villa.googleRatingCount || 1}
                    />
                  </div>
                  <div class="text-sm text-gray-600">Google Rating</div>

                  <div
                    class="text-gray-900 flex flex-col cursor-pointer mt-2"
                    onclick={openPVRInfoModal}
                  >
                    <div
                      class="flex gap-2 items-center text-xl font-semibold text-green-600 pt-3"
                    >
                      <GemIcon />
                      {data.villa.pvr?.slice(0, 3) || "-"}
                    </div>
                    <div class="flex gap-2 items-center">
                      <div class="text-sm">P/V Ratio</div>
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="flex justify-between gap-4">
              <div class="mb-4 text-xl lg:text-2xl font-bold text-indigo-600">
                {formatPrice(data.villa.priceMin)} - {formatPrice(
                  data.villa.priceMax,
                )}
              </div>

              <div class="flex flex-wrap items-center space-x-3 ml-4">
                <SaveButton
                  villaId={data.villa.id}
                  villaData={data.villa}
                  className="w-5 h-5"
                />
                <button
                  onclick={shareVilla}
                  class="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 cursor-pointer transition-colors"
                  aria-label="Share villa"
                  title="Share this villa"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-6 w-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {#if data.villa.unitsCount > 1}
          <div class="flex items-center space-x-2 mb-5">
            <HouseIcon className="text-gray-500 w-5 h-5" />
            <span class="text-gray-700">{data.villa.unitsCount} Units</span>
          </div>
        {/if}

        <!-- Description -->
        {#if data.villa.description}
          <div class="mb-6 lg:hidden">
            <h2 class="mb-3 text-lg font-semibold text-gray-900">
              About This Villa
            </h2>
            <p class="whitespace-pre-line text-gray-700">
              {data.villa.description}
            </p>
          </div>
        {/if}

        <!-- Key Features & Facilities -->
        <div class="mb-6">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">
            {m.facility()}
          </h2>
          <div class="ml-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <!-- Key Features -->
            <div class="flex items-center space-x-2">
              <BedIcon className="text-gray-500 h-5 w-5" />
              <span class="text-gray-700"
                >{data.villa.bedroomMin === data.villa.bedroomMax
                  ? `${data.villa.bedroomMin}`
                  : `${data.villa.bedroomMin}-${data.villa.bedroomMax}`} Bedrooms</span
              >
            </div>
            {#if data.villa.bedSizes && data.villa.bedSizes.length > 0}
              <div class="flex items-center space-x-2">
                <BedIcon className="text-gray-500 h-5 w-5" />
                <span class="text-gray-700">
                  {#each data.villa.bedSizes as bedSize, index}
                    {bedSize.quantity > 1
                      ? `${bedSize.quantity}x `
                      : ""}{bedSize.bedSize}{index <
                    data.villa.bedSizes.length - 1
                      ? ", "
                      : ""}
                  {/each}
                </span>
              </div>
            {/if}

            {#if data.villa.personCapacityMin > 0 || data.villa.personCapacityMax > 0}
              <div class="flex items-center space-x-2">
                <PeopleIcon className="text-gray-500 h-6 w-6" />
                <span class="text-gray-700">
                  {data.villa.personCapacityMin === data.villa.personCapacityMax
                    ? `${data.villa.personCapacityMin}`
                    : `${data.villa.personCapacityMin}-${data.villa.personCapacityMax}`}
                  Orang
                </span>
              </div>
            {/if}

            <!-- Standard Amenities -->
            {#if data.villa.hasAc}
              <div class="flex items-center space-x-2">
                <AirCondIcon />
                <span class="text-gray-700">{m.air_cond()}</span>
              </div>
            {/if}
            {#if data.villa.hasBathtub}
              <div class="flex items-center space-x-2">
                <BathtubIcon />
                <span class="text-gray-700">Bathtub</span>
              </div>
            {/if}
            {#if data.villa.hasTv}
              <div class="flex items-center space-x-2">
                <TvIcon className="h-5 w-5" />
                <span class="text-gray-700">TV</span>
              </div>
            {/if}
            {#if data.villa.hasBreakfast}
              <div class="flex items-center space-x-2">
                <BreakfastIcon className="h-5 w-5" />
                <span class="text-gray-700">Breakfast</span>
              </div>
            {/if}
            {#if data.villa.hasPool}
              <div class="flex items-center space-x-2">
                <PoolIcon className="h-5 w-5" />
                <span class="text-gray-700">Kolam Renang</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Custom Amenities / Additional Facility -->
        {#if data.villa.amenities.length > 0}
          <div class="border-t border-gray-200 pt-6"></div>
          <div class="mb-6">
            <div class="gap-y-4">
              {#each Object.entries(groupedAmenities) as [category, amenities]}
                {#if amenities.length > 0}
                  <div class="space-y-4 mb-4">
                    <!-- Category Header -->

                    <!-- Amenity Items -->
                    <div class="flex space-y-3 pl-4">
                      <CategoryIconMapper
                        {category}
                        size={24}
                        className="text-gray-700 h-6 w-6"
                      />
                      <div class="w-96">
                        {#each amenities as amenity}
                          <div class="flex ml-4 mb-2">
                            <div class="flex-1">
                              <span class="text-gray-900">{amenity.name}</span>
                              {#if amenity.description}
                                <p
                                  class="text-gray-500 text-sm mt-1 leading-relaxed"
                                >
                                  {amenity.description}
                                </p>
                              {/if}
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <!-- Location -->
        <div class="mb-6">
          <h2 class="mb-3 text-lg font-semibold text-gray-900">
            {m.location()}
          </h2>
          <p class="mb-3 text-gray-700">{data.villa.address}</p>
        </div>

        <!-- Action Buttons -->
        <div class="mb-6 flex items-center gap-4 justify-between">
          <div class="w-1/2 m-auto space-y-3">
            {#if data.villa.googleMapsLink}
              <button
                onclick={gotoGoogleMaps}
                class="inline-flex w-full items-center rounded-lg bg-blue-600 px-4 py-3 cursor-pointer text-white transition-colors hover:bg-blue-700"
              >
                <svg
                  class="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                Google Maps
              </button>
            {/if}

            <!-- {#if data.villa.latitude && data.villa.longitude} -->
            <!-- 	<div bind:this={mapElement} class="w-full h-64 bg-gray-200 rounded-lg"></div> -->
            <!-- {/if} -->
          </div>

          <button
            onclick={openCompareModal}
            class="flex w-1/2 items-center space-x-2 rounded-lg bg-orange-600 px-4 py-3 font-medium text-white hover:bg-orange-500 cursor-pointer transition-colors relative text-white font-semibold rounded-lg bg-black border-2
  "
            title="Bandingkan dengan villa lain"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>{m.compare()}</span>
          </button>
        </div>

        <!-- Contact Buttons -->
        <div class="flex space-x-4">
          <button
            onclick={() => _openWhatsApp("owner")}
            disabled={isLoadingWhatsApp}
            class="flex flex-1 items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoadingWhatsApp}
              <div
                class="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent"
              ></div>
            {:else}
              <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                />
              </svg>
            {/if}
            WhatsApp Owner
          </button>
        </div>

        <!-- OTA Links Section -->
        {#if data.otaLinks && data.otaLinks.length > 0}
          <OtaLinksSection villaId={data.villa.id} otaLinks={data.otaLinks} />
        {/if}

        <!-- Nearby Places (Mobile - below buttons) -->
        <div class="mt-5 lg:hidden">
          <div class="border-t border-gray-200 pt-6"></div>
          <VillaPlaces
            villa={data.villa}
            villaPlaces={data.villaPlaces}
            nearbyPlaces={data.villa.nearbyPlaces}
            paginationInfo={data.villaPlacesPagination}
            currentPath="/villa/{data.villa.slug}"
          />
        </div>

        <!-- Report, Request Changes, and Claim Villa -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div
            class="flex items-center justify-center space-x-6 flex-wrap gap-y-2"
          >
            <a
              href="/villa/{data.villa.slug}/report"
              class="inline-flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Report an issue with this villa"
            >
              <FlagIcon />
              <span class="text-sm">Report</span>
            </a>
            <a
              href="/villa/{data.villa.slug}/request-changes"
              class="inline-flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
              title="Request changes to this villa listing"
            >
              <PencilEditIcon className="h-5 w-5" />
              <span class="text-sm">Request Changes</span>
            </a>
            {#if data.isClaimable}
              <button
                onclick={() => {
                  if (user) {
                    window.location.href = `/villa/${data.villa.slug}/claim`;
                  } else {
                    window.location.href = `/login?redirect=/villa/${data.villa.slug}/claim`;
                  }
                }}
                class="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                title="Claim ownership of this villa"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span class="text-sm">Claim</span>
              </button>
            {/if}
            {#if data.isAdmin}
              <a
                href="/admin/villas/{data.villa.id}"
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
      </div>
    </div>

    <!-- Other Villas -->
    {#if data.otherVillas.length > 0}
      <div class="mt-12">
        <h2 class="mb-6 text-2xl font-bold text-gray-900">Other Villas</h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          {#each data.otherVillas as villa (villa.id)}
            <VillaCard
              {villa}
              variant="desktop"
              showDistance={villa.distanceKm != null}
            />
          {/each}
        </div>
      </div>
      {#if cityId && data.otherVillas.length > 0}
        <div>
          <a
            href={`/explore?city=${cityId}`}
            class="mt-6 inline-block text-blue-600 hover:underline"
            >Cari villa lainnya di {toTitleCase(cityName)} &rarr;</a
          >
        </div>
      {/if}
    {/if}
  </main>

  <div
    class="mt-5 bg-gray-50 top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
      <div class="flex gap-4 h-16 items-center justify-between">
        <!-- Mobile: Back button, Desktop: Villana brand -->
        <div class="flex gap-4 items-center">
          <BackIcon className="text-white" />
          <a
            href="/explore"
            class="text-xl font-bold text-white hover:text-blue-100"
          >
            Back
          </a>
        </div>
      </div>
    </div>
  </div>

  <Footer user={data.user} />

  <!-- Media Modal -->
  <ImageLightbox
    mediaItems={mediaItems.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      thumbnailUrl: item.thumbnailUrl,
      altText: item.altText || data.villa.title,
      type: item.type as "image" | "video",
    }))}
    currentIndex={currentMediaIndex}
    isOpen={showMediaModal}
    onClose={closeMediaModal}
  />

  <!-- Compare Modal -->
  {#if showCompareModal}
    <CompareModal
      currentVillaSlug={data.villa.slug}
      onClose={closeCompareModal}
    />
  {/if}

  <!-- Mobile Sidebar -->
  <MobileSidebar
    isOpen={mobileMenuOpen}
    user={data.user}
    onClose={closeMobileMenu}
  />

  <!-- PVR Info Modal -->
  {#if showPVRInfoModal}
    <PVRInfoModal
      currentPVR={data.villa.pvr?.slice(0, 3)}
      onClose={closePVRInfoModal}
    />
  {/if}
</div>

<style>
  .media-button {
    background-color: rgba(0, 0, 0, 0.3);
    transition: background-color 0.2s ease;
  }

  .media-button:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }

  .carousel-container,
  .modal-carousel-container {
    cursor: grab;
    will-change: transform;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: pan-y pinch-zoom;
  }

  .carousel-container:active,
  .modal-carousel-container:active {
    cursor: grabbing;
  }

  @media (hover: none) {
    .carousel-container,
    .modal-carousel-container {
      cursor: default;
    }
  }

  .carousel-container img,
  .carousel-container video,
  .modal-carousel-container img {
    pointer-events: none;
    -webkit-user-drag: none;
    user-drag: none;
    -webkit-user-select: none;
    user-select: none;
  }

  /* Modal videos need pointer events for controls */
  .modal-carousel-container .modal-video {
    pointer-events: auto;
    -webkit-user-drag: none;
    user-drag: none;
    -webkit-user-select: none;
    user-select: none;
  }
  @keyframes glow {
    0%,
    100% {
      box-shadow:
        0 0 10px 2px rgba(255, 215, 0, 0.6),
        0 0 20px 4px rgba(255, 215, 0, 0.4);
      border-color: rgba(255, 215, 0, 1);
    }
    50% {
      box-shadow:
        0 0 25px 5px rgba(255, 215, 0, 1),
        0 0 35px 8px rgba(255, 215, 0, 0.8);
      border-color: rgba(255, 215, 0, 0.8);
    }
  }

  .glow-gold {
    animation: glow 2s ease-in-out infinite;
  }
</style>
