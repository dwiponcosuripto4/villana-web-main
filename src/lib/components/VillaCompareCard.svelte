<script lang="ts">
  import { formatPrice } from "$lib/utils/format";
  import VillaImagePlaceholder from "./VillaImagePlaceholder.svelte";

  export let villa: any;
  export let onClick: () => void;
</script>

<button
  onclick={onClick}
  class="relative flex cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-indigo-600 hover:shadow-lg"
>
  <!-- Square Thumbnail -->
  <div class="w-32 h-32 flex-shrink-0">
    {#if villa.images && villa.images.length > 0}
      <img
        src={villa.images[0].thumbnailUrl || villa.images[0].imageUrl}
        alt={villa.title}
        class="h-full w-full object-cover"
      />
    {:else}
      <div class="h-full w-full">
        <VillaImagePlaceholder />
      </div>
    {/if}
  </div>

  <!-- Details -->
  <div class="flex flex-1 flex-col justify-between p-4 text-left min-h-32">
    <div>
      <h3 class="font-semibold text-gray-900 line-clamp-2">{villa.title}</h3>
      <p class="mt-1 text-sm text-indigo-600">
        {formatPrice(villa.priceMin)} - {formatPrice(villa.priceMax)}
      </p>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex gap-3 text-xs text-gray-500 flex-wrap">
        <span>
          {villa.bedroomMin === villa.bedroomMax
            ? villa.bedroomMin
            : `${villa.bedroomMin}-${villa.bedroomMax}`} BR
        </span>
        {#if villa.hasAc}
          <span>AC</span>
        {/if}
        {#if villa.hasTv}
          <span>TV</span>
        {/if}
        {#if villa.hasBreakfast}
          <span>Breakfast</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Compare indicator -->
  <div class="absolute top-2 right-2">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600"
    >
      <svg
        class="h-4 w-4 text-white"
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
    </div>
  </div>
</button>

