<script lang="ts">
  interface Props {
    images?: Array<{
      id: string;
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
    }>;
    onImageClick?: (index: number) => void;
    title?: string;
    showAll?: boolean;
    maxVisible?: number;
  }

  const {
    images = [],
    onImageClick = () => {},
    title = "Photo Gallery",
    showAll = false,
    maxVisible = 6,
  }: Props = $props();

  let showAllImages = $state(showAll);

  const displayImages = $derived(
    showAllImages ? images : images.slice(0, maxVisible),
  );

  const hasMoreImages = $derived(images.length > maxVisible);

  function toggleShowAll() {
    showAllImages = !showAllImages;
  }
</script>

{#if images.length > 0}
  <section class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">{title}</h2>
      {#if hasMoreImages && !showAllImages}
        <button
          onclick={toggleShowAll}
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all {images.length} photos
        </button>
      {:else if showAllImages && hasMoreImages}
        <button
          onclick={toggleShowAll}
          class="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          Show less
        </button>
      {/if}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {#each displayImages as image, index}
        <div
          class="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
        >
          <button
            onclick={() => {
              // Find the actual index of this image in the full images array
              const actualIndex = images.findIndex(img => img.id === image.id);
              onImageClick(actualIndex >= 0 ? actualIndex : index);
            }}
            class="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
          >
            <div
              class="w-full h-full bg-gray-200 flex items-center justify-center"
            >
              <img
                src={image.thumbnailUrl || image.imageUrl}
                alt={image.altText || `Gallery image ${index + 1}`}
                class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                onerror={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
                onload={(e) => {
                  e.target.style.display = "block";
                  e.target.nextElementSibling.style.display = "none";
                }}
              />
              <!-- Fallback content -->
              <div
                class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm"
                style="display: none;"
              >
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <!-- Hover overlay -->
            <div
              class="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200 flex items-center justify-center"
            >
              <svg
                class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </button>
        </div>
      {/each}
    </div>

    {#if hasMoreImages && !showAllImages}
      <div class="mt-4 text-center">
        <button
          onclick={toggleShowAll}
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            class="-ml-1 mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Show {images.length - maxVisible} more photos
        </button>
      </div>
    {/if}
  </section>
{/if}

