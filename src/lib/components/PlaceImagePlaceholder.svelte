<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
	export let className: string = '';

	// Size configurations
	const sizeClasses = {
		sm: 'w-12 h-12',
		md: 'w-16 h-16',
		lg: 'w-24 h-24',
		xl: 'w-full h-full'
	};

	const iconSizeClasses = {
		sm: 'w-6 h-6',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
		xl: 'w-16 h-16'
	};
</script>

<div
	class="rounded-lg bg-gray-200 flex items-center justify-center {sizeClasses[size]} {className}"
	role="img"
	aria-label="Place image placeholder"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="text-gray-400 {iconSizeClasses[size]}"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
		/>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
		/>
	</svg>
</div>