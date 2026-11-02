<script lang="ts">
  import SortableImageItem from './SortableImageItem.svelte';

  interface Props {
    images?: Array<{
      id: string;
      imageUrl: string;
      thumbnailUrl?: string;
      altText?: string;
      orderIndex?: number;
    }>;
    onReorder?: ((newOrder: string[]) => void) | undefined;
    onDelete?: ((imageId: string) => void) | undefined;
    onEdit?: ((imageId: string, altText: string) => void) | undefined;
    onImageClick?: ((imageIndex: number) => void) | undefined;
    editable?: boolean;
    deletable?: boolean;
    reorderable?: boolean;
  }

  const {
    images = [],
    onReorder = undefined,
    onDelete = undefined,
    onEdit = undefined,
    onImageClick = undefined,
    editable = true,
    deletable = true,
    reorderable = true
  }: Props = $props();

  let draggedItem: string | null = null;
  let draggedOverItem: string | null = null;
  let items = $state([...images]);

  $effect(() => {
    items = [...images];
  });

  function handleDragStart(e: DragEvent, imageId: string) {
    if (!reorderable) return;
    draggedItem = imageId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, imageId: string) {
    if (!reorderable) return;
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    draggedOverItem = imageId;
  }

  function handleDragEnd() {
    if (!reorderable) return;
    draggedItem = null;
    draggedOverItem = null;
  }

  function handleDrop(e: DragEvent, targetId: string) {
    if (!reorderable) return;
    e.preventDefault();

    if (draggedItem && draggedItem !== targetId) {
      const draggedIndex = items.findIndex((img) => img.id === draggedItem);
      const targetIndex = items.findIndex((img) => img.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...items];
        const [draggedImage] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedImage);
        items = newItems;

        if (onReorder) {
          onReorder(newItems.map((img) => img.id));
        }
      }
    }

    draggedItem = null;
    draggedOverItem = null;
  }

  function handleDeleteImage(imageId: string) {
    if (onDelete) {
      onDelete(imageId);
    }
  }

  function handleEditImage(imageId: string, altText: string) {
    if (onEdit) {
      onEdit(imageId, altText);
    }
  }
</script>

<div class="sortable-image-grid">
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {#each items as image, index (image.id)}
      <SortableImageItem
        {image}
        {editable}
        {deletable}
        {reorderable}
        isDragging={draggedItem === image.id}
        isDraggedOver={draggedOverItem === image.id}
        onDragStart={(e) => handleDragStart(e, image.id)}
        onDragOver={(e) => handleDragOver(e, image.id)}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, image.id)}
        onDelete={handleDeleteImage}
        onEdit={handleEditImage}
        onImageClick={onImageClick ? () => onImageClick(index) : undefined}
      />
    {/each}
  </div>

  {#if items.length === 0}
    <p class="text-gray-500 col-span-full text-center py-8">No images uploaded yet</p>
  {/if}
</div>

<style>
  .sortable-image-grid {
    position: relative;
  }
</style>