<script lang="ts">
	export let isOpen = false;
	export let title = 'Confirm Action';
	export let message = '';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let onConfirm: () => void = () => {};
	export let danger = false;

	function closeModal() {
		isOpen = false;
	}

	function handleConfirm() {
		onConfirm();
		closeModal();
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
	<!-- Overlay with higher z-index -->
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background-color: rgba(0, 0, 0, 0.5);">
		<!-- Modal content -->
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<!-- Header -->
			<div class="flex items-center p-6 border-b border-gray-200">
				<div class="w-10 h-10 rounded-full {danger ? 'bg-red-100' : 'bg-yellow-100'} flex items-center justify-center mr-3">
					<svg class="w-6 h-6 {danger ? 'text-red-600' : 'text-yellow-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900">{title}</h3>
			</div>

			<!-- Body -->
			<div class="p-6">
				<p class="text-gray-600">{message}</p>
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					type="button"
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
					onclick={closeModal}
				>
					{cancelText}
				</button>
				<button
					type="button"
					class="px-4 py-2 {danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} text-white rounded-md focus:outline-none focus:ring-2"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}