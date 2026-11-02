<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { Dialog } from "bits-ui";
  import { showToast } from "$lib/utils/toast";
  import {
    Shield,
    ExternalLink,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    X,
    FileText,
    Phone,
    Mail,
    User,
  } from "lucide-svelte";

  let { data, form }: { data: PageData; form: any } = $props();

  // Show toast when form result changes
  $effect(() => {
    if (form?.success) {
      if (form.action === "approved") {
        showToast.success("Claim approved successfully. User has been granted ownership.");
      } else if (form.action === "rejected") {
        showToast.success("Claim rejected successfully.");
      } else if (form.action === "under_review") {
        showToast.success("Claim marked as under review.");
      }
    } else if (form?.error) {
      showToast.error(form.error);
    }
  });

  let openModalId = $state<string | null>(null);
  let rejectModalId = $state<string | null>(null);

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
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
      case "under_review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  }

  function formatDate(dateString: string | Date | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
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
    goto(`/admin/claims?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Ownership Claims - Admin - Villana</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  <div class="sm:flex sm:items-center mb-6">
    <div class="sm:flex-auto">
      <h1 class="text-2xl font-bold text-gray-900">Ownership Claims</h1>
      <p class="mt-2 text-sm text-gray-600">
        Review and manage villa ownership claims from users.
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
              Claim approved successfully. User has been granted ownership.
            {:else if form.action === "rejected"}
              Claim rejected successfully.
            {:else if form.action === "under_review"}
              Claim marked as under review.
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

  <!-- Status Filter Tabs -->
  <div class="mb-6 border-b border-gray-200">
    <nav class="-mb-px flex space-x-8">
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
        onclick={() => handleStatusFilter("under_review")}
        class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {data.statusFilter === 'under_review'
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Under Review
        <span
          class="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
        >
          {data.statusCounts.under_review}
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
              Claimant
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Reason
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
          {#each data.claims as claim}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  <a
                    href="/villa/{claim.villa.slug}"
                    class="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    target="_blank"
                  >
                    {claim.villa.title}
                    <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
                <div class="text-sm text-gray-500 max-w-xs truncate">
                  {claim.villa.address}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {claim.user.fullName || claim.user.username}
                </div>
                <div class="text-sm text-gray-500">{claim.user.email}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">
                  {claim.claimReason}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                    claim.status,
                  )}"
                >
                  {getStatusLabel(claim.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(claim.createdAt)}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                  onclick={() => {
                    openModalId = claim.id;
                  }}
                >
                  <Eye class="h-4 w-4" />
                  Review
                </button>
              </td>
            </tr>

            <!-- Modal for Claim Details -->
            <Dialog.Root
              open={openModalId === claim.id}
              onOpenChange={(open) => {
                if (!open) openModalId = null;
              }}
            >
              <Dialog.Portal>
                <Dialog.Overlay
                  class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
                <Dialog.Content
                  class="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                >
                  <div class="flex items-center justify-between mb-4">
                    <Dialog.Title class="text-lg font-semibold text-gray-900">
                      Ownership Claim Details
                    </Dialog.Title>
                    <Dialog.Close
                      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X class="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Villa Info -->
                    <div class="space-y-4">
                      <h3
                        class="text-sm font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Villa Information
                      </h3>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Villa Name</label
                        >
                        <p class="text-sm text-gray-900">
                          <a
                            href="/villa/{claim.villa.slug}"
                            class="text-indigo-600 hover:text-indigo-900"
                            target="_blank"
                          >
                            {claim.villa.title}
                          </a>
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Address</label
                        >
                        <p class="text-sm text-gray-900">
                          {claim.villa.address}
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Listed Phone</label
                        >
                        <p class="text-sm text-gray-900 flex items-center gap-1">
                          <Phone class="h-4 w-4 text-gray-400" />
                          {claim.villa.phoneNumber || "-"}
                        </p>
                      </div>
                      <div>
                        <a
                          href="/admin/villas/{claim.villa.id}"
                          class="text-sm text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          target="_blank"
                        >
                          View in Admin
                          <ExternalLink class="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <!-- Claimant Info -->
                    <div class="space-y-4">
                      <h3
                        class="text-sm font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Claimant Information
                      </h3>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Name</label
                        >
                        <p class="text-sm text-gray-900 flex items-center gap-1">
                          <User class="h-4 w-4 text-gray-400" />
                          {claim.user.fullName || claim.user.username}
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Email</label
                        >
                        <p class="text-sm text-gray-900 flex items-center gap-1">
                          <Mail class="h-4 w-4 text-gray-400" />
                          {claim.user.email}
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Phone</label
                        >
                        <p class="text-sm text-gray-900 flex items-center gap-1">
                          <Phone class="h-4 w-4 text-gray-400" />
                          {claim.user.phoneNumber || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Phone Verification Section -->
                  {#if claim.verificationCode}
                    <div class="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h3
                        class="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-3"
                      >
                        Phone Verification
                      </h3>
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm text-indigo-700 mb-1">Verification Code:</p>
                          <p class="text-3xl font-mono font-bold text-indigo-900 tracking-widest">{claim.verificationCode}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm text-indigo-700 mb-1">Villa Phone:</p>
                          <p class="text-lg font-semibold text-indigo-900">{claim.villa.phoneNumber || "-"}</p>
                        </div>
                      </div>
                      <p class="text-xs text-indigo-600 mt-3">
                        Call or WhatsApp the villa phone number and ask for this code to verify ownership.
                      </p>
                    </div>
                  {/if}

                  <!-- Claim Details -->
                  <div class="mt-6 space-y-4 border-t border-gray-200 pt-6">
                    <h3
                      class="text-sm font-semibold text-gray-900 uppercase tracking-wider"
                    >
                      Claim Details
                    </h3>
                    <div>
                      <label class="block text-sm font-medium text-gray-700"
                        >Claim Reason</label
                      >
                      <p class="text-sm text-gray-900 whitespace-pre-line">
                        {claim.claimReason}
                      </p>
                    </div>
                    {#if claim.ownershipProof}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Ownership Proof</label
                        >
                        <p
                          class="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md"
                        >
                          {claim.ownershipProof}
                        </p>
                      </div>
                    {/if}
                    {#if claim.contactVerification}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Contact Verification</label
                        >
                        <p
                          class="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md"
                        >
                          {claim.contactVerification}
                        </p>
                      </div>
                    {/if}
                    {#if claim.additionalInfo}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Additional Information</label
                        >
                        <p
                          class="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md"
                        >
                          {claim.additionalInfo}
                        </p>
                      </div>
                    {/if}
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Submitted</label
                        >
                        <p class="text-sm text-gray-900">
                          {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Status</label
                        >
                        <span
                          class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {getStatusBadgeClass(
                            claim.status,
                          )}"
                        >
                          {getStatusLabel(claim.status)}
                        </span>
                      </div>
                    </div>
                    {#if claim.reviewedAt}
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700"
                            >Reviewed At</label
                          >
                          <p class="text-sm text-gray-900">
                            {formatDate(claim.reviewedAt)}
                          </p>
                        </div>
                      </div>
                    {/if}
                    {#if claim.rejectionReason}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Rejection Reason</label
                        >
                        <p
                          class="text-sm text-red-700 whitespace-pre-line bg-red-50 p-3 rounded-md"
                        >
                          {claim.rejectionReason}
                        </p>
                      </div>
                    {/if}
                    {#if claim.adminNotes}
                      <div>
                        <label class="block text-sm font-medium text-gray-700"
                          >Admin Notes</label
                        >
                        <p
                          class="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md"
                        >
                          {claim.adminNotes}
                        </p>
                      </div>
                    {/if}
                  </div>

                  <!-- Action Buttons -->
                  {#if claim.status === "pending" || claim.status === "under_review"}
                    <div
                      class="mt-6 border-t border-gray-200 pt-6 flex flex-wrap gap-3 justify-end"
                    >
                      {#if claim.status === "pending"}
                        <form
                          method="post"
                          action="?/markUnderReview"
                          use:enhance={() => {
                            return async ({ result, update }) => {
                              await update();
                              if (result.type === "success") {
                                openModalId = null;
                              }
                            };
                          }}
                        >
                          <input type="hidden" name="claimId" value={claim.id} />
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
                          rejectModalId = claim.id;
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
                        <input type="hidden" name="claimId" value={claim.id} />
                        <button
                          type="submit"
                          class="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircle class="h-4 w-4" />
                          Approve Claim
                        </button>
                      </form>
                    </div>
                  {/if}

                  {#if claim.status === "approved" || claim.status === "rejected"}
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
              open={rejectModalId === claim.id}
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
                      Reject Claim
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
                    <input type="hidden" name="claimId" value={claim.id} />
                    <div class="space-y-4">
                      <div>
                        <label
                          for="rejectionReason-{claim.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Rejection Reason <span class="text-red-500">*</span>
                        </label>
                        <textarea
                          id="rejectionReason-{claim.id}"
                          name="rejectionReason"
                          rows="3"
                          required
                          class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          placeholder="Explain why this claim is being rejected..."
                        ></textarea>
                      </div>
                      <div>
                        <label
                          for="adminNotes-{claim.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          id="adminNotes-{claim.id}"
                          name="adminNotes"
                          rows="2"
                          class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          placeholder="Internal notes..."
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
                        Reject Claim
                      </button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          {/each}

          {#if data.claims.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center">
                <Shield class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  No claims found
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  {#if data.statusFilter !== "all"}
                    No {data.statusFilter.replace("_", " ")} ownership claims to review.
                  {:else}
                    There are no ownership claims to review.
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
