<script lang="ts">
  import type { LayoutData } from "./$types";
  import { page } from "$app/stores";
  import Footer from "$lib/components/Footer.svelte";
  import { languageStore } from "$lib/stores/language";
  import { onMount } from "svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  let { data }: { data: LayoutData } = $props();

  let mobileMenuOpen = $state(false);

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  // Navigation items
  let navigation = $derived([
    { name: "Profile", href: "/dashboard/profile", icon: "user" },
    ...(data.hasVillaActivity
      ? [{ name: "Villa Saya", href: "/dashboard/villas", icon: "home" }]
      : []),
    { name: "Saved Villas", href: "/dashboard/saved", icon: "heart" },
    { name: "Settings", href: "/dashboard/settings", icon: "cog" },
  ]);

  // Get current route for active state
  let currentPath = $derived($page.url.pathname);

  // Initialize language store with user's language preferences
  onMount(() => {
    languageStore.initialize(
      data.language.userPreference,
      data.language.current,
    );
  });
</script>

<svelte:head>
  <ClarityCode />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Mobile menu -->
  {#if mobileMenuOpen}
    <div class="relative z-60 lg:hidden">
      <div
        class="fixed inset-0 bg-gray-900/80"
        on:click={closeMobileMenu}
        on:keydown
      ></div>

      <div class="fixed inset-0 flex">
        <div class="relative mr-16 flex w-full max-w-xs flex-1">
          <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              class="-m-2.5 p-2.5"
              on:click={closeMobileMenu}
            >
              <span class="sr-only">Close sidebar</span>
              <svg
                class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 pt-6"
          >
            <nav class="flex flex-1 flex-col">
              <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" class="-mx-2 space-y-1">
                    {#each navigation as item}
                      <li>
                        <a
                          href={item.href}
                          class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold {currentPath.startsWith(
                            item.href,
                          )
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}"
                          on:click={closeMobileMenu}
                        >
                          {#if item.icon === "user"}
                            <svg
                              class="h-6 w-6 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          {:else if item.icon === "home"}
                            <svg
                              class="h-6 w-6 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          {:else if item.icon === "heart"}
                            <svg
                              class="h-6 w-6 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          {:else if item.icon === "cog"}
                            <svg
                              class="h-6 w-6 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          {/if}
                          {item.name}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Static sidebar for desktop -->
  <div
    class="hidden lg:fixed lg:top-16 lg:bottom-0 lg:z-30 lg:flex lg:w-72 lg:flex-col"
  >
    <div
      class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pt-6"
    >
      <nav class="flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" class="-mx-2 space-y-1">
              {#each navigation as item}
                <li>
                  <a
                    href={item.href}
                    class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold {currentPath.startsWith(
                      item.href,
                    )
                      ? 'bg-gray-50 text-indigo-600'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}"
                  >
                    {#if item.icon === "user"}
                      <svg
                        class="h-6 w-6 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    {:else if item.icon === "home"}
                      <svg
                        class="h-6 w-6 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    {:else if item.icon === "heart"}
                      <svg
                        class="h-6 w-6 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    {:else if item.icon === "cog"}
                      <svg
                        class="h-6 w-6 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    {/if}
                    {item.name}
                  </a>
                </li>
              {/each}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- Top bar - Full width navbar -->
  <div
    class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
  >
    <button
      type="button"
      class="-m-2.5 p-2.5 text-white/80 hover:text-white lg:hidden"
      on:click={() => (mobileMenuOpen = true)}
    >
      <span class="sr-only">Open sidebar</span>
      <svg
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <div class="h-6 w-px bg-white/30 lg:hidden"></div>

    <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
      <div class="flex flex-1 items-center space-x-4">
        <a href="/" class="hidden lg:flex items-center hover:opacity-90">
          <img
            src="/images/logo-villana-with-name-beta.svg"
            alt="Villana Logo"
            class="max-w-[128px]"
          />
        </a>
        <h2 class="text-lg font-semibold text-white">
          {#if currentPath === "/dashboard"}
            Dashboard
          {:else if currentPath.includes("/profile")}
            Profile
          {:else if currentPath.includes("/villas")}
            Villa Saya
          {:else if currentPath.includes("/saved")}
            Saved Villas
          {:else if currentPath.includes("/settings")}
            Settings
          {:else}
            Dashboard
          {/if}
        </h2>
      </div>
      <div class="flex items-center gap-x-4 lg:gap-x-6">
        <!-- User menu -->
        <div class="relative">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              {#if data.user.profilePicture}
                <img
                  class="h-8 w-8 rounded-full"
                  src={data.user.profilePicture}
                  alt="Profile"
                  referrerpolicy="no-referrer"
                />
              {:else}
                <div
                  class="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              {/if}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{data.user.fullName}</p>
              <p class="text-xs text-white/80">{data.user.email}</p>
            </div>
            <div>
              <a
                href="/auth/logout"
                class="text-sm text-white/80 hover:text-white"
                title="Logout"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="lg:pl-72">
    <!-- Main content -->
    <main class="py-10">
      <div class="px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <!-- <Footer user={data.user} isDashboard={true} /> -->
  </div>
</div>
