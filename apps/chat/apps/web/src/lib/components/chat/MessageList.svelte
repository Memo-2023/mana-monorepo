<script lang="ts">
	import { onMount } from 'svelte';
	import type { Message } from '@chat/types';
	import MessageBubble from './MessageBubble.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import { ChatCircleDots } from '@manacore/shared-icons';

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
			<ChatCircleDots size={64} weight="light" class="mb-4 opacity-50" />
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
