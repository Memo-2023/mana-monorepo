<script lang="ts">
  import { marked } from 'marked';
  import type { Message } from '@chat/types';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.sender === 'user');

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const htmlContent = $derived(
    isUser ? message.message_text : marked.parse(message.message_text)
  );

  const formattedTime = $derived(
    new Date(message.created_at).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
</script>

<div class="flex {isUser ? 'justify-end' : 'justify-start'} mb-4">
  <div
    class="max-w-[80%] rounded-2xl px-4 py-3 {isUser
      ? 'bg-blue-600 text-white rounded-br-md'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'}"
  >
    {#if isUser}
      <p class="whitespace-pre-wrap">{message.message_text}</p>
    {:else}
      <div class="prose prose-sm dark:prose-invert max-w-none">
        {@html htmlContent}
      </div>
    {/if}
    <div
      class="text-xs mt-1 {isUser
        ? 'text-blue-200'
        : 'text-gray-500 dark:text-gray-400'}"
    >
      {formattedTime}
    </div>
  </div>
</div>
