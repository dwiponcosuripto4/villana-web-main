<script lang="ts">
  import { formatPrice, formatGeoLocation } from "$lib/utils/format";
  import SaveButton from "./SaveButton.svelte";
  import VillaImagePlaceholder from "./VillaImagePlaceholder.svelte";
  import BedIcon from "./icons/BedIcon.svelte";
  import HouseIcon from "./icons/HouseIcon.svelte";
  import TvIcon from "./icons/TvIcon.svelte";
  import PeopleIcon from "./icons/PeopleIcon.svelte";
  import PoolIcon from "./icons/PoolIcon.svelte";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";
  import RatingView from "./RatingView.svelte";
  import GoogleIcon from "./icons/GoogleIcon.svelte";
  import GemIcon from "./icons/GemIcon.svelte";
  import BathtubIcon from "./icons/BathtubIcon.svelte";
  import MapPinIcon from "./icons/MapPinIcon.svelte";
  import LazyImage from "./LazyImage.svelte";
  import WhatsAppIcon from "./icons/WhatsAppIcon.svelte";
  import VerifiedCheckIcon from "./icons/VerifiedCheckIcon.svelte";
  import { openWhatsAppForVilla } from "$lib/utils/whatsapp";
  import SyariahIcon from "./icons/SyariahIcon.svelte";
  import GoldCheckIcon from "./icons/GoldCheckIcon.svelte";
  import SilverCheckIcon from "./icons/SilverCheckIcon.svelte";

  interface Props {
    villa: VillaWithRelations;
    variant?: "mobile" | "desktop";
    className?: string;
    showDistance?: boolean;
    showPhoneNumber?: boolean;
    maxImages?: number;
  }

  let {
    villa,
    variant = "desktop",
    className = "",
    showDistance = false,
    showPhoneNumber = false,
    maxImages = 5,
  }: Props = $props();

  const isMobile = $derived(variant === "mobile");
  const bedroomDisplay = $derived(
    villa.bedroomMin === villa.bedroomMax
      ? `${villa.bedroomMin}`
      : `${villa.bedroomMin}-${villa.bedroomMax}`,
  );
  const personCapacityDisplay = $derived(
    villa.personCapacityMin === villa.personCapacityMax
      ? `${villa.personCapacityMin}`
      : `${villa.personCapacityMin}-${villa.personCapacityMax}`,
  );

  // Limit images for carousel
  const displayImages = $derived(villa.images.slice(0, maxImages));
  const hasMultipleImages = $derived(displayImages.length > 1);

  let activeImageIndex = $state(0);
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isDragging = false;
  let carouselElement: HTMLDivElement;

  // Image preloading system
  let preloadedImages = $state(new Set<string>());
  const loadingImages = new Set<string>();

  function preloadImage(url: string) {
    if (!url || preloadedImages.has(url) || loadingImages.has(url)) return;

    loadingImages.add(url);
    const img = new Image();

    img.onload = () => {
      preloadedImages = new Set([...preloadedImages, url]);
      loadingImages.delete(url);
    };

    img.onerror = () => {
      loadingImages.delete(url);
    };

    img.src = url;
  }

  // Preload adjacent images when active index changes
  $effect(() => {
    if (!isMobile || !hasMultipleImages) return;

    // Preload current image if not already loaded
    const currentImage = displayImages[activeImageIndex];
    if (currentImage) {
      const currentUrl = currentImage.thumbnailUrl || currentImage.imageUrl;
      preloadImage(currentUrl);
    }

    // Preload next image
    if (activeImageIndex < displayImages.length - 1) {
      const nextImage = displayImages[activeImageIndex + 1];
      if (nextImage) {
        const nextUrl = nextImage.thumbnailUrl || nextImage.imageUrl;
        preloadImage(nextUrl);
      }
    }

    // Preload previous image (for smooth backward swiping)
    if (activeImageIndex > 0) {
      const prevImage = displayImages[activeImageIndex - 1];
      if (prevImage) {
        const prevUrl = prevImage.thumbnailUrl || prevImage.imageUrl;
        preloadImage(prevUrl);
      }
    }
  });

  // Preload first two images on mount for mobile
  $effect(() => {
    if (!isMobile || !hasMultipleImages) return;

    // Preload first image
    if (displayImages[0]) {
      const firstUrl =
        displayImages[0].thumbnailUrl || displayImages[0].imageUrl;
      preloadImage(firstUrl);
    }

    // Preload second image
    if (displayImages[1]) {
      const secondUrl =
        displayImages[1].thumbnailUrl || displayImages[1].imageUrl;
      preloadImage(secondUrl);
    }
  });

  // Setup touch events with proper passive handling
  $effect(() => {
    if (!carouselElement || !isMobile || !hasMultipleImages) return;

    const element = carouselElement;

    // Add event listeners with proper passive options
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  });

  // Reset image index when villa prop changes (including re-sort)
  $effect(() => {
    // Depend on the villa object itself, not just the ID
    // This will trigger when the villa prop is reassigned during sorting
    villa; // This creates a dependency on the villa object reference
    displayImages[0]?.imageUrl; // Also depend on first image to handle image changes
    activeImageIndex = 0;
  });

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // Detect if this is a horizontal swipe
    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs(currentY - startY);

    // If horizontal movement is greater than vertical, prevent default to stop page scroll
    if (diffX > diffY && diffX > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - currentX;

    // Only trigger swipe if movement was primarily horizontal
    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs((e.changedTouches[0]?.clientY || 0) - startY);

    if (diffX > diffY && Math.abs(diff) > 50) {
      e.preventDefault();
      e.stopPropagation();

      if (diff > 0 && activeImageIndex < displayImages.length - 1) {
        activeImageIndex++;
      } else if (diff < 0 && activeImageIndex > 0) {
        activeImageIndex--;
      }
    }
  }

  function handleMouseDown(e: MouseEvent) {
    startX = e.clientX;
    isDragging = true;
    e.preventDefault();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    currentX = e.clientX;
  }

  function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - currentX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeImageIndex < displayImages.length - 1) {
        activeImageIndex++;
      } else if (diff < 0 && activeImageIndex > 0) {
        activeImageIndex--;
      }
    }
  }

  function formatDistance(distanceKm: string | number): string {
    const distance =
      typeof distanceKm === "string" ? parseFloat(distanceKm) : distanceKm;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  let isLoadingWhatsApp = $state(false);

  async function _openWhatsAppForVilla(e: MouseEvent) {
    e.preventDefault();

    if (isLoadingWhatsApp) return;

    try {
      isLoadingWhatsApp = true;

      // Call the message preparation API for tracking
      const response = await fetch("/api/message/whatsapp/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villa_id: villa.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.whatsapp_url) {
        // Open WhatsApp with the prepared URL
        window.open(result.whatsapp_url, "_blank");
      } else {
        throw new Error("Failed to prepare WhatsApp message");
      }
    } catch (error) {
      console.error("Error preparing WhatsApp message:", error);
      // Fallback to the direct method
      openWhatsAppForVilla(villa);
    } finally {
      isLoadingWhatsApp = false;
    }
  }
</script>

<article
  class="overflow-hidden {isMobile
    ? 'mb-2 bg-white'
    : 'rounded-lg bg-white border border-gray-300 border-2 hover:shadow-lg transition-all duration-300'} {className}"
