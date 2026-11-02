<script lang="ts">
  import { showToast } from "$lib/utils/toast.js";

  interface Props {
    images?: Array<{
      id: string;
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
    }>;
    onSave?: ((updates: Array<{ id: string; altText: string }>) => void) | undefined;
    onCancel?: (() => void) | undefined;
  }

  const {
    images = [],
    onSave = undefined,
    onCancel = undefined
  }: Props = $props();

  let imageDescriptions = $state<Record<string, string>>({});
  let applyToAll = $state("");
  let isSaving = $state(false);

  $effect(() => {
    const descriptions: Record<string, string> = {};
    images.forEach((image) => {
      descriptions[image.id] = image.altText || "";
    });
    imageDescriptions = descriptions;
  });

  function handleApplyToAll() {
    if (!applyToAll.trim()) {
      showToast.error("Please enter a description to apply to all images");
      return;
    }

    const newDescriptions = { ...imageDescriptions };
    images.forEach((image) => {
      newDescriptions[image.id] = applyToAll;
    });
    imageDescriptions = newDescriptions;
    showToast.success("Description applied to all images");
  }

  function handleSave() {
    if (!onSave) return;

    isSaving = true;
    const updates = Object.entries(imageDescriptions).map(([id, altText]) => ({
      id,
      altText: altText.trim(),
    }));

    onSave(updates);
    isSaving = false;
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab" && !event.shiftKey) {
      const inputs = document.querySelectorAll('.batch-editor-input');
      const currentIndex = Array.from(inputs).findIndex(input => input === event.target);

      if (currentIndex === inputs.length - 1) {
        event.preventDefault();
        (inputs[0] as HTMLInputElement)?.focus();
      }
    }
  }
</script>

<div class="batch-image-editor">
  <div class="mb-4 p-4 bg-gray-50 rounded-lg">
    <h3 class="text-lg font-medium text-gray-900 mb-3">
      Edit Descriptions for {images.length} Image{images.length !== 1 ? 's' : ''}
    </h3>

    <div class="flex gap-2 mb-4">
      <input
        type="text"
        bind:value={applyToAll}
        placeholder="Enter description to apply to all images"
        class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onkeydown={(e) => e.key === 'Enter' && handleApplyToAll()}
      />
      <button
        type="button"
        onclick={handleApplyToAll}
        class="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
      >
        Apply to All
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
    {#each images as image, index}
      <div class="flex flex-col space-y-2">
        <div class="relative">
          <img
            src={image.thumbnailUrl || image.imageUrl}
            alt={image.altText || `Image ${index + 1}`}
            class="w-full h-32 object-cover rounded-lg"
          />
          <div class="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            #{index + 1}
          </div>
        </div>
        <input
          type="text"
          bind:value={imageDescriptions[image.id]}
          placeholder="Enter description for this image"
          class="batch-editor-input px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onkeydown={handleKeyDown}
        />
      </div>
    {/each}
  </div>

  <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
    <button
      type="button"
      onclick={handleCancel}
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      disabled={isSaving}
    >
      Cancel
    </button>
    <button
      type="button"
      onclick={handleSave}
      class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      disabled={isSaving}
    >
      {isSaving ? 'Saving...' : 'Save Descriptions'}
    </button>
  </div>
</div>

<style>
  .batch-image-editor {
    background: white;
    border-radius: 0.5rem;
  }
</style>