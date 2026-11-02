<script lang="ts">
  import { page } from "$app/stores";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";

  // Access error data from $page store
  let status = $derived($page.status);
  let message = $derived($page.error?.message);

  // Derive the appropriate error image based on status
  let errorImage = $derived(() => {
    if (status === 404) return "/images/villana-404.png";
    if (status === 500 || status === 503) return "/images/villana-500.webp";
    return null;
  });

  // Derive error title based on status
  let errorTitle = $derived(() => {
    switch (status) {
      case 404:
        return "Oops! Halaman tidak ditemukan";
      case 500:
      case 503:
        return "Ups! Terjadi kesalahan server";
      case 403:
        return "Akses Ditolak";
      case 401:
        return "Autentikasi Diperlukan";
      default:
        return "Terjadi Kesalahan";
    }
  });

  // Derive error subtitle based on status
  let errorSubtitle = $derived(() => {
    switch (status) {
      case 404:
        // if url contains /villa/, customize message
        if ($page.url.href.includes("/villa/")) {
          return "Villa yang Anda cari mungkin sudah dipindahkan atau tidak tersedia.";
        }
        return "";
      case 500:
      case 503:
        return "Maaf, ada masalah dengan server kami. Silakan coba lagi nanti.";
      case 403:
        return "Anda tidak memiliki izin untuk mengakses halaman ini.";
      case 401:
        return "Silakan login terlebih dahulu untuk mengakses halaman ini.";
      default:
        return (
          message || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."
        );
    }
  });

  // Derive whether to show reload button (for server errors)
  let showReloadButton = $derived(status >= 500 && status < 600);

  function handleReload() {
    window.location.reload();
  }
</script>

<svelte:head>
  <title>{status} - {errorTitle()} | Villana</title>
  <meta name="description" content={errorSubtitle()} />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-gray-50">
  <Navbar user={$page.data.user} />

  <main
    class="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full text-center">
      <!-- Error Image -->
      {#if errorImage()}
        <div class="mt-8 mb-8 animate-fade-in">
          <img
            src={errorImage()}
            alt={status === 404
              ? "404 Not Found Illustration"
              : "Server Error Illustration"}
            class="mx-auto h-48 w-auto sm:h-64 object-contain"
            loading="eager"
          />
        </div>
      {/if}

      <!-- Error Title -->
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {errorTitle()}
      </h1>

      <!-- Error Subtitle -->
      <p class="text-gray-600 mb-8 px-4">
        {errorSubtitle()}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center px-4">
        <a
          href="/"
          class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          Kembali ke Beranda
        </a>

        {#if showReloadButton}
          <button
            onclick={handleReload}
            class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Coba Lagi
          </button>
        {:else}
          <a
            href="/explore"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Jelajahi Villa
          </a>
        {/if}
      </div>

      <!-- Additional Help Text -->
      <div class="mt-12 text-sm text-gray-500">
        {#if status === 404}
          <p>Tidak menemukan yang Anda cari?</p>
          <p class="mt-2">
            Coba gunakan menu navigasi atau
            <a
              href="/contact-us"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              hubungi kami
            </a>
            untuk bantuan.
          </p>
        {:else if status >= 500}
          <p>
            Jika masalah berlanjut, silakan
            <a
              href="/contact-us"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              laporkan ke tim kami
            </a>.
          </p>
        {/if}
      </div>
    </div>
  </main>

  <Footer />
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
</style>
