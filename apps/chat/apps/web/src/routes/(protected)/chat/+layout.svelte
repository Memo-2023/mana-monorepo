<script lang="ts">
	import { onMount } from 'svelte';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import ConversationList from '$lib/components/chat/ConversationList.svelte';

	let { children }: { children: any } = $props();
	let showSidebar = $state(true);

	onMount(async () => {
		if (authStore.user) {
			await conversationsStore.loadConversations(authStore.user.id);
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
		class="fixed bottom-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg
           sm:hidden hover:bg-blue-700 transition-colors"
		aria-label={showSidebar ? 'Seitenleiste schließen' : 'Seitenleiste öffnen'}
	>
		{#if showSidebar}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		{:else}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		{/if}
	</button>

	<!-- Sidebar -->
	<aside
		class="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
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
