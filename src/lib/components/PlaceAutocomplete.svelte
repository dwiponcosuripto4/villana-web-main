<script lang="ts">
	interface Place {
		id: string;
		name: string;
		type?: string;
		category?: string;
		latitude: string;
		longitude: string;
		address?: string;
	}

	interface Props {
		placeholder?: string;
		disabled?: boolean;
		selectedPlace?: Place | null;
		class?: string;
		onselect?: (place: Place) => void;
		onclear?: () => void;
		onsubmit?: (place: Place) => void;
	}

	let {
		placeholder = "Search for a place...",
		disabled = false,
		selectedPlace = $bindable(null),
		class: className = "",
		onselect,
		onclear,
		onsubmit
	}: Props = $props();

	let searchTerm = $state('');
	let isOpen = $state(false);
	let isLoading = $state(false);
	let results = $state<Place[]>([]);
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	let selectedIndex = $state(-1);
	let inputElement: HTMLInputElement;
	let dropdownElement: HTMLDivElement;

	// Update display when selectedPlace changes
	$effect(() => {
		if (selectedPlace) {
			searchTerm = selectedPlace.name;
			isOpen = false;
		} else {
			searchTerm = '';
		}
	});

	async function searchPlaces(term: string) {
		if (term.length < 2) {
			results = [];
			selectedIndex = -1;
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(term)}&limit=8`);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					results = data.data;
				} else {
					results = [];
				}
				selectedIndex = -1;
			}
		} catch (error) {
			console.error('Error searching places:', error);
			results = [];
			selectedIndex = -1;
		} finally {
			isLoading = false;
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;

		// Clear selected place if user types something different
		if (selectedPlace && searchTerm !== selectedPlace.name) {
			selectedPlace = null;
			onclear?.();
		}

		clearTimeout(searchTimeout);

		if (searchTerm.length >= 2) {
			isOpen = true;
			searchTimeout = setTimeout(() => {
				searchPlaces(searchTerm);
			}, 300);
		} else {
			isOpen = false;
			results = [];
		}
	}

	function selectPlace(place: Place) {
		selectedPlace = place;
		searchTerm = place.name;
		isOpen = false;
		selectedIndex = -1;
		onselect?.(place);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen || results.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				scrollToSelected();
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				scrollToSelected();
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && results[selectedIndex]) {
					selectPlace(results[selectedIndex]);
					if (onsubmit) {
						onsubmit(results[selectedIndex]);
					}
				}
				break;
			case 'Escape':
				isOpen = false;
				selectedIndex = -1;
				break;
		}
	}

	function scrollToSelected() {
		if (selectedIndex >= 0 && dropdownElement) {
			const items = dropdownElement.querySelectorAll('[data-index]');
			const selectedItem = items[selectedIndex] as HTMLElement;
			if (selectedItem) {
				selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}

	function handleFocus() {
		if (searchTerm.length >= 2 && results.length > 0) {
			isOpen = true;
		}
	}

	function handleBlur() {
		// Delay closing to allow click events on dropdown items
		setTimeout(() => {
			isOpen = false;
			selectedIndex = -1;
		}, 200);
	}

	function clearSearch() {
		searchTerm = '';
		selectedPlace = null;
		results = [];
		isOpen = false;
		selectedIndex = -1;
		onclear?.();
		inputElement?.focus();
	}

	function getPlaceTypeLabel(type?: string, category?: string) {
		if (category) return category;
		if (type) return type.replace(/_/g, ' ');
		return 'Place';
	}
</script>

<div class="relative {className}">
	<div class="relative">
		<input
			bind:this={inputElement}
			type="text"
			value={searchTerm}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			onfocus={handleFocus}
			onblur={handleBlur}
			{placeholder}
			{disabled}
			class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
			autocomplete="off"
		/>

		{#if searchTerm}
			<button
				type="button"
				onclick={clearSearch}
				class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{:else}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
				<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
		{/if}
	</div>

	{#if isOpen}
		<div
			bind:this={dropdownElement}
			class="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto ring-1 ring-black ring-opacity-5"
		>
			{#if isLoading}
				<div class="px-4 py-3 text-sm text-gray-500">
					Loading...
				</div>
			{:else if results.length > 0}
				<ul class="py-1">
					{#each results as place, index}
						<li
							data-index={index}
							class="px-4 py-2 cursor-pointer hover:bg-gray-100 {selectedIndex === index ? 'bg-gray-100' : ''}"
							onmousedown={() => selectPlace(place)}
							onmouseenter={() => selectedIndex = index}
						>
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{place.name}</p>
									{#if place.address}
										<p class="text-xs text-gray-500 truncate">{place.address}</p>
									{/if}
								</div>
								<span class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
									{getPlaceTypeLabel(place.type, place.category)}
								</span>
							</div>
						</li>
					{/each}
				</ul>
			{:else if searchTerm.length >= 2}
				<div class="px-4 py-3 text-sm text-gray-500">
					No places found
				</div>
			{/if}
		</div>
	{/if}
</div>