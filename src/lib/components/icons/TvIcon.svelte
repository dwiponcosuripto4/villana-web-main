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
  fill="none"
  stroke="currentColor"
  stroke-width={`${strokeWidth}`}
  stroke-linecap="round"
  stroke-linejoin="round"
  ><path d="m9 10 2 2 4-4" /><rect
    width="20"
    height="14"
    x="2"
    y="3"
    rx="2"
  /><path d="M12 17v4" /><path d="M8 21h8" /></svg
>
