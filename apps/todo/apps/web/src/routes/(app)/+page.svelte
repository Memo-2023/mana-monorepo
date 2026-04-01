<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';
	import { Plus } from '@manacore/shared-icons';
	import PagePicker from '$lib/components/pages/PagePicker.svelte';
	import TodoPage from '$lib/components/pages/TodoPage.svelte';
	import { minimizedPagesStore } from '$lib/stores/minimized-pages.svelte';

	// Get active view from layout context
	const activeViewCtx: { readonly value: LocalBoardView | null } = getContext('activeView');

	let activeView = $derived(activeViewCtx.value);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');

	// ── Pages ───────────────────────────────────────────────
	let showPagePicker = $state(false);
	let openPages = $state<{ id: string; minimized: boolean; customTitle?: string }[]>([
		{ id: 'todo', minimized: false },
	]);

	let expandedPages = $derived(openPages.filter((p) => !p.minimized));

	// Sync minimized pages to shared store so layout can render tabs
	$effect(() => {
		minimizedPagesStore.set(openPages);
	});
	onDestroy(() => minimizedPagesStore.clear());

	// Listen for events from layout's minimized tab bar
	function onRestorePage(e: Event) {
		handleRestorePage((e as CustomEvent).detail);
	}
	function onRemovePage(e: Event) {
		handleRemovePage((e as CustomEvent).detail);
	}
	function onTogglePagePicker() {
		togglePagePicker();
	}

	$effect(() => {
		window.addEventListener('restore-page', onRestorePage);
		window.addEventListener('remove-page', onRemovePage);
		window.addEventListener('toggle-page-picker', onTogglePagePicker);
		return () => {
			window.removeEventListener('restore-page', onRestorePage);
			window.removeEventListener('remove-page', onRemovePage);
			window.removeEventListener('toggle-page-picker', onTogglePagePicker);
		};
	});

	function handleAddPage(pageId: string) {
		if (!openPages.some((p) => p.id === pageId)) {
			openPages = [...openPages, { id: pageId, minimized: false }];
		} else {
			openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: false } : p));
		}
		showPagePicker = false;
	}

	function handleRemovePage(pageId: string) {
		openPages = openPages.filter((p) => p.id !== pageId);
	}

	function handleMinimizePage(pageId: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: true } : p));
	}

	function handleRestorePage(pageId: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: false } : p));
	}

	function handleRenamePage(pageId: string, name: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, customTitle: name } : p));
	}

	// ── Page drag reorder ───────────────────────────────────
	let dragPageId = $state<string | null>(null);

	function handlePageDragStart(e: DragEvent, pageId: string) {
		dragPageId = pageId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', pageId);
		}
	}

	function handlePageDragOver(e: DragEvent) {
		if (!dragPageId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handlePageDrop(e: DragEvent, targetPageId: string) {
		e.preventDefault();
		if (!dragPageId || dragPageId === targetPageId) return;
		const fromIdx = openPages.findIndex((p) => p.id === dragPageId);
		const toIdx = openPages.findIndex((p) => p.id === targetPageId);
		if (fromIdx === -1 || toIdx === -1) return;
		const pages = [...openPages];
		const [moved] = pages.splice(fromIdx, 1);
		pages.splice(toIdx, 0, moved);
		openPages = pages;
		dragPageId = null;
	}

	function handlePageDragEnd() {
		dragPageId = null;
	}

	function togglePagePicker() {
		showPagePicker = !showPagePicker;
	}

	function handleColumnClose(colIdx: number) {
		if (!activeView) return;
		const columns = $state.snapshot(activeView.columns).filter((_, i) => i !== colIdx);
		updateView({ columns });
	}

	// ── Column helpers ──────────────────────────────────────

	async function updateView(data: Partial<LocalBoardView>) {
		if (!activeView) return;
		await boardViewsStore.updateView(activeView.id, data);
	}

	function updateColumn(colIdx: number, data: Record<string, unknown>) {
		if (!activeView) return;
		const raw = $state.snapshot(activeView.columns);
		const cols = raw.map((c, i) => (i === colIdx ? { ...c, ...data } : c));
		updateView({ columns: cols });
	}

	function removeColumn(colIdx: number) {
		if (!activeView) return;
		const columns = $state.snapshot(activeView.columns).filter((_, i) => i !== colIdx);
		updateView({ columns });
	}

	function moveColumn(colIdx: number, dir: -1 | 1) {
		if (!activeView) return;
		const cols = $state.snapshot(activeView.columns);
		const target = colIdx + dir;
		if (target < 0 || target >= cols.length) return;
		[cols[colIdx], cols[target]] = [cols[target], cols[colIdx]];
		updateView({ columns: cols });
	}

	let columnsEditable = $derived(
		activeView?.groupBy === 'status' || activeView?.groupBy === 'custom'
	);

	let pagePickerEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (showPagePicker && pagePickerEl) {
			pagePickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	});
</script>

<svelte:head>
	<title>{pageTitle} - Todo</title>
</svelte:head>

<div class="board-page">
	<!-- Board Content -->
	{#if activeView}
		<BoardViewRenderer
			view={activeView}
			layoutOverride="fokus"
			onColumnRename={columnsEditable ? (i, name) => updateColumn(i, { name }) : undefined}
			onColumnColorChange={columnsEditable ? (i, color) => updateColumn(i, { color }) : undefined}
			onColumnMove={columnsEditable ? moveColumn : undefined}
			onColumnDelete={columnsEditable ? removeColumn : undefined}
			onColumnClose={handleColumnClose}
		>
			{#snippet trailing()}
				<!-- Pages -->
				{#each expandedPages as page (page.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="page-drag-wrapper"
						class:dragging={dragPageId === page.id}
						draggable="true"
						ondragstart={(e) => handlePageDragStart(e, page.id)}
						ondragover={handlePageDragOver}
						ondrop={(e) => handlePageDrop(e, page.id)}
						ondragend={handlePageDragEnd}
					>
						<TodoPage
							pageId={page.id}
							title={page.customTitle}
							onClose={() => handleRemovePage(page.id)}
							onMinimize={() => handleMinimizePage(page.id)}
							onRename={(name) => handleRenamePage(page.id, name)}
						/>
					</div>
				{/each}

				<!-- Page picker -->
				{#if showPagePicker}
					<div bind:this={pagePickerEl}>
						<PagePicker
							onSelect={handleAddPage}
							onClose={() => (showPagePicker = false)}
							activePageIds={openPages.map((p) => p.id)}
						/>
					</div>
				{:else}
					<button class="neue-seite-card" onclick={togglePagePicker} title="Neue Seite hinzufügen">
						<Plus size={18} />
					</button>
				{/if}
			{/snippet}
		</BoardViewRenderer>
	{:else}
		<div class="empty-state">
			<p class="text-muted-foreground">Views werden geladen...</p>
		</div>
	{/if}
</div>

<style>
	.board-page {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
	}

	.page-drag-wrapper {
		flex: 0 0 auto;
		transition: opacity 0.15s;
	}
	.page-drag-wrapper.dragging {
		opacity: 0.4;
	}

	.neue-seite-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s;
	}
	.neue-seite-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, transparent);
	}
	:global(.dark) .neue-seite-card {
		border-color: rgba(255, 255, 255, 0.06);
		color: #4b5563;
	}
	:global(.dark) .neue-seite-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 8%, transparent);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
