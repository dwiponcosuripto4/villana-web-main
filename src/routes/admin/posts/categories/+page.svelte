<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { ArrowLeft, Plus, Pencil, Trash2, X } from "lucide-svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let editingId = $state<number | null>(null);
  let newName = $state("");
  let newDescription = $state("");
  let editName = $state("");
  let editSlug = $state("");
  let editDescription = $state("");

  function startEdit(cat: typeof data.categories[0]) {
    editingId = cat.id;
    editName = cat.name;
    editSlug = cat.slug;
    editDescription = cat.description || "";
  }

  function cancelEdit() {
    editingId = null;
  }

  function resetCreate() {
    showCreateForm = false;
    newName = "";
    newDescription = "";
  }
</script>

<div class="px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-6">
    <a
      href="/admin/posts"
      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
    >
      <ArrowLeft class="h-4 w-4 mr-1" />
      Back to Posts
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Categories</h2>
        <p class="mt-1 text-sm text-gray-600">Manage post categories</p>
      </div>
      <button
        onclick={() => (showCreateForm = !showCreateForm)}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add Category
      </button>
    </div>
  </div>

  <!-- Messages -->
  {#if form?.error}
    <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {form.error}
    </div>
  {/if}
  {#if form?.success}
    <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
      Category saved successfully!
    </div>
  {/if}

  <!-- Create Form -->
  {#if showCreateForm}
    <div class="mb-6 bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">New Category</h3>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
            if (result.type === "success") {
              resetCreate();
            }
          };
        }}
        class="space-y-4"
      >
        <div>
          <label for="new-name" class="block text-sm font-medium text-gray-700 mb-1">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="new-name"
            name="name"
            bind:value={newName}
            required
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="new-description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="new-description"
            name="description"
            bind:value={newDescription}
            rows={2}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create
          </button>
          <button
            type="button"
            onclick={resetCreate}
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Categories List -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Slug
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Posts
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each data.categories as cat}
          {#if editingId === cat.id}
            <!-- Edit Row -->
            <tr class="bg-indigo-50">
              <td colspan="4" class="px-6 py-4">
                <form
                  method="POST"
                  action="?/update"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      await update();
                      if (result.type === "success") {
                        cancelEdit();
                      }
                    };
                  }}
                  class="space-y-4"
                >
                  <input type="hidden" name="id" value={cat.id} />
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        bind:value={editName}
                        required
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                      <input
                        type="text"
                        name="slug"
                        bind:value={editSlug}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        name="description"
                        bind:value={editDescription}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="submit"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onclick={cancelEdit}
                      class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <!-- Display Row -->
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{cat.name}</div>
                {#if cat.description}
                  <div class="text-sm text-gray-500">{cat.description}</div>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cat.slug}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cat.postCount} {cat.postCount === 1 ? "post" : "posts"}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <button
                    onclick={() => startEdit(cat)}
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <form method="POST" action="?/delete" class="inline">
                    <input type="hidden" name="id" value={cat.id} />
                    <button
                      type="submit"
                      onclick={(e) => {
                        if (!confirm(`Delete "${cat.name}"? Posts using this category will become uncategorized.`)) {
                          e.preventDefault();
                        }
                      }}
                      class="text-red-600 hover:text-red-900"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/if}
        {:else}
          <tr>
            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
              No categories yet.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
