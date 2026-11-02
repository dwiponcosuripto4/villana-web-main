<script lang="ts">
  interface Props {
    show?: boolean;
    villaId: number;
  }

  let {
    show = $bindable(false),
    villaId
  }: Props = $props();

  let dialogEl: HTMLDialogElement;
  let analyticsData = $state<any>(null);
  let loading = $state(false);
  let error = $state("");

  $effect(() => {
    if (show && dialogEl) {
      dialogEl.showModal();
      // Load analytics data when modal opens
      if (!analyticsData) {
        loadAnalytics();
      }
    } else if (!show && dialogEl) {
      dialogEl.close();
    }
  });

  function closeModal() {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    const rect = dialogEl.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      closeModal();
    }
  }

  async function loadAnalytics() {
    loading = true;
    error = "";
    try {
      const response = await fetch(`/admin/api/villas/${villaId}/analytics`);
      if (response.ok) {
        analyticsData = await response.json();
      } else {
        error = "Failed to load analytics data";
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      error = "Error loading analytics data";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<dialog
  bind:this={dialogEl}
  class="rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
  onclick={handleBackdropClick}
>
  <div class="bg-white p-6 overflow-y-auto max-h-[90vh]">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">WhatsApp Analytics</h2>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={loadAnalytics}
          disabled={loading}
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-b-indigo-600"></div>
          {/if}
          Refresh
        </button>
        <button
          type="button"
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
        <span class="ml-3 text-gray-500">Loading analytics...</span>
      </div>
    {:else if error}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Analytics Error</h3>
            <div class="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    {:else if analyticsData}
      <div class="space-y-6">
        <!-- WhatsApp Clicks Summary -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <div class="text-center">
            <div class="text-sm font-medium text-green-600 uppercase tracking-wide">Total WhatsApp Clicks</div>
            <div class="mt-2 text-5xl font-bold text-green-900">{analyticsData.whatsappClicks}</div>
            <div class="mt-1 text-sm text-green-600">clicks from all locations</div>
          </div>
        </div>

        {#if analyticsData.recentClicks && analyticsData.recentClicks.length > 0}
          <!-- Recent Activity -->
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
              <p class="mt-1 text-sm text-gray-500">Last {analyticsData.recentClicks.length} clicks</p>
            </div>

            <div class="overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Button Type
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each analyticsData.recentClicks as click}
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            WhatsApp Contact
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(click.clickedAt).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {click.userId ? `User ${click.userId}` : 'Anonymous'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {click.userIp || 'N/A'}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {:else}
          <!-- No Activity -->
          <div class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
            <p class="mt-1 text-sm text-gray-500">No WhatsApp button clicks recorded for this villa.</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-12 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="mt-2">Click "Refresh" to load analytics data</p>
      </div>
    {/if}

    <div class="mt-6 flex justify-end">
      <button
        type="button"
        onclick={closeModal}
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Close
      </button>
    </div>
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
</style>