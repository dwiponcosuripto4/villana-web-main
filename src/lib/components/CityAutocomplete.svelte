<script lang="ts">
	import type { CityWithProvince } from '$lib/server/services/city.service';
	import type { Province } from '$lib/server/db/schema';

	interface Props {
		placeholder?: string;
		disabled?: boolean;
		selectedCity?: CityWithProvince | null;
		class?: string;
		onselect?: (city: CityWithProvince) => void;
		onclear?: () => void;
		onsubmit?: (city: CityWithProvince) => void;
	}

	let {
		placeholder = "Search for a city...",
		disabled = false,
		selectedCity = $bindable(null),
		class: className = "",
		onselect,
		onclear,
		onsubmit
	}: Props = $props();

	let searchTerm = $state('');
	let isOpen = $state(false);
	let isLoading = $state(false);
	let results = $state<{
		cities: CityWithProvince[];
		provinces: Province[];
	}>({ cities: [], provinces: [] });
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	let selectedIndex = $state(-1);

	// Total number of selectable items (cities only for now)
	let totalItems = $derived(results.cities.length);

	// Update display when selectedCity changes
	$effect(() => {
		if (selectedCity) {
			searchTerm = `${selectedCity.name}, ${selectedCity.province.name}`;
			isOpen = false;
		} else {
			searchTerm = '';
		}
	});

	async function searchCities(term: string) {
		if (term.length < 2) {
			results = { cities: [], provinces: [] };
			selectedIndex = -1;
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/api/cities/search?q=${encodeURIComponent(term)}&limit=8`);
			if (response.ok) {
				const data = await response.json();
				console.log('API response:', data);
				if (data.success) {
					results = { cities: data.data, provinces: [] };
				} else {
					results = { cities: [], provinces: [] };
				}
				selectedIndex = -1; // Reset selection when new results come in
			}
		} catch (error) {
			console.error('Error searching cities:', error);
			results = { cities: [], provinces: [] };
			selectedIndex = -1;
		} finally {
			isLoading = false;
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;

		// Clear selected city if user types something different
		if (selectedCity && searchTerm !== `${selectedCity.name}, ${selectedCity.province.name}`) {
			selectedCity = null;
			onclear?.();
		}

		clearTimeout(searchTimeout);

		if (searchTerm.length >= 2) {
			isOpen = true;
			searchTimeout = setTimeout(() => {
				searchCities(searchTerm);
			}, 300);
		} else {
			isOpen = false;
			results = { cities: [], provinces: [] };
		}
	}

	function selectCity(city: CityWithProvince) {
		console.log('Selecting city in autocomplete:', city);
		console.log('City ID:', city.id);
		selectedCity = city;
		searchTerm = `${city.name}, ${city.province.name}`;
		isOpen = false;
		onselect?.(city);
	}

	function clearSelection() {
		selectedCity = null;
		searchTerm = '';
		isOpen = false;
		results = { cities: [], provinces: [] };
		selectedIndex = -1;
		onclear?.();
	}

	function handleFocus() {
		if (searchTerm.length >= 2) {
			isOpen = true;
		}
	}

	function handleBlur() {
		// Delay closing to allow clicking on results
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
					selectedIndex = -1;
				}
				break;

			case 'Enter':
				// If dropdown is open and an item is selected, select it
				if (isOpen && selectedIndex >= 0 && selectedIndex < results.cities.length) {
					event.preventDefault();
					event.stopPropagation();
					const selectedCity = results.cities[selectedIndex];
					selectCity(selectedCity);
				}
				// If dropdown is closed or no item selected, treat as submit
				else if (selectedCity) {
					event.preventDefault();
					event.stopPropagation();
					onsubmit?.(selectedCity);
				}
				break;

			case 'ArrowDown':
				if (isOpen && totalItems > 0) {
					event.preventDefault();
					selectedIndex = selectedIndex < totalItems - 1 ? selectedIndex + 1 : 0;
				}
				break;

			case 'ArrowUp':
				if (isOpen && totalItems > 0) {
					event.preventDefault();
					selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : totalItems - 1;
				}
				break;
		}
	}
</script>

<div class="relative {className}">
	<div class="relative">
		<input
			type="text"
			bind:value={searchTerm}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			{placeholder}
			{disabled}
			class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			autocomplete="off"
		/>

		{#if selectedCity}
			<button
				type="button"
				onclick={clearSelection}
				class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
				aria-label="Clear selection"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if isOpen && (results.cities.length > 0 || results.provinces.length > 0 || isLoading)}
		<div class="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
			{#if isLoading}
				<div class="px-4 py-3 text-sm text-gray-500">
					Searching...
				</div>
			{:else}
				{#if results.cities.length > 0}
					<div class="py-1">
						{#if results.provinces.length > 0}
							<div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
								Cities
							</div>
						{/if}
						{#each results.cities as city, index}
							<button
								type="button"
								onclick={() => selectCity(city)}
								class="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
								class:bg-indigo-50={selectedIndex === index}
								class:text-indigo-700={selectedIndex === index}
							>
								<div class="font-medium" class:text-indigo-900={selectedIndex === index}>
									{city.name}
								</div>
								<div class="text-gray-500" class:text-indigo-600={selectedIndex === index}>
									{city.province.name}
								</div>
							</button>
						{/each}
					</div>
				{/if}

				{#if results.provinces.length > 0}
					<div class="py-1 border-t border-gray-100">
						<div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
							Provinces
						</div>
						{#each results.provinces as province}
							<div class="px-4 py-3 text-sm text-gray-700">
								<div class="font-medium">{province.name}</div>
								<div class="text-xs text-gray-500">Province</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if results.cities.length === 0 && results.provinces.length === 0}
					<div class="px-4 py-3 text-sm text-gray-500">
						No cities found for "{searchTerm}"
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>