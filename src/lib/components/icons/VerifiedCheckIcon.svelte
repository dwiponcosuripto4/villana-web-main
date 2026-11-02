<script lang="ts">
  export let size: number = 24;
  export let className: string = "h-5 w-5";
  export let strokeWidth: number = 1.2;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  class={`${className}`}
  width={`${size}`}
  height={`${size}`}
  viewBox="0 0 24 24"
  fill="currentColor"
>
  <path
    d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
    fill="currentColor"
  />
  <path
    d="m9 12 2 2 4-4"
    fill="none"
    stroke="white"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
