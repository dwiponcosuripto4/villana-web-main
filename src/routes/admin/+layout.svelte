<script lang="ts">
  import { page } from "$app/stores";
  import type { LayoutData } from "./$types";
  import { Toaster } from "svelte-5-french-toast";
  import {
    LayoutDashboard,
    Building,
    MapPin,
    Users,
    Flag,
    FileEdit,
    Home,
    Menu,
    X,
    LogOut,
    BarChart3,
    MessageCircle,
    Shield,
    FileText,
  } from "lucide-svelte";

  interface Props {
    data: LayoutData;
  }

  let { data }: Props = $props();

  let sidebarOpen = $state(false);

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
        { name: "Posts", href: "/admin/posts", icon: FileText },
      ],
    },
    {
      name: "Analytics",
      items: [
        {
          name: "WhatsApp",
          href: "/admin/analytics/whatsapp",
          icon: MessageCircle,
        },
      ],
    },
    {
      name: "Management",
      items: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Ownership Claims", href: "/admin/claims", icon: Shield },
        { name: "Villa Updates", href: "/admin/villa-updates", icon: FileEdit },
        { name: "Reports", href: "/admin/reports", icon: Flag },
        {
          name: "Change Requests",
          href: "/admin/change-requests",
          icon: FileEdit,
        },
      ],
    },
  ];

  let currentPath = $derived($page.url.pathname);

  function isActiveRoute(href: string): boolean {
    if (href === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(href);
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<Toaster />
<div class="min-h-screen bg-gray-50">
  <!-- Mobile menu overlay -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
      onclick={closeSidebar}
      onkeydown={(e) => e.key === "Escape" && closeSidebar()}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- Sidebar -->
  <div
    class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 {sidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <!-- Header with gradient -->
    <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <a
          href="/"
          class="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
        >
          <Home size={20} />
          <span class="text-sm">Back to App</span>
        </a>
        <button
          class="lg:hidden text-white hover:text-gray-200"
          onclick={closeSidebar}
        >
          <X size={20} />
        </button>
      </div>
      <h1 class="text-white text-xl font-bold mt-2">Admin Panel</h1>
    </div>

    <!-- Navigation -->
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
                  class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group
                    {isActiveRoute(item.href)
                    ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-900'}"
                  onclick={closeSidebar}
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

    <!-- User info at bottom -->
    <div
      class="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white"
    >
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0">
            <div class="flex-shrink-0">
              <div
                class="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center"
              >
                <span class="text-sm font-semibold text-white">
                  {data.user?.username?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
            </div>
            <div class="ml-3 min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                {data.user?.username || "Admin"}
              </p>
              <p class="text-xs text-indigo-600 font-medium">Administrator</p>
            </div>
          </div>
          <form method="post" action="/admin/logout">
            <button
              type="submit"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Main content -->
  <div class="lg:pl-64">
    <!-- Mobile header -->
    <div
      class="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
    >
      <button class="text-gray-600 hover:text-gray-900" onclick={toggleSidebar}>
        <Menu size={24} />
      </button>
      <h1 class="text-lg font-bold text-indigo-900">Admin Panel</h1>
      <div class="w-6"></div>
      <!-- Spacer for centering -->
    </div>

    <main class="max-w-7xl mx-auto px-1 md:px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <slot />
    </main>
  </div>
</div>
