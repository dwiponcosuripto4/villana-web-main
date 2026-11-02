<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  export let siteKey: string;
  export let onToken: (token: string) => void;
  export let onError: () => void = () => {};
  export let onExpired: () => void = () => {};

  let turnstileWidgetId: string | null = null;
  let containerElement: HTMLElement;

  onMount(() => {
    if (browser && siteKey) {
      // Load Turnstile script
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Render the Turnstile widget
        if (window.turnstile && containerElement) {
          turnstileWidgetId = window.turnstile.render(containerElement, {
            sitekey: siteKey,
            theme: "auto",
            size: "normal",
            callback: onToken,
            "error-callback": onError,
            "expired-callback": onExpired,
          });
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      // Clean up the widget if needed
      if (turnstileWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch (e) {
          console.warn("Failed to remove Turnstile widget:", e);
        }
      }
    };
  });

  export function reset() {
    if (turnstileWidgetId && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }
</script>

<div bind:this={containerElement} class="flex justify-center"></div>