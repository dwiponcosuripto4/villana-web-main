<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "svelte-5-french-toast";
  import { siteConfig } from "$lib/config/site";
  import { languageStore } from "$lib/stores/language";
  import { onMount } from "svelte";
  import type { LayoutData } from "./$types";

  let { children, data }: { children: any; data: LayoutData } = $props();

  // Initialize language store with resolved language
  onMount(() => {
    languageStore.initialize(
      data.language.userPreference,
      data.language.current
    );
  });
</script>

<svelte:head>
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<Toaster position="top-center" />
{@render children?.()}
