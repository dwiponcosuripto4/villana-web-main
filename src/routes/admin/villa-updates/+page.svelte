<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { Dialog } from "bits-ui";
  import { showToast } from "$lib/utils/toast";
  import {
    FileEdit,
    ExternalLink,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    X,
    Search,
    ArrowRight,
  } from "lucide-svelte";

  let { data, form }: { data: PageData; form: any } = $props();

  // Show toast when form result changes
  $effect(() => {
    if (form?.success) {
      if (form.action === "approved") {
        showToast.success("Perubahan berhasil disetujui dan diterapkan.");
      } else if (form.action === "rejected") {
        showToast.success("Perubahan ditolak.");
      } else if (form.action === "reviewed") {
        showToast.success("Permintaan ditandai sebagai sedang direview.");
      }
    } else if (form?.error) {
      showToast.error(form.error);
    }
  });

  let openModalId = $state<string | null>(null);
  let rejectModalId = $state<string | null>(null);
  let searchQuery = $state(data.search || "");

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending":
        return "Pending";
      case "reviewed":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case "basic_info":
        return "Basic Info";
      case "pricing":
        return "Pricing";
      case "media":
        return "Media";
      case "amenities":
        return "Amenities";
      case "contact":
        return "Contact";
      case "technical":
        return "Technical";
      default:
        return category;
    }
  }

  function getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: "Nama Villa",
      priceMin: "Harga Minimum",
      priceMax: "Harga Maximum",
      bedroomMin: "Kamar Tidur (Min)",
      bedroomMax: "Kamar Tidur (Max)",
      personCapacityMin: "Kapasitas Orang (Min)",
      personCapacityMax: "Kapasitas Orang (Max)",
      hasAc: "AC",
      hasBathtub: "Bathtub",
      hasTv: "TV",
      hasBreakfast: "Sarapan",
      hasPool: "Kolam Renang",
      isPetFriendly: "Pet Friendly",
      isKidFriendly: "Kid Friendly",
      isSeniorFriendly: "Senior Friendly",
      isSyaria: "Syariah",
      phoneNumber: "Nomor Telepon",
      address: "Alamat",
      latitude: "Latitude",
      longitude: "Longitude",
      googleMapsLink: "Link Google Maps",
    };
    return labels[fieldName] || fieldName;
  }

  function formatValue(value: string | null, fieldName: string): string {
    if (value === null || value === undefined || value === "") return "-";

    // Handle boolean fields
    if (["hasAc", "hasBathtub", "hasTv", "hasBreakfast", "hasPool", "isPetFriendly", "isKidFriendly", "isSeniorFriendly", "isSyaria"].includes(fieldName)) {
      return value === "true" ? "Ya" : "Tidak";
    }

    return value;
  }

  function formatDate(dateString: string | Date | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleStatusFilter(status: string) {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    goto(`/admin/villa-updates?${params.toString()}`);
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (data.statusFilter !== "all") {
      params.set("status", data.statusFilter);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    goto(`/admin/villa-updates?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Villa Update Requests - Admin - Villana</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  <div class="sm:flex sm:items-center mb-6">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900">Villa Update Requests</h1>
      <p class="mt-2 text-sm text-gray-600">
        Review dan kelola permintaan perubahan data villa dari pemilik.
      </p>
    </div>
  </div>

  {#if form?.success}
    <div class="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <CheckCircle class="h-5 w-5 text-green-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700">
            {#if form.action === "approved"}
              Perubahan berhasil disetujui dan diterapkan.
            {:else if form.action === "rejected"}
              Perubahan ditolak.
            {:else if form.action === "reviewed"}
              Permintaan ditandai sebagai sedang direview.
            {:else}
              Action completed successfully.
            {/if}
          </p>
        </div>
      </div>
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <XCircle class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{form.error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Search Bar -->
  <div class="mb-6">
    <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari berdasarkan nama villa atau pemilik..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Search
      </button>
    </form>
  </div>

  <!-- Status Filter Tabs -->
  <div class="mb-6 border-b border-gray-200">
    <nav class="-mb-px flex space-x-8 overflow-x-auto">
      <button
        onclick={() => handleStatusFilter("all")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'all'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        All
        <span
          class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
        >
          {data.statusCounts.all}
        </span>
      </button>
      <button
        onclick={() => handleStatusFilter("pending")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'pending'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Pending
        <span
          class="ml-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
        >
          {data.statusCounts.pending}
        </span>
      </button>
      <button
        onclick={() => handleStatusFilter("reviewed")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'reviewed'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Under Review
        <span
          class="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
        >
          {data.statusCounts.reviewed}
        </span>
      </button>
      <button
        onclick={() => handleStatusFilter("approved")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'approved'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Approved
        <span
          class="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
        >
          {data.statusCounts.approved}
        </span>
      </button>
      <button
        onclick={() => handleStatusFilter("rejected")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'rejected'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Rejected
        <span
          class="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
        >
          {data.statusCounts.rejected}
        </span>
      </button>
    </nav>
  </div>

  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Villa
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Owner
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Field
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Change
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Submitted
            </th>
            <th class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each data.requests as request}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  <a
                    href="/villa/{request.villa.slug}"
                    class="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    target="_blank"
                  >
                    {request.villa.title}
                    <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {request.owner.fullName || request.owner.username}
                </div>
                <div class="text-sm text-gray-500">{request.owner.email}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {getFieldLabel(request.fieldName)}
                </div>
                <div class="text-xs text-gray-500">
                  {getCategoryLabel(request.dataCategory)}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-500 max-w-[100px] truncate" title={formatValue(request.currentValue, request.fieldName)}>
                    {formatValue(request.currentValue, request.fieldName)}
                  </span>
                  <ArrowRight class="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span class="text-gray-900 font-medium max-w-[100px] truncate" title={formatValue(request.proposedValue, request.fieldName)}>
                    {formatValue(request.proposedValue, request.fieldName)}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                    request.status,
                  )}"
                >
                  {getStatusLabel(request.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(request.createdAt)}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                  onclick={() => {
                    openModalId = request.id;
                  }}
                >
                  <Eye class="h-4 w-4" />
                  Review
                </button>
              </td>
            </tr>

            <!-- Modal for Request Details -->
            <Dialog.Root
              open={openModalId === request.id}
              onOpenChange={(open) => {
                if (!open) openModalId = null;
              }}
            >
              <Dialog.Portal>
                <Dialog.Overlay
                  class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
                <Dialog.Content
                  class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                >
                  <div class="flex items-center justify-between mb-4">
                    <Dialog.Title class="text-lg font-semibold text-gray-900">
                      Detail Permintaan Perubahan
                    </Dialog.Title>
                    <Dialog.Close
                      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X class="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div class="space-y-6">
                    <!-- Villa & Owner Info -->
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                          Villa
                        </h3>
                        <p class="text-sm">
                          <a
                            href="/villa/{request.villa.slug}"
                            class="text-indigo-600 hover:text-indigo-900"
                            target="_blank"
                          >
                            {request.villa.title}
                          </a>
                        </p>
                        <a
                          href="/admin/villas/{request.villa.id}"
                          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-1"
                          target="_blank"
                        >
                          View in Admin
                          <ExternalLink class="h-3 w-3" />
                        </a>
                      </div>
                      <div>
                        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                          Owner
                        </h3>
                        <p class="text-sm font-medium text-gray-900">
                          {request.owner.fullName || request.owner.username}
                        </p>
                        <p class="text-sm text-gray-500">{request.owner.email}</p>
                      </div>
                    </div>

                    <!-- Change Details -->
                    <div class="border-t border-gray-200 pt-6">
                      <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                        Detail Perubahan
                      </h3>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Field</label>
                          <p class="text-sm text-gray-900">{getFieldLabel(request.fieldName)}</p>
                          <p class="text-xs text-gray-500">{getCategoryLabel(request.dataCategory)}</p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span
                            class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                              request.status,
                            )}"
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                      </div>

                      <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Nilai Saat Ini</label>
                          <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                            {formatValue(request.currentValue, request.fieldName)}
                          </p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Nilai Diajukan</label>
                          <p class="text-sm text-gray-900 bg-green-50 p-3 rounded-md font-medium">
                            {formatValue(request.proposedValue, request.fieldName)}
                          </p>
                        </div>
                      </div>

                      {#if request.changeReason}
                        <div class="mt-4">
                          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan</label>
                          <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                            {request.changeReason}
                          </p>
                        </div>
                      {/if}

                      <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                          <p class="text-sm text-gray-900">{formatDate(request.createdAt)}</p>
                        </div>
                        {#if request.reviewedAt}
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Reviewed At</label>
                            <p class="text-sm text-gray-900">{formatDate(request.reviewedAt)}</p>
                          </div>
                        {/if}
                      </div>

                      {#if request.adminNotes}
                        <div class="mt-4">
                          <label class="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                          <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                            {request.adminNotes}
                          </p>
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  {#if request.status === "pending" || request.status === "reviewed"}
                    <div
                      class="mt-6 border-t border-gray-200 pt-6 flex flex-wrap gap-3 justify-end"
                    >
                      {#if request.status === "pending"}
                        <form
                          method="post"
                          action="?/markReviewed"
                          use:enhance={() => {
                            return async ({ result, update }) => {
                              await update();
                              if (result.type === "success") {
                                openModalId = null;
                              }
                            };
                          }}
                        >
                          <input type="hidden" name="requestId" value={request.id} />
                          <button
                            type="submit"
                            class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            <Clock class="h-4 w-4" />
                            Mark Under Review
                          </button>
                        </form>
                      {/if}

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        onclick={() => {
                          openModalId = null;
                          rejectModalId = request.id;
                        }}
                      >
                        <XCircle class="h-4 w-4" />
                        Reject
                      </button>

                      <form
                        method="post"
                        action="?/approve"
                        use:enhance={() => {
                          return async ({ result, update }) => {
                            await update();
                            if (result.type === "success") {
                              openModalId = null;
                            }
                          };
                        }}
                      >
                        <input type="hidden" name="requestId" value={request.id} />
                        <button
                          type="submit"
                          class="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircle class="h-4 w-4" />
                          Approve & Apply
                        </button>
                      </form>
                    </div>
                  {/if}

                  {#if request.status === "approved" || request.status === "rejected"}
                    <div class="mt-6 flex justify-end">
                      <button
                        type="button"
                        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onclick={() => {
                          openModalId = null;
                        }}
                      >
                        Close
                      </button>
                    </div>
                  {/if}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <!-- Rejection Modal -->
            <Dialog.Root
              open={rejectModalId === request.id}
              onOpenChange={(open) => {
                if (!open) rejectModalId = null;
              }}
            >
              <Dialog.Portal>
                <Dialog.Overlay
                  class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
                <Dialog.Content
                  class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
                >
                  <div class="flex items-center justify-between mb-4">
                    <Dialog.Title class="text-lg font-semibold text-gray-900">
                      Tolak Perubahan
                    </Dialog.Title>
                    <Dialog.Close
                      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X class="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <form
                    method="post"
                    action="?/reject"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        await update();
                        if (result.type === "success") {
                          rejectModalId = null;
                        }
                      };
                    }}
                  >
                    <input type="hidden" name="requestId" value={request.id} />
                    <div class="space-y-4">
                      <div>
                        <label
                          for="adminNotes-{request.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Alasan Penolakan <span class="text-red-500">*</span>
                        </label>
                        <textarea
                          id="adminNotes-{request.id}"
                          name="adminNotes"
                          rows="3"
                          required
                          class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          placeholder="Jelaskan alasan penolakan..."
                        ></textarea>
                      </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onclick={() => {
                          rejectModalId = null;
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Tolak Perubahan
                      </button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          {/each}

          {#if data.requests.length === 0}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center">
                <FileEdit class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada permintaan perubahan
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  {#if data.statusFilter !== "all"}
                    Tidak ada permintaan dengan status {getStatusLabel(data.statusFilter).toLowerCase()}.
                  {:else}
                    Belum ada permintaan perubahan villa dari pemilik.
                  {/if}
                </p>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
