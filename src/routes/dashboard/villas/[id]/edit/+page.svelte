<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import {
    ArrowLeft,
    ExternalLink,
    Save,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    X,
    AlertCircle,
    FileText,
    Edit3,
  } from "lucide-svelte";

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  // Tab state
  let activeTab = $state<"edit" | "requests">("edit");

  // Form states
  let isSubmittingDirect = $state(false);
  let isSubmittingRequest = $state(false);
  let cancelingRequestId = $state<string | null>(null);

  // Direct edit form values - sync with data when it updates
  let description = $state(data.villa.description || "");
  let unitsCount = $state(data.villa.unitsCount || 1);

  // Keep form values in sync with data after successful updates
  $effect(() => {
    description = data.villa.description || "";
    unitsCount = data.villa.unitsCount || 1;
  });

  // Change request form state
  let selectedField = $state<string | null>(null);
  let proposedValue = $state("");
  let changeReason = $state("");

  // Field definitions for change requests
  const fieldGroups = [
    {
      title: "Informasi Dasar",
      fields: [{ name: "title", label: "Nama Villa", type: "text" }],
    },
    {
      title: "Harga",
      fields: [
        { name: "priceMin", label: "Harga Minimum", type: "number" },
        { name: "priceMax", label: "Harga Maximum", type: "number" },
      ],
    },
    {
      title: "Kapasitas",
      fields: [
        { name: "bedroomMin", label: "Kamar Tidur (Min)", type: "number" },
        { name: "bedroomMax", label: "Kamar Tidur (Max)", type: "number" },
        {
          name: "personCapacityMin",
          label: "Kapasitas Orang (Min)",
          type: "number",
        },
        {
          name: "personCapacityMax",
          label: "Kapasitas Orang (Max)",
          type: "number",
        },
      ],
    },
    {
      title: "Fasilitas",
      fields: [
        { name: "hasAc", label: "AC", type: "boolean" },
        { name: "hasBathtub", label: "Bathtub", type: "boolean" },
        { name: "hasTv", label: "TV", type: "boolean" },
        { name: "hasBreakfast", label: "Sarapan", type: "boolean" },
        { name: "hasPool", label: "Kolam Renang", type: "boolean" },
        { name: "isPetFriendly", label: "Pet Friendly", type: "boolean" },
        { name: "isKidFriendly", label: "Kid Friendly", type: "boolean" },
        { name: "isSeniorFriendly", label: "Senior Friendly", type: "boolean" },
        { name: "isSyaria", label: "Syariah", type: "boolean" },
      ],
    },
    {
      title: "Kontak",
      fields: [
        { name: "phoneNumber", label: "Nomor Telepon", type: "text" },
        { name: "address", label: "Alamat", type: "textarea" },
      ],
    },
    {
      title: "Lokasi",
      fields: [
        { name: "latitude", label: "Latitude", type: "text" },
        { name: "longitude", label: "Longitude", type: "text" },
        { name: "googleMapsLink", label: "Link Google Maps", type: "text" },
      ],
    },
  ];

  // Get current value for a field
  function getCurrentValue(fieldName: string): string {
    const value = data.villa[fieldName as keyof typeof data.villa];
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    return String(value);
  }

  // Check if a field has a pending request
  function hasPendingRequest(fieldName: string): boolean {
    return data.pendingRequests.some((r) => r.fieldName === fieldName);
  }

  // Get pending request for a field
  function getPendingRequest(fieldName: string) {
    return data.pendingRequests.find((r) => r.fieldName === fieldName);
  }

  // Get status badge colors
  function getStatusColor(status: string) {
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

  function getStatusText(status: string) {
    switch (status) {
      case "pending":
        return "Menunggu Review";
      case "reviewed":
        return "Sedang Direview";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  }

  // Get field label by name
  function getFieldLabel(fieldName: string): string {
    for (const group of fieldGroups) {
      const field = group.fields.find((f) => f.name === fieldName);
      if (field) return field.label;
    }
    return fieldName;
  }

  // Open change request form for a field
  function openChangeRequest(fieldName: string) {
    selectedField = fieldName;
    if (proposedValue === null || proposedValue === "") {
      proposedValue = getCurrentValue(fieldName);
    } else {
      proposedValue = "";
    }
    changeReason = "";
    // focus on the proposed value input after opening
    setTimeout(() => {
      const input = document.querySelector(
        'form input[name="proposedValue"], form textarea[name="proposedValue"], form select[name="proposedValue"]',
      ) as HTMLElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }

  // Close change request form
  function closeChangeRequest() {
    selectedField = null;
    proposedValue = "";
    changeReason = "";
  }
</script>

<svelte:head>
  <title>Edit {data.villa.title} - Dashboard | Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex items-center gap-4">
      <a
        href="/dashboard/villas"
        class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <ArrowLeft class="w-5 h-5 text-gray-600" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{data.villa.title}</h1>
        <p class="text-sm text-gray-600">Edit informasi villa</p>
      </div>
    </div>
    {#if data.villa.status === "published"}
      <a
        href="/villa/{data.villa.slug}"
        target="_blank"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <ExternalLink class="w-4 h-4" />
        Lihat Villa
      </a>
    {/if}
  </div>

  <!-- Success/Error Messages -->
  {#if form?.success}
    <div
      class="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-green-700">{form.message}</p>
    </div>
  {/if}

  {#if form?.error}
    <div
      class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-red-700">{form.error}</p>
    </div>
  {/if}

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-8" aria-label="Tabs">
      <button
        type="button"
        onclick={() => (activeTab = "edit")}
        class="cursor-pointer relative py-3 text-sm font-medium transition-colors {activeTab ===
        'edit'
          ? 'text-indigo-600'
          : 'text-gray-500 hover:text-gray-700'}"
      >
        <div class="flex items-center gap-2">
          <Edit3 class="w-4 h-4" />
          <span>Edit</span>
        </div>
        {#if activeTab === "edit"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
          ></div>
        {/if}
      </button>

      <button
        type="button"
        onclick={() => (activeTab = "requests")}
        class="cursor-pointer relative py-3 text-sm font-medium transition-colors {activeTab ===
        'requests'
          ? 'text-indigo-600'
          : 'text-gray-500 hover:text-gray-700'}"
      >
        <div class="flex items-center gap-2">
          <FileText class="w-4 h-4" />
          <span>Permintaan Perubahan</span>
          {#if data.pendingRequests.length > 0}
            <span
              class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full {activeTab ===
              'requests'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-yellow-100 text-yellow-600'}"
            >
              {data.pendingRequests.length}
            </span>
          {/if}
        </div>
        {#if activeTab === "requests"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
          ></div>
        {/if}
      </button>
    </nav>
  </div>

  <!-- Edit Tab Content -->
  {#if activeTab === "edit"}
    <div class="space-y-8">
      <!-- Direct Edit Section -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit Langsung</h2>
          <p class="mt-1 text-sm text-gray-600">
            Perubahan pada field ini akan langsung berlaku tanpa perlu
            verifikasi admin.
          </p>
        </div>
        <form
          method="POST"
          action="?/updateDirect"
          use:enhance={() => {
            isSubmittingDirect = true;
            return async ({ update }) => {
              await update();
              isSubmittingDirect = false;
            };
          }}
          class="p-6 space-y-6"
        >
          <!-- Description -->
          <div>
            <label
              for="description"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              rows="6"
              bind:value={description}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              placeholder="Tulis deskripsi villa..."
            ></textarea>
          </div>

          <!-- Units Count -->
          <div>
            <label
              for="unitsCount"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Jumlah Unit
            </label>
            <input
              id="unitsCount"
              name="unitsCount"
              type="number"
              min="1"
              bind:value={unitsCount}
              class="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <p class="mt-2 text-sm text-gray-500">
              Berapa unit villa yang tersedia untuk disewa
            </p>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingDirect}
              class="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save class="w-4 h-4" />
              {isSubmittingDirect ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      <!-- Change Request Section -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Ajukan Perubahan</h2>
          <p class="mt-1 text-sm text-gray-600">
            Field berikut memerlukan verifikasi admin sebelum perubahan berlaku.
          </p>
        </div>
        <div class="p-6 space-y-8">
          {#each fieldGroups as group}
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-4">
                {group.title}
              </h3>
              <div class="space-y-3">
                {#each group.fields as field}
                  {@const pendingReq = getPendingRequest(field.name)}
                  <div
                    class="flex items-center justify-between p-4 bg-gray-50 rounded-lg {pendingReq
                      ? 'ring-1 ring-yellow-300'
                      : ''}"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-900"
                          >{field.label}</span
                        >
                        {#if pendingReq}
                          <span
                            class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full {getStatusColor(
                              pendingReq.status,
                            )}"
                          >
                            <Clock class="w-3 h-3" />
                            {getStatusText(pendingReq.status)}
                          </span>
                        {/if}
                      </div>
                      <p class="mt-1 text-sm text-gray-500">
                        {getCurrentValue(field.name)}
                      </p>
                      {#if pendingReq}
                        <div class="mt-1 text-sm text-yellow-700">
                          <p>Perubahan diajukan:</p>
                          <div class="font-medium">
                            {pendingReq.proposedValue}
                          </div>
                        </div>
                      {/if}
                    </div>
                    <div class="flex-shrink-0 ml-4">
                      {#if pendingReq}
                        <span class="text-xs text-gray-500"
                          >Menunggu review</span
                        >
                      {:else if selectedField === field.name}
                        <button
                          type="button"
                          onclick={closeChangeRequest}
                          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <X class="w-3.5 h-3.5" />
                          Batal
                        </button>
                      {:else}
                        <button
                          type="button"
                          onclick={() => openChangeRequest(field.name)}
                          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <Edit3 class="w-3.5 h-3.5" />
                          Ubah
                        </button>
                      {/if}
                    </div>
                  </div>

                  <!-- Change Request Form (Inline) -->
                  {#if selectedField === field.name}
                    <form
                      method="POST"
                      action="?/requestChange"
                      use:enhance={() => {
                        isSubmittingRequest = true;
                        return async ({ update }) => {
                          await update();
                          isSubmittingRequest = false;
                          closeChangeRequest();
                        };
                      }}
                      class="ml-4 p-4 bg-white border border-gray-200 rounded-lg space-y-4"
                    >
                      <input
                        type="hidden"
                        name="fieldName"
                        value={field.name}
                      />

                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Nilai Baru
                        </label>
                        {#if field.type === "boolean"}
                          <select
                            name="proposedValue"
                            bind:value={proposedValue}
                            class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Pilih...</option>
                            <option value="true">Ya</option>
                            <option value="false">Tidak</option>
                          </select>
                        {:else if field.type === "textarea"}
                          <textarea
                            name="proposedValue"
                            rows="3"
                            bind:value={proposedValue}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            placeholder="Masukkan nilai baru..."
                          ></textarea>
                        {:else if field.type === "number"}
                          <input
                            name="proposedValue"
                            type="number"
                            bind:value={proposedValue}
                            class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Masukkan nilai baru..."
                          />
                        {:else}
                          <input
                            name="proposedValue"
                            type="text"
                            bind:value={proposedValue}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Masukkan nilai baru..."
                          />
                        {/if}
                      </div>

                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Alasan Perubahan <span class="text-gray-400"
                            >(opsional)</span
                          >
                        </label>
                        <textarea
                          name="changeReason"
                          rows="2"
                          bind:value={changeReason}
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          placeholder="Jelaskan alasan perubahan..."
                        ></textarea>
                      </div>

                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          onclick={closeChangeRequest}
                          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingRequest || !proposedValue}
                          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send class="w-4 h-4" />
                          {isSubmittingRequest
                            ? "Mengirim..."
                            : "Ajukan Perubahan"}
                        </button>
                      </div>
                    </form>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Requests Tab Content -->
  {#if activeTab === "requests"}
    <div class="space-y-6">
      {#if data.pendingRequests.length > 0}
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nilai Saat Ini
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nilai Diajukan
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
                {#each data.pendingRequests as request}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-gray-900">
                        {getFieldLabel(request.fieldName)}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <span
                        class="text-sm text-gray-600 max-w-[200px] truncate block"
                      >
                        {request.currentValue || "-"}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <span
                        class="text-sm text-gray-900 font-medium max-w-[200px] truncate block"
                      >
                        {request.proposedValue}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(
                          request.status,
                        )}"
                      >
                        {#if request.status === "pending" || request.status === "reviewed"}
                          <Clock class="w-3 h-3" />
                        {:else if request.status === "approved"}
                          <CheckCircle class="w-3 h-3" />
                        {:else if request.status === "rejected"}
                          <XCircle class="w-3 h-3" />
                        {/if}
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-right">
                      {#if request.status === "pending" || request.status === "reviewed"}
                        <form
                          method="POST"
                          action="?/cancelRequest"
                          use:enhance={() => {
                            cancelingRequestId = request.id;
                            return async ({ update }) => {
                              await update();
                              cancelingRequestId = null;
                            };
                          }}
                          class="inline"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <button
                            type="submit"
                            disabled={cancelingRequestId === request.id}
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X class="w-3.5 h-3.5" />
                            {cancelingRequestId === request.id
                              ? "Membatalkan..."
                              : "Batalkan"}
                          </button>
                        </form>
                      {:else}
                        <span class="text-xs text-gray-400">-</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <div
          class="text-center py-12 bg-white rounded-lg border border-gray-200"
        >
          <FileText class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            Belum Ada Permintaan Perubahan
          </h3>
          <p class="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Anda belum mengajukan perubahan yang memerlukan verifikasi admin.
          </p>
          <button
            type="button"
            onclick={() => (activeTab = "edit")}
            class="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Edit3 class="w-4 h-4" />
            Mulai Edit
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Help Section -->
  <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <AlertCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-medium text-blue-800">Tentang Verifikasi</h3>
        <p class="mt-1 text-sm text-blue-700">
          Beberapa field memerlukan verifikasi admin untuk memastikan akurasi
          data. Perubahan pada deskripsi dan jumlah unit akan langsung berlaku.
        </p>
      </div>
    </div>
  </div>
</div>
