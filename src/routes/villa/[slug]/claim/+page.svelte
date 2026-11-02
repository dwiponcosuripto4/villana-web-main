<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";
  import Footer from "$lib/components/Footer.svelte";
  import TurnstileWidget from "$lib/components/auth/TurnstileWidget.svelte";

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let isSubmitting = $state(false);
  let claimReason = $state(form?.values?.claimReason || "");
  let additionalInfo = $state(form?.values?.additionalInfo || "");
  let turnstileToken = $state("");
  let turnstileWidget: TurnstileWidget;

  function handleTurnstileToken(token: string) {
    turnstileToken = token;
  }

  function handleTurnstileError() {
    turnstileToken = "";
  }

  function resetTurnstile() {
    if (turnstileWidget) {
      turnstileWidget.reset();
    }
    turnstileToken = "";
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "appealed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "pending":
        return "Menunggu Review";
      case "under_review":
        return "Sedang Direview";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      case "appealed":
        return "Dalam Banding";
      default:
        return status;
    }
  }

  function maskPhoneNumber(phone: string | null): string {
    if (!phone) return "Tidak tersedia";
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (normalizedPhone.length <= 6) return normalizedPhone;
    let start = normalizedPhone.slice(0, 5);
    if (normalizedPhone.startsWith("+")) {
      start = normalizedPhone.slice(0, 6);
    }
    const end = normalizedPhone.slice(-2);
    const masked = "*".repeat(
      normalizedPhone.length - start.length - end.length,
    );
    return `${start}${masked}${end}`;
  }
</script>

