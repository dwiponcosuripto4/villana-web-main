<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { showToast } from "$lib/utils/toast.js";
  import {
    OTA_PROVIDERS,
    getOtaProviderConfig,
    getOtaDisplayName,
    formatOtaPrice,
    type OtaProvider,
  } from "$lib/config/ota-providers";
  import type { VillaOtaLink } from "$lib/server/db/schema";
  import TrashIcon from "$lib/components/icons/TrashIcon.svelte";
  import PencilEditIcon from "$lib/components/icons/PencilEditIcon.svelte";

  type PriceMode = "auto_fetch" | "manual" | "none";

  interface Props {
    villaId: number;
    otaLinks: VillaOtaLink[];
    onUpdate?: () => Promise<void>;
  }

  let { villaId, otaLinks = [], onUpdate }: Props = $props();

  let showAddForm = $state(false);
  let editingLinkId = $state<string | null>(null);
  let isLoading = $state(false);

  // Form fields
  let provider = $state<OtaProvider>("agoda");
  let affiliateUrl = $state("");
  let customLabel = $state("");
  let priceMode = $state<PriceMode>("none");
  let manualPrice = $state("");
  let isActive = $state(true);

  function resetForm() {
    provider = "agoda";
    affiliateUrl = "";
    customLabel = "";
    priceMode = "none";
    manualPrice = "";
    isActive = true;
    editingLinkId = null;
  }

  function startEdit(link: VillaOtaLink) {
    editingLinkId = link.id;
    provider = link.provider as OtaProvider;
    affiliateUrl = link.affiliateUrl;
    customLabel = link.customLabel || "";
    priceMode = link.priceMode as PriceMode;
    manualPrice = link.manualPrice || "";
    isActive = link.isActive;
    showAddForm = true;
  }

  async function handleSubmit() {
    if (!affiliateUrl) {
      showToast.error("Affiliate URL is required");
      return;
    }

    isLoading = true;

    try {
      const endpoint = editingLinkId
        ? `/api/admin/villas/${villaId}/ota-links/${editingLinkId}`
        : `/api/admin/villas/${villaId}/ota-links`;

      const method = editingLinkId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          affiliateUrl,
          customLabel: customLabel || null,
          priceMode,
          manualPrice: priceMode === "manual" ? manualPrice : null,
          isActive,
        }),
      });

      if (response.ok) {
        showToast.success(
          editingLinkId
            ? "OTA link updated successfully"
            : "OTA link added successfully"
        );
        resetForm();
        showAddForm = false;
        if (onUpdate) await onUpdate();
        await invalidateAll();
      } else {
        const error = await response.json();
        showToast.error(error.message || "Failed to save OTA link");
      }
    } catch (error) {
      console.error("Error saving OTA link:", error);
      showToast.error("Failed to save OTA link");
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(linkId: string) {
    if (!confirm("Are you sure you want to delete this OTA link?")) return;

    isLoading = true;

    try {
      const response = await fetch(
        `/api/admin/villas/${villaId}/ota-links/${linkId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        showToast.success("OTA link deleted successfully");
        if (onUpdate) await onUpdate();
        await invalidateAll();
      } else {
        showToast.error("Failed to delete OTA link");
      }
    } catch (error) {
      console.error("Error deleting OTA link:", error);
      showToast.error("Failed to delete OTA link");
    } finally {
      isLoading = false;
    }
  }

  async function toggleActive(link: VillaOtaLink) {
    try {
      const response = await fetch(
        `/api/admin/villas/${villaId}/ota-links/${link.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !link.isActive }),
        }
      );

      if (response.ok) {
        showToast.success(
          link.isActive ? "OTA link disabled" : "OTA link enabled"
        );
        if (onUpdate) await onUpdate();
        await invalidateAll();
      }
    } catch (error) {
      console.error("Error toggling OTA link:", error);
    }
  }
</script>

