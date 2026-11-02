<script lang="ts">
  import { page } from "$app/stores";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let user = $derived($page.data.user);
</script>

<div class="min-h-screen flex flex-col">
  <Navbar {user} />

  <!-- Add padding top to account for fixed navbar -->
  <main class="flex-1 pt-16">
    <slot />
  </main>

  <Footer {user} />
</div>
