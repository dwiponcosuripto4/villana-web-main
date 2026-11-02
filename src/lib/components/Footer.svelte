<script lang="ts">
  import { siteConfig } from "$lib/config/site";
  import { languageStore } from "$lib/stores/language";
  import LanguageSelector from "./LanguageSelector.svelte";

  let {
    user = null,
    isDashboard = false,
  }: {
    user?: any;
    isDashboard?: boolean;
  } = $props();

  const yearNow = new Date().getFullYear();
  let currentLanguage = $state($languageStore);

  // Subscribe to language store updates
  $effect(() => {
    const unsubscribe = languageStore.subscribe((state) => {
      currentLanguage = state;
    });

    return unsubscribe;
  });
</script>

<footer class="bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
    <div
      class="grid grid-cols-1 gap-8 {isDashboard
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-4'}"
    >
      <!-- Company Info - Only show when NOT in dashboard -->
      {#if !isDashboard}
        <div class="lg:col-span-1">
          <a href="/" class="text-xl font-bold text-white">
            <img
              src="/images/logo-villana-with-name-beta.svg"
              alt="Villana Logo"
              class="w-[128px] md:w-[96px] md:max-w-[128px]"
            />
          </a>
          <p class="mt-4 text-gray-300">
            Platform eksplorasi villa terpercaya di Indonesia. Temukan villa
            impian dengan sistem P/V Ratio inovatif. 100% gratis, transparan,
            tanpa biaya OTA.
          </p>
          <div class="mt-6 flex space-x-6">
            <!-- Social Media Links -->
            <a href="#" class="text-gray-400 hover:text-gray-300">
              <span class="sr-only">Facebook</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-300">
              <span class="sr-only">Instagram</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fill-rule="evenodd"
                  d="M12.017 0C8.396 0 7.989.013 7.041.048 6.094.084 5.52.204 5.02.388a6.5 6.5 0 00-2.346 1.529c-.94.94-1.44 1.84-1.529 2.346C1.204 5.52 1.084 6.094 1.048 7.041.013 7.989 0 8.396 0 12.017s.013 4.028.048 4.976c.036.947.156 1.521.34 2.021a6.5 6.5 0 001.529 2.346c.94.94 1.84 1.44 2.346 1.529.5.184 1.074.304 2.021.34.948.035 1.355.048 4.976.048s4.028-.013 4.976-.048c.947-.036 1.521-.156 2.021-.34a6.5 6.5 0 002.346-1.529c.94-.94 1.44-1.84 1.529-2.346.184-.5.304-1.074.34-2.021.035-.948.048-1.355.048-4.976s-.013-4.028-.048-4.976c-.036-.947-.156-1.521-.34-2.021a6.5 6.5 0 00-1.529-2.346C19.777 1.44 18.877.94 18.371.756c-.5-.184-1.074-.304-2.021-.34C15.402.013 14.995 0 11.374 0h.643zm-.081 1.802h.468c2.456 0 2.784.011 3.807.058.975.045 1.504.207 1.857.344.467.182.8.398 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.857.047 1.023.058 1.351.058 3.807v.468c0 2.456-.011 2.784-.058 3.807-.045.975-.207 1.504-.344 1.857a3.097 3.097 0 01-.748 1.15 3.098 3.098 0 01-1.15.748c-.353.137-.882.3-1.857.344-1.023.047-1.351.058-3.807.058s-2.784-.011-3.807-.058c-.975-.045-1.504-.207-1.857-.344a3.097 3.097 0 01-1.15-.748 3.098 3.098 0 01-.748-1.15c-.137-.353-.3-.882-.344-1.857-.047-1.023-.058-1.351-.058-3.807s.011-2.784.058-3.807c.045-.975.207-1.504.344-1.857.182-.467.398-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.137.882-.3 1.857-.344 1.023-.047 1.351-.058 3.807-.058z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.017 7.283a4.734 4.734 0 100 9.468 4.734 4.734 0 000-9.468zm0 7.81a3.076 3.076 0 110-6.152 3.076 3.076 0 010 6.152z"
                />
                <path
                  d="M19.846 6.99a1.142 1.142 0 11-2.284 0 1.142 1.142 0 012.284 0z"
                />
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-300">
              <span class="sr-only">Twitter</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                />
              </svg>
            </a>
          </div>
        </div>
      {/if}

      <!-- Quick Links -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          Quick Links
        </h3>
        <ul class="mt-4 space-y-4">
          <li>
            <a href="/explore" class="text-base text-gray-300 hover:text-white"
              >Jelajahi Villa</a
            >
          </li>
          <li>
            <a href="/places" class="text-base text-gray-300 hover:text-white"
              >Jelajahi Tempat Wisata</a
            >
          </li>
          <li>
            <a href="/post" class="text-base text-gray-300 hover:text-white"
              >Blog</a
            >
          </li>
          <li>
            <a href="/saved" class="text-base text-gray-300 hover:text-white"
              >Villa Tersimpan</a
            >
          </li>
          <li>
            <a href="/about" class="text-base text-gray-300 hover:text-white"
              >Tentang Kami</a
            >
          </li>
          <li>
            <a href="#" class="text-base text-gray-300 hover:text-white"
              >List Your Villa</a
            >
          </li>
        </ul>
      </div>

      <!-- Support -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          Support
        </h3>
        <ul class="mt-4 space-y-4">
          <li>
            <a
              href="/contact-us"
              class="text-base text-gray-300 hover:text-white">Contact Us</a
            >
          </li>
          <li>
            <a href="/faq" class="text-base text-gray-300 hover:text-white"
              >FAQ</a
            >
          </li>
        </ul>
      </div>

      <!-- Language -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          {currentLanguage.current === "id" ? "Bahasa" : "Language"}
        </h3>
        <div class="mt-4">
          <LanguageSelector
            {user}
            size="small"
            variant="select"
            showLabels={false}
          />
        </div>
      </div>

      <!-- Account -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          Account
        </h3>
        <ul class="mt-4 space-y-4">
          {#if user}
            <!-- Authenticated user links -->
            <li>
              <a
                href="/dashboard"
                class="text-base text-gray-300 hover:text-white">Dashboard</a
              >
            </li>
            <li>
              <a
                href="/dashboard/profile"
                class="text-base text-gray-300 hover:text-white">My Profile</a
              >
            </li>
            <li>
              <a
                href="/dashboard/saved"
                class="text-base text-gray-300 hover:text-white">Saved Villas</a
              >
            </li>
            <li>
              <a
                href="/dashboard/settings"
                class="text-base text-gray-300 hover:text-white">Settings</a
              >
            </li>
          {:else}
            <!-- Non-authenticated user links -->
            <li>
              <a
                href="/register"
                class="text-base text-gray-300 hover:text-white"
                >Create Account</a
              >
            </li>
            <li>
              <a href="/login" class="text-base text-gray-300 hover:text-white"
                >Sign In</a
              >
            </li>
            <li>
              <a href="/saved" class="text-base text-gray-300 hover:text-white"
                >Saved Villas</a
              >
            </li>
          {/if}
        </ul>
      </div>
    </div>

    <!-- Bottom Border -->
    <div class="mt-12 border-t border-gray-700 pt-8">
      <div class="md:flex md:items-center md:justify-between">
        <div class="flex space-x-6 md:order-2">
          <a href="/term-of-service" class="text-gray-400 hover:text-gray-300">
            <span class="sr-only">Terms</span>
            <span class="text-sm">Terms</span>
          </a>
          <a href="/privacy" class="text-gray-400 hover:text-gray-300">
            <span class="sr-only">Privacy</span>
            <span class="text-sm">Privacy</span>
          </a>
          <a href="#" class="text-gray-400 hover:text-gray-300">
            <span class="sr-only">Cookies</span>
            <span class="text-sm">Cookies</span>
          </a>
        </div>
        <p class="mt-8 text-base text-center text-gray-400 md:order-1 md:mt-0">
          &copy; 2024-{yearNow}
          {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</footer>
