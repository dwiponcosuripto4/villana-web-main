<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import {
    Home,
    AlertCircle,
    Search,
    HelpCircle,
    Clock,
    XCircle,
    CheckCircle,
    FileText,
    Ban,
    X,
  } from "lucide-svelte";
  import DashboardVillaCard from "$lib/components/dashboard/DashboardVillaCard.svelte";
  import LazyImage from "$lib/components/LazyImage.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Tab state
  let activeTab = $state<"villas" | "claims">("villas");
  let cancelingClaimId = $state<string | null>(null);

  // Filter claims by status (exclude canceled for active display)
  const activeClaims = $derived(
    data.claims.filter((c) => c.status !== "canceled"),
  );

  const pendingClaims = $derived(
    data.claims.filter(
      (c) => c.status === "pending" || c.status === "under_review",
    ),
  );

  function getStatusText(status: string) {
    switch (status) {
      case "pending":
        return "Menunggu Review";
      case "under_review":
        return "Sedang Direview";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      case "canceled":
        return "Dibatalkan";
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function canCancel(status: string) {
    return status === "pending" || status === "under_review";
  }
</script>

<svelte:head>
  <title>Villa Saya - Dashboard | Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Villa Saya</h1>
    <p class="mt-1 text-sm text-gray-600">
      Kelola villa dan klaim kepemilikan Anda
    </p>
  </div>

  <!-- Error State -->
  {#if data.error}
    <div
      class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-red-700">{data.error}</p>
    </div>
  {/if}

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-8" aria-label="Tabs">
      <button
        type="button"
        onclick={() => (activeTab = "villas")}
        class="cursor-pointer relative py-3 text-sm font-medium transition-colors {activeTab ===
        'villas'
          ? 'text-indigo-600'
          : 'text-gray-500 hover:text-gray-700'}"
      >
        <div class="flex items-center gap-2">
          <Home class="w-4 h-4" />
          <span>Villa Saya</span>
          {#if data.ownedVillas.length > 0}
            <span
              class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full {activeTab ===
              'villas'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'}"
            >
              {data.ownedVillas.length}
            </span>
          {/if}
        </div>
        {#if activeTab === "villas"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
          ></div>
        {/if}
      </button>

      <button
        type="button"
        onclick={() => (activeTab = "claims")}
        class="cursor-pointer relative py-3 text-sm font-medium transition-colors {activeTab ===
        'claims'
          ? 'text-indigo-600'
          : 'text-gray-500 hover:text-gray-700'}"
      >
        <div class="flex items-center gap-2">
          <FileText class="w-4 h-4" />
          <span>Klaim</span>
          {#if activeClaims.length > 0}
            <span
              class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full {activeTab ===
              'claims'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'}"
            >
              {activeClaims.length}
            </span>
          {/if}
          {#if pendingClaims.length > 0}
            <span
              class="inline-flex items-center justify-center w-2 h-2 rounded-full bg-yellow-500"
            ></span>
          {/if}
        </div>
        {#if activeTab === "claims"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
          ></div>
        {/if}
      </button>
    </nav>
  </div>

  <!-- Villa Saya Tab Content -->
  {#if activeTab === "villas"}
    <div class="space-y-4">
      {#if data.ownedVillas.length > 0}
        <div class="space-y-3">
          {#each data.ownedVillas as ownership}
            <DashboardVillaCard
              villa={{
                id: ownership.villa.id,
                title: ownership.villa.title,
                slug: ownership.villa.slug,
                status: ownership.villa.status,
                thumbnail: ownership.villa.thumbnail,
              }}
              showStatus={true}
            />
          {/each}
        </div>
      {:else}
        <!-- Empty State for Villas -->
        <div
          class="text-center py-12 bg-white rounded-lg border border-gray-200"
        >
          <Home class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            Belum Ada Villa
          </h3>
          <p class="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            {#if pendingClaims.length > 0}
              Klaim Anda sedang dalam proses review. Silakan tunggu hingga klaim
              disetujui.
            {:else}
              Anda belum memiliki villa. Mulai dengan mencari villa yang Anda
              miliki dan ajukan klaim kepemilikan.
            {/if}
          </p>
          {#if pendingClaims.length === 0}
            <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/explore"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Search class="w-4 h-4" />
                Cari Villa Anda
              </a>
              <a
                href="/faq"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HelpCircle class="w-4 h-4" />
                Pelajari Cara Klaim
              </a>
            </div>
          {:else}
            <button
              type="button"
              onclick={() => (activeTab = "claims")}
              class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Clock class="w-4 h-4" />
              Lihat Status Klaim
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Klaim Tab Content -->
  {#if activeTab === "claims"}
    <div class="space-y-6">
      {#if activeClaims.length > 0}
        <!-- Claims Table -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Villa
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Kode Verifikasi
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each activeClaims as claim}
                  <tr class="hover:bg-gray-50">
                    <!-- Villa Column with Thumbnail -->
                    <td class="px-4 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100"
                        >
                          {#if claim.villa.thumbnail}
                            <LazyImage
                              src={claim.villa.thumbnail.thumbnailUrl ||
                                claim.villa.thumbnail.imageUrl}
                              alt={claim.villa.title}
                            />
                          {:else}
                            <div
                              class="w-full h-full flex items-center justify-center bg-gray-200"
                            >
                              <Home class="w-5 h-5 text-gray-400" />
                            </div>
                          {/if}
                        </div>
                        <div class="min-w-0">
                          <a
                            href="/villa/{claim.villa.slug}"
                            class="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block max-w-[200px]"
                          >
                            {claim.villa.title}
                          </a>
                          {#if claim.status === "rejected" && claim.rejectionReason}
                            <p
                              class="text-xs text-red-600 truncate max-w-[200px]"
                              title={claim.rejectionReason}
                            >
                              {claim.rejectionReason}
                            </p>
                          {/if}
                        </div>
                      </div>
                    </td>

                    <!-- Verification Code Column -->
                    <td class="px-4 py-4 whitespace-nowrap">
                      {#if claim.verificationCode && (claim.status === "pending" || claim.status === "under_review")}
                        <div class="text-center">
                          <span class="font-mono text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded">
                            {claim.verificationCode}
                          </span>
                          <p class="text-xs text-gray-500 mt-1">Sebutkan kode ini saat dihubungi</p>
                        </div>
                      {:else}
                        <span class="text-xs text-gray-400">-</span>
                      {/if}
                    </td>

                    <!-- Status Column -->
                    <td class="px-4 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(
                          claim.status,
                        )}"
                      >
                        {#if claim.status === "pending" || claim.status === "under_review"}
                          <Clock class="w-3 h-3" />
                        {:else if claim.status === "approved"}
                          <CheckCircle class="w-3 h-3" />
                        {:else if claim.status === "rejected"}
                          <XCircle class="w-3 h-3" />
                        {:else if claim.status === "canceled"}
                          <Ban class="w-3 h-3" />
                        {/if}
                        {getStatusText(claim.status)}
                      </span>
                    </td>

                    <!-- Action Column -->
                    <td class="px-4 py-4 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end gap-2">
                        {#if canCancel(claim.status)}
                          <form
                            method="POST"
                            action="?/cancelClaim"
                            use:enhance={() => {
                              cancelingClaimId = claim.id;
                              return async ({ update }) => {
                                await update();
                                cancelingClaimId = null;
                              };
                            }}
                          >
                            <input type="hidden" name="claimId" value={claim.id} />
                            <button
                              type="submit"
                              disabled={cancelingClaimId === claim.id}
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X class="w-3.5 h-3.5" />
                              {cancelingClaimId === claim.id
                                ? "Membatalkan..."
                                : "Batalkan"}
                            </button>
                          </form>
                        {:else if claim.status === "rejected"}
                          <a
                            href="/villa/{claim.villa.slug}/claim"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            Klaim Ulang
                          </a>
                        {:else}
                          <span class="text-xs text-gray-400">-</span>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <!-- Empty State for Claims -->
        <div
          class="text-center py-12 bg-white rounded-lg border border-gray-200"
        >
          <FileText class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            Belum Ada Klaim
          </h3>
          <p class="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Anda belum mengajukan klaim kepemilikan villa. Cari villa yang Anda
            miliki dan ajukan klaim.
          </p>
          <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/explore"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Search class="w-4 h-4" />
              Cari Villa
            </a>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Help Section -->
  <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <HelpCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-medium text-blue-800">Butuh Bantuan?</h3>
        <p class="mt-1 text-sm text-blue-700">
          Jika Anda mengalami masalah dengan klaim villa,
          <a href="/faq" class="font-medium underline hover:no-underline"
            >baca FAQ</a
          >
          atau hubungi tim support kami.
        </p>
      </div>
    </div>
  </div>
</div>
