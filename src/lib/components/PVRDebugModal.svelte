<script lang="ts">
  interface Props {
    show?: boolean;
    debugData?: any;
    loading?: boolean;
  }

  let {
    show = $bindable(false),
    debugData = null,
    loading = false
  }: Props = $props();

  let dialogEl: HTMLDialogElement;
  let copiedToClipboard = $state(false);

  // Local editable facility score values
  let editableFacilityDetails = $state<any>({});
  let isEditing = $state(false);

  // Watch for debugData changes to initialize editable values
  $effect(() => {
    if (debugData?.facilityScore?.details) {
      editableFacilityDetails = { ...debugData.facilityScore.details };
    }
  });

  // Function to calculate updated values
  function calculateUpdatedValues() {
    if (!debugData || Object.keys(editableFacilityDetails).length === 0) {
      return null;
    }

    // Calculate new facility score
    const facilitySum = Object.values(editableFacilityDetails).reduce((acc: number, val: any) => {
      // Handle both string and number inputs from form fields
      let numVal: number;
      if (typeof val === 'string') {
        numVal = val === '' ? 0 : parseFloat(val);
      } else {
        numVal = val;
      }

      const validNum = (!isNaN(numVal) && isFinite(numVal)) ? numVal : 0;
      return acc + validNum;
    }, 0);

    if (isNaN(facilitySum) || !isFinite(facilitySum)) {
      return null;
    }

    const maxScore = debugData.facilityScore?.maxScore || 26;
    const facilityScore = facilitySum / maxScore;

    // Use original rating data
    const normalizedRating = debugData.rating?.normalizedRating || 0;

    // Use original price data
    const adjustedPrice = debugData.price?.adjustedPrice || 1;

    if (!normalizedRating || !adjustedPrice || adjustedPrice <= 0) {
      return null;
    }

    // Calculate new PVR
    const priceSensitivity = debugData.pvrCalculation?.priceSensitivity || 1.65;
    const numerator = facilityScore * normalizedRating;
    const denominator = priceSensitivity * Math.log(adjustedPrice);

    if (denominator === 0 || !isFinite(denominator)) {
      return null;
    }

    const pvrScore = (10 * numerator) / denominator;
    const finalPVR = Math.ceil(pvrScore * 100) / 100;

    const result = {
      facilitySum,
      facilityScore,
      numerator,
      denominator,
      pvrScore,
      finalPVR,
      steps: [
        `Numerator = F × R = ${facilityScore.toFixed(3)} × ${normalizedRating.toFixed(3)} = ${numerator.toFixed(3)}`,
        `Denominator = ${priceSensitivity} × ln(${adjustedPrice}) = ${priceSensitivity} × ${Math.log(adjustedPrice).toFixed(3)} = ${denominator.toFixed(3)}`,
        `PVR = 10 × ${numerator.toFixed(3)} / ${denominator.toFixed(3)} = ${pvrScore.toFixed(3)}`,
        `Final PVR (rounded up) = ${finalPVR}`
      ]
    };

    return result;
  }

  // Use $derived with the function
  let updatedCalculations = $derived(isEditing ? calculateUpdatedValues() : null);

  function toggleEditing() {
    isEditing = !isEditing;
    if (!isEditing && debugData?.facilityScore?.details) {
      // Reset to original values when canceling edit
      editableFacilityDetails = { ...debugData.facilityScore.details };
    }
  }


  $effect(() => {
    if (show && dialogEl) {
      dialogEl.showModal();
    } else if (!show && dialogEl) {
      dialogEl.close();
    }
  });

  function closeModal() {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    const rect = dialogEl.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      closeModal();
    }
  }

  async function copyToClipboard() {
    if (!debugData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
      copiedToClipboard = true;
      setTimeout(() => {
        copiedToClipboard = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function formatNumber(num: any): string {
    if (typeof num === 'number') {
      return num.toFixed(3);
    }
    return String(num);
  }
</script>

<dialog
  bind:this={dialogEl}
  class="rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
  onclick={handleBackdropClick}
>
  <div class="bg-white p-6 overflow-y-auto max-h-[90vh]">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">PVR Calculation Debug</h2>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={toggleEditing}
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {isEditing ? 'Reset' : 'Edit Values'}
        </button>
        <button
          type="button"
          onclick={copyToClipboard}
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {copiedToClipboard ? 'Copied!' : 'Copy JSON'}
        </button>
        <button
          type="button"
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    {:else if debugData?.error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{debugData.error}</p>
        {#if debugData.priceMin !== undefined}
          <p class="text-sm text-red-600 mt-2">
            Price Min: {debugData.priceMin}, Price Max: {debugData.priceMax}
          </p>
        {/if}
      </div>
    {:else if debugData}
      <div class="space-y-6">
        <!-- Villa Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-2">Villa Information</h3>
          <p class="text-sm text-gray-600">ID: {debugData.villaId}</p>
          <p class="text-sm text-gray-600">Title: {debugData.villaTitle}</p>
          <p class="text-sm text-gray-600">Current PVR: <span class="font-bold">{debugData.currentPVR}</span></p>
        </div>

        <!-- Facility Score -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-2">
            Facility Score (F)
            {#if isEditing}
              <span class="text-sm font-normal text-gray-600">(Editable - changes are local only)</span>
            {/if}
          </h3>
          <p class="text-sm text-gray-600 mb-3">Formula: {debugData.facilityScore.formula}</p>

          <div class="grid grid-cols-2 gap-2 mb-3">
            {#each Object.entries(editableFacilityDetails) as [key, value]}
              {#if value !== undefined && value !== null}
                <div class="text-sm flex items-center justify-between">
                  <span class="font-medium capitalize">{key}:</span>
                  {#if isEditing}
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="1"
                      value={editableFacilityDetails[key] ?? 0}
                      oninput={(e) => {
                        const target = e.target as HTMLInputElement;
                        const newValue = target.value === '' ? 0 : parseFloat(target.value);
                        const validValue = isNaN(newValue) ? 0 : newValue;

                        // Create a new object to trigger reactivity
                        editableFacilityDetails = {
                          ...editableFacilityDetails,
                          [key]: validValue
                        };
                      }}
                      class="w-16 px-2 py-1 text-blue-700 font-mono border rounded text-center"
                    />
                  {:else}
                    <span class="text-blue-700 font-mono">{value}</span>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>

          <div class="border-t pt-3">
            {#if isEditing && updatedCalculations}
              <p class="text-sm">
                Sum: <span class="font-mono text-blue-700">{updatedCalculations.facilitySum}</span> /
                <span class="font-mono">{debugData.facilityScore?.maxScore || 26}</span> =
                <span class="font-bold text-blue-700">{formatNumber(updatedCalculations.facilityScore)}</span>
                <span class="text-green-600 font-semibold ml-2">← Updated</span>
              </p>
            {:else}
              <p class="text-sm">
                Sum: <span class="font-mono text-blue-700">{debugData.facilityScore.sum}</span> /
                <span class="font-mono">{debugData.facilityScore.maxScore}</span> =
                <span class="font-bold text-blue-700">{formatNumber(debugData.facilityScore.score)}</span>
              </p>
            {/if}
          </div>
        </div>

        <!-- Rating Normalization -->
        <div class="bg-green-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-2">Rating Normalization (R)</h3>
          <p class="text-sm text-gray-600 mb-3">Formula: {debugData.rating.formula}</p>

          <div class="space-y-2">
            <p class="text-sm">Google Rating: <span class="font-mono text-green-700">{debugData.rating.googleRating}</span></p>
            <p class="text-sm">Rating Count: <span class="font-mono text-green-700">{debugData.rating.googleRatingCount}</span></p>
            <p class="text-sm font-mono bg-white p-2 rounded">{debugData.rating.calculation}</p>
            <p class="text-sm">Normalized Rating: <span class="font-bold text-green-700">{formatNumber(debugData.rating.normalizedRating)}</span></p>
          </div>
        </div>

        <!-- Price Calculation -->
        <div class="bg-yellow-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-2">Price Calculation (P)</h3>
          <p class="text-sm text-gray-600 mb-3">Formula: {debugData.price.formula}</p>

          <div class="space-y-2">
            <p class="text-sm">Price Range: <span class="font-mono text-yellow-700">{debugData.price.priceMin} - {debugData.price.priceMax}</span></p>
            <p class="text-sm font-mono bg-white p-2 rounded">{debugData.price.calculation}</p>
            <p class="text-sm">Adjusted Price: <span class="font-bold text-yellow-700">{debugData.price.adjustedPrice}</span></p>
          </div>
        </div>

        <!-- PVR Calculation -->
        <div class="bg-purple-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-2">
            PVR Calculation
            {#if isEditing && updatedCalculations}
              <span class="text-sm font-normal text-gray-600">(Updated based on edited values)</span>
            {/if}
          </h3>
          <p class="text-sm text-gray-600 mb-3">Formula: {debugData.pvrCalculation.formula}</p>

          <div class="space-y-2">
            <p class="text-sm">Price Sensitivity: <span class="font-mono text-purple-700">{debugData.pvrCalculation.priceSensitivity}</span></p>

            {#if isEditing && updatedCalculations}
              <p class="text-sm font-mono bg-white p-2 rounded border-l-4 border-green-500">
                PVR = 10 × ({formatNumber(updatedCalculations.facilityScore)} × {formatNumber(debugData.rating.normalizedRating)}) / ({debugData.pvrCalculation.priceSensitivity} × ln({debugData.price.adjustedPrice}))
                <span class="text-green-600 font-semibold ml-2">← Updated</span>
              </p>
            {:else}
              <p class="text-sm font-mono bg-white p-2 rounded">{debugData.pvrCalculation.calculation}</p>
            {/if}

            <div class="mt-3 space-y-1">
              <p class="text-sm font-semibold">Step-by-step:</p>
              {#if isEditing && updatedCalculations}
                {#each updatedCalculations.steps as step}
                  <p class="text-sm font-mono bg-white p-2 rounded border-l-4 border-green-500">
                    {step}
                    <span class="text-green-600 font-semibold ml-2">← Updated</span>
                  </p>
                {/each}
              {:else}
                {#each debugData.pvrCalculation.steps as step}
                  <p class="text-sm font-mono bg-white p-2 rounded">{step}</p>
                {/each}
              {/if}
            </div>

            <div class="border-t pt-3 mt-3">
              {#if isEditing && updatedCalculations}
                <div class="space-y-2">
                  <p class="text-lg font-bold">
                    Original PVR: <span class="text-purple-700">{debugData.pvrCalculation.finalPVR}</span>
                  </p>
                  <p class="text-lg font-bold">
                    Updated PVR: <span class="text-green-700">{updatedCalculations.finalPVR}</span>
                    <span class="text-green-600 font-semibold ml-2">← New Result</span>
                  </p>
                  <p class="text-sm text-gray-600">
                    Difference: <span class="font-mono">
                      {updatedCalculations.finalPVR > debugData.pvrCalculation.finalPVR ? '+' : ''}{(updatedCalculations.finalPVR - debugData.pvrCalculation.finalPVR).toFixed(2)}
                    </span>
                  </p>
                </div>
              {:else}
                <p class="text-lg font-bold">
                  Final PVR: <span class="text-purple-700">{debugData.pvrCalculation.finalPVR}</span>
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-gray-500 text-center py-8">No debug data available</p>
    {/if}

    <div class="mt-6 flex justify-end">
      <button
        type="button"
        onclick={closeModal}
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Close
      </button>
    </div>
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
</style>