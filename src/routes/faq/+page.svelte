<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";

  // FAQ data with improved professional copy
  const faqSections = [
    {
      title: "Tentang Layanan Villana",
      items: [
        {
          question: "Apakah Villana adalah Online Travel Agency (OTA)?",
          answer:
            "Tidak, Villana adalah platform eksplorasi villa yang dirancang khusus untuk membantu Anda menemukan akomodasi terbaik. Kami tidak menangani transaksi atau berperan sebagai perantara dalam proses pemesanan. Anda dapat langsung bertransaksi dengan pemilik villa tanpa biaya tambahan dari platform. Komitmen kami adalah menyediakan layanan eksplorasi yang transparan dan akan selalu demikian.",
        },
        {
          question: "Apakah menggunakan Villana gratis?",
          answer:
            "Ya, Villana sepenuhnya gratis untuk digunakan. Tidak ada biaya tersembunyi, biaya langganan, atau biaya akses. Kami berkomitmen untuk menyediakan layanan gratis selamanya bagi seluruh pengguna.",
        },
        {
          question: "Apakah aman memesan melalui Villana?",
          answer:
            'Villana bukan platform pemesanan, melainkan platform listing. Anda tidak dapat melakukan pemesanan melalui Villana, tetapi dapat langsung memesan ke pemilik villa atau manjemennya melalui tombol "WA Owner" yang tersedia di setiap halaman villa. Kami menyarankan untuk selalu melakukan komunikasi langsung dengan pemilik untuk memastikan ketersediaan dan detail pemesanan.',
        },
      ],
    },
    {
      title: "Memahami P/V Ratio",
      items: [
        {
          question: "Apa itu P/V Ratio?",
          answer:
            "P/V Ratio atau Price-to-Value Ratio adalah metrik inovatif yang menunjukkan seberapa sebanding harga villa dengan nilai yang didapatkan. Semakin tinggi rasio ini, semakin besar nilai yang diterima dibanding harga yang dibayar. Sistem ini membantu Anda membuat keputusan yang lebih bijak dalam memilih villa. Untuk penjelasan lebih detail tentang cara kerja P/V Ratio, silakan pelajari di halaman khusus kami: /post/price-to-value-ratio",
        },
      ],
    },
    {
      title: "Pengelolaan Data Villa",
      items: [
        {
          question: "Bagaimana cara meminta pembaruan data villa?",
          answer:
            'Anda dapat menggunakan fitur "Request Changes" yang tersedia di setiap halaman villa untuk mengajukan perubahan informasi. Tim kami akan meninjau setiap permintaan dengan teliti dan melakukan verifikasi sebelum menerapkan perubahan. Proses ini memastikan akurasi dan kualitas data yang disajikan kepada pengguna.',
        },
        {
          question: "Bisakah saya mengubah sendiri data villa di Villana?",
          answer:
            "Ya, Anda dapat mengubah data villa secara mandiri dengan syarat tertentu. Pertama, Anda harus merupakan pemilik sah dari villa tersebut dan telah melakukan klaim kepemilikan villa di Villana. Untuk memulai, silakan daftar melalui halaman /register, kemudian lakukan proses klaim villa yang Anda miliki. Demi keamanan, proses verifikasi kepemilikan akan dilakukan secara manual oleh tim Villana untuk memastikan autentisitas klaim Anda.",
        },
      ],
    },
  ];
</script>

<svelte:head>
  <title>FAQ - Frequently Asked Questions | {siteConfig.name}</title>
  <meta
    name="description"
    content="Temukan jawaban atas pertanyaan yang sering diajukan tentang Villana, platform eksplorasi villa terbaik di Indonesia. Pelajari tentang layanan kami, P/V Ratio, dan cara mengelola data villa."
  />

  <!-- Open Graph Tags -->
  <meta
    property="og:title"
    content="FAQ - Frequently Asked Questions | {siteConfig.name}"
  />
  <meta
    property="og:description"
    content="Temukan jawaban atas pertanyaan yang sering diajukan tentang Villana, platform eksplorasi villa terbaik di Indonesia."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={getAbsoluteUrl("/faq")} />
  <meta
    property="og:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />
  <meta
    property="og:image:width"
    content={`${siteConfig.openGraph.imageWidth}`}
  />
  <meta
    property="og:image:height"
    content={`${siteConfig.openGraph.imageHeight}`}
  />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content={siteConfig.twitter.cardType} />
  <meta
    name="twitter:title"
    content="FAQ - Frequently Asked Questions | {siteConfig.name}"
  />
  <meta
    name="twitter:description"
    content="Temukan jawaban atas pertanyaan yang sering diajukan tentang Villana, platform eksplorasi villa terbaik di Indonesia."
  />
  <meta
    name="twitter:image"
    content={getAbsoluteUrl(siteConfig.openGraph.defaultImage)}
  />

  <!-- Canonical URL -->
  <link rel="canonical" href={getAbsoluteUrl("/faq")} />

  <!-- Structured Data for FAQ -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSections.flatMap(section =>
      section.items.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    )
  })}</script>`}
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
              <span class="text-white">FAQ</span>
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

  <!-- Main Content -->
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Page Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
        Frequently Asked Questions
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Temukan jawaban atas pertanyaan yang sering diajukan tentang layanan
        Villana, platform eksplorasi villa terpercaya di Indonesia.
      </p>
    </div>

    <!-- FAQ Sections -->
    <div class="space-y-12">
      {#each faqSections as section, sectionIndex}
        <section
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div class="bg-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-semibold text-gray-900">
              {section.title}
            </h2>
          </div>

          <div class="divide-y divide-gray-200">
            {#each section.items as item, itemIndex}
              {@const itemId = `faq-${sectionIndex}-${itemIndex}`}
              <details class="group">
                <summary
                  class="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  aria-expanded="false"
                >
                  <h3 class="text-lg font-medium text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  <svg
                    class="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>

                <div class="px-6 pb-5 pt-5">
                  <div class="prose prose-gray max-w-none">
                    <p class="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </details>
            {/each}
          </div>
        </section>
      {/each}
    </div>

    <!-- Call to Action Section -->
    <div
      class="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg"
    >
      <div class="px-6 py-8 text-center">
        <h2 class="text-2xl font-bold text-white mb-4">
          Masih Ada Pertanyaan?
        </h2>
        <p class="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
          Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk
          menghubungi kami. Tim support Villana siap membantu Anda.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/explore"
            class="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
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
            href="/register"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Daftar Sekarang
          </a>
        </div>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-12 text-center">
      <p class="text-sm text-gray-500">
        Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  </main>
</div>
<Footer />

<style>
  /* Custom styles for better accordion interaction */
  details[open] summary {
    background-color: rgb(249 250 251); /* equivalent to bg-gray-50 */
  }

  details summary::-webkit-details-marker {
    display: none;
  }

  details summary::marker {
    content: none;
  }

  /* Smooth opening animation */
  details[open] > div {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Focus styles removed - using focus:outline-none in HTML */
</style>
