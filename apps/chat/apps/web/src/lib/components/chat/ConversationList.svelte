<script lang="ts">
  import { page } from '$app/stores';
  import { conversationsStore } from '$lib/stores/conversations.svelte';
  import type { Conversation } from '@chat/types';

  interface Props {
    conversations: Conversation[];
    isLoading?: boolean;
  }

  let { conversations, isLoading = false }: Props = $props();

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  }

  function truncateTitle(title: string, maxLength: number = 30): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  }
</script>

<div class="flex flex-col h-full">
  <!-- New Chat Button -->
  <div class="p-3 border-b border-gray-200 dark:border-gray-700">
    <a
      href="/chat"
      class="flex items-center justify-center gap-2 w-full px-4 py-2.5
             bg-blue-600 hover:bg-blue-700 text-white rounded-lg
             font-medium transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Neuer Chat
    </a>
  </div>

  <!-- Conversation List -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-r-transparent rounded-full"></div>
      </div>
    {:else if conversations.length === 0}
      <div class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
        <p class="text-sm">Keine Konversationen</p>
        <p class="text-xs mt-1">Starte einen neuen Chat</p>
      </div>
    {:else}
      <div class="py-2">
        {#each conversations as conv (conv.id)}
          {@const isActive = $page.params.id === conv.id}
          <a
            href="/chat/{conv.id}"
            class="block px-3 py-2 mx-2 rounded-lg transition-colors
                   {isActive
                     ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                     : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">
                {truncateTitle(conv.title || 'Neue Konversation')}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                {formatDate(conv.updated_at || conv.created_at)}
              </span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
