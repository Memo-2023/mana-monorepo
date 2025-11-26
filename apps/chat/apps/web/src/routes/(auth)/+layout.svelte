<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
  <div class="w-full max-w-md">
    {@render children()}
  </div>
</div>
