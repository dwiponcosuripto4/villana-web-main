<script lang="ts">
	import type { PageData } from './$types';
	import Footer from "$lib/components/Footer.svelte";

	export let data: PageData;
</script>

<svelte:head>
	<title>Admin Status - Debug</title>
</svelte:head>

<!-- Layout with header, main content, and footer -->
<div class="min-h-screen flex flex-col">
  <!-- Simple header with logo only -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/images/logo-villana-with-name-beta.svg"
              alt="Villana Logo"
              class="h-8 w-auto"
            />
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="flex-grow bg-gray-50 p-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Admin System Status</h1>

      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <h2 class="text-lg font-semibold mb-2">System Status</h2>
          <div class="space-y-2">
            <p><strong>Has Admin:</strong> {data.hasAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Admin Count:</strong> {data.adminCount}</p>
            <p><strong>Session:</strong> {data.session}</p>
            <p><strong>User:</strong> {data.user ? `${data.user.username} (${data.user.role})` : 'None'}</p>
          </div>
        </div>

        <div class="border-t pt-4">
          <h2 class="text-lg font-semibold mb-2">Expected Flow</h2>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>If no admin exists → Redirect to /admin/setup</li>
            <li>If admin exists but user not logged in → Redirect to /admin/login</li>
            <li>If user logged in but not admin → Redirect to /admin/login</li>
            <li>If admin logged in → Show admin dashboard</li>
          </ul>
        </div>

        <div class="border-t pt-4">
          <div class="space-x-4">
            <a href="/admin" class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Go to /admin
            </a>
            <a href="/admin/setup" class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Go to /admin/setup
            </a>
            <a href="/admin/login" class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Go to /admin/login
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <Footer user={null} />
</div>