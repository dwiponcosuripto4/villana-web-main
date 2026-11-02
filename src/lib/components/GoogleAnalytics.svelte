<script lang="ts">
  import { onMount } from "svelte";
  // Google Analytics Component

  onMount(() => {
    // Check if already loaded
    if (document.querySelector('script[src*="googletagmanager.com/gtag"]')) {
      return;
    }

    // Load gtag script
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-TJR7PWDMET";
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", "G-TJR7PWDMET");
  });
</script>
