<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { Dialog } from "bits-ui";
  import {
    FileEdit,
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
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
  <title>Change Requests - Admin - Villana</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  <div class="sm:flex sm:items-center mb-6">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900">Change Requests</h1>
      <p class="mt-2 text-sm text-gray-600">
        Manage user requests for villa listing changes.
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
            Change request status updated successfully.
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
              Requester
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
          {#each data.changeRequests as request}
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
                <div class="text-sm text-gray-500">
                  {request.villa.address}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.user.username}
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">
                  {request.subject}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                    request.status,
                  )}"
                >
                  {request.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(request.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                  onclick={() => {
                    openModalId = request.id;
                  }}
                >
                  <Eye class="h-4 w-4" />
                  View
                </button>
              </td>
            </tr>

            <!-- Modal for Change Request Details -->
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
                      Change Request Details
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
                        {request.villa.title}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Requester</label
                      >
                      <p class="text-sm text-gray-900">
                        {request.user.username}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Subject</label
                      >
                      <p class="text-sm text-gray-900">
                        {request.subject}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Request Details</label
                      >
                      <p class="text-sm text-gray-900 whitespace-pre-line">
                        {request.requestDetail}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Created</label
                      >
                      <p class="text-sm text-gray-900">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    {#if request.adminNotes}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Admin Notes</label
                        >
                        <p class="text-sm text-gray-900 whitespace-pre-line">
                          {request.adminNotes}
                        </p>
                      </div>
                    {/if}
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
                    <input
                      type="hidden"
                      name="requestId"
                      value={request.id}
                    />
                    <div class="space-y-4">
                      <div>
                        <label
                          for="status-{request.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Update Status
                        </label>
                        <select
                          id="status-{request.id}"
                          name="status"
                          class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                          <option
                            value="pending"
                            selected={request.status === "pending"}
                            >Pending</option
                          >
                          <option
                            value="reviewed"
                            selected={request.status === "reviewed"}
                            >Reviewed</option
                          >
                          <option
                            value="approved"
                            selected={request.status === "approved"}
                            >Approved</option
                          >
                          <option
                            value="rejected"
                            selected={request.status === "rejected"}
                            >Rejected</option
                          >
                        </select>
                      </div>
                      <div>
                        <label
                          for="adminNotes-{request.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          id="adminNotes-{request.id}"
                          name="adminNotes"
                          rows="3"
                          class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          placeholder="Add notes about the review decision..."
                          value={request.adminNotes || ""}
                        ></textarea>
                      </div>
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

          {#if data.changeRequests.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center">
                <FileEdit class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  No change requests found
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  There are no villa change requests to review.
                </p>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
