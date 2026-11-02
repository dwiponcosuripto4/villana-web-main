<script lang="ts">
  import { savedVillasCount } from "$lib/stores/savedVillas";
  import { goto } from "$app/navigation";

  interface Props {
    onClick?: () => void;
    variant?: "default" | "white";
    showText?: boolean;
  }

  let {
    onClick = () => goto("/saved"),
    variant = "default",
    showText = false,
  }: Props = $props();

  let baseClasses = $derived(
    variant === "white"
      ? "relative inline-flex items-center rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
      : "relative inline-flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors",
  );
</script>

{#if $savedVillasCount > 0}
  <button
    onclick={onClick}
    class={`${baseClasses} cursor-pointer`}
    aria-label="Saved villas"
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
    <span class={`ml-2 ${showText ? "" : "hidden sm:inline"}`}>Saved</span>
  </button>
{/if}
