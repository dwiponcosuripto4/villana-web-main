<script lang="ts">
  import SavedVillasBadge from "./SavedVillasBadge.svelte";
  import MobileSidebar from "./MobileSidebar.svelte";
  import LanguageSelector from "./LanguageSelector.svelte";

  interface Props {
    user?: any;
    noSaved?: boolean;
    noLogin?: boolean;
    noRegister?: boolean;
  }

  let {
    user = null,
    noSaved = false,
    noLogin = false,
    noRegister = false,
  }: Props = $props();

  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<nav
  class="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700"
>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <div class="flex items-center space-x-4 relative">
        <a
          href="/"
          class="flex items-center space-x-2 text-xl font-bold text-white hover:text-white/90"
        >
          <img
            src="/images/logo-villana-with-name-beta.svg"
            alt="Villana Logo"
            class="max-w-[128px]"
          />
        </a>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Mobile hamburger menu button -->
        <button
          onclick={toggleMobileMenu}
          class="lg:hidden text-white/80 hover:text-white cursor-pointer"
          aria-label="Open menu"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <!-- Desktop menu items (hidden on mobile) -->
        <div class="hidden lg:flex lg:items-center lg:space-x-4">
          {#if user}
            <!-- Authenticated user menu -->
            {#if user.role === "admin"}
              <a href="/admin" class="text-sm text-white/80 hover:text-white"
                >Admin</a
              >
            {/if}
            <a href="/dashboard" class="text-sm text-white/80 hover:text-white"
              >Dashboard</a
            >
            <a
              href="/auth/logout"
              class="text-sm text-white/80 hover:text-white">Logout</a
            >
          {:else}
            <!-- Non-authenticated user menu -->
            <!-- Language Selector -->
            <div class="language-selector-navbar">
              <LanguageSelector
                {user}
                showLabels={false}
                size="small"
                variant="select"
              />
            </div>
            {#if !noLogin}
              <a href="/login" class="text-sm text-white/80 hover:text-white"
                >Login</a
              >{/if}
            {#if !noRegister}
              <a
                href="/register"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Register
              </a>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Sidebar -->
  <MobileSidebar isOpen={mobileMenuOpen} {user} onClose={closeMobileMenu} />
</nav>

<style>
  :global(.language-selector-navbar select) {
    background-color: white !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
  }

  :global(.language-selector-navbar select:focus) {
    border-color: #6366f1 !important;
    ring-color: #6366f1 !important;
  }
</style>
