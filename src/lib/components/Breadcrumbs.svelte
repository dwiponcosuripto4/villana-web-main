<!--
  Breadcrumbs Component

  Provides navigation breadcrumbs with Schema.org structured data
  for better SEO and user experience.
-->
<script lang="ts">
  import { generateBreadcrumbSchema } from "$lib/utils/schema";

  interface BreadcrumbItem {
    name: string;
    url: string;
    current?: boolean;
  }

  interface Props {
    items: BreadcrumbItem[];
    className?: string;
    showHome?: boolean;
  }

  let { items, className = "", showHome = true }: Props = $props();

  // Add home as first item if not present and showHome is true
  const breadcrumbItems = $derived(
    (() => {
      const allItems = [...items];

      if (showHome && (allItems.length === 0 || allItems[0].url !== "/")) {
        allItems.unshift({ name: "Home", url: "/" });
      }

      return allItems;
    })(),
  );

  // Generate Schema.org structured data
  const structuredData = $derived(
    generateBreadcrumbSchema(
      breadcrumbItems.map((item) => ({
        name: item.name,
        url: item.url,
      })),
    ),
  );
</script>

<svelte:head>
  <!-- Breadcrumb structured data -->
  {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<nav aria-label="Breadcrumb" class="flex {className}">
  <ol
    class="inline-flex items-center space-x-1 md:space-x-3"
    itemscope
    itemtype="https://schema.org/BreadcrumbList"
  >
    {#each breadcrumbItems as item, index}
      <li
        class="inline-flex items-center"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        <!-- Add separator for non-first items -->
        {#if index > 0}
          <svg
            class="w-3 h-3 mx-1 text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
        {/if}

        <!-- Current page (not a link) -->
        {#if item.current}
          <span
            class="ml-1 text-sm font-medium text-gray-500 md:ml-2"
            aria-current="page"
            itemprop="name"
          >
            {item.name}
          </span>
          <meta itemprop="position" content={index + 1} />
        {:else}
          <!-- Clickable breadcrumb item -->
          <a
            href={item.url}
            class="inline-flex ml-1 items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            itemprop="item"
          >
            <!-- Home icon for first item -->
            {#if index === 0 && showHome}
              <svg
                class="w-3 h-3 mr-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"
                />
              </svg>
            {/if}
            <span itemprop="name">{item.name}</span>
          </a>
          <meta itemprop="position" content={index + 1} />
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  /* Additional styles for better mobile responsiveness */
  @media (max-width: 640px) {
    .inline-flex {
      flex-wrap: wrap;
    }
  }
</style>

