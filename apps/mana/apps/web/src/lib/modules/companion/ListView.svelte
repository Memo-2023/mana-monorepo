<!--
  Companion Chat — Workbench-embedded version.
  Auto-creates a conversation if none exists.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import CompanionChat from './components/CompanionChat.svelte';
	import { chatStore } from './stores/chat.svelte';
	import { useConversations } from './queries';
	import type { LocalConversation } from './types';

	const conversations = useConversations();
	let activeConversation = $state<LocalConversation | null>(null);

	$effect(() => {
		if (!activeConversation && conversations.value.length > 0) {
			activeConversation = conversations.value[0];
		}
	});

	onMount(async () => {
		// Auto-create if no conversation exists
		if (conversations.value.length === 0) {
			const conv = await chatStore.createConversation('Workbench Chat');
			activeConversation = conv;
		}
	});
</script>

<div class="companion-embed">
	{#if activeConversation}
		{#key activeConversation.id}
			<CompanionChat conversation={activeConversation} />
		{/key}
	{:else}
		<div class="loading">Lade Companion...</div>
	{/if}
</div>

<style>
	.companion-embed {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.loading {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}
</style>
