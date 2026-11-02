<script lang="ts">
  interface Props {
    onclick?: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    text?: string;
    loadingText?: string;
  }

  let {
    onclick = () => {},
    loading = false,
    disabled = false,
    className = "",
    text = "Load More Villas",
    loadingText = "Loading...",
  }: Props = $props();

  // Handle click with loading state
  async function handleClick(): Promise<void> {
    if (disabled || loading) return;

    try {
      await onclick();
    } catch (error) {
      console.error("Error in LoadMoreButton click handler:", error);
    }
  }

  const isDisabled = $derived(disabled || loading);
  const buttonText = $derived(loading ? loadingText : text);
</script>

<button
  onclick={handleClick}
  disabled={isDisabled}
  class="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {isDisabled
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'} {className}"
  aria-label={loading ? 'Loading more villas' : 'Load more villas'}
  type="button"
>
  {#if loading}
    <!-- Loading Spinner -->
    <svg
      class="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading indicator"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  {:else}
    <!-- Load More Icon -->
    <svg
      class="-ml-1 mr-3 h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      role="img"
      aria-label="Load more icon"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  {/if}

  <span class="font-semibold">
    {buttonText}
  </span>
</button>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>