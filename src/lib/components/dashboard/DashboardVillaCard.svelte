<script lang="ts">
  import { Eye, Settings } from "lucide-svelte";
  import LazyImage from "$lib/components/LazyImage.svelte";

  interface Props {
    villa: {
      id: number;
      title: string;
      slug: string;
      status: string;
      thumbnail: { imageUrl: string; thumbnailUrl: string | null } | null;
    };
    showStatus?: boolean;
  }

  let { villa, showStatus = false }: Props = $props();

  const thumbnailUrl = $derived(
    villa.thumbnail?.thumbnailUrl || villa.thumbnail?.imageUrl || null
  );
</script>

<div
  class="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
>
  <!-- Thumbnail -->
  <div class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
    {#if thumbnailUrl}
      <LazyImage src={thumbnailUrl} alt={villa.title} />
    {:else}
      <div
        class="w-full h-full flex items-center justify-center bg-gray-200"
        role="img"
        aria-label="Villa image placeholder"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-8 h-8 text-gray-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
          />
        </svg>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 min-w-0">
    <h3 class="text-base font-semibold text-gray-900 truncate">
      {villa.title}
    </h3>
    {#if showStatus}
      <span
        class="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium {villa.status ===
        'published'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-600'}"
      >
        {villa.status === "published" ? "Published" : "Draft"}
      </span>
    {/if}
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2 flex-shrink-0">
    <a
      href="/villa/{villa.slug}"
      class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <Eye class="w-4 h-4" />
      <span class="hidden sm:inline">View</span>
    </a>
    <a
      href="/dashboard/villas/{villa.id}/edit"
      class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
    >
      <Settings class="w-4 h-4" />
      <span class="hidden sm:inline">Manage</span>
    </a>
  </div>
</div>
