<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import type { ChatMessage, ComparisonMessage } from '$lib/types';
	import MessageBubble from './MessageBubble.svelte';
	import ComparisonMessageBubble from './ComparisonMessageBubble.svelte';
	import { ChatCircle } from '@manacore/shared-icons';

	let scrollContainer: HTMLDivElement | undefined = $state();

	$effect(() => {
		// Scroll to bottom when messages change
		if (chatStore.messages.length && scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	});
</script>

<div bind:this={scrollContainer} class="flex-1 overflow-y-auto p-4">
	{#if chatStore.messages.length === 0}
		<div class="flex h-full flex-col items-center justify-center">
			<div class="mb-4 rounded-full p-4" style="background-color: var(--color-surface);">
				<ChatCircle size={20} />
			</div>
			<h2 class="mb-2 text-lg font-medium">Start a conversation</h2>
			<p class="max-w-md text-center text-sm" style="color: var(--color-text-muted);">
				Select a model from the sidebar and send a message to begin testing the mana-llm service.
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each chatStore.messages as message (message.id)}
				{#if message.role === 'comparison'}
					<ComparisonMessageBubble message={message as ComparisonMessage} />
				{:else}
					<MessageBubble message={message as ChatMessage} />
				{/if}
			{/each}
		</div>
	{/if}
</div>
