<script lang="ts">
  import { siteConfig } from "$lib/config/site";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { page } from "$app/stores";

  let user = $derived($page.data.user);

  // Detect if we're in an iframe (for modal display)
  let isInIframe = $state(false);

  $effect(() => {
    if (typeof window !== "undefined") {
      isInIframe = window.self !== window.top;
    }
  });
</script>

<svelte:head>
  <title>Syarat dan Ketentuan - {siteConfig.name}</title>
  <meta
    name="description"
    content="Syarat dan ketentuan penggunaan platform {siteConfig.name} - Pelajari hak dan kewajiban Anda sebagai pengguna."
  />
</svelte:head>

<!-- Only show navbar and footer if not in iframe -->
{#if !isInIframe}
  <Navbar {user} />
{/if}

<div class="bg-white">
  <div
    class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 {isInIframe
      ? 'py-4'
      : 'py-16'}"
  >
    <div class="prose prose-lg max-w-none pt-10">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Syarat dan Ketentuan
      </h1>

      <p class="mt-6 text-lg text-gray-600">
        Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div class="mt-10 space-y-8">
        <section>
          <h2 class="text-2xl font-semibold text-gray-900">1. Pendahuluan</h2>
          <p class="mt-4 text-gray-600">
            Selamat datang di Villana ("kami," "milik kami," atau "kita").
            Syarat dan Ketentuan ini mengatur penggunaan Anda atas platform
            eksplorasi vila kami. Dengan mengakses atau menggunakan layanan
            kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            2. Penerimaan Syarat
          </h2>
          <p class="mt-4 text-gray-600">
            Dengan membuat akun, mengakses, atau menggunakan platform Villana,
            Anda mengonfirmasi bahwa:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>
              Anda berusia minimal 18 tahun atau telah mendapat izin dari wali
              yang sah
            </li>
            <li>Anda memiliki kapasitas hukum untuk menerima syarat ini</li>
            <li>
              Anda akan mematuhi semua hukum dan peraturan yang berlaku di
              Indonesia
            </li>
            <li>Informasi yang Anda berikan adalah akurat dan terkini</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            3. Deskripsi Layanan
          </h2>
          <p class="mt-4 text-gray-600">
            Villana adalah platform online yang menyediakan informasi tentang
            villa dan akomodasi di Indonesia. Layanan kami meliputi:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>Pencarian dan penjelajahan informasi villa</li>
            <li>Perbandingan fasilitas dan harga antar villa</li>
            <li>Penyimpanan villa favorit dalam akun pengguna</li>
            <li>Informasi lokasi dan tempat menarik terdekat</li>
            <li>Konten dan ulasan tentang destinasi wisata</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">4. Akun Pengguna</h2>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Registrasi Akun
          </h3>
          <p class="mt-2 text-gray-600">
            Untuk menggunakan fitur tertentu, Anda perlu membuat akun dengan
            memberikan informasi yang akurat dan lengkap. Anda bertanggung jawab
            untuk menjaga keamanan akun dan kata sandi Anda.
          </p>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Kewajiban Pengguna
          </h3>
          <p class="mt-2 text-gray-600">
            Untuk menciptakan lingkungan yang aman dan nyaman, kami mengharapkan
            Anda:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>Menggunakan akun sesuai dengan tujuan yang sah dan legal</li>
            <li>
              Menjaga kerahasiaan akun dan tidak membagikannya dengan pihak lain
            </li>
            <li>
              Mengunggah konten yang sopan, relevan, dan sesuai dengan norma
              yang berlaku
            </li>
            <li>Mengakses sistem kami melalui cara yang telah disediakan</li>
            <li>
              Menggunakan platform secara manual tanpa bantuan bot atau
              automated tools
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            5. Penggunaan Platform
          </h2>

          <h3 class="text-xl font-medium text-gray-900 mt-6">Hak Penggunaan</h3>
          <p class="mt-2 text-gray-600">
            Kami memberikan Anda hak terbatas, non-eksklusif, dan tidak dapat
            dialihkan untuk menggunakan platform sesuai dengan Syarat dan
            Ketentuan ini.
          </p>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Pembatasan Penggunaan
          </h3>
          <p class="mt-2 text-gray-600">
            Untuk menjaga keamanan dan kenyamanan semua pengguna, harap tidak:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>
              Menyalin, memodifikasi, atau mendistribusikan konten tanpa izin
              yang sesuai
            </li>
            <li>
              Menggunakan platform untuk spam atau kegiatan komersial yang tidak
              pantas
            </li>
            <li>Mengganggu atau merusak fungsi normal platform</li>
            <li>
              Mengumpulkan data pengguna lain tanpa persetujuan yang diperlukan
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            6. Konten dan Hak Kekayaan Intelektual
          </h2>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Konten Milik Villana
          </h3>
          <p class="mt-2 text-gray-600">
            Konten yang dibuat oleh Villana, termasuk logo, desain interface,
            teks deskripsi platform, dan sistem P/V Ratio, dilindungi oleh hak
            cipta dan hukum kekayaan intelektual Indonesia. Penggunaan tanpa
            izin tertulis dari Villana tidak diperkenankan.
          </p>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Konten Pihak Ketiga
          </h3>
          <p class="mt-2 text-gray-600">
            Sebagian besar konten di platform kami, termasuk foto villa,
            deskripsi properti, dan informasi fasilitas, merupakan milik pemilik
            villa atau pihak ketiga yang bersangkutan. Villana menampilkan
            konten tersebut dalam rangka penyediaan layanan informasi. Hak cipta
            tetap berada pada pemilik aslinya.
          </p>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Konten Pengguna
          </h3>
          <p class="mt-2 text-gray-600">
            Dengan mengunggah konten (ulasan, foto, komentar), Anda memberikan
            Villana lisensi terbatas untuk menampilkan dan menggunakan konten
            tersebut dalam kaitannya dengan layanan platform kami. Anda tetap
            mempertahankan hak kepemilikan atas konten yang Anda unggah.
          </p>

          <h3 class="text-xl font-medium text-gray-900 mt-6">
            Pelaporan Pelanggaran Hak Cipta
          </h3>
          <p class="mt-2 text-gray-600">
            Jika Anda adalah pemilik hak cipta dan yakin bahwa konten Anda
            digunakan tanpa izin, silakan hubungi kami di legal@villana.com
            dengan menyertakan bukti kepemilikan yang memadai.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            7. Privasi dan Perlindungan Data
          </h2>
          <p class="mt-4 text-gray-600">
            Penggunaan informasi pribadi Anda diatur oleh <a
              href="/privacy"
              class="text-blue-600 hover:text-blue-500 underline"
              >Kebijakan Privasi</a
            > kami. Dengan menggunakan layanan ini, Anda setuju dengan pengumpulan
            dan penggunaan informasi sesuai kebijakan tersebut. Silakan baca Kebijakan
            Privasi kami untuk informasi lengkap tentang bagaimana kami mengelola
            data pribadi Anda.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            8. Informasi Villa dan Akurasi
          </h2>
          <p class="mt-4 text-gray-600">
            Kami berusaha menyediakan informasi yang akurat tentang villa dan
            fasilitas, namun:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>Informasi dapat berubah tanpa pemberitahuan sebelumnya</li>
            <li>Kami tidak bertanggung jawab atas ketidakakuratan informasi</li>
            <li>
              Pengguna disarankan untuk verifikasi langsung dengan pemilik villa
            </li>
            <li>Harga dan ketersediaan dapat berubah sewaktu-waktu</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            9. Pembatasan Tanggung Jawab
          </h2>
          <p class="mt-4 text-gray-600">
            Sejauh diizinkan oleh hukum yang berlaku, Villana tidak bertanggung
            jawab atas:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>
              Kerugian langsung atau tidak langsung dari penggunaan platform
            </li>
            <li>Gangguan layanan atau downtime platform</li>
            <li>Kehilangan data atau informasi</li>
            <li>Tindakan pihak ketiga (pemilik villa, dll.)</li>
            <li>Kerusakan yang timbul dari penggunaan yang tidak sesuai</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">10. Ganti Rugi</h2>
          <p class="mt-4 text-gray-600">
            Anda setuju untuk membebaskan, membela, dan mengganti rugi Villana
            dari segala klaim, kerugian, atau biaya yang timbul dari penggunaan
            platform Anda atau pelanggaran Syarat dan Ketentuan ini.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            11. Penangguhan dan Penghentian
          </h2>
          <p class="mt-4 text-gray-600">
            Kami berhak untuk menangguhkan atau menghentikan akun Anda jika:
          </p>
          <ul class="mt-2 list-disc list-inside text-gray-600 space-y-1">
            <li>Anda melanggar Syarat dan Ketentuan ini</li>
            <li>Terdapat dugaan aktivitas ilegal atau penyalahgunaan</li>
            <li>Diperlukan untuk pemeliharaan atau keamanan sistem</li>
            <li>Atas permintaan otoritas yang berwenang</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            12. Perubahan Syarat
          </h2>
          <p class="mt-4 text-gray-600">
            Kami dapat memperbarui Syarat dan Ketentuan ini dari waktu ke waktu.
            Perubahan akan diberi tahu melalui platform atau email. Penggunaan
            berkelanjutan setelah perubahan menunjukkan persetujuan Anda.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            13. Hukum yang Berlaku dan Penyelesaian Sengketa
          </h2>
          <p class="mt-4 text-gray-600">
            Syarat dan Ketentuan ini diatur oleh hukum Republik Indonesia.
            Setiap sengketa akan diselesaikan melalui pengadilan yang berwenang
            di Jakarta, Indonesia.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">14. Kontak</h2>
          <p class="mt-4 text-gray-600">
            Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini,
            silakan hubungi kami:
          </p>
          <div class="mt-4 text-gray-600">
            <p>Email: legal@villana.com</p>
            <p>Alamat: Jakarta, Indonesia</p>
            <p>
              Atau kunjungi halaman <a
                href="/contact-us"
                class="text-blue-600 hover:text-blue-500">Hubungi Kami</a
              >
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-900">
            15. Ketentuan Lain
          </h2>
          <p class="mt-4 text-gray-600">
            Jika ada bagian dari Syarat dan Ketentuan ini yang dianggap tidak
            berlaku, bagian lainnya akan tetap berlaku. Kegagalan kami untuk
            menegakkan hak tidak berarti kami melepaskan hak tersebut.
          </p>
        </section>
      </div>
    </div>
  </div>
</div>

{#if !isInIframe}
  <Footer {user} />
{/if}

