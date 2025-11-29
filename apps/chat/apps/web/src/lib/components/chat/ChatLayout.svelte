<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { isSidebarMode, isNavCollapsed } from '$lib/stores/navigation';
	import { MagnifyingGlass, X, Plus, ChatCircle, Archive, Trash, PushPin } from '@manacore/shared-icons';
	import { ConfirmationModal } from '@manacore/shared-ui';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Delete confirmation modal state
	let showDeleteModal = $state(false);
	let deleteTargetId = $state<string | null>(null);
	let isDeleting = $state(false);

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

	// Split into pinned and unpinned
	let pinnedConversations = $derived(filteredConversations.filter((conv) => conv.isPinned));
	let unpinnedConversations = $derived(filteredConversations.filter((conv) => !conv.isPinned));

	// Date section types
	type DateSection = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older';

	const sectionLabels: Record<DateSection, string> = {
		today: 'Heute',
		yesterday: 'Gestern',
		thisWeek: 'Diese Woche',
		thisMonth: 'Dieser Monat',
		older: 'Älter'
	};

	function getDateSection(dateString: string): DateSection {
		const date = new Date(dateString);
		const now = new Date();

		// Reset time to compare just dates
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

		if (dateOnly.getTime() === today.getTime()) {
			return 'today';
		}
		if (dateOnly.getTime() === yesterday.getTime()) {
			return 'yesterday';
		}

		// This week (last 7 days)
		const weekAgo = new Date(today);
		weekAgo.setDate(weekAgo.getDate() - 7);
		if (dateOnly > weekAgo) {
			return 'thisWeek';
		}

		// This month
		const monthAgo = new Date(today);
		monthAgo.setDate(monthAgo.getDate() - 30);
		if (dateOnly > monthAgo) {
			return 'thisMonth';
		}

		return 'older';
	}

	// Group unpinned conversations by date sections
	let groupedConversations = $derived(() => {
		const groups: Record<DateSection, typeof unpinnedConversations> = {
			today: [],
			yesterday: [],
			thisWeek: [],
			thisMonth: [],
			older: []
		};

		for (const conv of unpinnedConversations) {
			const section = getDateSection(conv.updatedAt || conv.createdAt);
			groups[section].push(conv);
		}

		return groups;
	});

	const sectionOrder: DateSection[] = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'older'];

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
			conversationsStore.loadConversations();
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

	// Archive conversation
	async function handleArchive(e: MouseEvent, convId: string) {
		e.preventDefault();
		e.stopPropagation();
		const success = await conversationsStore.archiveConversation(convId);
		if (success && isActive(convId)) {
			goto('/chat');
		}
	}

	// Pin/unpin conversation
	async function handleTogglePin(e: MouseEvent, convId: string, isPinned: boolean) {
		e.preventDefault();
		e.stopPropagation();
		if (isPinned) {
			await conversationsStore.unpinConversation(convId);
		} else {
			await conversationsStore.pinConversation(convId);
		}
	}

	// Open delete confirmation modal
	function handleDelete(e: MouseEvent, convId: string) {
		e.preventDefault();
		e.stopPropagation();
		deleteTargetId = convId;
		showDeleteModal = true;
	}

	// Confirm delete action
	async function confirmDelete() {
		if (!deleteTargetId) return;

		isDeleting = true;
		try {
			const wasActive = isActive(deleteTargetId);
			const success = await conversationsStore.deleteConversation(deleteTargetId);
			if (success && wasActive) {
				goto('/chat');
			}
		} finally {
			isDeleting = false;
			showDeleteModal = false;
			deleteTargetId = null;
		}
	}

	// Close delete modal
	function closeDeleteModal() {
		showDeleteModal = false;
		deleteTargetId = null;
	}
</script>

<div
	class="flex w-full gap-0 overflow-hidden"
	class:h-screen={$isNavCollapsed || $isSidebarMode}
	class:h-[calc(100vh-5rem)]={!$isNavCollapsed && !$isSidebarMode}
