<script lang="ts">
  import type { PageData } from "./$types";
  import { DropdownMenu } from "bits-ui";
  import { goto } from "$app/navigation";
  import {
    MessageCircle,
    Eye,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    ArrowUpDown,
  } from "lucide-svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const sortOptions = [
    { value: "clicks", label: "WhatsApp Clicks" },
    { value: "views", label: "View Count" },
    { value: "conversion", label: "Conversion Rate" },
    { value: "recent", label: "Recent Click" },
  ] as const;

  function getPageUrl(page: number, sortBy?: string): string {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", data.pagination.limit.toString());
    params.set("sortBy", sortBy || data.sortBy);
    return `?${params.toString()}`;
  }

  function handleSortChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    goto(getPageUrl(1, select.value));
  }

  // Generate page numbers to show
  let pageNumbers = $derived(() => {
    const pages: number[] = [];
    const { page, totalPages } = data.pagination;

    // Always show first page
    pages.push(1);

    // Show pages around current page
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Always show last page if more than 1 page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages.sort((a, b) => a - b);
  });
</script>

<svelte:head>
  <title>WhatsApp Analytics - Admin - Villana</title>
</svelte:head>

<div class="px-1 md:px-4 py-6 sm:px-0">
  <div class="sm:flex sm:items-center mb-6">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900">WhatsApp Analytics</h1>
      <p class="mt-2 text-sm text-gray-600">
        Track WhatsApp click engagement across all villa listings.
      </p>
    </div>
  </div>

  <!-- Total Stats Card -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-1 mb-8">
    <div class="bg-green-50 overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <MessageCircle class="h-12 w-12 text-green-600" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-green-600 truncate">
              Total WhatsApp Clicks
            </dt>
            <dd class="mt-1 text-4xl font-semibold text-green-900">
              {data.totalWhatsappClicks.toLocaleString()}
            </dd>
            <p class="text-sm text-green-600 mt-1">
              clicks across all published villas
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Villas Table -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Villas by WhatsApp Clicks
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            Showing {data.villasByClicks.length} of {data.pagination.total} villas
          </p>
        </div>
        <div class="flex items-center gap-2">
          <ArrowUpDown class="h-4 w-4 text-gray-400" />
          <label for="sortBy" class="text-sm text-gray-500">Sort by:</label>
          <select
            id="sortBy"
            value={data.sortBy}
            onchange={handleSortChange}
            class="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="w-1/2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Villa
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              WhatsApp Clicks
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              View Count
            </th>
            <th
              class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Conversion Rate
            </th>
            <th class="relative px-6 py-3 w-12">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each data.villasByClicks as villa, index}
            {@const conversionRate =
              villa.viewCount > 0
                ? ((villa.whatsappClicks / villa.viewCount) * 100).toFixed(1)
                : "0.0"}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 md:px-4 py-4">
                <div
                  class="text-sm font-medium text-gray-900"
                  onclick={() => goto(`/admin/villas/${villa.villaId}`)}
                  style="cursor: pointer;"
                >
                  {villa.villaTitle}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <MessageCircle class="h-4 w-4 text-green-500 mr-2" />
                  <span class="text-sm font-semibold text-green-600">
                    {villa.whatsappClicks.toLocaleString()}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <Eye class="h-4 w-4 text-blue-500 mr-2" />
                  <span class="text-sm text-gray-900">
                    {villa.viewCount.toLocaleString()}
                  </span>
                </div>
              </td>
              <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold
                  {Number(conversionRate) >= 5
                    ? 'bg-green-100 text-green-800'
                    : Number(conversionRate) >= 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'}"
                >
                  {conversionRate}%
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      class="z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      sideOffset={5}
                      align="end"
                    >
                      <DropdownMenu.Item
                        class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onSelect={() =>
                          (window.location.href = `/admin/villas/${villa.villaId}`)}
                      >
                        <Pencil class="h-4 w-4 mr-2" />
                        Edit Villa
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onSelect={() =>
                          window.open(`/villa/${villa.villaSlug}`, "_blank")}
                      >
                        <ExternalLink class="h-4 w-4 mr-2" />
                        View Public
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center">
                <MessageCircle class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  No analytics data
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  WhatsApp click data will appear here once users start
                  clicking.
                </p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div
        class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
      >
        <div class="flex-1 flex justify-between sm:hidden">
          {#if data.pagination.page > 1}
            <a
              href={getPageUrl(data.pagination.page - 1)}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </a>
          {/if}
          {#if data.pagination.page < data.pagination.totalPages}
            <a
              href={getPageUrl(data.pagination.page + 1)}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </a>
          {/if}
        </div>
        <div
          class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium"
                >{(data.pagination.page - 1) * data.pagination.limit + 1}</span
              >
              to
              <span class="font-medium"
                >{Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total,
                )}</span
              >
              of
              <span class="font-medium">{data.pagination.total}</span>
              results
            </p>
          </div>
          <div>
            <nav
              class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <!-- Previous button -->
              {#if data.pagination.page > 1}
                <a
                  href={getPageUrl(data.pagination.page - 1)}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Previous</span>
                  <ChevronLeft class="h-5 w-5" />
                </a>
              {:else}
                <span
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <ChevronLeft class="h-5 w-5" />
                </span>
              {/if}

              <!-- Page numbers -->
              {#each pageNumbers() as pageNum, i}
                {#if i > 0 && pageNumbers()[i - 1] !== pageNum - 1}
                  <span
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                {/if}
                {#if pageNum === data.pagination.page}
                  <span
                    class="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    {pageNum}
                  </span>
                {:else}
                  <a
                    href={getPageUrl(pageNum)}
                    class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    {pageNum}
                  </a>
                {/if}
              {/each}

              <!-- Next button -->
              {#if data.pagination.page < data.pagination.totalPages}
                <a
                  href={getPageUrl(data.pagination.page + 1)}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Next</span>
                  <ChevronRight class="h-5 w-5" />
                </a>
              {:else}
                <span
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <ChevronRight class="h-5 w-5" />
                </span>
              {/if}
            </nav>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
