<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";
  import VillaCard from "./VillaCard.svelte";

  interface Props {
    items: VillaWithRelations[];
    itemHeight?: number;
    containerHeight?: number;
    overscan?: number;
    className?: string;
    showDistance?: boolean;
    showPhoneNumber?: boolean;
  }

  let {
    items,
    itemHeight = 280, // Estimated height of mobile villa card
    containerHeight = 600, // Default container height
    overscan = 3, // Number of items to render outside viewport
    className = "",
    showDistance = false,
    showPhoneNumber = false,
  }: Props = $props();

  // Svelte 5 runes state
  let scrollTop = $state(0);
  let containerElement: HTMLElement;
  let scrollElement: HTMLElement;

  // Calculate visible range
  const startIndex = $derived(
    Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
  );
  const endIndex = $derived(
    Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan,
    ),
  );
  const visibleItems = $derived(items.slice(startIndex, endIndex + 1));

  // Calculate offsets
  const totalHeight = $derived(items.length * itemHeight);
  const offsetY = $derived(startIndex * itemHeight);

  // Handle scroll events
  function handleScroll(): void {
    if (scrollElement) {
      scrollTop = scrollElement.scrollTop;
    }
  }

  // Scroll to specific item (for accessibility)
  function scrollToItem(index: number): void {
    if (!scrollElement || index < 0 || index >= items.length) return;

    const targetScrollTop = index * itemHeight;
    scrollElement.scrollTop = targetScrollTop;
    scrollTop = targetScrollTop;
  }

  // Expose scrollToItem function for parent components
  function getScrollToItem() {
    return scrollToItem;
  }

  // Intersection observer for scroll optimization
  let intersectionObserver: IntersectionObserver | null = null;

  function setupIntersectionObserver(): void {
    if (!browser || !containerElement) return;

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Optimize scroll handling when visible
            scrollElement?.addEventListener("scroll", handleScroll, {
              passive: true,
            });
          } else {
            // Remove scroll listener when not visible
            scrollElement?.removeEventListener("scroll", handleScroll);
          }
        });
      },
      { threshold: 0.1 },
    );

    intersectionObserver.observe(containerElement);
  }

  function cleanupIntersectionObserver(): void {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
  }

  // Effect to setup/cleanup
  $effect(() => {
    if (containerElement) {
      setupIntersectionObserver();
    }

    return () => {
      cleanupIntersectionObserver();
      scrollElement?.removeEventListener("scroll", handleScroll);
    };
  });

  onMount(() => {
    return () => {
      cleanupIntersectionObserver();
    };
  });
</script>

<div
  bind:this={containerElement}
  class="virtual-scroll-container {className}"
  style="height: {containerHeight}px; overflow: hidden;"
>
  <div
    bind:this={scrollElement}
    class="virtual-scroll-content"
    style="height: 100%; overflow-y: auto; overflow-x: hidden;"
    onscroll={handleScroll}
  >
    <!-- Virtual container with full height -->
    <div
      class="virtual-spacer"
      style="height: {totalHeight}px; position: relative;"
    >
      <!-- Visible items container -->
      <div
        class="virtual-items"
        style="position: absolute; top: {offsetY}px; left: 0; right: 0;"
      >
        <div class="flex flex-col space-y-4">
          {#each visibleItems as villa, index (villa.id)}
            {@const actualIndex = startIndex + index}
            <div
              class="virtual-item"
              style="min-height: {itemHeight}px;"
              data-index={actualIndex}
              role="article"
              aria-posinset={actualIndex + 1}
              aria-setsize={items.length}
            >
              <VillaCard {villa} variant="mobile" {showPhoneNumber} {showDistance} />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .virtual-scroll-container {
    position: relative;
  }

  .virtual-scroll-content {
    /* Smooth scrolling for better UX */
    scroll-behavior: smooth;
  }

  .virtual-items {
    width: 100%;
  }

  .virtual-item {
    width: 100%;
  }

  /* Ensure smooth transitions */
  .virtual-spacer {
    transition: all 100ms ease-out;
  }

  /* Hide scrollbar on mobile for cleaner look */
  @media (max-width: 768px) {
    .virtual-scroll-content {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }

    .virtual-scroll-content::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }
</style>

