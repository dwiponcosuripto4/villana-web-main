<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  interface Props {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    rootMargin?: string;
    threshold?: number;
    fallbackSrc?: string;
  }

  let {
    src,
    alt,
    className = "",
    placeholderClassName = "",
    rootMargin = "50px",
    threshold = 0.1,
    fallbackSrc,
  }: Props = $props();

  // Svelte 5 runes state
  let loaded = $state(false);
  let error = $state(false);
  let imageElement: HTMLImageElement;
  let observer: IntersectionObserver | null = null;

  // Reset loaded state when src changes
  $effect(() => {
    src; // Create dependency on src prop
    loaded = false;
    error = false;
  });

  // Create intersection observer
  function createIntersectionObserver(): void {
    if (!browser || observer) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
          }
        });
      },
      {
        rootMargin,
        threshold,
      },
    );
  }

  // Load the actual image
  function loadImage(): void {
    if (!imageElement || loaded) return;

    // Set up event handlers directly on the img element
    imageElement.onload = () => {
      loaded = true;
      if (observer) {
        observer.unobserve(imageElement);
      }
    };

    imageElement.onerror = () => {
      error = true;
      if (fallbackSrc && imageElement.src !== fallbackSrc) {
        imageElement.src = fallbackSrc;
        error = false; // Reset error state to try fallback
      } else {
        if (observer) {
          observer.unobserve(imageElement);
        }
      }
    };

    // Now set the src to trigger loading
    imageElement.src = src;
  }

  // Setup intersection observer when element is mounted
  function setupObserver(element: HTMLImageElement): void {
    if (!browser) {
      // For SSR, just load the image immediately
      loaded = true;
      return;
    }

    imageElement = element;
    createIntersectionObserver();

    if (observer) {
      observer.observe(element);
    }
  }

  // Cleanup
  function cleanup(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  onMount(() => {
    return cleanup;
  });

  // Determine what to show
  const showPlaceholder = $derived(!loaded && !error);
  const showImage = $derived(loaded && !error);
  const showError = $derived(error && !loaded);
</script>

<div
  class="lazy-image-container relative overflow-hidden h-full w-full {className}"
>
  <!-- Placeholder -->
  {#if showPlaceholder}
    <div
      class="placeholder absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse {placeholderClassName}"
      role="img"
      aria-label="Loading image"
    >
      <!-- Loading animation overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -translate-x-full animate-shimmer"
      ></div>
    </div>
  {/if}

  <!-- Actual Image -->
  <img
    bind:this={imageElement}
    use:setupObserver
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    {alt}
    referrerpolicy="no-referrer"
    class="lazy-image h-full w-full transition-opacity duration-500 {className.includes(
      'object-contain',
    )
      ? 'object-contain'
      : 'object-cover'} {className.includes('object-cover')
      ? 'safari-object-cover-fix'
      : ''}"
    style="position: absolute; top: 0; left: 0; object-position: center;"
  />

  <!-- Error State -->
  {#if showError}
    <div
      class="error-state absolute inset-0 bg-gray-100 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <svg
          class="h-8 w-8 mx-auto mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-xs">Image unavailable</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .lazy-image-container {
    background-color: #e5e7eb; /* gray-200 */
  }

  .animate-shimmer {
    animation: shimmer 2.5s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
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

