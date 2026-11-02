<script lang="ts">
  import { onMount } from "svelte";
  // Microsoft Clarity Component

  onMount(() => {
    // Check if already loaded
    if ((window as any).clarity) {
      return;
    }

    // Initialize Clarity
    (function (c: any, l: any, a: string, r: string, i: string) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", "uuzi7ndcat");
  });
</script>
