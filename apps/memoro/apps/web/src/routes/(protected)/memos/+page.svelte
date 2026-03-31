<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { memoService } from '$lib/services/memoService';
	import { tagService } from '$lib/services/tagService';
	import {
		memos,
		selectedTagId,
		filteredMemos,
		searchQuery,
		hasMoreMemos,
		isLoadingMore,
		currentOffset,
	} from '$lib/stores/memos';
	import { tags } from '$lib/stores/tags';
	import { tabs } from '$lib/stores/tabs';
	import { isSidebarMode, isNavCollapsed } from '$lib/stores/navigation';
	import { supabase, createAuthClient } from '$lib/supabaseClient';
	import SplitView from '$lib/components/SplitView.svelte';
	import ContextMenu from '$lib/components/ContextMenu.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import VirtualList from '$lib/components/VirtualList.svelte';
	import { DashboardSkeleton } from '$lib/components/skeletons';
	import type { Memo } from '$lib/types/memo.types';
	import type { SplitDirection } from '$lib/stores/tabs';
	import { formatDuration, getMemooDuration, formatTimestamp } from '$lib/utils/formatters';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	// Real-time subscription channel (stored for cleanup)
	let realtimeChannel: RealtimeChannel | null = null;

	let loading = $state(true);
	let error = $state<string | null>(null);

	// Resizer state
	let leftColumnWidth = $state(400);
	let isResizing = $state(false);
	const MIN_WIDTH = 280;
	const MAX_WIDTH = 600;

	// Context menu state
	let contextMenu = $state<{ memo: Memo; x: number; y: number } | null>(null);

	// Delete modal state
	let deleteModalVisible = $state(false);
	let memoToDelete = $state<Memo | null>(null);

	// Resizer handlers
	function startResize() {
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

	// Add event listeners for resizing
	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', stopResize);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', stopResize);
		};
	});

	// Keyboard shortcuts
	onMount(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			// Cmd/Ctrl+W - Close active tab
			if (modKey && e.key === 'w') {
				e.preventDefault();
				if ($tabs.activeSplitId) {
					const activeSplit = $tabs.splits.find((s) => s.id === $tabs.activeSplitId);
					if (activeSplit?.activeTabId) {
						tabs.closeTab(activeSplit.id, activeSplit.activeTabId);
					}
				}
				return;
			}

			// Cmd/Ctrl+[ - Previous tab
			if (modKey && e.key === '[') {
				e.preventDefault();
				if ($tabs.activeSplitId) {
					const activeSplit = $tabs.splits.find((s) => s.id === $tabs.activeSplitId);
					if (activeSplit && activeSplit.tabs.length > 1) {
						const currentIndex = activeSplit.tabs.findIndex(
							(t) => t.id === activeSplit.activeTabId
						);
						const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeSplit.tabs.length - 1;
						tabs.activateTab(activeSplit.id, activeSplit.tabs[prevIndex].id);
					}
				}
				return;
			}

			// Cmd/Ctrl+] - Next tab
			if (modKey && e.key === ']') {
				e.preventDefault();
				if ($tabs.activeSplitId) {
					const activeSplit = $tabs.splits.find((s) => s.id === $tabs.activeSplitId);
					if (activeSplit && activeSplit.tabs.length > 1) {
						const currentIndex = activeSplit.tabs.findIndex(
							(t) => t.id === activeSplit.activeTabId
						);
						const nextIndex = currentIndex < activeSplit.tabs.length - 1 ? currentIndex + 1 : 0;
						tabs.activateTab(activeSplit.id, activeSplit.tabs[nextIndex].id);
					}
				}
				return;
			}

			// Cmd/Ctrl+1/2/3/4 - Focus split
			if (modKey && ['1', '2', '3', '4'].includes(e.key)) {
				e.preventDefault();
				const splitIndex = parseInt(e.key) - 1;
				if ($tabs.splits[splitIndex]) {
					tabs.activateTab($tabs.splits[splitIndex].id, $tabs.splits[splitIndex].activeTabId || '');
				}
				return;
			}
		}

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	const MEMOS_PER_PAGE = 30;

	// Load more memos for infinite scroll
	async function loadMoreMemos() {
		if ($isLoadingMore || !$hasMoreMemos || !$user) return;

		isLoadingMore.set(true);
		try {
			const newOffset = $currentOffset + MEMOS_PER_PAGE;
			const { memos: newMemos, hasMore } = await memoService.getMemosForList(
				$user.id,
				MEMOS_PER_PAGE,
				newOffset
			);

			memos.appendMemos(newMemos);
			currentOffset.set(newOffset);
			hasMoreMemos.set(hasMore);
		} catch (err) {
			console.error('Error loading more memos:', err);
		} finally {
			isLoadingMore.set(false);
		}
	}

	// Load memos and tags on mount
	onMount(async () => {
		// Reset search query and pagination when entering the page
		searchQuery.set('');
		currentOffset.set(0);

		try {
			if (!$user) {
				error = $t('memo.error_user_not_authenticated');
				loading = false;
				return;
			}

			// Load memos and tags in parallel using optimized list query
			const [memosResult, tagsData] = await Promise.all([
				memoService.getMemosForList($user.id, MEMOS_PER_PAGE, 0),
				tagService.getTags($user.id),
			]);

			memos.setMemos(memosResult.memos);
			hasMoreMemos.set(memosResult.hasMore);
			tags.setTags(tagsData);

			// Check if there's a memo ID in the URL query
			const memoId = $page.url.searchParams.get('id');
			if (memoId) {
				const memo = memosResult.memos.find((m) => m.id === memoId);
				if (memo) {
					await selectMemo(memo, false);
				}
			} else if (memosResult.memos.length > 0) {
				// Select the latest memo by default
				await selectMemo(memosResult.memos[0], false);
			}

			// Subscribe to real-time updates
			const authClient = await createAuthClient();
			realtimeChannel = authClient
				.channel('memos-page')
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'memos' },
					(payload) => {
						// Add new memo to list without auto-selecting (avoids interrupting user workflow)
						memos.addMemo(payload.new as any);
					}
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'memos' },
					(payload) => {
						memos.updateMemo(payload.new.id, payload.new as any);
						// Update memo in tabs
						tabs.updateMemo(payload.new.id, payload.new as any);
					}
				)
				.on(
					'postgres_changes',
					{ event: 'DELETE', schema: 'public', table: 'memos' },
					(payload) => {
						memos.deleteMemo(payload.old.id);
					}
				)
				.subscribe();

			loading = false;
		} catch (err) {
			console.error('Error loading memos:', err);
			error = $t('memo.error_loading_memos');
			loading = false;
		}
	});

	// Cleanup real-time subscription on component destroy
	onDestroy(() => {
		if (realtimeChannel) {
			realtimeChannel.unsubscribe();
			realtimeChannel = null;
		}
	});

	async function selectMemo(memo: Memo, shiftKey: boolean = false) {
		try {
			// Load full memo details with memories
			const fullMemo = await memoService.getMemoById(memo.id);

			// Get audio URL using cached service method
			let audioUrl: string | null = null;
			if (fullMemo.source?.audio_path) {
				audioUrl = await memoService.getAudioUrl(fullMemo.id, fullMemo.source.audio_path);
			} else if (fullMemo.audio_url) {
				audioUrl = fullMemo.audio_url;
			}

			// If Shift is pressed, open in new split
			if (shiftKey && $tabs.splits.length > 0) {
				const direction: SplitDirection = $tabs.splits.length === 1 ? 'vertical' : 'vertical';
				tabs.openInSplit(fullMemo, direction, audioUrl);
			} else {
				// Open in current tab or initialize
				if ($tabs.splits.length === 0) {
					tabs.init(fullMemo, audioUrl);
				} else {
					tabs.openTab(fullMemo, audioUrl);
				}
			}
		} catch (err) {
			console.error('Error loading memo details:', err);
		}
	}

	function handleMemoClick(memo: Memo, event: MouseEvent) {
		selectMemo(memo, event.shiftKey);
	}

	function handleOpenInSplit(memo: Memo, direction: SplitDirection, audioUrl: string | null) {
		tabs.openInSplit(memo, direction, audioUrl);
	}

	// Context menu handlers
	function handleContextMenu(e: MouseEvent, memo: Memo) {
		e.preventDefault();
		contextMenu = {
			memo,
			x: e.clientX,
			y: e.clientY,
		};
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	function handleDeleteMemo(memo: Memo) {
		memoToDelete = memo;
		deleteModalVisible = true;
	}

	async function confirmDelete() {
		if (!memoToDelete) return;

		try {
			await memoService.deleteMemo(memoToDelete.id);
			memos.deleteMemo(memoToDelete.id);
			deleteModalVisible = false;
			memoToDelete = null;
		} catch (err) {
			console.error('Error deleting memo:', err);
			alert($t('memo.error_deleting_memo'));
		}
	}

	function cancelDelete() {
		deleteModalVisible = false;
		memoToDelete = null;
	}

	async function handleEditTitle(memo: Memo) {
		const newTitle = prompt($t('memo.enter_new_title'), memo.title || '');
		if (newTitle === null || newTitle.trim() === '') {
			return;
		}

		try {
			await memoService.updateMemo(memo.id, { title: newTitle.trim() });
			memos.updateMemo(memo.id, { ...memo, title: newTitle.trim() });
		} catch (err) {
			console.error('Error updating memo title:', err);
			alert($t('memo.error_updating_title'));
		}
	}

	async function handleShareMemo(memo: Memo) {
		const shareUrl = `${window.location.origin}/memos/${memo.id}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: memo.title || $t('memo.no_title'),
					text: memo.transcript ? memo.transcript.substring(0, 100) + '...' : '',
					url: shareUrl,
				});
			} catch (err) {
				if ((err as Error).name !== 'AbortError') {
					console.error('Error sharing:', err);
				}
			}
		} else {
			try {
				await navigator.clipboard.writeText(shareUrl);
				alert($t('memo.link_copied'));
			} catch (err) {
				console.error('Error copying to clipboard:', err);
				alert($t('memo.error_copying_link'));
			}
		}
	}

	async function handleExportMemo(memo: Memo) {
		const content = `
Titel: ${memo.title || $t('memo.no_title')}
Datum: ${new Date(memo.created_at).toLocaleDateString('de-DE')}
Dauer: ${formatDuration(getMemooDuration(memo))}

Transkript:
${memo.transcript || 'Kein Transkript verfügbar'}

${memo.memories && memo.memories.length > 0 ? '\nKI-Analyse:\n' + memo.memories.map((m) => `${m.title}\n${m.content}`).join('\n\n') : ''}
`.trim();

		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${memo.title || 'memo'}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleOpenInNewTab(memo: Memo) {
		window.open(`/memos/${memo.id}`, '_blank');
	}

	async function handlePinMemo(memo: Memo) {
		try {
			const newPinStatus = await memoService.togglePin(memo.id, memo.is_pinned);
			memos.updateMemo(memo.id, { ...memo, is_pinned: newPinStatus });
			tabs.updateMemo(memo.id, { ...memo, is_pinned: newPinStatus });
		} catch (err) {
			console.error('Error toggling pin:', err);
			alert($t('memo.error_pin_status'));
		}
	}
</script>

<svelte:head>
	<title>Memos - Memoro</title>
</svelte:head>

{#if loading}
	<DashboardSkeleton {leftColumnWidth} />
{:else if error}
	<div class="flex h-full items-center justify-center">
		<div class="text-center">
			<div class="text-6xl mb-4">⚠️</div>
			<h2 class="text-2xl font-semibold mb-2 status-failed">{error}</h2>
			<button onclick={() => window.location.reload()} class="btn-primary mt-4">
				{$t('memo.retry')}
			</button>
		</div>
	</div>
{:else}
	<!-- Two-column layout -->
	<div
		class="flex w-full gap-0 overflow-hidden {$isNavCollapsed || $isSidebarMode
			? 'h-screen'
			: 'h-[calc(100vh-5rem)]'}"
	>
		<!-- Left Column: Memo List -->
		<div class="relative flex flex-shrink-0 flex-col bg-menu" style="width: {leftColumnWidth}px;">
			<!-- Floating Search Bar -->
			<div
				class="absolute top-0 left-0 right-0 z-20 py-3 pr-2 transition-all duration-300 {$isNavCollapsed
					? 'pl-16'
					: 'pl-4'}"
			>
				<div class="relative">
					<input
						type="text"
						bind:value={$searchQuery}
						placeholder={$t('memo.search_placeholder')}
						class="w-full rounded-xl border border-theme bg-white/70 dark:bg-black/50 backdrop-blur-xl px-4 py-3 pl-10 text-base font-medium text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-mana shadow-lg"
					/>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					{#if $searchQuery}
						<button
							onclick={() => searchQuery.set('')}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme"
							title={$t('memo.clear_search')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			</div>

			<!-- Memo List (Scrollable via VirtualList) -->
			<div class="flex-1 overflow-hidden flex flex-col">
				<!-- Content area (takes remaining space) -->
				<div class="flex-1 overflow-hidden">
					{#if $filteredMemos.length === 0}
						<div class="flex flex-col items-center justify-center p-8 pt-[80px] text-center h-full">
							{#if $searchQuery}
								<div class="text-6xl mb-4">🔍</div>
								<h3 class="text-lg font-semibold mb-2">{$t('memo.no_search_results')}</h3>
								<p class="text-sm text-theme-secondary mb-4">
									{$t('memo.no_memos_with_search', { values: { query: $searchQuery } })}
								</p>
								<button
									onclick={() => searchQuery.set('')}
									class="rounded-lg border border-mana bg-mana px-4 py-2 text-sm font-medium text-white hover:bg-mana/90"
								>
									{$t('memo.clear_search')}
								</button>
							{:else if $selectedTagId}
								<div class="text-6xl mb-4">🏷️</div>
								<h3 class="text-lg font-semibold mb-2">{$t('memo.no_memos_with_tag')}</h3>
								<p class="text-sm text-theme-secondary mb-4">
									{$t('memo.no_memos_with_tag_hint')}
								</p>
								<button
									onclick={() => selectedTagId.set(null)}
									class="rounded-lg border border-mana bg-mana px-4 py-2 text-sm font-medium text-white hover:bg-mana/90"
								>
									{$t('memo.show_all_memos')}
								</button>
							{:else}
								<div class="text-6xl mb-4">🎤</div>
								<h3 class="text-lg font-semibold mb-2">{$t('memo.no_memos_yet')}</h3>
								<p class="text-sm text-theme-secondary">
									{$t('memo.no_memos_hint')}
								</p>
							{/if}
						</div>
					{:else}
						<!-- Virtual Scrolling List -->
						<VirtualList
							items={$filteredMemos}
							itemHeight={156}
							onLoadMore={$hasMoreMemos ? loadMoreMemos : undefined}
							loadMoreThreshold={300}
							class="pl-4 pr-2 pt-[72px]"
						>
							{#snippet children({ item: memo, index })}
								<button
									onclick={(e) => handleMemoClick(memo, e)}
									oncontextmenu={(e) => handleContextMenu(e, memo)}
									class="w-full rounded-xl border border-theme bg-content p-4 text-left transition-colors hover:bg-menu-hover"
									style="height: 144px; margin-bottom: 12px;"
								>
									<!-- Title with Pin Indicator -->
									<div class="mb-1 flex items-center gap-2">
										{#if memo.is_pinned}
											<svg
												class="h-4 w-4 flex-shrink-0 text-primary"
												fill="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
											</svg>
										{/if}
										<h3 class="text-sm font-semibold line-clamp-2">
											{memo.title || $t('memo.no_title')}
										</h3>
									</div>

									<!-- Intro/Transcript Preview -->
									{#if memo.intro}
										<p class="mb-2 text-sm text-theme-secondary line-clamp-2">
											{memo.intro}
										</p>
									{:else if memo.transcript}
										<p class="mb-2 text-sm text-theme-secondary line-clamp-2">
											{memo.transcript}
										</p>
									{:else}
										<p class="mb-2 text-sm italic text-theme-muted">
											{$t('memo.processing_transcript')}
										</p>
									{/if}

									<!-- Footer -->
									<div class="flex items-center justify-between">
										<span class="text-xs text-theme-muted">
											{formatTimestamp(memo.created_at)}
										</span>
										<span class="text-xs text-theme-muted">
											{formatDuration(getMemooDuration(memo))}
										</span>
									</div>
								</button>
							{/snippet}
						</VirtualList>

						<!-- Loading indicator at bottom -->
						{#if $isLoadingMore}
							<div class="px-4 pb-3">
								<div
									class="w-full rounded-xl border border-theme bg-content/50 p-4 text-center text-sm text-theme-secondary"
								>
									<span class="flex items-center justify-center gap-2">
										<svg
											class="animate-spin h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										{$t('common.loading')}
									</span>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Resizer -->
		<button
			type="button"
			aria-label="Resize sidebar"
			class="resizer"
			class:resizing={isResizing}
			onmousedown={startResize}
		></button>

		<!-- Right Column: Split View with Tabs -->
		<div class="flex flex-1 flex-col bg-menu">
			<SplitView onOpenInSplit={handleOpenInSplit} />
		</div>
	</div>
{/if}

<!-- Context Menu -->
{#if contextMenu}
	<ContextMenu
		items={[
			{
				label: $t('memo.open_in_new_tab'),
				icon: 'open',
				action: () => handleOpenInNewTab(contextMenu.memo),
			},
			{
				label: contextMenu.memo.is_pinned ? $t('memo.unpin') : $t('memo.pin'),
				icon: 'pin',
				action: () => handlePinMemo(contextMenu.memo),
			},
			{
				separator: true,
				label: '',
				action: () => {},
			},
			{
				label: $t('memo.edit_title'),
				icon: 'edit',
				action: () => handleEditTitle(contextMenu.memo),
			},
			{
				label: $t('memo.share'),
				icon: 'share',
				action: () => handleShareMemo(contextMenu.memo),
			},
			{
				label: $t('memo.export_text'),
				icon: 'download',
				action: () => handleExportMemo(contextMenu.memo),
			},
			{
				separator: true,
				label: '',
				action: () => {},
			},
			{
				label: $t('common.delete'),
				icon: 'delete',
				danger: true,
				action: () => handleDeleteMemo(contextMenu.memo),
			},
		]}
		x={contextMenu.x}
		y={contextMenu.y}
		onClose={closeContextMenu}
	/>
{/if}

<!-- Delete Confirmation Modal -->
<Modal
	visible={deleteModalVisible}
	onClose={cancelDelete}
	title={$t('memo.delete_memo_title')}
	maxWidth="md"
>
	{#snippet children()}
		<div class="space-y-4">
			<p class="text-theme">
				{$t('memo.delete_memo_confirm', {
					values: { title: memoToDelete?.title || $t('memo.no_title') },
				})}
			</p>
			<p class="text-theme-secondary text-sm">
				{$t('memo.delete_memo_warning')}
			</p>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<button onclick={cancelDelete} class="btn-secondary">
				{$t('common.cancel')}
			</button>
			<button onclick={confirmDelete} class="btn-danger">
				{$t('common.delete')}
			</button>
		</div>
	{/snippet}
</Modal>

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
		background-color: #3b82f6;
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
		background-color: #2563eb;
	}

	/* Prevent text selection while resizing */
	:global(body:has(.resizer.resizing)) {
		user-select: none;
		cursor: col-resize;
	}
</style>
