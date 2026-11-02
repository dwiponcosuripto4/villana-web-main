<script lang="ts">
  import type { PageData } from "./$types";
  import { savedVillas } from "$lib/stores/savedVillas";
  import { recentlyViewedVillas } from "$lib/stores/recentlyViewedVillas";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import type { VillaWithRelations } from "$lib/server/services/villa.service";
  import HeroSection from "$lib/components/HeroSection.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import VillaCard from "$lib/components/VillaCard.svelte";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";
  import * as m from "$lib/paraglide/messages.js";
  import { languageStore } from "$lib/stores/language";
  import GemIcon from "$lib/components/icons/GemIcon.svelte";
  import GoogleIcon from "$lib/components/icons/GoogleIcon.svelte";

  let { data }: { data: PageData } = $props();

  let user = $derived($page.data.user);

  // Dynamic villas state
  let dynamicVillas = $state(data.randomVillas || []);
  let dynamicPlaces = $state(data.randomPlaces || []);

  let sliderContainer = $state<HTMLElement>();
  let recentlyViewedSliderContainer = $state<HTMLElement>();

  // Recently viewed villas state
  let recentlyViewedVillasData = $state<VillaWithRelations[]>([]);
  let isLoadingRecentlyViewed = $state(false);

  function scrollPrev(container: HTMLElement | undefined) {
    if (container) {
      const cardWidth = container.firstElementChild?.clientWidth || 300;
      container.scrollBy({ left: -(cardWidth + 12), behavior: "smooth" });
    }
  }

  function scrollNext(container: HTMLElement | undefined) {
    if (container) {
      const cardWidth = container.firstElementChild?.clientWidth || 300;
      container.scrollBy({ left: cardWidth + 12, behavior: "smooth" });
    }
  }

  let currentLanguage = $state($languageStore);

  // Effect for user authentication and saved villas
  $effect(() => {
    if (user) {
      // Load saved villas from server for authenticated user
      savedVillas.loadFromServer(user);
    }
    // For anonymous users, the store already loads from localStorage
  });

  // Fetch recently viewed villas when component mounts (client-side only)
  $effect(() => {
    if (!browser) return;

    const villaIds = recentlyViewedVillas.getIds();
    if (villaIds.length === 0) {
      recentlyViewedVillasData = [];
      return;
    }

    // Fetch villa data from server
    isLoadingRecentlyViewed = true;
    fetch("/api/villas/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: villaIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.villas) {
          recentlyViewedVillasData = data.villas;
        }
      })
      .catch((error) => {
        console.error("Error fetching recently viewed villas:", error);
      })
      .finally(() => {
        isLoadingRecentlyViewed = false;
      });
  });
</script>

<svelte:head>
  <title>{siteConfig.name} - {m.page_title_suffix()}</title>
  <meta name="description" content={siteConfig.description} />
  <meta name="agd-partner-manual-verification" />

  <!-- Open Graph Tags -->
  <meta
    property="og:title"
    content="{siteConfig.name} - {m.page_title_suffix()}"
  />
  <meta property="og:description" content={siteConfig.description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteConfig.url} />
  <meta
    property="og:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />
  <meta property="og:image:width" content={siteConfig.openGraph.imageWidth} />
  <meta property="og:image:height" content={siteConfig.openGraph.imageHeight} />
  <meta
    property="og:image:alt"
    content="{siteConfig.name} - {m.villa_booking_platform()}"
  />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content={siteConfig.twitter.cardType} />
  <meta
    name="twitter:title"
    content="{siteConfig.name} - {m.page_title_suffix()}"
  />
  <meta name="twitter:description" content={siteConfig.description} />
  <meta
    name="twitter:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />
  <meta
    name="twitter:image:alt"
    content="{siteConfig.name} - {m.villa_booking_platform()}"
  />

  <!-- Canonical URL -->
  <link rel="canonical" href={siteConfig.url} />

  <GoogleAnalytics />
</svelte:head>

<!-- Navigation Header -->
<Navbar {user} />

<!-- Hero Section -->
<HeroSection />

