<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { enhance } from "$app/forms";

  export let form: ActionData;
  export let data: PageData;

  let isSubmitting = false;
</script>

<svelte:head>
  <title>Complete Your Profile - Villana</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-3xl font-extrabold text-gray-900">Complete Your Profile</h1>
      <p class="mt-2 text-sm text-gray-600">
        Welcome, {data.user.fullName}! Please provide additional information to complete your registration.
      </p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <!-- User Info Display -->
      <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <div class="flex items-center">
          {#if data.user.profilePicture}
            <img
              src={data.user.profilePicture}
              alt="Profile"
              class="h-12 w-12 rounded-full mr-3"
              referrerpolicy="no-referrer"
            />
          {/if}
          <div>
            <p class="text-sm font-medium text-green-800">{data.user.fullName}</p>
            <p class="text-xs text-green-600">{data.user.email}</p>
            <p class="text-xs text-green-600">Google account connected ✓</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      {#if form?.message}
        <div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{form.message}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Profile Completion Form -->
      <form
        method="post"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result }) => {
            isSubmitting = false;
          };
        }}
        class="space-y-6"
      >
        <!-- Phone (Optional) -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </label>
          <div class="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              autocomplete="tel"
              value={form?.phone ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="+1234567890"
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
        </div>

        <!-- Address (Optional) -->
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700">
            Address (Optional)
          </label>
          <div class="mt-1">
            <textarea
              id="address"
              name="address"
              rows="3"
              autocomplete="address-line1"
              value={form?.address ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your address"
            ></textarea>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {#if isSubmitting}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            {:else}
              Complete Profile
            {/if}
          </button>

          <a
            href="/dashboard"
            class="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Skip for Now
          </a>
        </div>
      </form>

      <!-- Note -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">
          You can always update this information later in your profile settings.
        </p>
      </div>
    </div>
  </div>
</div>