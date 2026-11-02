<script lang="ts">
  interface Option {
    id: string | number;
    label: string;
    value?: any;
  }

  interface Props {
    options: Option[];
    placeholder?: string;
    searchFunction?: (query: string) => Promise<Option[]>;
    onSelect: (option: Option | null) => void;
    selectedValue?: string | number | null;
    className?: string;
    disabled?: boolean;
    required?: boolean;
  }

  let {
    options = [],
    placeholder = "Search...",
    searchFunction,
    onSelect,
    selectedValue = null,
    className = "",
    disabled = false,
    required = false
  }: Props = $props();

  let inputValue = $state("");
  let filteredOptions = $state<Option[]>([]);
  let isOpen = $state(false);
  let selectedIndex = $state(-1);
  let inputElement: HTMLInputElement;
  let dropdownElement: HTMLDivElement;
  let isSearching = $state(false);

  // Track selected option
  let selectedOption = $state<Option | null>(null);

  // Update input value when selectedValue changes externally
  $effect(() => {
    if (selectedValue) {
      const option = options.find(opt => opt.id === selectedValue);
      if (option) {
        selectedOption = option;
        inputValue = option.label;
      }
    } else {
      selectedOption = null;
      inputValue = "";
    }
  });

  // Filter options based on input
  $effect(async () => {
    if (inputValue.trim() === "") {
      filteredOptions = options.slice(0, 10); // Show first 10 when empty
      isSearching = false;
      return;
    }

    if (searchFunction) {
      isSearching = true;
      try {
        filteredOptions = await searchFunction(inputValue);
      } catch (error) {
        console.error("Search error:", error);
        filteredOptions = [];
      } finally {
        isSearching = false;
      }
    } else {
      // Local filtering
      filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
    }

    selectedIndex = -1;
    isOpen = true;
  });

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;

    // Clear selection if input doesn't match selected option
    if (selectedOption && inputValue !== selectedOption.label) {
      selectedOption = null;
      onSelect(null);
    }
  }

  function selectOption(option: Option) {
    selectedOption = option;
    inputValue = option.label;
    isOpen = false;
    selectedIndex = -1;
    onSelect(option);
    inputElement.blur();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        isOpen = true;
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
        scrollToSelected();
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        scrollToSelected();
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          selectOption(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        isOpen = false;
        selectedIndex = -1;
        inputElement.blur();
        break;
    }
  }

  function scrollToSelected() {
    if (selectedIndex >= 0 && dropdownElement) {
      const selectedElement = dropdownElement.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (inputElement && !inputElement.contains(event.target as Node) &&
        dropdownElement && !dropdownElement.contains(event.target as Node)) {
      isOpen = false;
      selectedIndex = -1;
    }
  }

  // Close dropdown when clicking outside
  $effect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<div class="relative">
  <input
    bind:this={inputElement}
    type="text"
    value={inputValue}
    oninput={handleInput}
    onkeydown={handleKeydown}
    onfocus={() => isOpen = true}
    {placeholder}
    {disabled}
    {required}
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 {className}"
    autocomplete="off"
  />

  {#if isOpen && (filteredOptions.length > 0 || isSearching)}
    <div
      bind:this={dropdownElement}
      class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
    >
      {#if isSearching}
        <div class="px-3 py-2 text-sm text-gray-500 flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
          Searching...
        </div>
      {:else if filteredOptions.length === 0}
        <div class="px-3 py-2 text-sm text-gray-500">
          No results found
        </div>
      {:else}
        {#each filteredOptions as option, index}
          <button
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm {
              index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
            }"
            onclick={() => selectOption(option)}
          >
            {option.label}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>