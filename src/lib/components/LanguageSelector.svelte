<script lang="ts">
  import { languageStore } from '$lib/stores/language';
  import type { LocaleOption } from '$lib/stores/language';

  let {
    user = null,
    showLabels = true,
    size = 'normal',
    variant = 'select' // 'select' | 'radio' | 'buttons'
  }: {
    user?: any;
    showLabels?: boolean;
    size?: 'small' | 'normal' | 'large';
    variant?: 'select' | 'radio' | 'buttons';
  } = $props();

  let currentState = $state($languageStore);
  let isUpdating = $state(false);

  // Subscribe to language store updates
  $effect(() => {
    const unsubscribe = languageStore.subscribe((state) => {
      currentState = state;
    });

    return unsubscribe;
  });

  const options = [
    { value: 'auto', labelEn: 'Auto (Browser Default)', labelId: 'Otomatis (Sesuai Browser)' },
    { value: 'en', labelEn: 'English', labelId: 'English' },
    { value: 'id', labelEn: 'Bahasa Indonesia', labelId: 'Bahasa Indonesia' }
  ];

  async function handleLocaleChange(locale: LocaleOption) {
    if (isUpdating || locale === currentState.preference) return;

    isUpdating = true;
    console.log('Changing locale from', currentState.preference, 'to', locale);

    try {
      await languageStore.updatePreference(locale, user?.id);
    } catch (error) {
      console.error('Failed to update language preference:', error);
      // Show user-friendly error message
      alert('Failed to update language preference. Please try again.');
    } finally {
      isUpdating = false;
    }
  }

  // Size classes
  const sizeClasses = {
    small: {
      select: 'text-sm py-1 px-2',
      label: 'text-sm',
      radio: 'text-sm',
      button: 'text-sm px-3 py-1'
    },
    normal: {
      select: 'text-base py-2 px-3',
      label: 'text-base',
      radio: 'text-base',
      button: 'text-base px-4 py-2'
    },
    large: {
      select: 'text-lg py-3 px-4',
      label: 'text-lg',
      radio: 'text-lg',
      button: 'text-lg px-6 py-3'
    }
  };
</script>

{#if variant === 'select'}
  <!-- Dropdown Select -->
  <div class="language-selector">
    {#if showLabels}
      <label class="block {sizeClasses[size].label} font-medium text-gray-700 mb-2">
        {currentState.current === 'id' ? 'Bahasa' : 'Language'}
      </label>
    {/if}
    <select
      class="block w-full {sizeClasses[size].select} border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      value={currentState.preference}
      disabled={isUpdating}
      onchange={(e) => handleLocaleChange(e.target.value as LocaleOption)}
    >
      {#each options as option}
        <option value={option.value}>
          {currentState.current === 'id' ? option.labelId : option.labelEn}
        </option>
      {/each}
    </select>
  </div>

{:else if variant === 'radio'}
  <!-- Radio Buttons -->
  <div class="language-selector">
    {#if showLabels}
      <legend class="block {sizeClasses[size].label} font-medium text-gray-700 mb-3">
        {currentState.current === 'id' ? 'Bahasa' : 'Language'}
      </legend>
    {/if}
    <div class="space-y-2">
      {#each options as option}
        <label class="flex items-center cursor-pointer">
          <input
            type="radio"
            name="locale"
            value={option.value}
            checked={currentState.preference === option.value}
            disabled={isUpdating}
            onchange={() => handleLocaleChange(option.value as LocaleOption)}
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 disabled:cursor-not-allowed"
          />
          <span class="ml-3 {sizeClasses[size].radio} text-gray-700">
            {currentState.current === 'id' ? option.labelId : option.labelEn}
          </span>
        </label>
      {/each}
    </div>
  </div>

{:else if variant === 'buttons'}
  <!-- Button Group -->
  <div class="language-selector">
    {#if showLabels}
      <div class="block {sizeClasses[size].label} font-medium text-gray-700 mb-3">
        {currentState.current === 'id' ? 'Bahasa' : 'Language'}
      </div>
    {/if}
    <div class="flex flex-wrap gap-2">
      {#each options as option}
        <button
          type="button"
          disabled={isUpdating}
          onclick={() => handleLocaleChange(option.value as LocaleOption)}
          class="inline-flex items-center {sizeClasses[size].button} border font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 {
            currentState.preference === option.value
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }"
        >
          {currentState.current === 'id' ? option.labelId : option.labelEn}
          {#if isUpdating && currentState.preference === option.value}
            <svg class="ml-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Loading indicator when updating -->
{#if isUpdating}
  <div class="mt-2 flex items-center text-sm text-gray-500">
    <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    {currentState.current === 'id' ? 'Menyimpan...' : 'Saving...'}
  </div>
{/if}