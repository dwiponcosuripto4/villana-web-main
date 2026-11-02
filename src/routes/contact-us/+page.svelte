<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import TurnstileWidget from "$lib/components/auth/TurnstileWidget.svelte";
  import SEOHead from "$lib/components/SEOHead.svelte";
  import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
  import { siteConfig } from "$lib/config/site";

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let turnstileToken = $state("");
  let turnstileWidget: TurnstileWidget;
  let isSubmitting = $state(false);

  // Form values
  let subject = $state(form?.values?.subject || "");
  let content = $state(form?.values?.content || "");

  // Check if form is valid
  let isFormValid = $derived(
    !!data.user &&
    subject.trim().length > 0 &&
    content.trim().length >= 10 &&
    !!turnstileToken
  );

  function handleTurnstileToken(token: string) {
    turnstileToken = token;
  }

  function handleTurnstileError() {
    turnstileToken = "";
    console.error("Turnstile verification error");
  }

  function handleTurnstileExpired() {
    turnstileToken = "";
  }

  // Reset form on success
  $effect(() => {
    if (form?.success) {
      subject = "";
      content = "";
      turnstileToken = "";
      if (turnstileWidget) {
        turnstileWidget.reset();
      }
    }
  });

  // Breadcrumbs
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact-us", current: true }
  ];
</script>

<SEOHead
  title="Contact Us - Villana"
  description="Get in touch with the Villana team. Send us your questions, feedback, or suggestions."
  keywords="contact, support, help, feedback, villana"
  image={siteConfig.openGraph.defaultImage}
  imageAlt="Contact Villana"
  type="website"
/>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center space-x-4 relative">
          <a href="/" class="text-xl font-bold text-white hover:text-blue-100">
            Villana
          </a>
          <span class="text-white absolute" style="top: -11px; right: 8px; font-size: 10px;">[beta]</span>
        </div>

        <nav class="hidden md:flex items-center space-x-4">
          <a href="/explore" class="text-sm text-white/80 hover:text-white">Explore Villas</a>
          <a href="/places" class="text-sm text-white/80 hover:text-white">Places</a>
          {#if data.user}
            {#if data.user.role === "admin"}
              <a href="/admin" class="text-sm text-white/80 hover:text-white">Admin</a>
            {/if}
            <a href="/dashboard" class="text-sm text-white/80 hover:text-white">Dashboard</a>
            <a href="/auth/logout" class="text-sm text-white/80 hover:text-white">Logout</a>
          {:else}
            <a href="/login" class="text-sm text-white/80 hover:text-white">Login</a>
            <a href="/register" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50">
              Register
            </a>
          {/if}
        </nav>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Breadcrumbs -->
    <Breadcrumbs items={breadcrumbs} className="mb-6" />

    <div class="bg-white shadow-sm rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        {#if form?.success}
          <!-- Success State - Show only success message -->
          <div class="text-center py-8">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h2>
            <p class="text-gray-600 mb-8 max-w-md mx-auto">
              Thank you for contacting us. We've received your message and will respond as soon as possible, typically within 24-48 hours.
            </p>
            <a
              href="/explore"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Explore Villas
            </a>
          </div>
        {:else}
          <!-- Normal Form State -->
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p class="text-gray-600 mb-8">
            Have questions, feedback, or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <!-- Error Message -->
          {#if form?.error}
            <div class="mb-6 rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">
                    {form.error}
                  </p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Login Warning -->
          {#if !data.user}
            <div class="mb-6 rounded-md bg-yellow-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    You need to <a href="/login" class="font-medium underline text-yellow-700 hover:text-yellow-600">login</a> to send a message.
                  </p>
                </div>
              </div>
            </div>
          {/if}

          <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ result, update }) => {
              isSubmitting = false;
              await update();
            };
          }}
        >
          <div class="space-y-6">
            <!-- Subject Field -->
            <div>
              <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
                Subject <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                bind:value={subject}
                required
                maxlength="255"
                disabled={!data.user || isSubmitting}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                placeholder="What is your message about?"
              />
            </div>

            <!-- Content Field -->
            <div>
              <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
                Message <span class="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                bind:value={content}
                rows="8"
                required
                minlength="10"
                maxlength="5000"
                disabled={!data.user || isSubmitting}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                placeholder="Please describe your question or feedback in detail..."
              />
              <p class="mt-1 text-xs text-gray-500">
                {content.length}/5000 characters
              </p>
            </div>

            <!-- Turnstile Captcha or Login Prompt -->
            {#if data.user}
              {#if data.turnstileSiteKey}
                <div class="flex flex-col items-center space-y-2">
                  <TurnstileWidget
                    bind:this={turnstileWidget}
                    siteKey={data.turnstileSiteKey}
                    onToken={handleTurnstileToken}
                    onError={handleTurnstileError}
                    onExpired={handleTurnstileExpired}
                  />
                  {#if !turnstileToken && subject && content.length >= 10}
                    <p class="text-xs text-gray-500">Please complete the captcha verification</p>
                  {/if}
                </div>
              {/if}
            {:else}
              <div class="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-gray-900">Login Required</h3>
                    <div class="mt-1 text-sm text-gray-600">
                      <p>Please <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">login</a> or <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">create an account</a> to send us a message.</p>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {#if isSubmitting}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                {:else}
                  Send Message
                {/if}
              </button>
            </div>
          </div>
        </form>
        {/if}
      </div>
    </div>

    <!-- Additional Information -->
    <div class="mt-8 bg-white shadow-sm rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h2>
        <div class="space-y-4 text-sm text-gray-600">
          <div>
            <h3 class="font-medium text-gray-900">Response Time</h3>
            <p>We typically respond to messages within 24-48 hours during business days.</p>
          </div>
          <div>
            <h3 class="font-medium text-gray-900">For Villa Owners</h3>
            <p>If you're a villa owner looking to list your property, please visit our <a href="/dashboard" class="text-indigo-600 hover:text-indigo-500">Villa Owner Dashboard</a>.</p>
          </div>
          <div>
            <h3 class="font-medium text-gray-900">Report an Issue</h3>
            <p>To report issues with specific villa listings, please use the report feature on the villa's detail page.</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>