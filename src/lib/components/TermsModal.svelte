<script lang="ts">
  import { browser } from "$app/environment";

  let {
    showModal = $bindable(),
    onClose = () => {}
  }: {
    showModal: boolean;
    onClose?: () => void;
  } = $props();

  let modalElement: HTMLDivElement;
  let iframeLoaded = $state(false);

  function closeModal() {
    showModal = false;
    onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleOutsideClick(event: MouseEvent) {
    if (event.target === modalElement) {
      closeModal();
    }
  }

  function handleIframeLoad() {
    iframeLoaded = true;
  }

  // Focus management when modal opens/closes
  $effect(() => {
    if (browser && showModal) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeydown);

      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
      };
    }
  });
</script>

{#if showModal}
  <!-- Modal backdrop -->
  <div
    bind:this={modalElement}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    on:click={handleOutsideClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal content -->
    <div
      class="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col"
      on:click|stopPropagation
    >
      <!-- Modal header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 id="modal-title" class="text-lg font-semibold text-gray-900">
          Syarat dan Ketentuan Penggunaan
        </h2>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          on:click={closeModal}
          aria-label="Tutup modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Modal body with iframe -->
      <div class="flex-1 relative">
        {#if !iframeLoaded}
          <!-- Loading state -->
          <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div class="text-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-600 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p class="mt-2 text-sm text-gray-600">Memuat syarat dan ketentuan...</p>
            </div>
          </div>
        {/if}

        <!-- Terms of service iframe -->
        <iframe
          src="/term-of-service"
          class="w-full h-full border-0"
          title="Syarat dan Ketentuan"
          sandbox="allow-same-origin allow-scripts"
          on:load={handleIframeLoad}
        />
      </div>

      <!-- Modal footer -->
      <div class="p-4 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-end">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            on:click={closeModal}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}