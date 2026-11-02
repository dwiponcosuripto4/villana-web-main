<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { invalidateAll, goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { DropdownMenu } from "bits-ui";
  import {
    Plus,
    Search,
    Users,
    ShieldCheck,
    User,
    X,
    MoreHorizontal,
    UserCog,
    UserMinus,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Key,
    Copy,
    Check,
  } from "lucide-svelte";
  import { showToast } from "$lib/utils/toast";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let searchQuery = $state(data.searchParams.query);
  let selectedRole = $state(data.searchParams.role);
  let selectedSort = $state(data.searchParams.sortBy);

  // Reset password modal state
  let showResetPasswordModal = $state(false);
  let resetPasswordUser: (typeof data.users)[0] | null = $state(null);
  let resetPasswordMode: "custom" | "generate" = $state("generate");
  let customPassword = $state("");
  let generatedPassword = $state("");
  let passwordCopied = $state(false);

  let searchTimeout: NodeJS.Timeout;

  const roleOptions = [
    { value: "all", label: "All Users" },
    { value: "admin", label: "Admins Only" },
    { value: "viewer", label: "Viewers Only" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "alphabetical", label: "Alphabetical" },
  ];

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateUrl();
    }, 300);
  }

  function handleFilterChange() {
    updateUrl();
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedRole && selectedRole !== "all")
      params.set("role", selectedRole);
    if (selectedSort && selectedSort !== "newest")
      params.set("sortBy", selectedSort);

    const queryString = params.toString();
    goto(`/admin/users${queryString ? `?${queryString}` : ""}`);
  }

  function clearFilters() {
    searchQuery = "";
    selectedRole = "all";
    selectedSort = "newest";
    goto("/admin/users");
  }

  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set("page", pageNum.toString());
    goto(`/admin/users?${params.toString()}`);
  }

  function openResetPasswordModal(user: (typeof data.users)[0]) {
    resetPasswordUser = user;
    resetPasswordMode = "generate";
    customPassword = "";
    generatedPassword = "";
    passwordCopied = false;
    showResetPasswordModal = true;
  }

  function closeResetPasswordModal() {
    showResetPasswordModal = false;
    resetPasswordUser = null;
    customPassword = "";
    generatedPassword = "";
    passwordCopied = false;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      passwordCopied = true;
      setTimeout(() => {
        passwordCopied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8 sm:flex sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
      <p class="mt-2 text-sm text-gray-600">
        Manage admin users and permissions
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        onclick={() => (showCreateForm = !showCreateForm)}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus class="-ml-1 mr-2 h-5 w-5" />
        Add Admin User
      </button>
    </div>
  </div>

  <!-- Messages -->
  {#if form?.error}
    <div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
      <p class="text-sm text-red-700">{form.error}</p>
    </div>
  {/if}

  {#if form?.success}
    <div class="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
      <p class="text-sm text-green-700">{form.message}</p>
    </div>
  {/if}

  <!-- Create Admin Form -->
  {#if showCreateForm}
    <div class="mb-8 bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Create New Admin User
        </h3>
        <form
          method="post"
          action="?/createAdmin"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") {
                showCreateForm = false;
                await invalidateAll();
              }
            };
          }}
          class="space-y-4"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                for="fullName"
                class="block text-sm font-medium text-gray-700"
              >
                Full Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700"
              >
                Email Address <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label
                for="username"
                class="block text-sm font-medium text-gray-700"
              >
                Username <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter username"
              />
              <p class="mt-1 text-xs text-gray-500">
                3-31 characters, alphanumeric only
              </p>
            </div>
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
              >
                Password <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter secure password"
              />
              <p class="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              onclick={() => (showCreateForm = false)}
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Users class="h-8 w-8 text-indigo-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Total Users
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {data.stats.totalUsers}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ShieldCheck class="h-8 w-8 text-green-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Admin Users
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-green-600">
              {data.stats.totalAdmins}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <User class="h-8 w-8 text-gray-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Regular Users
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-600">
              {data.stats.totalViewers}
            </dd>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="mb-6 bg-white shadow sm:rounded-md p-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <!-- Search Input -->
      <div class="sm:col-span-2">
        <label for="search" class="sr-only">Search users</label>
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            oninput={handleSearch}
            placeholder="Search by name, email, or username..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <!-- Role Filter -->
      <div>
        <label for="role" class="sr-only">Filter by role</label>
        <select
          id="role"
          bind:value={selectedRole}
          onchange={handleFilterChange}
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {#each roleOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Sort Filter -->
      <div>
        <label for="sort" class="sr-only">Sort by</label>
        <select
          id="sort"
          bind:value={selectedSort}
          onchange={handleFilterChange}
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if searchQuery || selectedRole !== "all" || selectedSort !== "newest"}
      <div class="mt-3 flex items-center">
        <span class="text-sm text-gray-500 mr-3">Active filters:</span>
        <button
          onclick={clearFilters}
          class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Clear all
          <X class="ml-1.5 h-4 w-4" />
        </button>
      </div>
    {/if}
  </div>

  <!-- Users Table -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        {searchQuery ? "Search Results" : "All Users"}
      </h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        Showing {Math.min(
          (data.pagination.page - 1) * data.pagination.limit + 1,
          data.pagination.total,
        )}
        to {Math.min(
          data.pagination.page * data.pagination.limit,
          data.pagination.total,
        )}
        of {data.pagination.total} users
      </p>
    </div>
    <ul class="divide-y divide-gray-200">
      {#each data.users as user}
        <li class="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <div
                  class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center"
                >
                  <span class="text-white font-medium text-sm">
                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="ml-4">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900">
                    {user.fullName || user.username}
                  </div>
                  <span
                    class={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isAdmin
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.isAdmin ? "Admin" : "User"}
                  </span>
                </div>
                <div class="text-sm text-gray-500">
                  @{user.username} • {user.email}
                </div>
                <div class="text-xs text-gray-400">
                  ID: {user.id}
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal class="h-5 w-5" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    class="z-50 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    sideOffset={5}
                    align="end"
                  >
                    {#if user.isAdmin}
                      {#if data.admins.length > 1}
                        <form method="post" action="?/demoteAdmin" use:enhance>
                          <input type="hidden" name="userId" value={user.id} />
                          <DropdownMenu.Item asChild>
                            <button
                              type="submit"
                              onclick={(e) => {
                                if (
                                  !confirm(
                                    "Are you sure you want to remove admin privileges?",
                                  )
                                )
                                  e.preventDefault();
                              }}
                              class="w-full flex items-center px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer"
                            >
                              <UserMinus class="h-4 w-4 mr-2" />
                              Remove Admin
                            </button>
                          </DropdownMenu.Item>
                        </form>
                      {:else}
                        <div
                          class="flex items-center px-3 py-2 text-sm text-gray-400"
                        >
                          <UserCog class="h-4 w-4 mr-2" />
                          Last Admin
                        </div>
                      {/if}
                    {:else}
                      <form method="post" action="?/promoteUser" use:enhance>
                        <input type="hidden" name="userId" value={user.id} />
                        <DropdownMenu.Item asChild>
                          <button
                            type="submit"
                            onclick={(e) => {
                              if (
                                !confirm(
                                  "Are you sure you want to make this user an admin?",
                                )
                              )
                                e.preventDefault();
                            }}
                            class="w-full flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 cursor-pointer"
                          >
                            <ShieldCheck class="h-4 w-4 mr-2" />
                            Make Admin
                          </button>
                        </DropdownMenu.Item>
                      </form>
                    {/if}

                    <DropdownMenu.Separator
                      class="my-1 border-t border-gray-200"
                    />
                    <DropdownMenu.Item asChild>
                      <button
                        type="button"
                        onclick={() => openResetPasswordModal(user)}
                        class="w-full flex items-center px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                      >
                        <Key class="h-4 w-4 mr-2" />
                        Reset Password
                      </button>
                    </DropdownMenu.Item>

                    {#if !user.isAdmin || data.admins.length > 1}
                      <DropdownMenu.Separator
                        class="my-1 border-t border-gray-200"
                      />
                      <form method="post" action="?/deleteUser" use:enhance>
                        <input type="hidden" name="userId" value={user.id} />
                        <DropdownMenu.Item asChild>
                          <button
                            type="submit"
                            onclick={(e) => {
                              if (
                                !confirm(
                                  "Are you sure you want to delete this user?",
                                )
                              )
                                e.preventDefault();
                            }}
                            class="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 class="h-4 w-4 mr-2" />
                            Delete User
                          </button>
                        </DropdownMenu.Item>
                      </form>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </li>
      {:else}
        <li class="px-4 py-8 text-center text-gray-500">
          <Users class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? "No matching users" : "No users found"}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {#if searchQuery}
              Try searching with different terms or <button
                onclick={clearFilters}
                class="text-indigo-600 hover:text-indigo-500 underline"
                >clear the filters</button
              >
            {:else}
              Get started by creating an admin user.
            {/if}
          </p>
        </li>
      {/each}
    </ul>

    <!-- Pagination Controls -->
    {#if data.pagination.totalPages > 1}
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              onclick={() => goToPage(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onclick={() => goToPage(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-gray-700">
                Page <span class="font-medium">{data.pagination.page}</span> of
                <span class="font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onclick={() => goToPage(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <ChevronLeft class="h-5 w-5" />
                </button>

                {#each Array(Math.min(7, data.pagination.totalPages)) as _, i}
                  {@const pageNumber = (() => {
                    if (data.pagination.totalPages <= 7) return i + 1;
                    if (data.pagination.page <= 4) return i + 1;
                    if (data.pagination.page >= data.pagination.totalPages - 3)
                      return data.pagination.totalPages - 6 + i;
                    return data.pagination.page - 3 + i;
                  })()}
                  {#if pageNumber > 0 && pageNumber <= data.pagination.totalPages}
                    <button
                      onclick={() => goToPage(pageNumber)}
                      class={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNumber === data.pagination.page
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  {/if}
                {/each}

                <button
                  onclick={() => goToPage(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <ChevronRight class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Security Notice -->
  <div class="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <AlertTriangle class="h-5 w-5 text-yellow-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-yellow-700">
          <strong>Security Notice:</strong> Admin users have full access to the villa
          management system. Only grant admin privileges to trusted users. There
          must always be at least one admin user.
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Reset Password Modal -->
{#if showResetPasswordModal && resetPasswordUser}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 opacity-75 transition-opacity"
        aria-hidden="true"
        onclick={closeResetPasswordModal}
      ></div>

      <!-- Centering spacer for desktop -->
      <span
        class="hidden sm:inline-block sm:h-screen sm:align-middle"
        aria-hidden="true">&#8203;</span
      >

      <!-- Modal panel -->
      <div
        class="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <Key class="h-6 w-6 text-indigo-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3
                class="text-lg font-medium leading-6 text-gray-900"
                id="modal-title"
              >
                Reset Password
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Reset password for <span class="font-medium"
                    >{resetPasswordUser.fullName ||
                      resetPasswordUser.username}</span
                  >
                  ({resetPasswordUser.email})
                </p>
              </div>

              {#if generatedPassword}
                <!-- Show generated password -->
                <div class="mt-4">
                  <div class="rounded-md bg-green-50 p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <Check class="h-5 w-5 text-green-400" />
                      </div>
                      <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-green-800">
                          Password reset successfully!
                        </p>
                        <p class="mt-2 text-sm text-green-700">New password:</p>
                        <div class="mt-1 flex items-center gap-2">
                          <code
                            class="px-3 py-2 bg-white border border-green-200 rounded text-sm font-mono text-green-900 select-all"
                          >
                            {generatedPassword}
                          </code>
                          <button
                            type="button"
                            onclick={() => copyToClipboard(generatedPassword)}
                            class="inline-flex items-center px-2.5 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            {#if passwordCopied}
                              <Check class="h-4 w-4" />
                            {:else}
                              <Copy class="h-4 w-4" />
                            {/if}
                          </button>
                        </div>
                        <p class="mt-2 text-xs text-green-600">
                          Make sure to copy this password. It won't be shown
                          again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              {:else}
                <!-- Password reset form -->
                <form
                  method="post"
                  action="?/resetPassword"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === "success" && result.data) {
                        if (result.data.generatedPassword) {
                          generatedPassword = result.data.generatedPassword;
                          showToast.success("Password reset successfully");
                        } else {
                          closeResetPasswordModal();
                          showToast.success("Password reset successfully");
                        }
                        await invalidateAll();
                      } else if (result.type === "failure") {
                        showToast.error(result.data?.error || "Failed to reset password");
                        await update();
                      } else {
                        await update();
                      }
                    };
                  }}
                  class="mt-4 space-y-4"
                >
                  <input
                    type="hidden"
                    name="userId"
                    value={resetPasswordUser.id}
                  />

                  <!-- Password mode selection -->
                  <div class="space-y-3">
                    <label class="block text-sm font-medium text-gray-700">
                      Password Option
                    </label>
                    <div class="space-y-2">
                      <label class="flex items-center">
                        <input
                          type="radio"
                          name="passwordMode"
                          value="generate"
                          checked={resetPasswordMode === "generate"}
                          onchange={() => (resetPasswordMode = "generate")}
                          class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span class="ml-2 text-sm text-gray-700">
                          Generate random password
                        </span>
                      </label>
                      <label class="flex items-center">
                        <input
                          type="radio"
                          name="passwordMode"
                          value="custom"
                          checked={resetPasswordMode === "custom"}
                          onchange={() => (resetPasswordMode = "custom")}
                          class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span class="ml-2 text-sm text-gray-700">
                          Set custom password
                        </span>
                      </label>
                    </div>
                  </div>

                  <input
                    type="hidden"
                    name="generateRandom"
                    value={resetPasswordMode === "generate" ? "true" : "false"}
                  />

                  {#if resetPasswordMode === "custom"}
                    <div>
                      <label
                        for="resetPassword"
                        class="block text-sm font-medium text-gray-700"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="resetPassword"
                        bind:value={customPassword}
                        required={resetPasswordMode === "custom"}
                        minlength="6"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter new password"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        Minimum 6 characters
                      </p>
                    </div>
                  {/if}

                  <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="submit"
                      class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:text-sm"
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onclick={closeResetPasswordModal}
                      class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              {/if}
            </div>
          </div>
        </div>

        {#if generatedPassword}
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onclick={closeResetPasswordModal}
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Done
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
