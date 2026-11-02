<script lang="ts">
  import type { PageData } from "./$types";
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { formatPrice } from "$lib/utils/format";
  import {
    Building2,
    CheckCircle2,
    Clock,
    Eye,
    MapPin,
    FileText,
    Newspaper,
    Plus,
    RefreshCw,
    Globe,
    MessageCircle,
    Package,
    Compass,
  } from "lucide-svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const stats = $derived(data?.stats);
  const recentVillas = $derived(data?.recentVillas ?? []);

  let nowLabel = $state("");
  let refreshing = $state(false);

  onMount(() => {
    nowLabel = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  });

  async function refresh() {
    refreshing = true;
    await invalidateAll();
    refreshing = false;
  }

  function num(value: number | undefined | null) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function pct(part: number, total: number) {
    if (!total) return 0;
    return Math.min(100, Math.round((part / total) * 100));
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const metricCards = $derived([
    {
      label: "Total villas",
      value: num(stats?.totalVillas),
      hint: "in the catalogue",
      icon: Building2,
    },
    {
      label: "Published",
      value: num(stats?.published),
      hint: "live on the site",
      icon: CheckCircle2,
    },
    {
      label: "Drafts",
      value: num(stats?.drafts),
      hint: "awaiting completion",
      icon: Clock,
    },
    {
      label: "Total views",
      value: num(stats?.totalViews),
      hint: "all-time villa views",
      icon: Eye,
    },
    {
      label: "Total places",
      value: num(stats?.totalPlaces),
      hint: "nearby destinations",
      icon: MapPin,
    },
    {
      label: "Published places",
      value: num(stats?.publishedPlaces),
      hint: "visible to visitors",
      icon: Compass,
    },
    {
      label: "Total posts",
      value: num(stats?.totalPosts),
      hint: "blog articles",
      icon: FileText,
    },
    {
      label: "Published posts",
      value: num(stats?.publishedPosts),
      hint: "live articles",
      icon: Newspaper,
    },
  ]);

  const availability = $derived([
    {
      label: "Villas",
      part: stats?.published ?? 0,
      total: stats?.totalVillas ?? 0,
    },
    {
      label: "Places",
      part: stats?.publishedPlaces ?? 0,
      total: stats?.totalPlaces ?? 0,
    },
    {
      label: "Posts",
      part: stats?.publishedPosts ?? 0,
      total: stats?.totalPosts ?? 0,
    },
  ]);
</script>

<div class="space-y-6">
  <!-- Page header -->
  <div
    class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
  >
    <div>
      <h1 class="text-xl font-semibold tracking-tight text-forest-950">
        Overview
      </h1>
      <p class="mt-1 text-[12px] text-forest-900/50">
        Villas, places, posts and visitor activity at a glance.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#if nowLabel}
        <span
          class="hidden items-center rounded-full border border-cream-200 bg-cream-100/70 px-3 py-2 text-[11px] text-forest-900/55 sm:inline-flex"
        >
          {nowLabel}
        </span>
      {/if}
      <button
        type="button"
        onclick={refresh}
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cream-200 bg-white text-forest-700 transition-colors hover:bg-cream-50 disabled:opacity-60"
        aria-label="Refresh dashboard"
        title="Refresh dashboard"
        disabled={refreshing}
      >
        <RefreshCw size={15} class={refreshing ? "animate-spin" : ""} />
      </button>
      <a
        href="/admin/villas/new"
        class="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-[13px] font-medium text-cream-50 shadow-sm transition-colors hover:bg-forest-700"
      >
        <Plus size={15} />
        New villa
      </a>
    </div>
  </div>

  <!-- Section header -->
  <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <h2 class="font-serif text-2xl text-forest-950">Today at Villana</h2>
      <p class="mt-1 text-[12px] text-forest-900/50">
        A live summary of the content currently available to visitors.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-2 text-[12px] font-medium text-forest-900/70 transition-colors hover:bg-cream-50 hover:text-forest-950"
      >
        <Globe size={14} />
        Public site
      </a>
      <a
        href="/admin/villas"
        class="inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-2 text-[12px] font-medium text-forest-900/70 transition-colors hover:bg-cream-50 hover:text-forest-950"
      >
        <Building2 size={14} />
        Manage villas
      </a>
      <a
        href="/admin/analytics/whatsapp"
        class="inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-2 text-[12px] font-medium text-forest-900/70 transition-colors hover:bg-cream-50 hover:text-forest-950"
      >
        <MessageCircle size={14} />
        WhatsApp analytics
      </a>
      <a
        href="/admin/villas/new"
        class="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-3 py-2 text-[12px] font-medium text-cream-50 shadow-sm transition-colors hover:bg-forest-700"
      >
        <Plus size={14} />
        New villa
      </a>
    </div>
  </div>

  <!-- Metric cards -->
  <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
    {#each metricCards as card}
      {@const Icon = card.icon}
      <div
        class="rounded-xl border border-cream-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,31,25,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(7,31,25,0.06)] sm:p-4"
      >
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cream-200 bg-cream-50 text-forest-700"
        >
          <Icon size={14} />
        </span>
        <p
          class="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-forest-900/45"
        >
          {card.label}
        </p>
        <p
          class="mt-1 text-[22px] leading-none font-semibold tracking-tight text-forest-950 tabular-nums sm:text-[26px]"
        >
          {card.value}
        </p>
        <p class="mt-1.5 text-[11px] text-forest-900/40">{card.hint}</p>
      </div>
    {/each}
  </div>

  <!-- Detail panels -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
    <!-- Recent villas -->
    <section class="rounded-xl border border-cream-200 bg-white shadow-sm">
      <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h3 class="text-[14px] font-semibold text-forest-950">
            Recent villas
          </h3>
          <p class="mt-0.5 text-[11px] text-forest-900/45">
            Latest additions to the catalogue
          </p>
        </div>
        <a
          href="/admin/villas"
          class="inline-flex items-center gap-1 text-[11px] font-medium text-forest-700 transition-colors hover:text-forest-950"
        >
          View all <span aria-hidden="true">→</span>
        </a>
      </div>

      <ul class="divide-y divide-cream-100">
        {#each recentVillas as villa (villa.id)}
          <li>
            <a
              href="/admin/villas/{villa.id}"
              class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream-50"
            >
              {#if villa.firstImage}
                <img
                  src={villa.firstImage.thumbnailUrl || villa.firstImage.imageUrl}
                  alt={villa.title}
                  class="h-10 w-10 shrink-0 rounded-lg border border-cream-200 object-cover"
                />
              {:else}
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cream-200 bg-cream-50 text-forest-900/30"
                >
                  <Building2 size={16} />
                </span>
              {/if}

              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium text-forest-950">
                  {villa.title}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-forest-900/45">
                  {formatPrice(Number(villa.priceMin))} – {formatPrice(
                    Number(villa.priceMax),
                  )} · {villa.bedrooms} BR · {formatDate(villa.createdAt)}
                </p>
              </div>

              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide {villa.status ===
                'published'
                  ? 'bg-forest-100 text-forest-700'
                  : 'bg-gold-100 text-gold-600'}"
              >
                {villa.status}
              </span>
            </a>
          </li>
        {:else}
          <li class="px-5 py-10 text-center">
            <Package class="mx-auto h-8 w-8 text-forest-900/20" />
            <p class="mt-2 text-[13px] font-medium text-forest-950">
              No villas yet
            </p>
            <p class="mt-1 text-[11px] text-forest-900/45">
              Create your first villa listing to get started.
            </p>
            <a
              href="/admin/villas/new"
              class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-3 py-2 text-[12px] font-medium text-cream-50 transition-colors hover:bg-forest-700"
            >
              <Plus size={14} />
              Add new villa
            </a>
          </li>
        {/each}
      </ul>
    </section>

    <!-- Content availability -->
    <section class="rounded-xl border border-cream-200 bg-white shadow-sm">
      <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <h3 class="text-[14px] font-semibold text-forest-950">
            Content availability
          </h3>
          <p class="mt-0.5 text-[11px] text-forest-900/45">
            Published versus total entries
          </p>
        </div>
        <span
          class="rounded-full border border-cream-200 bg-cream-50 px-2 py-0.5 text-[9px] uppercase tracking-wide text-forest-900/45"
        >
          Today
        </span>
      </div>

      <div class="space-y-4 px-5 pb-5">
        {#each availability as row}
          {@const percent = pct(row.part, row.total)}
          <div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-medium text-forest-900/70">{row.label}</span>
              <span class="text-forest-900/40 tabular-nums">
                {row.part}/{row.total}
              </span>
            </div>
            <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
              <div
                class="h-full rounded-full bg-forest-700 transition-[width] duration-500"
                style="width: {percent}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>

      <div class="border-t border-cream-100 px-5 py-3">
        <a
          href="/admin/villas"
          class="inline-flex items-center gap-1 text-[11px] font-medium text-forest-700 transition-colors hover:text-forest-950"
        >
          Review drafts <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  </div>
</div>
