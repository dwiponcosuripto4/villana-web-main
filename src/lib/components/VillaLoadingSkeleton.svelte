<script lang="ts">
  interface Props {
    variant?: "mobile" | "desktop";
    className?: string;
  }

  let { variant = "desktop", className = "" }: Props = $props();

  const isMobile = $derived(variant === "mobile");
</script>

<!-- Villa Card Loading Skeleton -->
<article
  class="overflow-hidden animate-pulse {isMobile
    ? 'mb-2 bg-white'
    : 'rounded-lg bg-white shadow-md'} {className}"
  role="presentation"
  aria-label="Loading villa information"
>
  <!-- Image Placeholder -->
  <div class="relative {isMobile ? 'aspect-[4/3]' : 'aspect-[4/3]'}">
    <div class="h-full w-full bg-gray-300"></div>

    <!-- Price Badge Placeholder -->
    <div
      class="absolute {isMobile
        ? 'top-4 right-4 rounded-full'
        : 'top-2 right-2 rounded'} bg-gray-400 px-{isMobile
        ? '3'
        : '2'} py-1"
    >
      <div class="h-{isMobile ? '4' : '3'} w-16 bg-gray-500 rounded"></div>
    </div>

    <!-- Rating Badge Placeholder (if not mobile) -->
    {#if !isMobile}
      <div class="absolute bottom-2 left-2 rounded bg-gray-400 px-2 py-1">
        <div class="h-3 w-12 bg-gray-500 rounded"></div>
      </div>
    {/if}
  </div>

  <!-- Content Section -->
  <div class="p-{isMobile ? '4' : '4'}">
    <!-- Title Placeholder -->
    <div class="mb-2">
      <div class="h-5 bg-gray-300 rounded w-3/4 mb-1"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    <!-- Location Placeholder -->
    <div class="mb-3">
      <div class="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>

    <!-- Amenities Section -->
    {#if isMobile}
      <!-- Mobile Amenities Layout -->
      <div class="mb-4">
        <div class="grid grid-cols-3 gap-4 text-center">
          {#each Array(3) as _, i}
            <div class="flex flex-col items-center space-y-1">
              <div class="h-6 w-6 bg-gray-300 rounded"></div>
              <div class="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Mobile Rating -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="h-4 w-16 bg-gray-200 rounded"></div>
          <div class="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <!-- Save Button Placeholder -->
        <div class="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
    {:else}
      <!-- Desktop Amenities Layout -->
      <div class="mb-3">
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          {#each Array(4) as _, i}
            <div class="flex items-center space-x-1">
              <div class="h-4 w-4 bg-gray-300 rounded"></div>
              <div class="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Desktop Rating and Save Button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="h-4 w-12 bg-gray-200 rounded"></div>
          <div class="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
        <!-- Save Button Placeholder -->
        <div class="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
    {/if}
  </div>
</article>

<style>
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>