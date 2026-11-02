<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Debug Session</title>
</svelte:head>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Session Debug</h1>

	<div class="space-y-4">
		<div>
			<h2 class="text-lg font-semibold">User:</h2>
			<pre class="bg-gray-100 p-4 rounded">{JSON.stringify(data.user, null, 2)}</pre>
		</div>

		<div>
			<h2 class="text-lg font-semibold">Session:</h2>
			<pre class="bg-gray-100 p-4 rounded">{JSON.stringify(data.session, null, 2)}</pre>
		</div>

		<div>
			<h2 class="text-lg font-semibold">Cookies:</h2>
			<pre class="bg-gray-100 p-4 rounded">{JSON.stringify(data.cookies, null, 2)}</pre>
		</div>

		<div>
			<h2 class="text-lg font-semibold">Pathname:</h2>
			<p>{data.pathname}</p>
		</div>

		<div class="space-x-4">
			<a href="/admin" class="bg-blue-500 text-white px-4 py-2 rounded">Try /admin</a>
			<a href="/admin/login" class="bg-green-500 text-white px-4 py-2 rounded">Go to login</a>
		</div>
	</div>
</div>