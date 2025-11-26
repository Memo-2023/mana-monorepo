<script lang="ts">
  // Typing indicator with animated dots
</script>

<div class="flex justify-start mb-4">
  <div
    class="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3"
  >
    <div class="flex items-center gap-1">
      <div
        class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style="animation-delay: 0ms"
      ></div>
      <div
        class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style="animation-delay: 150ms"
      ></div>
      <div
        class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
        style="animation-delay: 300ms"
      ></div>
    </div>
  </div>
</div>

<style>
  @keyframes bounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-4px);
    }
  }

  .animate-bounce {
    animation: bounce 1s infinite;
  }
</style>
