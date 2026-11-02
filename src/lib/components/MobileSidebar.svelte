<script lang="ts">
  import SavedVillasBadge from "./SavedVillasBadge.svelte";
  import { goto } from "$app/navigation";

  interface Props {
    isOpen: boolean;
    user: any;
    onClose: () => void;
  }

  let { isOpen = false, user = null, onClose }: Props = $props();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300 ease-in {isOpen
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none'}"
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label="Close sidebar"
>
  <!-- Sidebar panel -->
  <div
    class="fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in {isOpen
      ? 'translate-x-0'
      : 'translate-x-full'}"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-label="Mobile navigation menu"
  >
    <!-- Sidebar header -->
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-gray-200"
    >
      <h2 class="text-lg font-semibold text-gray-900">Menu</h2>
      <button
        onclick={onClose}
        class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close menu"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation links -->
    <nav class="px-6 py-6">
      <div class="space-y-1">
        <!-- Saved Villas -->
        <SavedVillasBadge
          onClick={() => {
            onClose();
            goto("/saved");
          }}
          variant="default"
          showText={true}
        />

        <div class="border-t border-gray-200 my-4"></div>
        {#if user}
          <!-- Authenticated user menu -->
          {#if user.role === "admin"}
            <a
              href="/admin"
              onclick={onClose}
              class="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Admin Panel</span>
            </a>
          {/if}

          <a
            href="/dashboard"
            onclick={onClose}
            class="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Dashboard</span>
          </a>

          <div class="border-t border-gray-200 my-4"></div>

          <a
            href="/auth/logout"
            onclick={onClose}
            class="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </a>
        {:else}
          <!-- Non-authenticated user menu -->
          <a
            href="/admin/login"
            onclick={onClose}
            class="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Login</span>
          </a>

          <a
            href="/register"
            onclick={onClose}
            class="flex items-center space-x-3 px-3 py-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <span>Register</span>
          </a>
        {/if}
      </div>
    </nav>
  </div>
</div>