>
	<!-- Left Column: Conversation List -->
	<div
		class="relative flex flex-shrink-0 flex-col bg-background"
		style="width: {leftColumnWidth}px;"
	>
		<!-- Floating Search Bar -->
		<div
			class="absolute top-0 left-0 right-0 z-20 py-3 pr-3 transition-all duration-300"
			class:pl-16={$isNavCollapsed}
			class:pl-4={!$isNavCollapsed}
		>
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Konversationen durchsuchen..."
					class="w-full rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 px-4 py-2.5 pl-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
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
			<div class="flex-1 overflow-y-auto pl-4 pr-3 pt-[68px] pb-3 scrollbar-hide">
				<!-- New Chat Button -->
				<a
					href="/chat"
					class="flex items-center gap-2 w-full mb-3 px-4 py-2.5 rounded-xl
							 bg-white/80 dark:bg-white/10 backdrop-blur-xl
							 border border-black/10 dark:border-white/20
							 text-foreground font-medium text-sm
							 shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-white/20
							 transition-all duration-200 hover:-translate-y-0.5"
				>
					<Plus size={18} weight="bold" class="text-primary" />
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
								class="rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 px-4 py-2 text-sm font-medium text-foreground shadow-md hover:shadow-lg transition-all"
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
					<!-- Pinned Section -->
					{#if pinnedConversations.length > 0}
						<div class="mb-5">
							<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<PushPin size={12} weight="fill" class="text-primary" />
								Angepinnt
							</h4>
							{#each pinnedConversations as conv (conv.id)}
								<a
									href="/chat/{conv.id}"
									class="group block w-full rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-black/10 dark:border-white/20 p-4 text-left transition-all mb-3 hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10
										   {isActive(conv.id)
										? 'bg-white/90 dark:bg-white/15 shadow-md border-primary/30'
										: ''}"
								>
									<!-- Title Row -->
									<div class="mb-1.5 flex items-center gap-2">
										<PushPin
											size={16}
											weight="fill"
											class="flex-shrink-0 text-primary"
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
											{formatDate(conv.updatedAt || conv.createdAt)}
										</span>
										<div class="flex items-center gap-1">
											{#if conv.documentMode}
												<span
													class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full"
												>
													Dokument
												</span>
											{/if}
											<!-- Action Buttons (visible on hover) -->
											<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onclick={(e) => handleTogglePin(e, conv.id, true)}
													class="p-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
													title="Nicht mehr anpinnen"
												>
													<PushPin size={14} weight="fill" />
												</button>
												<button
													onclick={(e) => handleArchive(e, conv.id)}
													class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
													title="Archivieren"
												>
													<Archive size={14} weight="bold" />
												</button>
												<button
													onclick={(e) => handleDelete(e, conv.id)}
													class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
													title="Löschen"
												>
													<Trash size={14} weight="bold" />
												</button>
											</div>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}

					<!-- Grouped Conversations by Date -->
					{#each sectionOrder as section}
						{@const convs = groupedConversations()[section]}
						{#if convs.length > 0}
							<div class="mb-5">
								<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									{sectionLabels[section]}
								</h4>
								{#each convs as conv (conv.id)}
									<a
										href="/chat/{conv.id}"
										class="group block w-full rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-black/10 dark:border-white/20 p-4 text-left transition-all mb-3 hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10
											   {isActive(conv.id)
											? 'bg-white/90 dark:bg-white/15 shadow-md border-primary/30'
											: ''}"
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
												{formatDate(conv.updatedAt || conv.createdAt)}
											</span>
											<div class="flex items-center gap-1">
												{#if conv.documentMode}
													<span
														class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full"
													>
														Dokument
													</span>
												{/if}
												<!-- Action Buttons (visible on hover) -->
												<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														onclick={(e) => handleTogglePin(e, conv.id, false)}
														class="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
														title="Anpinnen"
													>
														<PushPin size={14} weight="bold" />
													</button>
													<button
														onclick={(e) => handleArchive(e, conv.id)}
														class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
														title="Archivieren"
													>
														<Archive size={14} weight="bold" />
													</button>
													<button
														onclick={(e) => handleDelete(e, conv.id)}
														class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
														title="Löschen"
													>
														<Trash size={14} weight="bold" />
													</button>
												</div>
											</div>
										</div>
									</a>
								{/each}
							</div>
						{/if}
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
	<div class="flex flex-1 flex-col bg-background overflow-hidden">
		{@render children()}
	</div>
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
	visible={showDeleteModal}
	onClose={closeDeleteModal}
	onConfirm={confirmDelete}
	variant="danger"
	title="Konversation löschen?"
	message="Diese Aktion kann nicht rückgängig gemacht werden. Alle Nachrichten werden dauerhaft gelöscht."
	confirmLabel="Löschen"
	cancelLabel="Abbrechen"
	loading={isDeleting}
/>

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
