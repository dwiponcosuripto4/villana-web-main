<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { enhance } from "$app/forms";
  import TurnstileWidget from "$lib/components/auth/TurnstileWidget.svelte";
  import TermsModal from "$lib/components/TermsModal.svelte";
  import * as m from "$lib/paraglide/messages.js";

  let { form, data }: { form: ActionData; data: PageData } = $props();

  let turnstileToken = $state("");
  let turnstileWidget: TurnstileWidget;
  let isSubmitting = $state(false);
  let showSuccess = $state(false);
  let showError = $state(false);
  let errorMessage = $state("");
  let errorDismissed = $state(false);
  let termsAccepted = $state(false);
  let showTermsModal = $state(false);

  function handleTurnstileToken(token: string) {
    turnstileToken = token;
  }

  function handleTurnstileError() {
    turnstileToken = "";
  }

  function resetTurnstile() {
    if (turnstileWidget) {
      turnstileWidget.reset();
    }
    turnstileToken = "";
  }

  // Check for success and show popup
  $effect(() => {
    if (form?.success && !showSuccess) {
      showSuccess = true;
    }
  });

  // Check for errors and show error modal - only if not dismissed
  $effect(() => {
    if (form?.message && !form?.success && !errorDismissed) {
      errorMessage = form.message;
      showError = true;
    }
  });

  // Reset error dismissed flag when form data changes (new submission)
  $effect(() => {
    if (form?.success || !form?.message) {
      errorDismissed = false;
    }
  });

  function closeErrorModal() {
    console.log("Closing error modal");
    showError = false;
    errorMessage = "";
    errorDismissed = true;
    // Reset form state if needed
    isSubmitting = false;
  }

  function closeSuccessModal() {
    showSuccess = false;
  }

  function showTerms(event: Event) {
    event.preventDefault();
    showTermsModal = true;
  }

  function closeTermsModal() {
    showTermsModal = false;
  }
</script>

<svelte:head>
  <title>{m.register_page_title()}</title>
</svelte:head>

<div
  class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-3xl font-extrabold text-gray-900">{m.create_account()}</h1>
      <p class="mt-2 text-sm text-gray-600">
        {m.register_subtitle()}
      </p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <!-- Google OAuth Button -->
      <div class="mb-6">
        <a
          href="/auth/google/login"
          class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
          {m.continue_with_google()}
        </a>
      </div>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">{m.or_register_with_email()}</span
          >
        </div>
      </div>

      <!-- Error messages now shown in modal for better mobile UX -->

      <!-- Registration Form -->
      <form
        method="post"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result, formData, update }) => {
            // Add the Turnstile token to the form data
            if (turnstileToken) {
              formData.append("cf-turnstile-response", turnstileToken);
            }

            isSubmitting = false;

            if (result.type === "failure") {
              resetTurnstile();
              await update();
              // Show error modal for mobile users
              if (result.data?.message) {
                errorMessage = result.data.message;
                showError = true;
              }
            } else if (result.type === "success") {
              // Update first to get the form data
              await update();
              // Check if registration was successful
              if (result.data?.success) {
                showSuccess = true;
              }
            } else {
              await update();
            }
          };
        }}
        class="space-y-6"
      >
        <!-- Full Name -->
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700">
            {m.full_name()} <span class="text-red-500">*</span>
          </label>
          <div class="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              autocomplete="name"
              required
              value={form?.fullName ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.enter_your_full_name()}
            />
          </div>
        </div>

        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            {m.username()} <span class="text-red-500">*</span>
          </label>
          <div class="mt-1">
            <input
              id="username"
              name="username"
              type="text"
              autocomplete="username"
              required
              value={form?.username ?? ""}
              pattern="[a-z0-9_]+"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.enter_your_username()}
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {m.username_hint()}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            {m.email_address()} <span class="text-red-500">*</span>
          </label>
          <div class="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              value={form?.email ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.enter_your_email_address()}
            />
          </div>
        </div>

        <!-- Phone (Optional) -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">
            {m.phone_number_optional()}
          </label>
          <div class="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              autocomplete="tel"
              value={form?.phone ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.phone_placeholder()}
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {m.phone_hint()}
          </p>
        </div>

        <!-- Address (Optional) -->
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700">
            {m.address_optional()}
          </label>
          <div class="mt-1">
            <textarea
              id="address"
              name="address"
              rows="2"
              autocomplete="address-line1"
              value={form?.address ?? ""}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.enter_your_address()}
            ></textarea>
          </div>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            {m.password()} <span class="text-red-500">*</span>
          </label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.create_strong_password()}
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {m.password_requirements()}
          </p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-gray-700"
          >
            {m.confirm_password()} <span class="text-red-500">*</span>
          </label>
          <div class="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={m.confirm_your_password()}
            />
          </div>
        </div>

        <!-- Terms and Conditions Acceptance -->
        <div>
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                required
                bind:checked={termsAccepted}
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="termsAccepted" class="text-gray-700">
                {m.terms_acceptance_label()}
                <button
                  type="button"
                  class="text-indigo-600 hover:text-indigo-500 underline font-medium"
                  on:click={showTerms}
                >
                  {m.terms_link_text()}
                </button>
                <span class="text-red-500 ml-1">*</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Turnstile Widget -->
        <div class="space-y-4">
          <label class="block text-sm font-medium text-gray-700">
            {m.security_verification()} <span class="text-red-500">*</span>
          </label>
          <TurnstileWidget
            bind:this={turnstileWidget}
            siteKey={data.turnstileSiteKey}
            onToken={handleTurnstileToken}
            onError={handleTurnstileError}
            onExpired={handleTurnstileError}
          />
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken || !termsAccepted}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              {m.creating_account()}
            {:else}
              {m.create_account()}
            {/if}
          </button>
        </div>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          {m.already_have_account()}
          <a
            href="/login"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {m.sign_in_here()}
          </a>
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Success Modal -->
{#if showSuccess}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 opacity-75 z-40"></div>

      <!-- Modal panel -->
      <div
        class="relative z-50 inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6"
      >
        <div>
          <div
            class="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full"
          >
            <svg
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg font-medium leading-6 text-gray-900">
              {m.account_created_successfully()}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                {m.welcome_message({ name: form?.user?.fullName || '' })}
              </p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6">
          <a
            href="/dashboard"
            class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            {m.go_to_dashboard()}
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Error Modal -->
{#if showError}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 opacity-75 z-40"
        on:click={closeErrorModal}
        on:keydown
      ></div>

      <!-- Modal panel -->
      <div
        class="relative z-50 inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6"
      >
        <div>
          <div
            class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full"
          >
            <svg
              class="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg font-medium leading-6 text-gray-900">
              {m.registration_failed()}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6">
          <button
            type="button"
            on:click={closeErrorModal}
            class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
          >
            {m.try_again()}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Terms Modal -->
<TermsModal bind:showModal={showTermsModal} onClose={closeTermsModal} />