>
  <a href="/villa/{villa.slug}" class="block">
    {#if displayImages.length > 0}
      <div
        class="relative {isMobile
          ? 'aspect-[1/1]'
          : 'aspect-[1/1]'} image-container-mobile"
      >
        {#if isMobile && hasMultipleImages}
          <!-- Mobile: Swipeable carousel -->
          <div
            class="relative overflow-hidden bg-gray-200 h-full touch-pan-y"
            style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"
            bind:this={carouselElement}
            role="region"
            aria-label="Image carousel"
          >
            <div
              class="flex h-full transition-transform duration-300 ease-in-out"
              style="transform: translateX(-{activeImageIndex * 100}%)"
            >
              {#each displayImages as image, index}
                {@const imageUrl = image.thumbnailUrl || image.imageUrl}
                {@const isPreloaded = preloadedImages.has(imageUrl)}
                <div class="min-w-full h-full flex-shrink-0">
                  {#if isPreloaded}
                    <!-- Preloaded images: render directly without fade effect -->
                    <div
                      class="lazy-image-container relative overflow-hidden h-full w-full"
                    >
                      <img
                        src={imageUrl}
                        alt={image.altText || villa.title}
                        referrerpolicy="no-referrer"
                        class="lazy-image h-full w-full transition-opacity duration-500 opacity-100 object-cover safari-object-cover-fix bg-gray-100"
                        style="position: absolute; top: 0; left: 0; object-position: center;"
                      />
                    </div>
                  {:else}
                    <!-- Not preloaded: use LazyImage with faster fade -->
                    <LazyImage
                      src={imageUrl}
                      alt={image.altText || villa.title}
                      className="w-full h-full object-cover bg-gray-100"
                      rootMargin={index === 0 ? "0px" : "100px"}
                      threshold={0.1}
                    />
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Indicators -->
            <div
              class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10"
            >
              {#each displayImages as _, index}
                <button
                  onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    activeImageIndex = index;
                  }}
                  class="w-2 h-2 rounded-full transition-all {activeImageIndex ===
                  index
                    ? 'bg-white w-3'
                    : 'bg-white/50'}"
                  aria-label="Go to image {index + 1}"
                />
              {/each}
            </div>
          </div>
        {:else}
          <!-- Desktop or single image: Show first image only -->
          <LazyImage
            src={displayImages[0].thumbnailUrl || displayImages[0].imageUrl}
            alt={displayImages[0].altText || villa.title}
            className="h-full w-full {isMobile
              ? 'object-cover bg-gray-100'
              : 'object-cover'}"
            rootMargin="100px"
            threshold={0.1}
          />
        {/if}
        <div
          class="bg-opacity-70 absolute {isMobile
            ? 'bottom-3 left-3 rounded-full'
            : 'bottom-5 left-5 rounded'} bg-[#292D3D]/80 px-{isMobile
            ? '3'
            : '2'} py-1 text-md font-semibold text-green-300 z-10"
        >
          {formatPrice(villa.priceMin)} - {formatPrice(villa.priceMax)}
        </div>
        <div
          class="absolute {isMobile
            ? 'bottom-3 right-3'
            : 'bottom-5 right-5'} z-20"
        >
          <SaveButton villaId={villa.id} size="sm" villaData={villa} />
        </div>
      </div>
    {:else}
      <div
        class="relative flex {isMobile
          ? 'aspect-[1/1]'
          : 'aspect-[1/1]'} items-center justify-center"
      >
        <VillaImagePlaceholder size="lg" className="w-full h-full" />
        <div
          class="bg-opacity-70 absolute {isMobile
            ? 'bottom-3 left-3 rounded-full'
            : 'bottom-5 left-5 rounded'} bg-[#292D3D]/80 px-{isMobile
            ? '3'
            : '2'} py-1 text-md font-semibold text-green-300 z-10"
        >
          {formatPrice(villa.priceMin)} - {formatPrice(villa.priceMax)}
        </div>
        <div
          class="absolute {isMobile
            ? 'bottom-3 right-3'
            : 'bottom-5 right-5'} z-20"
        >
          <SaveButton villaId={villa.id} size="sm" villaData={villa} />
        </div>
      </div>
    {/if}

    <div class="p-4">
      <p
        class="{isMobile ? '' : 'line-clamp-2'} text-xs text-gray-400 truncate"
      >
        {villa.province?.name}, {villa.city?.name}
      </p>
      <h2
        class={`${
          isMobile ? "text-lg" : "text-base"
        } font-bold text-gray-900 flex items-center gap-0.5`}
      >
        <span class="truncate line-clamp-2">
          {villa.title}
        </span>
        {#if villa.ownerId}
          <span title="Verified Villa">
            <SilverCheckIcon />
          </span>
        {/if}
        {#if villa.isSyaria}
          <span title="Syariah Compliant Villa">
            <SyariahIcon className="w-[18px] h-[18px]" />
          </span>
        {/if}
      </h2>
      <div
        class="md:flex flex-wrap justify-between items-center py-2 min-h-4 md:min-h-[45px]"
      >
        {#if villa.googleRating || villa.pvr}
          <div
            class="inline-flex gap-1 justify-start lg:justify-between *:inline-flex *:gap-1 *:items-center *:p-1 *:border *:rounded-md *:md:rounded-lg *:lg:rounded-xl *:border-gray-300"
          >
            {#if villa.pvr}
              <div
                class="{villa.googleRating
                  ? '' // 'lg:ml-3'
                  : ''} text-xs text-sky-600 font-semibold"
              >
                <GemIcon className="w-[18px] h-[18px]" />
                <div>{villa.pvr}</div>
              </div>
            {/if}
            {#if villa.googleRating}
              <div class="">
                <GoogleIcon className="w-4 h-4" />
                <RatingView
                  rating={villa.googleRating}
                  ratingCount={villa.googleRatingCount || 0}
                  size="small"
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex justify-between w-full items-center">
        <div
          class="mb-2 flex flex-wrap {isMobile
            ? 'gap-3'
            : 'gap-2'} text-{isMobile ? 'sm' : 'xs'} text-gray-600 uppercase"
        >
          <!-- Units Available with house icon -->
          <span class="flex items-center">
            <HouseIcon className="mr-1 w-4 h-4" />
            {villa.unitsCount} Units
          </span>

          {#if villa.personCapacityMin > 0 || villa.personCapacityMax > 0}
            <!-- Person Capacity with people icon -->
            <span class="flex items-center">
              <PeopleIcon className="mr-1 w-5 h-5" />
              {personCapacityDisplay} Orang
            </span>
          {/if}

          <!-- Bedrooms with bed icon -->
          <span class="flex items-center">
            <BedIcon className="mr-1" />
            {bedroomDisplay} Bed
          </span>

          {#if villa.hasPool}
            <span class="flex items-center">
              <PoolIcon className="h-4 w-4 mr-1" />
              Pool
            </span>
          {/if}

          {#if villa.hasBathtub}
            <span class="flex items-center lg:hidden">
              <BathtubIcon className="h-4 w-4 mr-1" />
              Bathtub
            </span>
          {/if}

          <!-- {#if villa.hasTv} -->
          <!--   <span class="flex items-center"> -->
          <!--     <TvIcon className="mr-1 w-4 h-4" size={24} strokeWidth={2} /> -->
          <!--     TV -->
          <!--   </span> -->
          <!-- {/if} -->
        </div>

        <!-- {#if showPhoneNumber && villa.phoneNumber} -->
        <div class="relative">
          <button
            onclick={_openWhatsAppForVilla}
            disabled={isLoadingWhatsApp}
            class="inline-flex -mt-4 cursor-pointer items-center bg-green-500 text-green-500 hover:text-white border-green-500 border-1 gap-1 hover:bg-green-600 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoadingWhatsApp}
              <div
                class="w-5 h-5 animate-spin rounded-full border-2 border-green-500 border-b-transparent"
              ></div>
            {:else}
              <WhatsAppIcon className="w-5 h-5" />
            {/if}
          </button>
          <div class="absolute" style="top: -16px; right: 15px; z-index: 10;">
            <VerifiedCheckIcon className="w-5 h-5 text-blue-500 absolute" />
          </div>
        </div>
        <!-- {/if} -->
      </div>

      <div class="flex items-center justify-between">
        <!-- <p
          class="{isMobile
            ? 'text-sm'
            : 'line-clamp-2 text-xs'} text-gray-500 flex-1"
        >
          {formatGeoLocation(villa.province?.name, villa.city?.name) ||
            villa.address}
        </p> -->

        {#if showDistance && villa.distanceKm}
          <div
            class="flex gap-2 items-center ml-2 text-xs text-blue-600 font-medium"
          >
            <span>Jarak:</span>
            <!-- <MapPinIcon className="w-3 h-3 mr-1" /> -->
            {formatDistance(villa.distanceKm)}
          </div>
        {/if}
      </div>
    </div>
  </a>
</article>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Mobile image container fixes */
  .image-container-mobile {
    position: relative;
    overflow: hidden;
  }

  /* Safari-specific mobile fixes */
  @supports (-webkit-appearance: none) {
    .image-container-mobile {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    .image-container-mobile img {
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      scale: 1.001;
    }
  }

  /* High DPI screen optimizations */
  @media screen and (-webkit-min-device-pixel-ratio: 2) {
    .image-container-mobile img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  }

  /* Touch optimization for mobile carousel */
  @media (pointer: coarse) {
    .image-container-mobile {
      touch-action: pan-y pinch-zoom;
    }
  }

  /* LazyImage styles for preloaded images consistency */
  .lazy-image-container {
    background-color: #e5e7eb; /* gray-200 */
  }

  /* Safari-specific fix for object-cover scaling issues */
  @supports (-webkit-appearance: none) {
    .safari-object-cover-fix {
      scale: 1.01;
      min-height: 100%;
    }
  }

  /* Additional mobile Safari fixes */
  @media screen and (-webkit-min-device-pixel-ratio: 2) {
    .safari-object-cover-fix {
      -webkit-transform: scale(1.001);
      transform: scale(1.001);
    }
  }
</style>
