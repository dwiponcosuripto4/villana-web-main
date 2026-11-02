<script lang="ts">
  // import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "svelte-5-french-toast";
  import { siteConfig } from "$lib/config/site";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/favicon.ico" />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content={siteConfig.locale} />
  <meta name="twitter:site" content={siteConfig.twitter.site} />
</svelte:head>

<Toaster position="top-center" />
{@render children?.()}
