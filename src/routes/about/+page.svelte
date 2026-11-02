<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";
</script>

<svelte:head>
  <title>Tentang Kami - About Villana | {siteConfig.name}</title>
  <meta
    name="description"
    content="Pelajari lebih lanjut tentang Villana.id, platform eksplorasi villa terpercaya di Indonesia. Temukan misi kami dalam membantu Anda menemukan villa impian dengan sistem P/V Ratio yang inovatif."
  />

  <!-- Open Graph Tags -->
  <meta
    property="og:title"
    content="Tentang Kami - About Villana | {siteConfig.name}"
  />
  <meta
    property="og:description"
    content="Pelajari lebih lanjut tentang Villana.id, platform eksplorasi villa terpercaya di Indonesia dengan sistem P/V Ratio yang inovatif."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={getAbsoluteUrl("/about")} />
  <meta
    property="og:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />
  <meta property="og:image:width" content={siteConfig.openGraph.imageWidth} />
  <meta property="og:image:height" content={siteConfig.openGraph.imageHeight} />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content={siteConfig.twitter.cardType} />
  <meta
    name="twitter:title"
    content="Tentang Kami - About Villana | {siteConfig.name}"
  />
  <meta
    name="twitter:description"
    content="Pelajari lebih lanjut tentang Villana.id, platform eksplorasi villa terpercaya di Indonesia."
  />
  <meta
    name="twitter:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />

  <!-- Canonical URL -->
  <link rel="canonical" href={getAbsoluteUrl("/about")} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center space-x-4">
          <a href="/" class="text-xl font-bold text-white hover:text-blue-100">
            {siteConfig.name}
          </a>
          <nav aria-label="Breadcrumb">
            <div class="hidden sm:flex items-center text-sm text-white/90">
              <a href="/" class="hover:text-white">Beranda</a>
              <svg class="mx-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-white">Tentang Kami</span>
            </div>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <a
            href="/explore"
            class="hidden sm:inline-flex items-center px-3 py-1.5 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
          >
            Jelajahi Villa
          </a>
          <a
            href="/register"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Daftar
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Tentang <span class="text-indigo-600">Villana</span>
        </h1>
        <p class="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
          Platform eksplorasi villa terpercaya di Indonesia yang membantu Anda
          menemukan akomodasi impian dengan sistem penilaian yang transparan dan
          inovatif.
        </p>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Mission Section -->
    <section
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12"
    >
      <div class="flex items-center mb-6">
        <div class="bg-indigo-100 p-3 rounded-lg mr-4">
          <svg
            class="h-8 w-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Misi Kami</h2>
      </div>
      <div class="prose prose-lg max-w-none text-gray-700">
        <p class="mb-4">
          Villana hadir dengan misi untuk merevolusi cara orang mencari dan
          memilih villa di Indonesia. Kami percaya bahwa setiap orang berhak
          mendapatkan pengalaman liburan yang luar biasa tanpa harus membayar
          biaya tambahan yang tidak perlu.
        </p>
        <p>
          Sebagai platform eksplorasi villa yang 100% gratis, kami berkomitmen
          untuk memberikan transparansi penuh dalam setiap informasi yang kami
          sajikan, memungkinkan Anda untuk membuat keputusan yang tepat
          berdasarkan data yang akurat dan terpercaya.
        </p>
      </div>
    </section>

    <!-- What Makes Us Different -->
    <section
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12"
    >
      <div class="flex items-center mb-6">
        <div class="bg-blue-100 p-3 rounded-lg mr-4">
          <svg
            class="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">
          Yang Membuat Kami Berbeda
        </h2>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div class="flex items-start">
            <div class="bg-green-100 p-2 rounded-full mr-4 mt-1">
              <svg
                class="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                100% Gratis, Selamanya
              </h3>
              <p class="text-gray-600">
                Tidak ada biaya tersembunyi, tidak ada biaya langganan. Kami
                berkomitmen untuk menyediakan layanan gratis untuk pencari villa
                di seluruh Indonesia.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="bg-yellow-100 p-2 rounded-full mr-4 mt-1">
              <svg
                class="h-5 w-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Koneksi Langsung</h3>
              <p class="text-gray-600">
                Hubungkan Anda langsung dengan pemilik villa tanpa perantara,
                memastikan harga terbaik tanpa beban biaya OTA.
              </p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="bg-purple-100 p-2 rounded-full mr-4 mt-1">
              <svg
                class="h-5 w-5 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                Sistem P/V Ratio Inovatif
              </h3>
              <p class="text-gray-600">
                Metrik eksklusif kami yang membantu Anda menilai keseimbangan
                antara harga dan nilai yang didapatkan dari setiap villa.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex items-start">
            <div class="bg-red-100 p-2 rounded-full mr-4 mt-1">
              <svg
                class="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                Data Terverifikasi
              </h3>
              <p class="text-gray-600">
                Tim kami melakukan verifikasi manual untuk memastikan akurasi
                dan kualitas setiap informasi villa yang ditampilkan.
                Menghindarkan Anda dari penipuan akun palsu seperti ketika
                mencari villa <i>hidden-gem</i> di sosial media.
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="bg-indigo-100 p-2 rounded-full mr-4 mt-1">
              <svg
                class="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Pencarian Cerdas</h3>
              <p class="text-gray-600">
                Teknologi pencarian canggih yang memungkinkan Anda menemukan
                villa yang sesuai dengan preferensi dan budget Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Commitment -->
    <section
      class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg text-white p-8 mb-12"
    >
      <div class="text-center">
        <div
          class="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h2 class="text-3xl font-bold mb-6">Komitmen Kami</h2>
        <div class="prose prose-lg max-w-3xl mx-auto text-blue-100">
          <p class="mb-4">
            Villana berkomitmen untuk menjadi platform eksplorasi villa yang
            paling terpercaya di Indonesia. Kami tidak hanya menyediakan daftar
            villa, tetapi juga memastikan setiap informasi yang kami berikan
            akurat, up-to-date, dan membantu Anda membuat keputusan yang tepat.
          </p>
          <p>
            Dengan terus mengembangkan teknologi dan meningkatkan kualitas
            layanan, kami berusaha untuk memberikan pengalaman terbaik dalam
            mencari villa impian Anda. Kepercayaan Anda adalah prioritas utama
            kami.
          </p>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
    >
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        Mulai Jelajahi Villa Bersama Villana
      </h2>
      <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
        Bergabunglah dengan ribuan pengguna yang telah mempercayai Villana untuk
        menemukan villa terbaik di Indonesia. Gratis, transparan, dan
        terpercaya.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/explore"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg
            class="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Mulai Jelajahi Villa
        </a>
        <a
          href="/faq"
          class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg
            class="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pelajari FAQ
        </a>
      </div>
    </section>

    <!-- Additional Info -->
    <div class="mt-12 text-center">
      <p class="text-sm text-gray-500">
        Villana.id - Platform eksplorasi villa terpercaya di Indonesia
      </p>
    </div>
  </main>
</div>
<Footer />