<svelte:head>
  <title>Klaim Villa - {data.villa.title} | {siteConfig.name}</title>
  <meta
    name="description"
    content="Klaim kepemilikan villa {data.villa
      .title}. Verifikasi kepemilikan Anda dan kelola villa melalui dashboard owner."
  />

  <!-- Open Graph Tags -->
  <meta
    property="og:title"
    content="Klaim Villa - {data.villa.title} | {siteConfig.name}"
  />
  <meta
    property="og:description"
    content="Klaim kepemilikan villa {data.villa
      .title}. Verifikasi kepemilikan Anda dan kelola villa melalui dashboard owner."
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:url"
    content={getAbsoluteUrl(`/villa/${data.villa.slug}/claim`)}
  />

  <!-- Canonical URL -->
  <link
    rel="canonical"
    href={getAbsoluteUrl(`/villa/${data.villa.slug}/claim`)}
  />
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
              <a href="/villa/{data.villa.slug}" class="hover:text-white"
                >{data.villa.title}</a
              >
              <svg class="mx-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-white">Klaim Villa</span>
            </div>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <a
            href="/villa/{data.villa.slug}"
            class="inline-flex items-center px-3 py-1.5 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
          >
            Kembali ke Villa
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Page Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
        Klaim Kepemilikan Villa
      </h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Klaim villa <strong>{data.villa.title}</strong> sebagai milik Anda.
      </p>
    </div>

    {#if data.isOwner}
      <!-- Already Owner -->
      <div
        class="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <div class="flex justify-center mb-4">
          <svg
            class="h-12 w-12 text-green-500"
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
        <h2 class="text-xl font-semibold text-green-800 mb-2">
          Anda sudah menjadi owner villa ini!
        </h2>
        <p class="text-green-700 mb-6">
          Villa ini sudah terdaftar atas nama Anda. Anda dapat mengelolanya
          melalui dashboard owner.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/dashboard/villas"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Buka Dashboard Owner
          </a>
          <a
            href="/villa/{data.villa.slug}"
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Kembali ke Villa
          </a>
        </div>
      </div>
    {:else if !data.isClaimable}
      <!-- Villa Already Owned -->
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="flex justify-center mb-4">
          <svg
            class="h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-red-800 mb-2">
          Villa Sudah Diklaim
        </h2>
        <p class="text-red-700 mb-6">
          Villa ini sudah diklaim oleh owner lain. Jika Anda merasa ini adalah
          kesalahan, silakan hubungi tim support kami.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/villa/{data.villa.slug}/report"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Laporkan Masalah
          </a>
          <a
            href="/villa/{data.villa.slug}"
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Kembali ke Villa
          </a>
        </div>
      </div>
    {:else if data.hasClaim}
      <!-- Has Existing Claim -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <svg
              class="h-12 w-12 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            Klaim Sudah Diajukan
          </h2>
          <div
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(
              data.claimStatus || '',
            )}"
          >
            {getStatusText(data.claimStatus || "")}
          </div>
        </div>

        <div class="prose max-w-none text-gray-700 text-center">
          {#if data.claimStatus === "pending"}
            <p>
              Klaim Anda sedang menunggu review dari tim admin. Kami akan
              mengirimkan notifikasi melalui WhatsApp setelah klaim direview.
            </p>
            <p>
              Anda dapat melihat dan memonitor status klaim melalui dashboard.
            </p>
          {:else if data.claimStatus === "under_review"}
            <p>
              Klaim Anda sedang dalam proses review oleh tim admin. Mohon tunggu
              hingga proses selesai.
            </p>
          {:else if data.claimStatus === "rejected"}
            <p>
              Klaim Anda ditolak. Anda dapat mengajukan klaim baru dengan bukti
              kepemilikan yang lebih lengkap.
            </p>
          {/if}
        </div>

        <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/dashboard/villas"
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Ke Dashboard
          </a>
          <a
            href="/villa/{data.villa.slug}"
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Kembali ke Villa
          </a>
        </div>
      </div>
    {:else}
      <!-- Claim Form -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {#if form?.success}
          <!-- Success Message -->
          <div
            class="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center"
          >
            <div class="flex justify-center mb-4">
              <svg
                class="h-12 w-12 text-green-500"
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
            <h3 class="text-lg font-semibold text-green-800 mb-2">
              Klaim Berhasil Diajukan!
            </h3>
            <p class="text-green-700 mb-4">{form.message}</p>

            <!-- Verification Code Display -->
            <div class="mt-4 p-4 bg-white border-2 border-green-300 rounded-lg">
              <p class="text-sm text-gray-600 mb-2">Kode Verifikasi Anda:</p>
              <p class="text-3xl font-bold text-green-700 tracking-widest">
                {form.verificationCode}
              </p>
              <p class="text-xs text-gray-500 mt-2">
                Simpan kode ini! Sebutkan kode saat tim kami menghubungi nomor
                villa <strong>{maskPhoneNumber(data.villa.phoneNumber)}</strong>
              </p>
            </div>

            <div class="mt-6 flex justify-center">
              <a
                href="/dashboard/villas"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Ke Dashboard
              </a>
            </div>
          </div>
        {:else}
          <!-- Claim Form -->
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              Formulir Klaim Kepemilikan
            </h2>

            <!-- Villa Phone Number Display -->
            <div
              class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <svg
                    class="h-8 w-8 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-indigo-700">
                    Nomor Telepon Villa untuk Verifikasi:
                  </p>
                  <p class="text-xl font-bold text-indigo-900">
                    {maskPhoneNumber(data.villa.phoneNumber)}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-blue-800">
                    Proses Verifikasi
                  </h3>
                  <div class="mt-2 text-sm text-blue-700">
                    <ul class="list-disc list-inside space-y-1">
                      <li>
                        Setelah mengajukan klaim, Anda akan menerima <strong
                          >kode verifikasi 5 digit</strong
                        >
                      </li>
                      <li>
                        Tim kami akan menghubungi nomor telepon villa di atas
                        melalui telepon atau WhatsApp
                      </li>
                      <li>
                        Sebutkan kode verifikasi saat dihubungi untuk
                        membuktikan kepemilikan
                      </li>
                      <li>
                        Pastikan Anda memiliki akses ke nomor telepon villa
                        tersebut
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {#if form?.error}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg
                    class="h-5 w-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error</h3>
                  <div class="mt-2 text-sm text-red-700">
                    <p>{form.error}</p>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <form
            method="POST"
            action="?/submitClaim"
            use:enhance={() => {
              isSubmitting = true;
              return async ({ update }) => {
                await update();
                isSubmitting = false;
              };
            }}
            class="space-y-6"
          >
            <div>
              <label
                for="claimReason"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Alasan Klaim Kepemilikan <span class="text-red-500">*</span>
              </label>
              <textarea
                id="claimReason"
                name="claimReason"
                bind:value={claimReason}
                rows="4"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Jelaskan mengapa Anda mengklaim villa ini. Misalnya: 'Saya adalah pemilik villa ini berdasarkan sertifikat kepemilikan No. XXX yang diterbitkan pada tanggal XXX...'"
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                Minimum 10 karakter. Berikan penjelasan yang detail dan jelas.
              </p>
            </div>

            <div>
              <label
                for="additionalInfo"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Informasi Tambahan
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                bind:value={additionalInfo}
                rows="3"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Informasi tambahan yang mendukung klaim Anda. Misalnya: sejak kapan Anda memiliki villa, riwayat pengelolaan, dll."
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                Informasi tambahan yang dapat membantu proses verifikasi.
              </p>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2">
                Ketentuan Klaim:
              </h4>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>
                  • Anda menyatakan bahwa Anda memiliki akses ke nomor telepon
                  villa
                </li>
                <li>
                  • Tim kami akan menghubungi nomor villa untuk verifikasi kode
                </li>
                <li>• Proses verifikasi dapat memakan waktu 3-5 hari kerja</li>
                <li>
                  • Klaim yang terbukti palsu akan ditolak dan akun dapat
                  diblokir
                </li>
              </ul>
            </div>

            <!-- Turnstile Captcha -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Verifikasi Keamanan <span class="text-red-500">*</span>
              </label>
              <div class="flex justify-center">
                <TurnstileWidget
                  bind:this={turnstileWidget}
                  siteKey={data.turnstileSiteKey}
                  onToken={handleTurnstileToken}
                  onError={handleTurnstileError}
                  onExpired={handleTurnstileError}
                />
              </div>
              <p class="mt-2 text-sm text-gray-500 text-center">
                Mohon selesaikan verifikasi keamanan untuk melanjutkan
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-end pt-6">
              <a
                href="/villa/{data.villa.slug}"
                class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Batal
              </a>
              <button
                type="submit"
                disabled={isSubmitting ||
                  !claimReason ||
                  claimReason.trim().length < 10 ||
                  !turnstileToken}
                class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {#if isSubmitting}
                  <svg
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Mengajukan Klaim...
                {:else}
                  Ajukan Klaim
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>
    {/if}
  </main>
</div>
<Footer />
