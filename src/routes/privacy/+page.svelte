<script lang="ts">
  import { siteConfig } from "$lib/config/site";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { page } from "$app/stores";
  import { languageStore } from "$lib/stores/language";
  import PrivacyPolicyEN from './PrivacyPolicyEN.svelte';
  import PrivacyPolicyID from './PrivacyPolicyID.svelte';

  let user = $derived($page.data.user);
  let currentLanguage = $state($languageStore);

  // Detect if we're in an iframe (for modal display)
  let isInIframe = $state(false);

  $effect(() => {
    if (typeof window !== 'undefined') {
      isInIframe = window.self !== window.top;
    }
  });

  // Subscribe to language store updates
  $effect(() => {
    const unsubscribe = languageStore.subscribe((state) => {
      currentLanguage = state;
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  {#if currentLanguage.current === 'id'}
    <title>Kebijakan Privasi - {siteConfig.name}</title>
    <meta
      name="description"
      content="Kebijakan Privasi {siteConfig.name} - Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda."
    />
  {:else}
    <title>Privacy Policy - {siteConfig.name}</title>
    <meta
      name="description"
      content="Privacy Policy for {siteConfig.name} - Learn how we collect, use, and protect your personal information."
    />
  {/if}
</svelte:head>

<!-- Only show navbar if not in iframe -->
{#if !isInIframe}
  <Navbar {user} />
{/if}

<div class="bg-white">
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 {isInIframe ? 'py-4' : 'py-16'}">
    <div class="prose prose-lg max-w-none pt-10">
      <!-- Language-specific privacy policy content -->
      {#if currentLanguage.current === 'id'}
        <PrivacyPolicyID />
      {:else}
        <PrivacyPolicyEN />
      {/if}
    </div>
  </div>
</div>

{#if !isInIframe}
  <Footer {user} />
{/if}

