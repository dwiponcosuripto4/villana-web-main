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
      name: "Villa operations",
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
      name: "Insights",
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
<div class="min-h-screen bg-cream-50 text-forest-950">
  <!-- Mobile overlay -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 z-40 bg-forest-950/50 backdrop-blur-[2px] lg:hidden"
      onclick={closeSidebar}
      onkeydown={(e) => e.key === "Escape" && closeSidebar()}
      role="button"
      tabindex="0"
      aria-label="Close navigation"
    ></div>
  {/if}

  <!-- Sidebar -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-forest-900 text-cream-100 transition-transform duration-300 ease-out lg:translate-x-0 {sidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <!-- Brand -->
    <div class="flex items-center justify-between gap-3 px-5 pt-6 pb-5">
      <a href="/admin" class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/40 bg-forest-800"
        >
          <Home size={18} class="text-gold-400" />
        </span>
        <span class="leading-tight">
          <span class="block font-serif text-lg tracking-wide text-cream-50">
            Villana
          </span>
          <span
            class="block text-[9px] uppercase tracking-[0.2em] text-cream-100/40"
          >
            Villa management
          </span>
        </span>
      </a>
      <button
        class="rounded-md p-1.5 text-cream-100/70 transition-colors hover:bg-white/10 hover:text-cream-50 lg:hidden"
        onclick={closeSidebar}
        aria-label="Close navigation"
      >
        <X size={18} />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 pb-6">
      {#each navigationGroups as group}
        <div class="mb-5">
          <p
            class="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-cream-100/35"
          >
            {group.name}
          </p>
          <ul class="space-y-0.5">
            {#each group.items as item}
              {@const Icon = item.icon}
              {@const active = isActiveRoute(item.href)}
              <li>
                <a
                  href={item.href}
                  onclick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  class="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors {active
                    ? 'bg-cream-50 text-forest-950 shadow-sm'
                    : 'text-cream-100/70 hover:bg-white/10 hover:text-cream-50'}"
                >
                  <Icon
                    size={15}
                    class={active
                      ? "text-forest-700"
                      : "text-cream-100/45 group-hover:text-cream-100"}
                  />
                  <span class="truncate">{item.name}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    <!-- User -->
    <div class="border-t border-white/10 p-4">
      <div class="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 font-serif text-sm font-semibold text-forest-950"
        >
          {data.user?.username?.charAt(0)?.toUpperCase() || "A"}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] font-medium text-cream-50">
            {data.user?.username || "Admin"}
          </p>
          <p
            class="truncate text-[9px] uppercase tracking-[0.16em] text-cream-100/40"
          >
            Administrator
          </p>
        </div>
        <form method="post" action="/admin/logout">
          <button
            type="submit"
            class="rounded-md p-1.5 text-cream-100/50 transition-colors hover:bg-white/10 hover:text-cream-50"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <div class="lg:pl-[268px]">
    <!-- Mobile header -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-cream-200/70 bg-cream-50/90 px-4 py-3 backdrop-blur lg:hidden"
    >
      <button
        class="rounded-md p-1.5 text-forest-700 transition-colors hover:bg-forest-50"
        onclick={toggleSidebar}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>
      <span class="font-serif text-lg text-forest-950">Villana</span>
      <a
        href="/"
        class="rounded-md p-1.5 text-forest-700 transition-colors hover:bg-forest-50"
        aria-label="Back to public site"
      >
        <Home size={18} />
      </a>
    </header>

    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <slot />
    </main>
  </div>
</div>
