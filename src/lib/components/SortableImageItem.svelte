<script lang="ts">
  interface Props {
    image: {
      id: string;
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
      orderIndex?: number;
    };
    editable?: boolean;
    deletable?: boolean;
    reorderable?: boolean;
    isDragging?: boolean;
    isDraggedOver?: boolean;
    onDelete?: ((imageId: string) => void) | undefined;
    onEdit?: ((imageId: string, altText: string) => void) | undefined;
    onImageClick?: (() => void) | undefined;
    onDragStart?: ((e: DragEvent) => void) | undefined;
    onDragOver?: ((e: DragEvent) => void) | undefined;
    onDragEnd?: (() => void) | undefined;
    onDrop?: ((e: DragEvent) => void) | undefined;
  }

  const {
    image,
    editable = true,
    deletable = true,
    reorderable = true,
    isDragging = false,
    isDraggedOver = false,
    onDelete = undefined,
    onEdit = undefined,
    onImageClick = undefined,
    onDragStart = undefined,
    onDragOver = undefined,
    onDragEnd = undefined,
    onDrop = undefined
  }: Props = $props();

  let isEditing = $state(false);
  let editingAltText = $state(image.altText || '');

  function handleDelete() {
    if (onDelete) {
      onDelete(image.id);
    }
  }

  function handleEditStart() {
    isEditing = true;
    editingAltText = image.altText || '';
  }

  function handleEditSave() {
    if (onEdit) {
      onEdit(image.id, editingAltText);
    }
    isEditing = false;
  }

  function handleEditCancel() {
    editingAltText = image.altText || '';
    isEditing = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleEditSave();
    } else if (event.key === 'Escape') {
      handleEditCancel();
    }
  }
</script>

<div
  class="group relative rounded-lg overflow-hidden bg-gray-100 transition-all {isDragging ? 'opacity-50 scale-95' : ''} {isDraggedOver ? 'ring-2 ring-indigo-500' : ''} {reorderable ? 'cursor-move' : ''}"
  draggable={reorderable}
  ondragstart={onDragStart}
  ondragover={onDragOver}
  ondragend={onDragEnd}
  ondrop={onDrop}
>
  {#if reorderable}
    <div class="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <div class="bg-white rounded p-1 shadow-lg">
        <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
        </svg>
      </div>
    </div>
  {/if}

  <img
    src={image.thumbnailUrl || image.imageUrl}
    alt={image.altText || 'Villa image'}
    class="h-32 w-full object-cover {onImageClick ? 'cursor-pointer' : ''}"
    loading="lazy"
    draggable="false"
    onclick={onImageClick}
  />

  <div class="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {#if editable}
      <button
        type="button"
        onclick={handleEditStart}
        class="rounded-full bg-blue-600 p-1.5 text-white hover:bg-blue-700 shadow-lg"
        title="Edit description"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
    {/if}

    {#if deletable}
      <button
        type="button"
        onclick={handleDelete}
        class="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700 shadow-lg"
        title="Delete image"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    {/if}
  </div>

  {#if image.altText && !isEditing}
    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 truncate">
      {image.altText}
    </div>
  {/if}

  {#if isEditing}
    <div class="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2">
      <div class="bg-white rounded-lg p-3 w-full max-w-sm" onclick={(e) => e.stopPropagation()}>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Alt Text
        </label>
        <input
          type="text"
          bind:value={editingAltText}
          onkeydown={handleKeyDown}
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter image description"
          autofocus
        />
        <div class="flex justify-end space-x-2 mt-2">
          <button
            type="button"
            onclick={handleEditCancel}
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={handleEditSave}
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>