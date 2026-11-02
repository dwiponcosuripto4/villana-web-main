<script lang="ts">
  interface Props {
    currentPVR?: string;
    onClose: () => void;
  }

  let { currentPVR, onClose }: Props = $props();

  function getPVRClassification(pvr: number): {
    category: string;
    color: string;
    bgColor: string;
    range: string;
  } {
    if (pvr >= 0 && pvr <= 1.0) {
      return {
        category: "Mahal",
        color: "text-red-600",
        bgColor: "bg-red-100",
        range: "0.0 - 1.0",
      };
    } else if (pvr <= 1.8) {
      return {
        category: "Lumayan",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        range: "1.1 - 1.8",
      };
    } else if (pvr <= 2.0) {
      return {
        category: "Baik",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        range: "1.9 - 2.0",
      };
    } else if (pvr <= 2.4) {
      return {
        category: "Sebanding",
        color: "text-green-600",
        bgColor: "bg-green-100",
        range: "2.1 - 2.4",
      };
    } else if (pvr <= 2.7) {
      return {
        category: "Lebih Baik",
        color: "text-green-600",
        bgColor: "bg-green-100",
        range: "2.5 - 2.7",
      };
    } else {
      return {
        category: "Istimewa (nilai melebihi harga)",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        range: "2.8 +",
      };
    }
  }

  let currentPVRNumber = $derived(currentPVR ? parseFloat(currentPVR) : 0);
  let currentClassification = $derived(getPVRClassification(currentPVRNumber));

  const allClassifications = [
    {
      category: "Mahal",
      color: "text-red-600",
      bgColor: "bg-red-100",
      range: "0.0 - 1.0",
      description: "Harga relatif tinggi dibanding nilai yang didapat",
    },
    {
      category: "Lumayan",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      range: "1.1 - 1.8",
      description: "Harga masih masuk akal untuk nilai yang didapat",
    },
    {
      category: "Baik",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      range: "1.9 - 2.0",
      description: "Nilai yang diberikan cukup sebanding dengan harganya",
    },
    {
      category: "Sebanding",
      color: "text-green-600",
      bgColor: "bg-green-100",
      range: "2.1 - 2.4",
      description: "Nilai yang diberikan sebanding dengan harganya",
    },
    {
      category: "Lebih Baik",
      color: "text-green-600",
      bgColor: "bg-green-100",
      range: "2.5 - 2.7",
      description: "Nilai yang diberikan lebih baik dari harganya",
    },
    {
      category: "Istimewa",
      color: "text-cyan-700",
      bgColor: "bg-cyan-200",
      range: "2.8 +",
      description: "Nilai yang diberikan melebihi harganya",
    },
  ];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  function handleBackdropClick() {
    onClose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="bg-gray-600/75 fixed inset-0 z-50 flex items-center justify-center md:p-2 lg:p-4 w-full"
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="pvr-modal-title"
>
  <div
    class="relative h-full w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="sticky top-0 z-10 border-b bg-white px-6 py-4">
      <div class="flex items-center justify-between">
        <h2 id="pvr-modal-title" class="text-2xl font-bold text-gray-900">
          Apa itu P/V Ratio?
        </h2>
        <button
          onclick={onClose}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="overflow-y-auto max-h-[90vh] px-6 py-6">
      <!-- Illustration -->
      <div class="mb-6 flex justify-center">
        <img
          src="/images/pvr-illustration.png"
          alt="P/V Ratio Illustration"
          class="max-w-full h-auto"
          style="max-height: 300px;"
        />
      </div>

      <!-- Definition -->
      <div class="mb-6">
        <p class="text-gray-700 leading-relaxed">
          <strong>Price-to-Value Ratio (P/V Ratio)</strong> adalah rasio yang menunjukkan
          seberapa sebanding harga villa dengan nilai yang didapatkan. Semakin tinggi
          rasio ini, semakin besar nilai yang diterima dibanding harga yang dibayar.
        </p>
      </div>

      <!-- Calculation Factors -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Faktor Perhitungan:
        </h3>
        <div class="space-y-3">
          <div class="flex items-start space-x-3">
            <div
              class="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-3 h-3 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">
                Fasilitas & Amenitas Villa
              </p>
              <p class="text-sm text-gray-600">
                Kolam renang, dapur, AC, TV, WiFi, dan fasilitas lainnya
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <div
              class="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-3 h-3 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">Harga</p>
              <p class="text-sm text-gray-600">
                Harga villa dibandingkan dengan rata-rata harga di area
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <div
              class="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-3 h-3 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">
                Rating Google & Jumlah Review
              </p>
              <p class="text-sm text-gray-600">
                Rating dari pengguna dan jumlah ulasan yang diterima
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Classification Scale -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Skala Klasifikasi P/V Ratio:
        </h3>
        <div class="space-y-3">
          {#each allClassifications as classification, index}
            <div
              class={`p-4 rounded-lg border-2 transition-all ${
                currentPVR &&
                classification.range === currentClassification.range
                  ? "border-blue-400 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <span
                    class="text-sm bg-gray-300 font-semibold text-gray-600 p-1 px-2 rounded-l-xl"
                  >
                    {classification.range}
                  </span>
                  <span
                    class={`inline-flex items-center px-3 py-1 rounded-r-xl text-sm font-medium ${classification.color} ${classification.bgColor}`}
                  >
                    {classification.category}
                  </span>
                  {#if currentPVR && classification.range === currentClassification.range}
                    <span class="text-blue-600 font-medium text-sm ml-2">
                      ← Villa ini</span
                    >
                  {/if}
                </div>
              </div>
              <p class="text-sm text-gray-600">
                {classification.description}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <!-- Additional Info -->
      <div class="bg-gray-100 rounded-lg p-4 mb-6">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 mb-1">
              Catatan Penting
            </p>
            <p class="text-sm text-gray-700">
              P/V Ratio dihitung secara objektif berdasarkan data fasilitas,
              rating, dan harga. Pertimbangkan juga preferensi pribadi Anda
              dalam memilih villa.
            </p>
          </div>
        </div>
      </div>

      <!-- Cool Button -->
      <div class="flex justify-center">
        <button
          onclick={onClose}
          class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</div>
