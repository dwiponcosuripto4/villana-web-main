<script lang="ts">
  import {
    OTA_PROVIDERS,
    getOtaProviderConfig,
    getOtaDisplayName,
    formatOtaPrice,
    type OtaProvider,
  } from "$lib/config/ota-providers";
  import { Info } from "lucide-svelte";

  interface OtaLink {
    id: string;
    provider: string;
    affiliateUrl: string;
    customLabel: string | null;
    priceMode: string;
    manualPrice: string | null;
    fetchedPrice: string | null;
    priceCurrency: string | null;
    displayPrice?: string | null;
  }

  interface Props {
    villaId: number;
    otaLinks: OtaLink[];
  }

  let { villaId, otaLinks = [] }: Props = $props();

  // Filter only active links (already filtered on server, but just in case)
  let activeLinks = $derived(otaLinks.filter((link) => link));

  async function handleOtaClick(link: OtaLink) {
    try {
      // Track the click
      await fetch(`/api/villas/${villaId}/ota-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otaLinkId: link.id }),
      });
    } catch (error) {
      console.error("Error tracking OTA click:", error);
    }

    // Open the affiliate URL in a new tab
    window.open(link.affiliateUrl, "_blank", "noopener,noreferrer");
  }

  function getDisplayPrice(link: OtaLink): string | null {
    if (link.displayPrice) return link.displayPrice;
    if (link.priceMode === "none") return null;
    if (link.priceMode === "manual" && link.manualPrice) {
      return formatOtaPrice(link.manualPrice, link.priceCurrency || "IDR");
    }
    if (link.priceMode === "auto_fetch" && link.fetchedPrice) {
      return formatOtaPrice(link.fetchedPrice, link.priceCurrency || "IDR");
    }
    return null;
  }
</script>

{#if activeLinks.length > 0}
  <div class="mt-4">
    <p class="mb-3 text-sm text-gray-500">Also available on:</p>

    <div class="grid grid-cols-2 gap-3">
      {#each activeLinks as link}
        {@const config = getOtaProviderConfig(link.provider as OtaProvider)}
        {@const displayPrice = getDisplayPrice(link)}

        <button
          onclick={() => handleOtaClick(link)}
          class="flex cursor-pointer flex-col items-center rounded-lg border p-3 transition-all hover:shadow-md {config.bgColor} {config.hoverBgColor} {config.borderColor}"
        >
          <!-- Logo or fallback initial -->
          <div class="mb-2 flex h-8 w-full items-center justify-center">
            {#if config.logo}
              <img
                src={config.logo}
                alt={config.name}
                class="h-6 max-w-full object-contain"
                onerror={(e) => {
                  // Hide image and show text fallback
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = document.createElement("span");
                    fallback.className = "text-sm font-semibold";
                    fallback.style.color = config.color;
                    fallback.textContent = config.name;
                    parent.appendChild(fallback);
                  }
                }}
              />
            {:else}
              <span class="text-sm font-semibold" style="color: {config.color}">
                {getOtaDisplayName(
                  link.provider as OtaProvider,
                  link.customLabel,
                )}
              </span>
            {/if}
          </div>

          <!-- Provider name (if logo exists) -->
          {#if config.logo}
            <span class="text-xs text-gray-600">
              {getOtaDisplayName(
                link.provider as OtaProvider,
                link.customLabel,
              )}
            </span>
          {/if}

          <!-- Price if available -->
          {#if displayPrice}
            <span class="mt-1 text-sm font-medium text-green-600">
              {displayPrice}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}
