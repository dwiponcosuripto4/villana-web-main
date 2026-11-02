<script lang="ts">
	export let isOpen = false;
	export let title = 'Error';
	export let message = '';

	function closeModal() {
		isOpen = false;
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
	<!-- Simple overlay with higher z-index -->
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background-color: rgba(0, 0, 0, 0.5);">
		<!-- Modal content -->
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<!-- Header -->
			<div class="flex items-center p-6 border-b border-gray-200">
				<div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
					<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900">{title}</h3>
			</div>

			<!-- Body -->
			<div class="p-6">
				<p class="text-gray-600">{message}</p>
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end">
				<button
					type="button"
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
					onclick={closeModal}
				>
					OK
				</button>
			</div>
		</div>
	</div>
{/if}