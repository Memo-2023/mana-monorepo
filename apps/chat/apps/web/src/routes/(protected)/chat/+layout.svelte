<script lang="ts">
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import ConversationList from '$lib/components/chat/ConversationList.svelte';
	import { X, List } from '@manacore/shared-icons';

	let { children }: { children: any } = $props();
	let showSidebar = $state(true);

	// Wait for auth to be initialized before loading conversations
	$effect(() => {
		if (authStore.initialized && authStore.user) {
			conversationsStore.loadConversations(authStore.user.id);
		}
	});

	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
</script>

<div class="flex h-[calc(100vh-4rem)]">
	<!-- Sidebar Toggle (mobile) -->
	<button
		onclick={toggleSidebar}
		class="fixed bottom-4 left-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg
           sm:hidden hover:bg-primary/90 transition-colors"
		aria-label={showSidebar ? 'Seitenleiste schließen' : 'Seitenleiste öffnen'}
	>
		{#if showSidebar}
			<X size={24} weight="bold" />
		{:else}
			<List size={24} weight="bold" />
		{/if}
	</button>

	<!-- Sidebar -->
	<aside
		class="w-72 flex-shrink-0 bg-surface border-r border-border
           transition-transform duration-200 ease-in-out
           fixed sm:static inset-y-0 left-0 z-40 top-16
           {showSidebar
			? 'translate-x-0'
			: '-translate-x-full sm:translate-x-0 sm:w-0 sm:border-0'}"
	>
		<ConversationList
			conversations={conversationsStore.conversations}
			isLoading={conversationsStore.isLoading}
		/>
	</aside>

	<!-- Mobile Overlay -->
	{#if showSidebar}
		<button
			class="fixed inset-0 bg-black/50 z-30 sm:hidden"
			onclick={toggleSidebar}
			aria-label="Seitenleiste schließen"
		></button>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
