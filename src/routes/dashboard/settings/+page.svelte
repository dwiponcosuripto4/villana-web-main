<script lang="ts">
  import type { PageData } from "./$types";
  import LanguageSelector from "$lib/components/LanguageSelector.svelte";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Settings - Dashboard - Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
    <p class="mt-1 text-sm text-gray-500">
      Manage your account preferences and privacy settings.
    </p>
  </div>

  <!-- Language Preferences -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Language Preferences</h3>
      <p class="mt-1 text-sm text-gray-500">
        Choose your preferred language for the interface and content.
      </p>

      <div class="mt-6">
        <LanguageSelector user={data.user} variant="radio" />
      </div>
    </div>
  </div>

  <!-- Notifications -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Notifications</h3>
      <p class="mt-1 text-sm text-gray-500">
        Choose how you want to receive notifications about villa updates and recommendations.
      </p>

      <div class="mt-6 space-y-6">
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="email-notifications"
              name="email-notifications"
              type="checkbox"
              checked
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="email-notifications" class="font-medium text-gray-700">
              Email notifications
            </label>
            <p class="text-gray-500">Get notified when new villas match your preferences.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="price-alerts"
              name="price-alerts"
              type="checkbox"
              checked
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="price-alerts" class="font-medium text-gray-700">
              Price drop alerts
            </label>
            <p class="text-gray-500">Get notified when saved villas have price reductions.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="marketing-emails"
              name="marketing-emails"
              type="checkbox"
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="marketing-emails" class="font-medium text-gray-700">
              Marketing emails
            </label>
            <p class="text-gray-500">Receive emails about new features and special offers.</p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <button
          type="button"
          class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save notification preferences
        </button>
      </div>
    </div>
  </div>

  <!-- Privacy -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Privacy</h3>
      <p class="mt-1 text-sm text-gray-500">
        Control your privacy settings and data sharing preferences.
      </p>

      <div class="mt-6 space-y-6">
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="profile-visibility"
              name="profile-visibility"
              type="checkbox"
              checked
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="profile-visibility" class="font-medium text-gray-700">
              Profile visibility
            </label>
            <p class="text-gray-500">Allow other users to see your public profile information.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="location-sharing"
              name="location-sharing"
              type="checkbox"
              checked
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="location-sharing" class="font-medium text-gray-700">
              Location-based recommendations
            </label>
            <p class="text-gray-500">Use your address to provide better villa recommendations.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="analytics"
              name="analytics"
              type="checkbox"
              checked
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="analytics" class="font-medium text-gray-700">
              Usage analytics
            </label>
            <p class="text-gray-500">Help improve Villana by sharing anonymous usage data.</p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <button
          type="button"
          class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save privacy settings
        </button>
      </div>
    </div>
  </div>

  <!-- Account Information -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
      <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-medium text-gray-500">Account type</dt>
          <dd class="mt-1 text-sm text-gray-900">
            <div class="flex items-center">
              {#if data.user.registrationMethod === "google"}
                <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Account
              {:else}
                <svg class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V9a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Account
              {/if}
            </div>
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Member since</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {new Date(data.user.createdAt).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Email verified</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {#if data.user.emailVerified}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified
              </span>
            {:else}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            {/if}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">User role</dt>
          <dd class="mt-1 text-sm text-gray-900 capitalize">{data.user.role}</dd>
        </div>
      </div>
    </div>
  </div>

  <!-- Danger Zone -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Danger Zone</h3>
      <p class="mt-1 text-sm text-gray-500">
        Irreversible and destructive actions.
      </p>

      <div class="mt-6 space-y-4">
        <div class="border border-red-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-red-800">Delete Account</h4>
          <p class="mt-1 text-sm text-red-600">
            Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
          </p>
          <div class="mt-3">
            <button
              type="button"
              class="bg-red-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>