<div>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg leading-6 font-medium text-gray-900">
      OTA Affiliate Links
    </h3>
    <button
      type="button"
      onclick={() => {
        resetForm();
        showAddForm = !showAddForm;
      }}
      class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-indigo-700"
    >
      {showAddForm ? "Cancel" : "Add OTA Link"}
    </button>
  </div>

  {#if showAddForm}
    <div class="mb-4 rounded-lg border p-4 bg-gray-50">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label for="ota-provider" class="block text-sm font-medium text-gray-700">
            OTA Provider *
          </label>
          <select
            id="ota-provider"
            bind:value={provider}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {#each Object.entries(OTA_PROVIDERS) as [key, config]}
              <option value={key}>{config.name}</option>
            {/each}
          </select>
        </div>

        <div class="sm:col-span-2">
          <label for="ota-url" class="block text-sm font-medium text-gray-700">
            Affiliate URL *
          </label>
          <input
            type="url"
            id="ota-url"
            bind:value={affiliateUrl}
            placeholder="https://www.agoda.com/..."
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="ota-label" class="block text-sm font-medium text-gray-700">
            Custom Label (optional)
          </label>
          <input
            type="text"
            id="ota-label"
            bind:value={customLabel}
            placeholder="e.g., Agoda Promo"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="price-mode" class="block text-sm font-medium text-gray-700">
            Price Display
          </label>
          <select
            id="price-mode"
            bind:value={priceMode}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="none">No Price</option>
            <option value="manual">Manual Price</option>
            <option value="auto_fetch">Auto-fetch (Coming Soon)</option>
          </select>
        </div>

        {#if priceMode === "manual"}
          <div>
            <label for="manual-price" class="block text-sm font-medium text-gray-700">
              Price (IDR)
            </label>
            <input
              type="number"
              id="manual-price"
              bind:value={manualPrice}
              placeholder="1500000"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        {/if}

        <div class="flex items-center pt-6">
          <input
            type="checkbox"
            id="ota-active"
            bind:checked={isActive}
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label for="ota-active" class="ml-2 block text-sm text-gray-700">
            Active (visible on villa page)
          </label>
        </div>
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <button
          type="button"
          onclick={() => {
            resetForm();
            showAddForm = false;
          }}
          class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleSubmit}
          disabled={isLoading}
          class="rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : editingLinkId ? "Update" : "Add OTA Link"}
        </button>
      </div>
    </div>
  {/if}

  <!-- OTA Links List -->
  <div class="space-y-2">
    {#each otaLinks as link}
      {@const config = getOtaProviderConfig(link.provider as OtaProvider)}
      <div
        class="rounded border p-3 flex items-center justify-between {link.isActive
          ? 'bg-white'
          : 'bg-gray-100 opacity-60'}"
      >
        <div class="flex items-center space-x-3">
          {#if config.logo}
            <img
              src={config.logo}
              alt={config.name}
              class="h-8 w-8 object-contain"
              onerror={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          {:else}
            <div
              class="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold"
              style="background-color: {config.color}"
            >
              {config.name.charAt(0)}
            </div>
          {/if}

          <div>
            <div class="flex items-center space-x-2">
              <span class="font-medium">
                {getOtaDisplayName(link.provider as OtaProvider, link.customLabel)}
              </span>
              {#if !link.isActive}
                <span
                  class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600"
                >
                  Inactive
                </span>
              {/if}
            </div>
            <div class="text-sm text-gray-500 truncate max-w-md">
              {link.affiliateUrl}
            </div>
            {#if link.priceMode !== "none"}
              <div class="text-sm">
                {#if link.priceMode === "manual" && link.manualPrice}
                  <span class="text-green-600 font-medium">
                    {formatOtaPrice(link.manualPrice, link.priceCurrency || "IDR")}
                  </span>
                {:else if link.priceMode === "auto_fetch"}
                  <span class="text-blue-600">Auto-fetch enabled</span>
                {/if}
              </div>
            {/if}
            {#if link.clickCount > 0}
              <div class="text-xs text-gray-400">
                {link.clickCount} clicks
              </div>
            {/if}
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            onclick={() => toggleActive(link)}
            class="p-1 rounded hover:bg-gray-100"
            title={link.isActive ? "Disable" : "Enable"}
          >
            {#if link.isActive}
              <svg
                class="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            {:else}
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            {/if}
          </button>
          <button
            type="button"
            onclick={() => startEdit(link)}
            class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit"
          >
            <PencilEditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onclick={() => handleDelete(link.id)}
            class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    {:else}
      <p class="text-gray-500 text-center py-4">
        No OTA links added yet. Add links to Agoda, Traveloka, Booking.com, etc.
        to let users book through their preferred platform.
      </p>
    {/each}
  </div>
</div>
