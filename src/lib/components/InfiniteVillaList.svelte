<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import VillaCard from "./VillaCard.svelte";
  import VillaLoadingSkeleton from "./VillaLoadingSkeleton.svelte";
  import LoadMoreButton from "./LoadMoreButton.svelte";
  import VirtualScrollList from "./VirtualScrollList.svelte";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";

  interface Props {
    initialVillas: VillaWithRelations[];
    initialHasMore?: boolean;
    initialNextCursor?: string | null;
    filters?: Record<string, any>;
    autoLoadOnScroll?: boolean;
    itemsPerLoad?: number;
    updateUrl?: boolean;
    enableVirtualScroll?: boolean;
    virtualScrollThreshold?: number;
    onUpdate?: (count: number, hasMore: boolean) => void;
    showDistance?: boolean;
    showPhoneNumber?: boolean;
  }

  let {
    initialVillas,
    initialHasMore = false,
    initialNextCursor = null,
    filters = {},
    autoLoadOnScroll = true,
    itemsPerLoad = 20,
    updateUrl = false,
    enableVirtualScroll = true,
    virtualScrollThreshold = 50,
    onUpdate,
    showDistance = false,
    showPhoneNumber = false,
  }: Props = $props();

  // Svelte 5 runes state
  let villas = $state<VillaWithRelations[]>(initialVillas);
  let loading = $state(false);
  let hasMore = $state(initialHasMore);
  let nextCursor = $state<string | null>(initialNextCursor);
  let error = $state<string | null>(null);
  let retryCount = $state(0);

  // Accessibility state
  let feedAnnouncement = $state<string>("");
  let lastFocusedIndex = $state<number>(-1);

  // Intersection observer target for infinite scroll
  let loadTrigger: HTMLElement;
  let intersectionObserver: IntersectionObserver | null = null;
  let loadTimeout: ReturnType<typeof setTimeout> | null = null;

  // Determine when to use virtual scrolling
  const shouldUseVirtualScroll = $derived(
    enableVirtualScroll && villas.length > virtualScrollThreshold,
  );

  // Build URL parameters for API calls
  function buildParams(): string {
    const params = new URLSearchParams();

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value.toString());
      }
    });

    // Add pagination params
    params.set("paginated", "true");
    params.set("limit", itemsPerLoad.toString());

    if (nextCursor) {
      params.set("cursor", nextCursor);
    }

    return params.toString();
  }

  // Focus a specific villa card for accessibility
  function focusVillaCard(index: number): void {
    if (!browser || index < 0 || index >= villas.length) return;

    const villaCard = document.querySelector(`[data-villa-index="${index}"] a`);
    if (villaCard instanceof HTMLElement) {
      villaCard.focus();
      lastFocusedIndex = index;
    }
  }

  // Handle keyboard navigation within the feed
  function handleKeyDown(event: KeyboardEvent): void {
    if (!browser) return;

    const { key, ctrlKey, metaKey } = event;

    // Ctrl/Cmd + End: Go to end of current results
    if ((ctrlKey || metaKey) && key === "End") {
      event.preventDefault();
      const lastIndex = villas.length - 1;
      if (lastIndex >= 0) {
        focusVillaCard(lastIndex);
      }
    }

    // Ctrl/Cmd + Home: Go to beginning
    if ((ctrlKey || metaKey) && key === "Home") {
      event.preventDefault();
      focusVillaCard(0);
    }

    // Page Down: Load more content if available
    if (key === "PageDown" && hasMore && !loading) {
      event.preventDefault();
      lastFocusedIndex = villas.length - 1; // Remember position before loading
      loadMoreVillas();
    }
  }

  // Update URL with current pagination state
  function updateUrlWithPagination(): void {
    if (!browser || !updateUrl) return;

    try {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);

      // Add pagination metadata to URL
      searchParams.set("loaded", villas.length.toString());

      if (nextCursor) {
        searchParams.set("cursor", nextCursor);
      }

      // Update URL without triggering navigation
      const newUrl = `${currentUrl.pathname}?${searchParams.toString()}`;
      window.history.replaceState(
        {
          ...window.history.state,
          pagination: { cursor: nextCursor, loaded: villas.length },
        },
        "",
        newUrl,
      );
    } catch (error) {
      console.error("Error updating URL:", error);
    }
  }

  // Load more villas function
  async function loadMoreVillas(): Promise<void> {
    if (loading || !hasMore) return;

    loading = true;
    error = null;

    try {
      const url = `/api/villas/explore?${buildParams()}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.villas && Array.isArray(data.villas)) {
        // Filter out any villas that are already in the list to prevent duplicates
        const existingVillaIds = new Set(villas.map((v) => v.id));
        const newVillas = data.villas.filter(
          (villa) => !existingVillaIds.has(villa.id),
        );

        // Check if all villas were duplicates
        if (newVillas.length === 0 && data.villas.length > 0) {
          // Still update the cursor to try to move forward
          nextCursor = data.nextCursor || null;
          hasMore = data.hasMore || false;

          // If we keep getting duplicates, stop trying
          retryCount++;
          if (retryCount >= 2) {
            hasMore = false;
          } else {
            // Try loading again with the new cursor after a delay
            setTimeout(() => {
              if (hasMore && !loading) {
                loadMoreVillas();
              }
            }, 500);
          }
        } else {
          // Append only new villas to existing list
          villas = [...villas, ...newVillas];
          hasMore = data.hasMore || false;
          nextCursor = data.nextCursor || null;
          retryCount = 0; // Reset retry count on successful load

          // Call the update callback if provided
          if (onUpdate) {
            onUpdate(villas.length, hasMore);
          }
        }

        // Update URL with pagination state if enabled
        if (updateUrl && browser && nextCursor) {
          updateUrlWithPagination();
        }

        // Announce new content to screen readers
        const newCount = newVillas.length;
        feedAnnouncement = `Loaded ${newCount} more villa${newCount === 1 ? "" : "s"}. ${villas.length} total villa${villas.length === 1 ? "" : "s"} now showing.`;

        // Focus management for keyboard users
        if (lastFocusedIndex >= 0 && newCount > 0) {
          // Focus the first new item
          const newItemIndex = villas.length - newCount;
          setTimeout(() => focusVillaCard(newItemIndex), 100);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load more villas";

      // Exponential backoff for retries
      retryCount++;

      // If too many retries, stop trying to load more
      if (retryCount >= 3) {
        hasMore = false;
        error = "Unable to load more villas. Please refresh the page.";
      }
    } finally {
      loading = false;
    }
  }

  // Retry with exponential backoff
  async function retry(): Promise<void> {
    // Reset error state and hasMore for retry
    error = null;
    hasMore = true;
    retryCount = Math.max(0, retryCount - 1); // Reduce retry count for manual retry

    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5s delay
    await new Promise((resolve) => setTimeout(resolve, delay));
    await loadMoreVillas();
  }

  // Setup intersection observer for auto-loading
  function setupIntersectionObserver(): void {
    if (!browser || !autoLoadOnScroll || !loadTrigger) return;

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !error) {
          // Clear any existing timeout
          if (loadTimeout) {
            clearTimeout(loadTimeout);
          }
          // Debounce loading to prevent rapid calls
          loadTimeout = setTimeout(() => {
            if (hasMore && !loading && !error) {
              loadMoreVillas();
            }
          }, 100);
        }
      },
      {
        rootMargin: "50px", // Load when trigger is 50px away from viewport (less aggressive)
        threshold: 0.1,
      },
    );

    intersectionObserver.observe(loadTrigger);
  }

  // Cleanup intersection observer
  function cleanupIntersectionObserver(): void {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
  }

  // Effect to setup/cleanup intersection observer
  $effect(() => {
    if (loadTrigger && autoLoadOnScroll) {
      // Clean up existing observer first
      cleanupIntersectionObserver();
      // Set up new observer
      setupIntersectionObserver();
    }

    return () => {
      cleanupIntersectionObserver();
    };
  });

  // Track previous filters to detect actual changes
  let previousFilters = JSON.stringify(filters);

  // Effect to reinitialize when filters change
  $effect(() => {
    const currentFilters = JSON.stringify(filters);
    if (currentFilters !== previousFilters) {
      // Only reset when filters actually change
      previousFilters = currentFilters;
      villas = initialVillas;
      hasMore = initialHasMore;
      nextCursor = initialNextCursor;
      error = null;
      retryCount = 0;
      loading = false;

      // Call the update callback if provided
      if (onUpdate) {
        onUpdate(villas.length, hasMore);
      }
    }
  });

  // Cleanup on component destroy
  onMount(() => {
    return () => {
      cleanupIntersectionObserver();
    };
  });
</script>

<!-- Villa Grid/Feed -->
<div
  class="villa-list"
  role="feed"
  aria-label="Villa listings"
  aria-live="polite"
  aria-relevant="additions"
  aria-busy={loading}
  onkeydown={handleKeyDown}
  tabindex="-1"
>
  <!-- Screen reader announcements -->
  <div class="sr-only" aria-live="assertive" aria-atomic="true">
    {feedAnnouncement}
  </div>

  <!-- Instructions for screen reader users -->
  <div class="sr-only">
    <p>
      Use Page Down to load more villas. Use Ctrl+Home to go to the beginning,
      Ctrl+End to go to the end of current results.
    </p>
  </div>

  <!-- Mobile Feed Layout (Instagram/TikTok style) -->
  <div class="md:hidden">
    {#if shouldUseVirtualScroll}
      <!-- Virtual scrolling for large datasets -->
      <VirtualScrollList
        items={villas}
        itemHeight={280}
        containerHeight={browser
          ? Math.min(window.innerHeight * 0.8, 800)
          : 600}
        overscan={3}
        className="virtual-mobile-feed"
        {showDistance}
        {showPhoneNumber}
      />
    {:else}
      <!-- Regular scrolling for smaller datasets -->
      <div class="flex flex-col space-y-4">
        {#each villas as villa, index (villa.id)}
          <div
            data-villa-index={index}
            role="article"
            aria-posinset={index + 1}
            aria-setsize={villas.length}
          >
            <VillaCard {villa} variant="mobile" {showPhoneNumber} {showDistance} />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Desktop Grid Layout (Pinterest style) -->
  <div class="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 md:block lg:px-8">
    <div class="grid grid-cols-2 gap-6 lg:grid-cols-3">
      {#each villas as villa, index (villa.id)}
        <div
          data-villa-index={index}
          role="article"
          aria-posinset={index + 1}
          aria-setsize={villas.length}
        >
          <VillaCard {villa} variant="desktop" {showPhoneNumber} {showDistance} />
        </div>
      {/each}
    </div>
  </div>

  <!-- Loading States -->
  {#if loading}
    <div
      class="loading-section"
      aria-live="polite"
      aria-label="Loading more villas"
    >
      <!-- Mobile Loading Skeletons -->
      <div class="flex flex-col space-y-4 md:hidden">
        {#each Array(3) as _, i}
          <VillaLoadingSkeleton variant="mobile" />
        {/each}
      </div>

      <!-- Desktop Loading Skeletons -->
      <div class="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 md:block lg:px-8">
        <div class="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {#each Array(8) as _, i}
            <VillaLoadingSkeleton variant="desktop" />
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error && !loading}
    <div
      class="error-section mx-auto max-w-md px-4 py-8 text-center"
      role="alert"
    >
      <div class="rounded-lg bg-red-50 p-6">
        <div class="flex items-center justify-center mb-4">
          <svg
            class="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-800 mb-2">
          Failed to load more villas
        </h3>
        <p class="text-sm text-red-600 mb-4">{error}</p>
        <button
          onclick={retry}
          class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  {/if}

  <!-- Load More Button (for desktop or manual loading) -->
  {#if hasMore && !loading && !error}
    <div class="load-more-section flex justify-center py-8">
      <!-- Show on desktop always, on mobile only if auto-scroll is disabled -->
      <div class="hidden md:block">
        <LoadMoreButton onclick={loadMoreVillas} {loading} />
      </div>
      {#if !autoLoadOnScroll}
        <div class="block md:hidden">
          <LoadMoreButton onclick={loadMoreVillas} {loading} />
        </div>
      {/if}
    </div>
  {/if}

  <!-- End of Results Message -->
  {#if !hasMore && villas.length > 0 && !loading}
    <div class="end-message mx-auto max-w-md px-4 py-8 text-center">
      <div class="rounded-lg bg-gray-50 p-6">
        <div class="flex items-center justify-center mb-4">
          <svg
            class="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">
          You've seen all villas
        </h3>
        <p class="text-sm text-gray-600">
          {villas.length} villa{villas.length === 1 ? "" : "s"} found matching your
          criteria.
        </p>
      </div>
    </div>
  {/if}

  <!-- Intersection Observer Trigger (hidden) -->
  {#if autoLoadOnScroll && !shouldUseVirtualScroll}
    <div
      bind:this={loadTrigger}
      class="intersection-trigger h-10 w-full {!hasMore || error || loading
        ? 'invisible'
        : ''}"
      aria-hidden="true"
    ></div>
  {/if}
</div>

<style>
  .villa-list {
    min-height: 100vh;
  }

  .loading-section {
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

  .intersection-trigger {
    pointer-events: none;
    visibility: hidden;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    border-width: 0;
    clip: rect(0, 0, 0, 0);
  }
</style>
