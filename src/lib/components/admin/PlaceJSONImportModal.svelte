<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    isOpen: boolean;
    onImport: (jsonData: any) => void;
  }

  let { isOpen = $bindable(), onImport }: Props = $props();

  let activeTab: "upload" | "paste" = $state("paste");
  let isDragging = $state(false);
  let fileInput = $state<HTMLInputElement>();
  let selectedFile: File | null = $state(null);
  let jsonText = $state("");
  let errorMessage = $state("");
  let isProcessing = $state(false);
  let parsedPlaceName = $state("");

  $effect(() => {
    if (isOpen) {
      console.log("[PlaceJSONImportModal] Modal opened, activeTab:", activeTab);
      if (activeTab === "paste") {
        // focus the textarea when the modal opens
        // use a timeout to ensure the element is rendered
        setTimeout(() => {
          const textarea = document.getElementById(
            "PlaceJsonTextarea",
          ) as HTMLTextAreaElement;
          textarea?.focus();
        }, 0);
      } else {
        selectedFile = null;
      }
    }
  });

  function closeModal() {
    isOpen = false;
    resetModal();
  }

  function resetModal() {
    activeTab = "paste";
    isDragging = false;
    selectedFile = null;
    jsonText = "";
    errorMessage = "";
    isProcessing = false;
    parsedPlaceName = "";
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && isOpen) {
      closeModal();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Drag and drop handlers
  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget === event.target) {
      isDragging = false;
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        await processFile(file);
      } else {
        errorMessage = "Please drop a valid JSON file";
      }
    }
  }

  function handleFileSelect() {
    fileInput?.click();
  }

  async function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await processFile(file);
    }
  }

  async function processFile(file: File) {
    selectedFile = file;
    errorMessage = "";
    parsedPlaceName = "";

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      validateAndPreviewJSON(data);
    } catch (error) {
      errorMessage = `Failed to parse JSON file: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  function handleTextInput() {
    errorMessage = "";
    parsedPlaceName = "";

    if (!jsonText.trim()) {
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      validateAndPreviewJSON(data);
    } catch (error) {
      errorMessage = `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  function validateAndPreviewJSON(data: any) {
    // Handle both single place object and array of places
    const placeData = Array.isArray(data) ? data[0] : data;

    // Check if it's a place object by looking for required place fields
    if (!placeData || (!placeData.name && !placeData.title)) {
      errorMessage = "Invalid JSON format: missing place name or title";
      parsedPlaceName = "";
      return;
    }

    // Support both 'name' (place format) and 'title' (for compatibility)
    parsedPlaceName = placeData.name || placeData.title || "Untitled Place";
    errorMessage = "";
  }

  async function handleImport() {
    if (activeTab === "upload" && !selectedFile) {
      errorMessage = "Please select a file first";
      return;
    }

    if (activeTab === "paste" && !jsonText.trim()) {
      errorMessage = "Please enter JSON text";
      return;
    }

    isProcessing = true;
    errorMessage = "";

    try {
      let data;

      if (activeTab === "upload" && selectedFile) {
        const text = await selectedFile.text();
        data = JSON.parse(text);
      } else {
        data = JSON.parse(jsonText);
      }

      // Handle both single place object and array of places
      const placeData = Array.isArray(data) ? data[0] : data;

      if (!placeData || (!placeData.name && !placeData.title)) {
        throw new Error("Invalid JSON format: missing place name or title");
      }

      onImport(placeData);
      closeModal();
    } catch (error) {
      errorMessage = `Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`;
    } finally {
      isProcessing = false;
    }
  }

  function formatJSON() {
    if (!jsonText.trim()) return;

    try {
      const data = JSON.parse(jsonText);
      jsonText = JSON.stringify(data, null, 2);
      errorMessage = "";
    } catch (error) {
      errorMessage = "Cannot format: Invalid JSON";
    }
  }
</script>

<svelte:window onkeydown={handleEscape} />

{#if isOpen}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50"
    onclick={handleBackdropClick}
    role="button"
    tabindex="-1"
  >
    <!-- Modal content -->
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <h3 class="text-lg font-medium text-gray-900">
          Import Place from JSON
        </h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-500"
          onclick={closeModal}
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          type="button"
          class={`px-6 py-3 text-sm font-medium ${activeTab === "paste" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          onclick={() => {
            activeTab = "paste";
            errorMessage = "";
            parsedPlaceName = "";
          }}
        >
          Paste JSON
        </button>
        <button
          type="button"
          class={`px-6 py-3 text-sm font-medium ${activeTab === "upload" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          onclick={() => {
            activeTab = "upload";
            errorMessage = "";
            parsedPlaceName = "";
          }}
        >
          Upload File
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === "upload"}
          <!-- File Upload Tab -->
          <div
            class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            ondragenter={handleDragEnter}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            role="button"
            tabindex="0"
          >
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

            <p class="mt-4 text-sm text-gray-600">
              {#if isDragging}
                Drop your JSON file here
              {:else if selectedFile}
                Selected: <strong>{selectedFile.name}</strong> ({(
                  selectedFile.size / 1024
                ).toFixed(2)} KB)
              {:else}
                Drag and drop your JSON file here, or
              {/if}
            </p>

            {#if !selectedFile}
              <button
                type="button"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                onclick={handleFileSelect}
              >
                Browse Files
              </button>
            {:else}
              <button
                type="button"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                onclick={() => {
                  selectedFile = null;
                  parsedPlaceName = "";
                }}
              >
                Change File
              </button>
            {/if}

            <input
              bind:this={fileInput}
              type="file"
              accept=".json,application/json"
              onchange={handleFileInputChange}
              class="hidden"
            />

            <p class="mt-2 text-xs text-gray-500">JSON files only</p>
          </div>
        {:else}
          <!-- Paste JSON Tab -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">
                JSON Content
              </label>
              <button
                type="button"
                class="text-sm text-indigo-600 hover:text-indigo-500"
                onclick={formatJSON}
              >
                Format JSON
              </button>
            </div>
            <textarea
              bind:value={jsonText}
              oninput={handleTextInput}
              placeholder="Paste your place JSON here..."
              rows="15"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
              id="PlaceJsonTextarea"
            ></textarea>
            <p class="text-xs text-gray-500">
              {jsonText.length} characters
            </p>
          </div>
        {/if}

        <!-- Preview Section -->
        {#if parsedPlaceName}
          <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p class="text-sm text-green-800">
              <strong>Place detected:</strong>
              {parsedPlaceName}
            </p>
          </div>
        {/if}

        <!-- Error Message -->
        {#if errorMessage}
          <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{errorMessage}</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3"
      >
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onclick={closeModal}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onclick={handleImport}
          disabled={isProcessing ||
            (!selectedFile && activeTab === "upload") ||
            (!jsonText.trim() && activeTab === "paste") ||
            !!errorMessage}
        >
          {isProcessing ? "Importing..." : "Import"}
        </button>
      </div>
    </div>
  </div>
{/if}