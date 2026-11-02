<script lang="ts">
  import { savedVillas } from "$lib/stores/savedVillas";
  import { page } from "$app/stores";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";

  export let villaId: number;
  export let size: "sm" | "md" | "lg" = "md";
  export let className = "";
  export let villaData: VillaWithRelations | undefined = undefined;

  $: user = $page.data.user;
  $: isSaved = $savedVillas.villaIds.includes(villaId);
  $: className = isSaved ? " border-red-100" : " border-gray-300";

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const paddingClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  };

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      savedVillas.remove(villaId, user);
    } else {
      savedVillas.add(villaId, user, villaData);
    }
  }
</script>

<button
  onclick={handleClick}
  class="group rounded-full border-2 cursor-pointer bg-white/80 backdrop-blur transition-all hover:bg-white hover:scale-110 {paddingClasses[
    size
  ]} {className}"
  aria-label={isSaved ? "Remove from saved" : "Save villa"}
  title={isSaved ? "Remove from saved" : "Save villa"}
>
  <svg
    class="{sizeClasses[size]} transition-colors {isSaved
      ? 'text-red-500 fill-red-500'
      : 'text-gray-600 group-hover:text-red-500'}"
    fill={isSaved ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
</button>
