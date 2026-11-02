<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { showToast } from "$lib/utils/toast.js";

  interface Props {
    action?: string;
    maxFiles?: number;
    onUploadComplete?: (() => void) | undefined;
  }

  const {
    action = "?/uploadImages",
    maxFiles = 10,
    onUploadComplete = undefined
  }: Props = $props();

  let fileInput: HTMLInputElement;
  let selectedFiles = $state<FileList | null>(null);
  let previews = $state<string[]>([]);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let isDragging = $state(false);

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    handleFiles(input.files);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    if (files.length > maxFiles) {
      showToast.error(`Maximum ${maxFiles} images can be uploaded at once`);
      return;
    }

    selectedFiles = files;
    previews = [];

    // Create new array for previews
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews[i] = e.target?.result as string;
          // Update previews reactively
          previews = [...newPreviews];
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function removeFile(index: number) {
    if (!selectedFiles) return;

    const dt = new DataTransfer();
    for (let i = 0; i < selectedFiles.length; i++) {
      if (i !== index) {
        dt.items.add(selectedFiles[i]);
      }
    }

    selectedFiles = dt.files;
    previews = previews.filter((_, i) => i !== index);

    if (fileInput) {
      fileInput.files = selectedFiles;
    }
  }

  function clearFiles() {
    selectedFiles = null;
    previews = [];
    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      handleFiles(files);
      if (fileInput && files) {
        fileInput.files = files;
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }
</script>

<div class="multi-image-upload">
  <form
    method="post"
    {action}
    enctype="multipart/form-data"
    use:enhance={() => {
      isUploading = true;
      uploadProgress = 0;

      return async ({ result }) => {
        isUploading = false;
        uploadProgress = 100;

        if (result.type === "success") {
          const uploadedCount = result.data?.uploadedCount || 0;
          showToast.success(`Successfully uploaded ${uploadedCount} image${uploadedCount !== 1 ? 's' : ''}`);
          clearFiles();
          await invalidateAll();
          if (onUploadComplete) {
            onUploadComplete();
          }
        } else if (result.type === "failure") {
          showToast.error(result.data?.error || "Failed to upload images");
        }
      };
    }}
  >
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center {isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}"
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <input
        bind:this={fileInput}
        type="file"
        name="images"
        id="images"
        accept="image/*"
        multiple
        required={!selectedFiles}
        onchange={handleFileSelect}
        class="hidden"
      />

      {#if !selectedFiles || selectedFiles.length === 0}
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          <button
            type="button"
            onclick={() => fileInput?.click()}
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Click to select images
          </button>
          or drag and drop
        </p>
        <p class="text-xs text-gray-500 mt-1">
          PNG, JPG, GIF up to 10 images at once
        </p>
      {:else}
        <div class="space-y-4">
          <p class="text-sm text-gray-700">
            {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {#each Array.from(selectedFiles) as file, index}
              <div class="relative group">
                {#if previews[index]}
                  <img
                    src={previews[index]}
                    alt="Preview {index + 1}"
                    class="h-24 w-full object-cover rounded-lg"
                  />
                {:else}
                  <div class="h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span class="text-xs text-gray-500">Loading...</span>
                  </div>
                {/if}
                <button
                  type="button"
                  onclick={() => removeFile(index)}
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
                  {formatFileSize(file.size)}
                </div>
              </div>
            {/each}
          </div>

          <div class="flex justify-between gap-2">
            <button
              type="button"
              onclick={() => fileInput?.click()}
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Add More
            </button>
            <button
              type="button"
              onclick={clearFiles}
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        </div>
      {/if}
    </div>

    {#if selectedFiles && selectedFiles.length > 0}
      <div class="mt-4">
        {#if isUploading}
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style="width: {uploadProgress}%"
              ></div>
            </div>
          </div>
        {:else}
          <button
            type="submit"
            class="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        {/if}
      </div>
    {/if}
  </form>
</div>