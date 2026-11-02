<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { toast } from "svelte-5-french-toast";

  export let form: ActionData;
  export let data: PageData;

  let profileLoading = false;
  let passwordLoading = false;

  // Handle success and error messages with toasts
  $: if (form?.success && form?.message) {
    toast.success(form.message);
  } else if (form?.message && !form?.success) {
    toast.error(form.message);
  }

  // Handle password-specific messages
  $: if (form?.passwordMessage) {
    toast.error(form.passwordMessage);
  }
</script>

<svelte:head>
  <title>Profile - Dashboard - Villana</title>
</svelte:head>

<div class="space-y-6">
  <!-- Profile Information -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
      <p class="mt-1 text-sm text-gray-500">
        Update your personal information and profile details.
      </p>

      {#if form?.message && !form?.success}
        <div class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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

      <form
        method="post"
        action="?/updateProfile"
        use:enhance={() => {
          profileLoading = true;
          return async ({ result, update }) => {
            profileLoading = false;
            // Let SvelteKit handle the form update
            await update();
          };
        }}
        class="mt-6 space-y-6"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Full Name -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              required
              value={form?.fullName ?? data.user.fullName}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <!-- Email (Read-only) -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              readonly
              value={data.user.email}
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500">
              {#if data.user.registrationMethod === "google"}
                Managed by Google
              {:else}
                Email cannot be changed
              {/if}
            </p>
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={form?.phone ?? data.user.phone ?? ""}
              placeholder="+1234567890"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
          </div>

          <!-- Registration Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Account Type</label>
            <div class="mt-1 flex items-center">
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
                <span class="text-sm text-gray-700">Google Account</span>
              {:else}
                <svg class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V9a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span class="text-sm text-gray-700">Email Account</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Address -->
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            name="address"
            id="address"
            rows="3"
            value={form?.address ?? data.user.address ?? ""}
            placeholder="Enter your address"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <!-- Profile Picture (if available) -->
        {#if data.user.profilePicture}
          <div>
            <label class="block text-sm font-medium text-gray-700">Profile Picture</label>
            <div class="mt-1 flex items-center space-x-4">
              <img
                src={data.user.profilePicture}
                alt="Profile"
                class="h-12 w-12 rounded-full"
                referrerpolicy="no-referrer"
              />
              {#if data.user.registrationMethod === "google"}
                <span class="text-sm text-gray-500">Managed by Google</span>
              {/if}
            </div>
          </div>
        {/if}

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={profileLoading}
            class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {#if profileLoading}
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
              Save Changes
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Change Password (only for email accounts) -->
  {#if data.user.registrationMethod === "email"}
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
        <p class="mt-1 text-sm text-gray-500">
          Ensure your account is using a long, random password to stay secure.
        </p>

        {#if form?.passwordMessage}
          <div class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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
                <p class="text-sm text-red-700">{form.passwordMessage}</p>
              </div>
            </div>
          </div>
        {/if}

        <form
          method="post"
          action="?/changePassword"
          use:enhance={() => {
            passwordLoading = true;
            return async ({ result, update }) => {
              passwordLoading = false;
              // Let SvelteKit handle the form update
              await update();
              // Reset form if successful
              if (result.type === "success") {
                const formElement = document.getElementById("passwordForm") as HTMLFormElement;
                formElement?.reset();
              }
            };
          }}
          id="passwordForm"
          class="mt-6 space-y-6"
        >
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              id="currentPassword"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {#if passwordLoading}
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
                Changing...
              {:else}
                Change Password
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Account Information -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
      <dl class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
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
          <dt class="text-sm font-medium text-gray-500">Account type</dt>
          <dd class="mt-1 text-sm text-gray-900 capitalize">{data.user.registrationMethod}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">User role</dt>
          <dd class="mt-1 text-sm text-gray-900 capitalize">{data.user.role}</dd>
        </div>
      </dl>
    </div>
  </div>
</div>