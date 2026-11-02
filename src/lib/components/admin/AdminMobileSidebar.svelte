<script lang="ts">
  import {
    LayoutDashboard,
    Building,
    MapPin,
    Users,
    Flag,
    FileEdit,
    Home,
    X,
    LogOut,
  } from "lucide-svelte";

  interface Props {
    isOpen: boolean;
    user: any;
    currentPath: string;
    onClose: () => void;
  }

  let { isOpen = false, user = null, currentPath = "", onClose }: Props = $props();

  const navigationGroups = [
    {
      name: "Overview",
      items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
      name: "Content",
      items: [
        { name: "Villas", href: "/admin/villas", icon: Building },
        { name: "Places", href: "/admin/places", icon: MapPin },
      ],
    },
    {
      name: "Management",
      items: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Reports", href: "/admin/reports", icon: Flag },
        { name: "Change Requests", href: "/admin/change-requests", icon: FileEdit },
      ],
    },
  ];

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

  function isActiveRoute(href: string): boolean {
    if (href === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(href);
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
  <!-- Sidebar panel - now slides from left -->
  <div
    class="fixed left-0 top-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in {isOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-label="Admin navigation menu"
  >
    <!-- Sidebar header with gradient -->
    <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <a
          href="/"
          class="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          onclick={onClose}
        >
          <Home size={20} />
          <span class="text-sm">Back to App</span>
        </a>
        <button
          onclick={onClose}
          class="text-white hover:text-gray-200 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <h1 class="text-white text-xl font-bold mt-2">Admin Panel</h1>
      {#if user}
        <p class="text-indigo-100 text-sm mt-1">{user.username}</p>
      {/if}
    </div>

    <!-- Navigation links -->
    <nav class="px-4 py-6 overflow-y-auto h-full pb-32">
      {#each navigationGroups as group}
        <div class="mb-6">
          <h3
            class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
          >
            {group.name}
          </h3>
          <ul class="space-y-1">
            {#each group.items as item}
              <li>
                <a
                  href={item.href}
                  onclick={onClose}
                  class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group
                    {isActiveRoute(item.href)
                    ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-900'}"
                >
                  <svelte:component
                    this={item.icon}
                    size={18}
                    class="mr-3 flex-shrink-0 {isActiveRoute(item.href)
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-600'}"
                  />
                  <span class="truncate">{item.name}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    <!-- Logout at bottom -->
    <div class="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
      <form method="post" action="/admin/logout">
        <button
          type="submit"
          onclick={onClose}
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span class="font-medium">Logout</span>
        </button>
      </form>
    </div>
  </div>
</div>
