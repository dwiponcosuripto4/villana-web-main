<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import {
    swipeable,
    type SwipeEndEventDetail,
    type SwipeStartEventDetail,
  } from '@svelte-put/swipeable';

  interface MediaItem {
    id: string;
    imageUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    altText?: string;
    type: 'image' | 'video';
    orderIndex?: number;
  }

  interface Props {
    mediaItems: MediaItem[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
  }

  let { mediaItems = [], currentIndex = 0, isOpen = false, onClose }: Props = $props();

  let activeIndex = $state(currentIndex);
  let isAnimating = $state(false);
  let isSwiping = $state(false);

  // Sync activeIndex with currentIndex prop when it changes externally
  $effect(() => {
    activeIndex = currentIndex;
  });

  function handleSwipeStart(e: CustomEvent<SwipeStartEventDetail>) {
    isSwiping = true;
  }

  function handleSwipeEnd(e: CustomEvent<SwipeEndEventDetail>) {
    const { passThreshold, direction } = e.detail;

    // Mark swiping as done first
    isSwiping = false;

    if (passThreshold) {
      if (direction === 'left' && activeIndex < mediaItems.length - 1) {
        goToIndex(activeIndex + 1);
      } else if (direction === 'right' && activeIndex > 0) {
        goToIndex(activeIndex - 1);
      }
    }
  }

  function goToIndex(index: number) {
    if (index >= 0 && index < mediaItems.length && index !== activeIndex) {
      isAnimating = true;
      activeIndex = index;
      setTimeout(() => {
        isAnimating = false;
      }, 300);
    }
  }

  function goToPrevious() {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  }

  function goToNext() {
    if (activeIndex < mediaItems.length - 1) {
      goToIndex(activeIndex + 1);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-label="Image viewer"
  >
    <!-- Close button -->
    <button
      onclick={onClose}
      class="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
      aria-label="Close image viewer"
    >
      <svg
        class="h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Previous button -->
    {#if activeIndex > 0}
      <button
        onclick={goToPrevious}
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="Previous image"
      >
        <svg
          class="h-10 w-10"
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
    {/if}

    <!-- Next button -->
    {#if activeIndex < mediaItems.length - 1}
      <button
        onclick={goToNext}
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="Next image"
      >
        <svg
          class="h-10 w-10"
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
    {/if}

    <!-- Media counter -->
    <div class="absolute top-4 left-4 text-white text-lg font-medium">
      {activeIndex + 1} / {mediaItems.length}
    </div>

    <!-- Swipeable content -->
    <div
      class="swipe-container w-full h-full max-w-screen-xl mx-auto px-4 py-16 flex items-center justify-center touch-none"
      use:swipeable
      onswipestart={handleSwipeStart}
      onswipeend={handleSwipeEnd}
    >
      <div
        class="carousel-track flex h-full w-full"
        class:animating={isAnimating && !isSwiping}
        style:transform={isSwiping
          ? `translateX(calc(${-activeIndex * 100}% + var(--swipe-distance-x, 0px)))`
          : `translateX(${-activeIndex * 100}%)`}
      >
        {#each mediaItems as item, index}
          <div class="carousel-slide flex-shrink-0 w-full h-full flex items-center justify-center">
            {#if item.type === 'image'}
              <img
                src={item.imageUrl}
                alt={item.altText || 'Villa image'}
                class="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain select-none pointer-events-none"
                draggable="false"
              />
            {:else if item.type === 'video'}
              <video
                src={item.videoUrl}
                controls
                class="max-w-full max-h-full"
              >
                Your browser does not support the video tag.
              </video>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-screen-lg overflow-x-auto p-2">
      {#each mediaItems as item, index}
        <button
          onclick={() => goToIndex(index)}
          class="flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all {activeIndex === index ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-80'}"
        >
          {#if item.type === 'image'}
            <img
              src={item.thumbnailUrl || item.imageUrl}
              alt=""
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full bg-gray-700 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .swipe-container {
    cursor: grab;
  }

  .swipe-container:active {
    cursor: grabbing;
  }

  .carousel-track {
    will-change: transform;
  }

  .carousel-track.animating {
    transition: transform 0.3s ease-out;
  }

  .carousel-slide {
    user-select: none;
    -webkit-user-drag: none;
  }
</style>
