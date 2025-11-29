<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { isSidebarMode, isNavCollapsed } from '$lib/stores/navigation';
	import { MagnifyingGlass, X, Plus, ChatCircle } from '@manacore/shared-icons';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Resizer state
	let leftColumnWidth = $state(320);
	let isResizing = $state(false);
	const MIN_WIDTH = 260;
	const MAX_WIDTH = 450;

	// Search state
	let searchQuery = $state('');

	// Get conversations from store
	let conversations = $derived(conversationsStore.conversations);
	let isLoading = $derived(conversationsStore.isLoading);

	// Filtered conversations based on search
	let filteredConversations = $derived(
		searchQuery.trim()
			? conversations.filter((conv) =>
					conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: conversations
	);

	// Resizer handlers
	function startResize(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = e.clientX;
		if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
			leftColumnWidth = newWidth;
		}
	}

	function stopResize() {
		isResizing = false;
	}

	// Load conversations on mount
	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', stopResize);

		if (authStore.user) {
			conversationsStore.loadConversations(authStore.user.id);
		}
	});

	onDestroy(() => {
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', stopResize);
	});

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

	function getPreview(title: string | undefined): string {
		if (!title) return 'Neue Konversation';
		return title.length > 60 ? title.substring(0, 60) + '...' : title;
	}

	// Check if current conversation is active
	function isActive(convId: string): boolean {
		return $page.params.id === convId;
	}
</script>

<div
	class="flex w-full gap-0 overflow-hidden"
	class:h-screen={$isNavCollapsed || $isSidebarMode}
	class:h-[calc(100vh-5rem)]={!$isNavCollapsed && !$isSidebarMode}
>
	<!-- Left Column: Conversation List -->
	<div
		class="relative flex flex-shrink-0 flex-col bg-muted/30 border-r border-border"
		style="width: {leftColumnWidth}px;"
	>
		<!-- Search Bar -->
		<div class="px-3 py-3 border-b border-border">
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Konversationen durchsuchen..."
					class="w-full rounded-xl border border-border bg-white/70 dark:bg-black/50 backdrop-blur-xl px-4 py-2.5 pl-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
				/>
				<MagnifyingGlass
					size={16}
					weight="bold"
					class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						title="Suche leeren"
					>
						<X size={14} weight="bold" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Conversation List (Scrollable) -->
		<div class="flex-1 overflow-hidden flex flex-col">
			<div class="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
				<!-- New Chat Button -->
				<a
					href="/chat"
					class="flex items-center gap-2 w-full mb-3 px-4 py-2.5 rounded-xl
							 bg-primary text-primary-foreground font-medium text-sm
							 shadow-md hover:bg-primary/90 transition-colors"
				>
					<Plus size={18} weight="bold" />
					Neuer Chat
				</a>

				{#if isLoading}
					<div class="flex items-center justify-center py-8">
						<div
							class="animate-spin w-6 h-6 border-2 border-primary border-r-transparent rounded-full"
						></div>
					</div>
				{:else if filteredConversations.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						{#if searchQuery}
							<div class="text-4xl mb-3">🔍</div>
							<h3 class="text-base font-semibold mb-1 text-foreground">Keine Ergebnisse</h3>
							<p class="text-sm text-muted-foreground mb-3">
								Keine Konversationen für "{searchQuery}"
							</p>
							<button
								onclick={() => (searchQuery = '')}
								class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								Suche leeren
							</button>
						{:else}
							<div class="text-4xl mb-3">💬</div>
							<h3 class="text-base font-semibold mb-1 text-foreground">Keine Konversationen</h3>
							<p class="text-sm text-muted-foreground">Starte einen neuen Chat</p>
						{/if}
					</div>
				{:else}
					{#each filteredConversations as conv (conv.id)}
						<a
							href="/chat/{conv.id}"
							class="block w-full rounded-xl border bg-surface p-4 text-left transition-all mb-3 hover:shadow-md
								   {isActive(conv.id)
								? 'border-primary bg-primary/5 shadow-md'
								: 'border-border hover:bg-muted/50'}"
						>
							<!-- Title Row -->
							<div class="mb-1.5 flex items-center gap-2">
								<ChatCircle
									size={16}
									weight={isActive(conv.id) ? 'fill' : 'regular'}
									class="flex-shrink-0 {isActive(conv.id)
										? 'text-primary'
										: 'text-muted-foreground'}"
								/>
								<h3 class="text-sm font-semibold line-clamp-1 text-foreground flex-1">
									{conv.title || 'Neue Konversation'}
								</h3>
							</div>

							<!-- Preview -->
							<p class="mb-2 text-sm text-muted-foreground line-clamp-2">
								{getPreview(conv.title)}
							</p>

							<!-- Footer -->
							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">
									{formatDate(conv.updated_at || conv.created_at)}
								</span>
								{#if conv.document_mode}
									<span
										class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full"
									>
										Dokument
									</span>
								{/if}
							</div>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Resizer -->
	<button
		type="button"
		aria-label="Sidebar-Breite anpassen"
		class="resizer"
		class:resizing={isResizing}
		onmousedown={startResize}
	></button>

	<!-- Right Column: Chat Content -->
	<div class="flex flex-1 flex-col bg-surface overflow-hidden">
		{@render children()}
	</div>
</div>

<style>
	/* Hide scrollbar completely */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Resizer */
	.resizer {
		width: 4px;
		background-color: transparent;
		cursor: col-resize;
		user-select: none;
		transition: background-color 0.2s;
		position: relative;
	}

	.resizer:hover,
	.resizer.resizing {
		background-color: var(--color-primary, #3b82f6);
	}

	.resizer::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -4px;
		right: -4px;
	}

	.resizer:active {
		background-color: var(--color-primary, #2563eb);
	}

	/* Prevent text selection while resizing */
	:global(body:has(.resizer.resizing)) {
		user-select: none;
		cursor: col-resize;
	}
</style>
