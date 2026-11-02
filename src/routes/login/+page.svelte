<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import * as m from "$lib/paraglide/messages.js";

  export let form: ActionData;
  export let data: PageData;

  $: user = $page.data.user;

  let backUrl = data.backUrl || "/";

  let turnstileToken = "";
  let turnstileWidgetId: string | null = null;
  let isLoggingIn = false;

  onMount(() => {
    // Try to access the environment variable directly
    const siteKey = data.turnstileSiteKey || "1x00000000000000000000AA";

    console.log("Turnstile debug:", {
      browser,
      turnstileSiteKey: data.turnstileSiteKey,
      hasKey: !!data.turnstileSiteKey,
      fallbackKey: siteKey,
    });

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
          console.log("Rendering Turnstile with sitekey:", siteKey);
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
  <title>{m.login_page_title()}</title>
</svelte:head>

<!-- Navigation Header -->
<Navbar noSaved={true} noLogin={true} noRegister={true} />

<div>
  <div
    class="min-h-screen mt-10 bg-gray-50 flex flex-col justify-start py-12 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-gray-900">{m.login_title()}</h1>
        <!-- <p class="mt-2 text-sm text-gray-600"> -->
        <!--   Sign in to access the admin dashboard -->
        <!-- </p> -->
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

        <form
          method="post"
          use:enhance={() => {
            isLoggingIn = true;
            return async ({ result, formData }) => {
              // Add the Turnstile token to the form data
              if (turnstileToken) {
                formData.append("cf-turnstile-response", turnstileToken);
              }

              // Handle successful login with client-side redirect fallback
              if (result.type === "redirect") {
                console.log(
                  "Login successful, redirecting to:",
                  result.location,
                );

                // Small delay to ensure session is properly set
                setTimeout(() => {
                  window.location.href = result.location || "/admin";
                }, 100);
              } else if (result.type === "failure") {
                console.log("Login failed:", result.data);
                isLoggingIn = false;
              } else {
                console.log("Unexpected result type:", result.type);
                isLoggingIn = false;
              }
            };
          }}
          class="space-y-6"
        >
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700"
            >
              {m.username()}
            </label>
            <div class="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autocomplete="username"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={m.enter_username()}
              />
            </div>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              {m.password()}
            </label>
            <div class="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={m.enter_password()}
              />
            </div>
          </div>

          <!-- Cloudflare Turnstile Widget -->
          <div class="flex justify-center">
            <div id="turnstile-container"></div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isLoggingIn}
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                {m.signing_in()}
              {:else}
                {m.sign_in()}
              {/if}
            </button>
          </div>
        </form>

        <div class="mt-5 text-center">
          <div class="relative pb-10">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
          </div>
          <p class="text-sm text-gray-600">
            {m.no_account_yet()}
            <a
              href="/register"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {m.register_here()}
            </a>
          </p>
        </div>

        <div class="mt-6">
          <div class="mt-6 text-center">
            <a
              href={backUrl}
              class="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {m.back_to_villana()}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer user={null} />
</div>
