<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  // Quick stats (these would come from API calls in a real app)
  $: accountAge = data.user.createdAt
    ? Math.floor(
        (Date.now() - new Date(data.user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
</script>

<svelte:head>
  <title>Dashboard - Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Section -->
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex items-center space-x-4">
      {#if data.user.profilePicture}
        <img
          src={data.user.profilePicture}
          alt="Profile"
          class="h-16 w-16 rounded-full"
          referrerpolicy="no-referrer"
        />
      {:else}
        <div
          class="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center"
        >
          <svg
            class="h-8 w-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      {/if}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {data.user.fullName}!
        </h1>
        <p class="text-gray-600">
          {#if data.user.registrationMethod === "google"}
            Signed in with Google
          {:else}
            Member since {new Date(data.user.createdAt).toLocaleDateString()}
          {/if}
        </p>
      </div>
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-8 w-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">
              Saved Villas
            </dt>
            <dd class="text-lg font-medium text-gray-900">-</dd>
          </dl>
        </div>
      </div>
      <div class="mt-4">
        <a
          href="/dashboard/saved"
          class="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
        >
          View saved villas →
        </a>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">
              Account Status
            </dt>
            <dd class="text-lg font-medium text-gray-900">
              {data.user.emailVerified ? "Verified" : "Pending"}
            </dd>
          </dl>
        </div>
      </div>
      <div class="mt-4">
        {#if !data.user.emailVerified}
          <button
            class="text-green-600 hover:text-green-500 text-sm font-medium"
          >
            Verify email →
          </button>
        {:else}
          <span class="text-green-600 text-sm font-medium">✓ Verified</span>
        {/if}
      </div>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-8 w-8 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">
              Member for
            </dt>
            <dd class="text-lg font-medium text-gray-900">
              {accountAge}
              {accountAge === 1 ? "day" : "days"}
            </dd>
          </dl>
        </div>
      </div>
      <div class="mt-4">
        <a
          href="/dashboard/profile"
          class="text-purple-600 hover:text-purple-500 text-sm font-medium"
        >
          Edit profile →
        </a>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <a
        href="/dashboard/profile"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
      >
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">Edit Profile</p>
          <p class="text-sm text-gray-500">Update your information</p>
        </div>
      </a>

      <a
        href="/dashboard/saved"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
      >
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">Saved Villas</p>
          <p class="text-sm text-gray-500">View your favorites</p>
        </div>
      </a>

      <a
        href="/explore"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
      >
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">Browse Villas</p>
          <p class="text-sm text-gray-500">Find new properties</p>
        </div>
      </a>

      {#if data.hasVillaActivity}
        <a
          href="/dashboard/villas"
          class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
        >
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">Villa Saya</p>
            <p class="text-sm text-gray-500">Kelola villa yang dimiliki</p>
          </div>
        </a>
      {/if}

      <a
        href="/dashboard/settings"
        class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400"
      >
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">Settings</p>
          <p class="text-sm text-gray-500">Manage preferences</p>
        </div>
      </a>
    </div>
  </div>

  <!-- Profile Completion Notice -->
  {#if !data.user.phone || !data.user.address}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-blue-800">
            Complete Your Profile
          </h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>
              {#if !data.user.phone && !data.user.address}
                Add your phone number and address to get personalized villa
                recommendations.
              {:else if !data.user.phone}
                Add your phone number to receive updates about your saved
                villas.
              {:else}
                Add your address to get location-based villa recommendations.
              {/if}
            </p>
          </div>
          <div class="mt-3">
            <a
              href="/dashboard/profile"
              class="text-sm font-medium text-blue-800 hover:text-blue-700"
            >
              Complete profile →
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

