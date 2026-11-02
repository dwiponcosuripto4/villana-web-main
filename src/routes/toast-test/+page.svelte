<script lang="ts">
	import { showToast, toastMessages } from '$lib/utils/toast';

	function testSuccessToast() {
		showToast.success('This is a success toast!');
	}

	function testErrorToast() {
		showToast.error('This is an error toast!');
	}

	function testInfoToast() {
		showToast.info('This is an info toast!');
	}

	function testVillaSaved() {
		showToast.success(toastMessages.villa.saved);
	}

	function testVillaRemoved() {
		showToast.success(toastMessages.villa.removed);
	}

	function testNetworkError() {
		showToast.error(toastMessages.general.networkError);
	}

	function testLoadingToast() {
		const toastId = showToast.loading('Loading...');
		setTimeout(() => {
			showToast.dismiss(toastId);
			showToast.success('Loading complete!');
		}, 3000);
	}

	function testPromiseToast() {
		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				Math.random() > 0.5 ? resolve('Success!') : reject('Error!');
			}, 2000);
		});

		showToast.promise(promise, {
			loading: 'Saving villa...',
			success: 'Villa saved successfully!',
			error: 'Failed to save villa'
		});
	}
</script>

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold text-gray-900">Toast Test Page</h1>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		<button
			onclick={testSuccessToast}
			class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
		>
			Test Success Toast
		</button>

		<button
			onclick={testErrorToast}
			class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
		>
			Test Error Toast
		</button>

		<button
			onclick={testInfoToast}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
		>
			Test Info Toast
		</button>

		<button
			onclick={testVillaSaved}
			class="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
		>
			Test Villa Saved
		</button>

		<button
			onclick={testVillaRemoved}
			class="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
		>
			Test Villa Removed
		</button>

		<button
			onclick={testNetworkError}
			class="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
		>
			Test Network Error
		</button>

		<button
			onclick={testLoadingToast}
			class="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
		>
			Test Loading Toast
		</button>

		<button
			onclick={testPromiseToast}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
		>
			Test Promise Toast
		</button>
	</div>

	<div class="mt-8 rounded-lg bg-gray-50 p-6">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Instructions</h2>
		<p class="text-gray-700">
			Click the buttons above to test different types of toast notifications. The toasts should appear in the top-right corner of the screen.
		</p>
		<p class="mt-2 text-gray-700">
			This test page demonstrates:
		</p>
		<ul class="mt-2 list-disc pl-6 text-gray-700">
			<li>Basic success, error, and info toasts</li>
			<li>Pre-configured villa operation messages</li>
			<li>Loading toasts with manual dismissal</li>
			<li>Promise-based toasts with automatic state transitions</li>
		</ul>
	</div>

	<div class="mt-8">
		<a href="/" class="text-blue-600 hover:text-blue-800 underline">
			← Back to Home
		</a>
	</div>
</div>