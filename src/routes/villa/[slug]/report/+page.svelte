<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  export let data: PageData;
  export let form: any;

  let turnstileToken = "";
  let turnstileWidgetId: string | null = null;
  let isSubmitting = false;
  let showThankYouDialog = false;

  $: user = $page.data.user;

  // Redirect to login if not authenticated
  $: if (browser && !user) {
    const backUrl = encodeURIComponent(`/villa/${data.villa.slug}`);
    goto(`/login?redirect=/villa/${data.villa.slug}/report&backUrl=${backUrl}`);
  }

  onMount(() => {
    if (!user) return;

    const siteKey = data.turnstileSiteKey || "1x00000000000000000000AA";

    if (browser && siteKey) {
      // Load Turnstile script
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Render the Turnstile widget
        if (window.turnstile) {
          turnstileWidgetId = window.turnstile.render("#turnstile-container", {
            sitekey: siteKey,
            theme: "auto",
            size: "normal",
            callback: (token: string) => {
              turnstileToken = token;
            },
            "error-callback": () => {
              console.error("Turnstile verification failed");
              turnstileToken = "";
            },
            "expired-callback": () => {
              turnstileToken = "";
            },
          });
        }
      };
      document.head.appendChild(script);
    }
  });
</script>

<svelte:head>
  <title>Report {data.villa.title} - Villana</title>
  <meta name="description" content="Report issues with {data.villa.title}" />
</svelte:head>

{#if user && data.villa}
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <!-- Back to villa link -->
      <div class="mb-6">
        <a
          href="/villa/{data.villa.slug}"
          class="inline-flex items-center text-indigo-600 hover:text-indigo-700"
        >
          <svg
            class="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {data.villa.title}
        </a>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Report Villa Issue</h1>
          <p class="mt-2 text-gray-600">
            Help us improve by reporting any issues with this villa listing.
          </p>
        </div>

        {#if form?.error}
          <div class="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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
                <p class="text-sm text-red-700">{form.error}</p>
              </div>
            </div>
          </div>
        {/if}

        <form
          method="post"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ result, formData, update }) => {
              // Add the Turnstile token to the form data
              if (turnstileToken) {
                formData.append("cf-turnstile-response", turnstileToken);
              }

              if (result.type === "success") {
                console.log(
                  "Form submitted successfully, showing thank you dialog",
                );
                // Reset turnstile on success
                if (window.turnstile && turnstileWidgetId) {
                  window.turnstile.reset(turnstileWidgetId);
                }
                turnstileToken = "";
                // Show thank you dialog instead of updating the page
                showThankYouDialog = true;
                // Don't call update for success to prevent page state confusion
              } else {
                // Call update for failures to show error messages
                await update();
              }

              if (result.type === "failure") {
                // Reset turnstile on failure so user can try again
                if (window.turnstile && turnstileWidgetId) {
                  window.turnstile.reset(turnstileWidgetId);
                }
                turnstileToken = "";
              }

              isSubmitting = false;
            };
          }}
          class="space-y-6"
        >
          <!-- Villa Info Display -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900">
              {data.villa.title}
            </h3>
            <p class="text-gray-600">{data.villa.address}</p>
          </div>

          <!-- Report Category -->
          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700"
            >
              Report Category *
            </label>
            <select
              id="category"
              name="category"
              required
              class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              <option value="scam">This is a scam/fraudulent listing</option>
              <option value="invalid">Information is incorrect/outdated</option>
              <option value="closed">Villa is permanently closed</option>
              <option value="other">Other issue</option>
            </select>
          </div>

          <!-- Custom Category (shown when "other" is selected) -->
          <div>
            <label
              for="customCategory"
              class="block text-sm font-medium text-gray-700"
            >
              Please specify (if "Other" selected)
            </label>
            <input
              type="text"
              id="customCategory"
              name="customCategory"
              maxlength="100"
              class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Briefly describe the issue type"
            />
          </div>

          <!-- Subject -->
          <div>
            <label
              for="subject"
              class="block text-sm font-medium text-gray-700"
            >
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              maxlength="255"
              class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Brief summary of the issue"
            />
          </div>

          <!-- Content -->
          <div>
            <label
              for="content"
              class="block text-sm font-medium text-gray-700"
            >
              Issue Details *
            </label>
            <textarea
              id="content"
              name="content"
              rows="5"
              required
              class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Please provide detailed information about the issue you're reporting..."
            ></textarea>
          </div>

          <!-- Turnstile Captcha -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Verification *
            </label>
            <div id="turnstile-container"></div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-4">
            <a
              href="/villa/{data.villa.slug}"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <svg
                  class="inline h-4 w-4 animate-spin mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Submitting...
              {:else}
                Submit Report
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Thank You Dialog -->
{#if showThankYouDialog}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background overlay -->
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-40 transition-opacity"
    ></div>

    <!-- Modal container -->
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div
        class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Thank You for Your Report!
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Your report has been submitted successfully. We appreciate
                    you helping us maintain the quality and accuracy of our
                    villa listings. Our team will review your report and take
                    appropriate action.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onclick={() => {
                showThankYouDialog = false;
                goto(`/villa/${data.villa.slug}`);
              }}
            >
              Back to Villa
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

