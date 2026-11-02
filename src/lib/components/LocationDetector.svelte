<script lang="ts">
	import type { CityWithProvince } from '$lib/server/services/city.service';

	interface Props {
		disabled?: boolean;
		class?: string;
		onsuccess?: (data: {
			city: CityWithProvince;
			coordinates: { latitude: number; longitude: number };
			locationData: any;
		}) => void;
		onerror?: (error: {
			code: number;
			message: string;
		}) => void;
	}

	let { disabled = false, class: className = "", onsuccess, onerror }: Props = $props();

	let isDetecting = $state(false);
	let errorMessage = $state('');

	async function detectLocation() {
		if (!navigator.geolocation) {
			const error = {
				code: 0,
				message: 'Geolocation is not supported by this browser'
			};
			errorMessage = error.message;
			onerror?.(error);
			return;
		}

		isDetecting = true;
		errorMessage = '';

		const options = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 300000 // 5 minutes cache
		};

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					const { latitude, longitude } = position.coords;

					// Call our reverse geocoding API
					const response = await fetch('/api/cities/reverse-geocode', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ latitude, longitude })
					});

					if (!response.ok) {
						throw new Error('Failed to get location information');
					}

					const data = await response.json();

					if (data.matchedCity) {
						onsuccess?.({
							city: data.matchedCity,
							coordinates: { latitude, longitude },
							locationData: data.nominatimData
						});
					} else {
						const error = {
							code: 404,
							message: `We couldn't find "${data.nominatimData?.city || 'your location'}" in our villa locations. Please select a city manually.`
						};
						errorMessage = error.message;
						onerror?.(error);
					}
				} catch (error) {
					console.error('Error in reverse geocoding:', error);
					const errorObj = {
						code: 500,
						message: 'Failed to determine your city. Please select manually.'
					};
					errorMessage = errorObj.message;
					onerror?.(errorObj);
				} finally {
					isDetecting = false;
				}
			},
			(error) => {
				isDetecting = false;
				let message = '';

				switch (error.code) {
					case error.PERMISSION_DENIED:
						message = 'Location access denied. Please allow location access and try again.';
						break;
					case error.POSITION_UNAVAILABLE:
						message = 'Location information is unavailable. Please select a city manually.';
						break;
					case error.TIMEOUT:
						message = 'Location request timed out. Please try again or select a city manually.';
						break;
					default:
						message = 'An error occurred while getting your location. Please select a city manually.';
						break;
				}

				errorMessage = message;
				onerror?.({
					code: error.code,
					message
				});
			},
			options
		);
	}
</script>

<div class={className}>
	<button
		type="button"
		onclick={detectLocation}
		{disabled}
		class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
		class:opacity-50={isDetecting}
		class:cursor-not-allowed={isDetecting || disabled}
	>
		{#if isDetecting}
			<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			Detecting location...
		{:else}
			<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Use My Location
		{/if}
	</button>

	{#if errorMessage}
		<div class="mt-2 text-sm text-red-600 max-w-sm">
			{errorMessage}
		</div>
	{/if}
</div>