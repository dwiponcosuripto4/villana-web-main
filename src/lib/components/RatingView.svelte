<script lang="ts">
  import StarIcon from "$lib/components/icons/StarIcon.svelte";

  export let rating: string;
  export let ratingCount: number = 0;
  export let className: string = "";
  export let countBottom: boolean = false;
  export let size: "small" | "medium" | "large" = "medium";

  let starSizeClass: string = "w-5 h-5";

  $: ratingNum = parseFloat(rating);
  $: starSizeClass =
    size === "small" ? "w-3 h-3" : size === "large" ? "w-6 h-6" : "w-5 h-5";
  $: textSizeClass =
    size === "small" ? "text-xs" : size === "large" ? "text-lg" : "text-sm";

  const getStars = (rating: string) => {
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return { fullStars, hasHalfStar, emptyStars };
  };
</script>

<div class={`flex items-center gap-2 text-sm ${className}`}>
  <div class="flex items-center gap-0.5">
    {#each Array(getStars(rating).fullStars) as _}
      <!-- Solid filled star -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class={`${starSizeClass} text-yellow-400 fill-yellow-400 stroke-yellow-400`}
      >
        <path
          d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {/each}

    {#if getStars(rating).hasHalfStar}
      <!-- Half star (left filled, right outline) -->
      <div class={`relative ${starSizeClass}`}>
        <!-- Outline behind -->
        <StarIcon className={`${starSizeClass} text-gray-300`} />
        <!-- Left half solid fill -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class={`absolute ${starSizeClass} inset-0 text-yellow-400 fill-yellow-400 stroke-yellow-400`}
          style="clip-path: inset(0 50% 0 0);"
        >
          <path
            d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    {/if}

    {#each Array(getStars(rating).emptyStars) as _}
      <StarIcon className={`${starSizeClass} text-gray-300`} />
    {/each}
  </div>

  <span class={`text-gray-600 dark:text-gray-600 font-medium ${textSizeClass}`}>
    <span class="font-semibold">{ratingNum.toFixed(1)}</span>
    {#if !countBottom}
      <span class="text-gray-400">({ratingCount.toLocaleString()})</span>
    {/if}
  </span>
</div>
{#if countBottom}
  <div class="text-gray-400">({ratingCount.toLocaleString()})</div>
{/if}