<!-- Recently Viewed Section -->
{#if recentlyViewedVillasData.length > 0}
  <div class="relative bg-gray-50 py-12 font-plus-jakarta-sans overflow-hidden">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center flex justify-between items-center w-full">
        <h2
          class="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl text-left"
        >
          Terakhir Dilihat
        </h2>
        <div class="inline-flex gap-2 items-center">
          <button
            onclick={() => scrollPrev(recentlyViewedSliderContainer)}
            class="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous villas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              class="w-4 h-4 fill-current"
              ><path
                d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"
              /></svg
            >
          </button>
          <button
            onclick={() => scrollNext(recentlyViewedSliderContainer)}
            class="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next villas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              class="w-4 h-4 fill-current"
              ><path
                d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
              /></svg
            >
          </button>
        </div>
      </div>

      <div
        bind:this={recentlyViewedSliderContainer}
        class="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 items-stretch"
      >
        {#each recentlyViewedVillasData as villa (villa.id)}
          <div
            class="w-[280px] sm:w-[320px] lg:w-[calc(25%-9px)] flex-shrink-0 snap-start"
          >
            <VillaCard
              {villa}
              variant="desktop"
              showDistance={false}
              maxImages={5}
              className="h-full"
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Villas Recomendation Section -->
{#if dynamicVillas && dynamicVillas.length > 0}
  <div class="relative bg-white py-16 font-plus-jakarta-sans overflow-hidden">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center flex justify-between items-center w-full">
        <h2
          class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl text-left"
        >
          Rekomendasi Villa
          <!-- {m.explore_our_villas()} -->
        </h2>
        <!-- <p class="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4 text-left">
          {m.discover_villas_subtitle()}
        </p> -->
        <div class="inline-flex gap-2 items-center">
          <button
            onclick={() => scrollPrev(sliderContainer)}
            class="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous villas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              class="w-4 h-4 fill-current"
              ><path
                d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"
              /></svg
            >
          </button>
          <button
            onclick={() => scrollNext(sliderContainer)}
            class="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next villas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              class="w-4 h-4 fill-current"
              ><path
                d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
              /></svg
            >
          </button>
        </div>
      </div>

      <div
        bind:this={sliderContainer}
        class="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
      >
        {#each dynamicVillas as villa (villa.id)}
          <div
            class="min-w-[280px] sm:min-w-[320px] lg:min-w-[calc(25%-9px)] snap-start"
          >
            <VillaCard
              {villa}
              variant="desktop"
              showDistance={false}
              maxImages={5}
            />
          </div>
        {/each}

        <!-- View All Card -->
        <section
          class="flex items-center justify-center min-w-[280px] sm:min-w-[320px] lg:min-w-[calc(25%-9px)] snap-start h-full overflow-hidden"
        >
          <div
            class="relative w-full bg-linear-to-bl from-indigo-600 to-indigo-900 rounded-lg h-117 lg:h-108 justify-center border border-indigo-500 p-6 flex flex-col items-center text-center relative"
          >
            <h3
              class="text-xl font-medium text-white mb-8 max-w-2xl capitalize"
            >
              {m.discover_villas_subtitle()}
            </h3>

            <div class="flex items-center gap-4">
              <a
                href="/explore"
                class="bg-white text-gray-900 rounded-lg px-6 py-3.5 text-sm flex items-center gap-2 hover:bg-gray-100 hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
              >
                {m.view_all_villas()}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
              <!-- logo -->
              <svg
                class="hidden md:block absolute -bottom-36 scale-150 rotate-15 left-0 opacity-10 w-full h-full pointer-events-none"
                width="57"
                height="51"
                viewBox="0 0 57 51"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M56.5638 0H47.5505C42.1509 0 37.1605 2.88888 34.4555 7.58058L12.4802 45.5031C16.4386 52.3374 26.5382 52.0578 30.4704 45.2083L56.5638 0Z"
                  fill="white"
                />
                <path
                  d="M10.314 10.9209C16.1157 10.9209 20.6281 15.8342 20.6281 21.4273C20.6281 23.4605 20.0248 25.3585 18.9816 26.9679L10.314 41.863L1.64651 26.9679C0.603273 25.3585 0 23.4605 0 21.4273C0 15.8342 4.67355 10.9209 10.314 10.9209Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>

      <!-- <div class="mt-12 text-center">
        <a
          href="/explore"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {m.view_all_villas()}
        </a>
      </div> -->
    </div>
  </div>
{/if}

<!-- PVR Section -->
<div class="relative py-24 font-plus-jakarta-sans bg-blue-50 w-full">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-left grid md:grid-cols-2 items-center w-full gap-8">
      <!-- left -->
      <div class="flex flex-col gap-2 items-start gap-8 p-4">
        <p
          class="px-4 text-xs md:text-sm py-2 rounded-full bg-yellow-400 text-waikawa-900 uppercase font-bold"
        >
          Apa itu P/V Ratio?
        </p>
        <h2
          class="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl text-left"
        >
          Biar Kamu Tahu, Harga yang Kamu Bayar Emang<span class="text-blue-500"
            >{" "} Worth It</span
          >
        </h2>
        <p class="text-waikawa-800">
          Di Villana, kami nggak cuma menampilkan harga, tapi juga bantu kamu
          tahu seberapa sebanding harga villa dengan nilai yang kamu dapatkan.
          Lewat sistem <span class="font-bold text-waikawa-900"
            >Price-to-Value Ratio (P/V Ratio)</span
          >, setiap villa dinilai berdasarkan fasilitas, rating, dan harga pasar
          di area yang sama.
        </p>
        <p class="text-waikawa-800 p-4 bg-white rounded-lg">
          Semakin tinggi P/V Ratio, semakin besar <span
            class="font-bold text-waikawa-900">value for money</span
          > yang kamu dapet. Artinya, kamu nggak cuma bayar untuk tempat nginep,
          kamu bayar untuk pengalaman yang berharga.
        </p>

        <a
          href="#"
          class="font-medium flex items-center gap-2 hover:underline group"
          >Pelajari Selengkapnya <span
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-4 h-4 group-hover:translate-x-1 transition-all"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              /></svg
            ></span
          ></a
        >
      </div>
      <!-- right -->
      <div class="flex relative m-auto items-center scale-80">
        <img
          src="/images/pvr-villa-placeholder.webp"
          alt="pvr"
          class="max-h-[440px] rounded-lg object-contain md:ml-8"
        />
        <!-- rating pvr -->
        <div
          class="absolute top-16 -left-12 px-6 py-2 shadow-lg bg-white flex items-center justify-center rounded-full"
        >
          <GemIcon className="w-8 h-8" />
          <div class="flex flex-col ml-2">
            <p class="text-waikawa-700 text-xs">P/V Ratio</p>
            <p class="text-waikawa-900 text-xl font-extrabold">2.7</p>
          </div>
        </div>
        <!-- villana logo -->
        <svg
          class="absolute top-0 right-0 w-20 h-20"
          width="78"
          height="78"
          viewBox="0 0 78 78"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M39 5.875C41.7099 5.875 43.8058 7.81962 45.9795 9.90527L45.9805 9.90625C46.5743 10.4745 47.2095 11.0838 47.8359 11.6064C48.4531 12.1214 49.1276 12.6075 49.8135 12.8906V12.8916C50.4602 13.1605 51.2498 13.2797 52.0127 13.3428C52.7898 13.407 53.6381 13.4186 54.4297 13.4307C57.4937 13.4778 60.4152 13.5676 62.4238 15.5762C64.4324 17.5848 64.5222 20.5063 64.5693 23.5703C64.5814 24.3619 64.593 25.2102 64.6572 25.9873C64.7203 26.7502 64.8395 27.5398 65.1084 28.1865C65.3915 28.8725 65.8786 29.5468 66.3936 30.1641C66.9162 30.7905 67.5255 31.4257 68.0938 32.0195L68.0947 32.0205C70.1804 34.1942 72.125 36.2901 72.125 39C72.125 41.7099 70.1804 43.8058 68.0947 45.9795L68.0938 45.9805C67.5255 46.5743 66.9162 47.2095 66.3936 47.8359C65.8786 48.4532 65.3915 49.1275 65.1084 49.8135C64.8395 50.4602 64.7203 51.2498 64.6572 52.0127C64.593 52.7898 64.5814 53.6381 64.5693 54.4297C64.5222 57.4937 64.4324 60.4152 62.4238 62.4238C60.4152 64.4324 57.4937 64.5222 54.4297 64.5693C53.6381 64.5814 52.7898 64.593 52.0127 64.6572C51.3452 64.7124 50.6572 64.8109 50.0625 65.0146L49.8135 65.1084C49.1275 65.3915 48.4532 65.8786 47.8359 66.3936C47.2095 66.9162 46.5743 67.5255 45.9805 68.0938L45.9795 68.0947C43.8058 70.1804 41.7099 72.125 39 72.125C36.2901 72.125 34.1942 70.1804 32.0205 68.0947L32.0195 68.0938L31.1035 67.2266C30.7923 66.9379 30.4772 66.6548 30.1641 66.3936C29.5465 65.8783 28.8718 65.3914 28.1855 65.1084H28.1865C27.5398 64.8395 26.7502 64.7203 25.9873 64.6572C25.2102 64.593 24.3619 64.5814 23.5703 64.5693C20.5063 64.5222 17.5848 64.4324 15.5762 62.4238C13.5676 60.4152 13.4778 57.4937 13.4307 54.4297C13.4186 53.6381 13.407 52.7898 13.3428 52.0127C13.2876 51.3452 13.1891 50.6572 12.9854 50.0625L12.8916 49.8135C12.6085 49.1275 12.1214 48.4532 11.6064 47.8359C11.0838 47.2095 10.4745 46.5743 9.90625 45.9805L9.90527 45.9795L9.13281 45.167C7.36344 43.2725 5.875 41.3712 5.875 39C5.875 36.2901 7.81962 34.1942 9.90527 32.0205L9.90625 32.0195C10.4745 31.4257 11.0838 30.7905 11.6064 30.1641C12.1214 29.5468 12.6085 28.8725 12.8916 28.1865C13.1605 27.5398 13.2797 26.7502 13.3428 25.9873C13.407 25.2102 13.4186 24.3619 13.4307 23.5703C13.4778 20.5063 13.5676 17.5848 15.5762 15.5762C17.5848 13.5676 20.5063 13.4778 23.5703 13.4307C24.3619 13.4186 25.2102 13.407 25.9873 13.3428C26.7502 13.2797 27.5398 13.1605 28.1865 12.8916L28.1855 12.8906C28.8717 12.6076 29.5466 12.1216 30.1641 11.6064C30.7905 11.0838 31.4257 10.4745 32.0195 9.90625L32.0205 9.90527C34.1942 7.81962 36.2901 5.875 39 5.875Z"
            fill="white"
            stroke="white"
            stroke-width="2"
          />
          <path
            d="M57.9536 22.3826H52.0645C48.5365 22.3826 45.2758 24.2842 43.5084 27.3725L29.1501 52.3352C31.7365 56.8338 38.3354 56.6497 40.9046 52.1411L57.9536 22.3826Z"
            fill="#3191FF"
          />
          <path
            d="M27.673 29.7681C31.4119 29.7681 34.3199 32.9345 34.3199 36.539C34.3199 37.8493 33.9311 39.0725 33.2588 40.1097L27.673 49.7089L22.0871 40.1097C21.4148 39.0725 21.026 37.8493 21.026 36.539C21.026 32.9345 24.0379 29.7681 27.673 29.7681Z"
            fill="#3191FF"
          />
        </svg>

        <!-- google rating -->
        <div
          class="absolute -bottom-8 -right-12 px-6 py-2 shadow-lg bg-white flex items-center justify-center rounded-xl"
        >
          <GoogleIcon className="w-8 h-8" />
          <div class="flex flex-col ml-2 gap-2">
            <p class="text-waikawa-700 text-xs">Google Rating</p>
            <div class="flex items-center gap-0.5">
              {#each Array(5) as _}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="text-yellow-400 fill-yellow-400 stroke-yellow-400 w-4 h-4"
                >
                  <path
                    d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Popular Destinations Section -->
{#if dynamicPlaces && dynamicPlaces.length > 0}
  <div
    class="relative bg-white py-8 md:py-16 font-plus-jakarta-sans overflow-hidden"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2
        class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl text-left"
      >
        {currentLanguage.current === "id"
          ? "Destinasi Populer"
          : "Popular Destinations"}
      </h2>

      <div
        class="mt-6 flex gap-3 overflow-x-scroll no-scrollbar snap-x snap-mandatory scrollbar-hide pb-4 w-full h-full justify-center"
      >
        {#each dynamicPlaces as place (place.id)}
          <a
            href="/place/{place.slug}"
            class="flex-shrink-0 w-[190px] snap-start cursor-pointer group"
          >
            <div class="flex flex-col h-[240px] gap-2">
              <div
                class="w-[180px] h-[180px] rounded-lg bg-gray-200 overflow-hidden"
              >
                {#if place.mainImage}
                  <img
                    src={place.mainImage}
                    alt={place.name}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                {:else}
                  <div
                    class="w-full h-full bg-gray-200 m-auto flex items-center justify-center text-waikawa-700"
                  >
                    <svg
                      class="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      fill="currentColor"
                      ><path
                        d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM224 176C250.5 176 272 197.5 272 224C272 250.5 250.5 272 224 272C197.5 272 176 250.5 176 224C176 197.5 197.5 176 224 176zM368 288C376.4 288 384.1 292.4 388.5 299.5L476.5 443.5C481 450.9 481.2 460.2 477 467.8C472.8 475.4 464.7 480 456 480L184 480C175.1 480 166.8 475 162.7 467.1C158.6 459.2 159.2 449.6 164.3 442.3L220.3 362.3C224.8 355.9 232.1 352.1 240 352.1C247.9 352.1 255.2 355.9 259.7 362.3L286.1 400.1L347.5 299.6C351.9 292.5 359.6 288.1 368 288.1z"
                      /></svg
                    >
                  </div>
                {/if}
              </div>

              <div class="px-1.5 h-[60px] flex flex-col justify-start">
                <h3
                  class="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2"
                >
                  {place.name}
                </h3>
                <p class="text-xs text-gray-500">
                  {place.nearbyVillasCount}
                  {place.nearbyVillasCount === 0 ||
                  place.nearbyVillasCount === 1
                    ? "Villa"
                    : "Villas"}
                </p>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Footer -->
<Footer {user} />

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
