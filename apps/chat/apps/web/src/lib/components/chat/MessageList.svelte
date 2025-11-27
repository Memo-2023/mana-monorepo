<script lang="ts">
	import { onMount } from 'svelte';
	import type { Message } from '@chat/types';
	import MessageBubble from './MessageBubble.svelte';
	import TypingIndicator from './TypingIndicator.svelte';

	interface Props {
		messages: Message[];
		isTyping?: boolean;
	}

	let { messages, isTyping = false }: Props = $props();

	let containerEl: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when messages change
	$effect(() => {
		if (messages.length > 0 && containerEl) {
			scrollToBottom();
		}
	});

	function scrollToBottom() {
		if (containerEl) {
			containerEl.scrollTop = containerEl.scrollHeight;
		}
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div bind:this={containerEl} class="flex-1 overflow-y-auto px-4 py-6">
	{#if messages.length === 0}
		<div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
			<svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
			<p class="text-lg font-medium">Keine Nachrichten</p>
			<p class="text-sm">Starte eine Konversation!</p>
		</div>
	{:else}
		{#each messages as message (message.id)}
			<MessageBubble {message} />
		{/each}
		{#if isTyping}
			<TypingIndicator />
		{/if}
	{/if}
</div>
