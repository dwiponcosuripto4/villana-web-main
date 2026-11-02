<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { Dialog } from "bits-ui";
  import {
    Flag,
    ExternalLink,
    Eye,
    CheckCircle,
    X,
  } from "lucide-svelte";

  let { data, form }: { data: PageData; form: any } = $props();

  let openModalId = $state<string | null>(null);

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case "scam":
        return "Scam/Fraudulent";
      case "invalid":
        return "Invalid Information";
      case "closed":
        return "Villa Closed";
      case "other":
        return "Other";
      default:
        return category;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>Villa Reports - Admin - Villana</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  <div class="sm:flex sm:items-center mb-6">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900">Villa Reports</h1>
      <p class="mt-2 text-sm text-gray-600">
        Manage user reports about villa listings.
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
            Report status updated successfully.
          </p>
        </div>
      </div>
    </div>
  {/if}

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
              Reporter
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Category
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Subject
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each data.reports as report}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  <a
                    href="/villa/{report.villa.slug}"
                    class="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    target="_blank"
                  >
                    {report.villa.title}
                    <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
                <div class="text-sm text-gray-500">
                  {report.villa.address}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.user.username}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {getCategoryLabel(report.category)}
                </div>
                {#if report.customCategory}
                  <div class="text-sm text-gray-500">
                    {report.customCategory}
                  </div>
                {/if}
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">
                  {report.subject}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                    report.status,
                  )}"
                >
                  {report.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(report.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                  onclick={() => {
                    openModalId = report.id;
                  }}
                >
                  <Eye class="h-4 w-4" />
                  View
                </button>
              </td>
            </tr>

            <!-- Modal for Report Details -->
            <Dialog.Root
              open={openModalId === report.id}
              onOpenChange={(open) => {
                if (!open) openModalId = null;
              }}
            >
              <Dialog.Portal>
                <Dialog.Overlay
                  class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
                <Dialog.Content
                  class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
                >
                  <div class="flex items-center justify-between mb-4">
                    <Dialog.Title class="text-lg font-semibold text-gray-900">
                      Report Details
                    </Dialog.Title>
                    <Dialog.Close
                      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X class="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Villa</label
                      >
                      <p class="text-sm text-gray-900">
                        {report.villa.title}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Reporter</label
                      >
                      <p class="text-sm text-gray-900">
                        {report.user.username}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Category</label
                      >
                      <p class="text-sm text-gray-900">
                        {getCategoryLabel(report.category)}
                        {#if report.customCategory}
                          - {report.customCategory}
                        {/if}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Subject</label
                      >
                      <p class="text-sm text-gray-900">
                        {report.subject}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Content</label
                      >
                      <p class="text-sm text-gray-900 whitespace-pre-line">
                        {report.content}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Created</label
                      >
                      <p class="text-sm text-gray-900">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>

                  <!-- Status Update Form -->
                  <form
                    method="post"
                    action="?/updateStatus"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        await update();
                        if (result.type === "success") {
                          openModalId = null;
                        }
                      };
                    }}
                    class="mt-6"
                  >
                    <input type="hidden" name="reportId" value={report.id} />
                    <div>
                      <label
                        for="status-{report.id}"
                        class="block text-sm font-medium text-gray-700"
                      >
                        Update Status
                      </label>
                      <select
                        id="status-{report.id}"
                        name="status"
                        class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      >
                        <option
                          value="pending"
                          selected={report.status === "pending"}>Pending</option
                        >
                        <option
                          value="reviewed"
                          selected={report.status === "reviewed"}
                          >Reviewed</option
                        >
                        <option
                          value="resolved"
                          selected={report.status === "resolved"}
                          >Resolved</option
                        >
                        <option
                          value="dismissed"
                          selected={report.status === "dismissed"}
                          >Dismissed</option
                        >
                      </select>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onclick={() => {
                          openModalId = null;
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Update Status
                      </button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          {/each}

          {#if data.reports.length === 0}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center">
                <Flag class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  No reports found
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  There are no villa reports to review.
                </p>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
