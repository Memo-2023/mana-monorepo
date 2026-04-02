<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import type { PageConfig, PageWidth } from '$lib/stores/settings.svelte';
	import { Plus, PencilSimple, X } from '@manacore/shared-icons';
	import PagePicker from '$lib/components/pages/PagePicker.svelte';
	import TodoPage from '$lib/components/pages/TodoPage.svelte';
	import type { MinimizedPagesContext } from '$lib/stores/minimized-pages.svelte';

	// Get active view from layout context
	const activeViewCtx: { readonly value: LocalBoardView | null } = getContext('activeView');
	const minimizedPages: MinimizedPagesContext = getContext('minimizedPages');

	let activeView = $derived(activeViewCtx.value);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');

	// ── Edit mode ──────────────────────────────────────────
	let editMode = $state(false);

	// ── Pages ───────────────────────────────────────────────
	let showPagePicker = $state(false);
	let openPages = $state<
		{ id: string; minimized: boolean; maximized?: boolean; customTitle?: string }[]
	>([{ id: 'todo', minimized: false }]);

	let expandedPages = $derived(openPages.filter((p) => !p.minimized));

	// Custom pages from settings
	let customPages = $derived(todoSettings.customPages);

	// Sync minimized pages to layout via context
	$effect(() => {
		minimizedPages.sync(openPages, customPages);
	});

	// Register handlers so layout can delegate tab actions back to us
	minimizedPages.registerHandlers({
		restore: (id) => handleRestorePage(id),
		remove: (id) => handleRemovePage(id),
		maximize: (id) => handleMaximizePage(id),
		togglePicker: () => togglePagePicker(),
	});

	onDestroy(() => minimizedPages.clear());

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
		// Also update custom page config label
		if (pageId.startsWith('custom-')) {
			const updated = customPages.map((cp) => (cp.id === pageId ? { ...cp, label: name } : cp));
			todoSettings.update({ customPages: updated });
		}
	}

	function handleMaximizePage(pageId: string) {
		openPages = openPages.map((p) =>
			p.id === pageId ? { ...p, maximized: !p.maximized, minimized: false } : p
		);
	}

	// ── Custom page CRUD ────────────────────────────────────
	function handleCreateCustomPage() {
		const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
		const newPage: PageConfig = {
			id,
			label: 'Neue Seite',
			icon: 'star',
			filter: {},
		};
		todoSettings.update({ customPages: [...customPages, newPage] });
		openPages = [...openPages, { id, minimized: false }];
		showPagePicker = false;
		// Auto-enable edit mode so the user can configure the new page
		editMode = true;
	}

	function handleUpdateCustomPage(pageId: string, data: Partial<PageConfig>) {
		const updated = customPages.map((cp) => {
			if (cp.id !== pageId) return cp;
			return { ...cp, ...data, filter: data.filter ?? cp.filter };
		});
		todoSettings.update({ customPages: updated });
	}

	function handleDeletePage(pageId: string) {
		// Remove from open pages
		openPages = openPages.filter((p) => p.id !== pageId);
		// If custom, also remove from settings
		if (pageId.startsWith('custom-')) {
			const updated = customPages.filter((cp) => cp.id !== pageId);
			todoSettings.update({ customPages: updated });
		}
	}

	function getCustomPageConfig(pageId: string): PageConfig | undefined {
		return customPages.find((cp) => cp.id === pageId);
	}

	// ── Page reorder (in edit mode, with arrows) ────────────
	function handleMovePageLeft(pageId: string) {
		const idx = openPages.findIndex((p) => p.id === pageId);
		if (idx <= 0) return;
		const pages = [...openPages];
		[pages[idx - 1], pages[idx]] = [pages[idx], pages[idx - 1]];
		openPages = pages;
	}

	function handleMovePageRight(pageId: string) {
		const idx = openPages.findIndex((p) => p.id === pageId);
		if (idx === -1 || idx >= openPages.length - 1) return;
		const pages = [...openPages];
		[pages[idx], pages[idx + 1]] = [pages[idx + 1], pages[idx]];
		openPages = pages;
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

	function toggleEditMode() {
		editMode = !editMode;
		if (!editMode) showPagePicker = false;
	}

	// ── Width pills ─────────────────────────────────────────
	const WIDTH_OPTIONS: { id: PageWidth; label: string }[] = [
		{ id: 'narrow', label: 'S' },
		{ id: 'medium', label: 'M' },
		{ id: 'wide', label: 'L' },
		{ id: 'full', label: 'XL' },
	];

	function setPageWidth(width: PageWidth) {
		todoSettings.update({ pageWidth: width });
	}

	// ── Column helpers ──────────────────────────────────────
	function handleColumnClose(colIdx: number) {
		if (!activeView) return;
		const columns = $state.snapshot(activeView.columns).filter((_, i) => i !== colIdx);
		updateView({ columns });
	}

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
	<!-- Width pills (visible in edit mode) -->
	{#if editMode}
		<div class="edit-toolbar">
			<div class="width-pills">
				{#each WIDTH_OPTIONS as opt (opt.id)}
					<button
						class="width-pill"
						class:active={todoSettings.pageWidth === opt.id}
						onclick={() => setPageWidth(opt.id)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

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
				{#each expandedPages as page, pageIdx (page.id)}
					{@const config = getCustomPageConfig(page.id)}
					{@const isCustom = page.id.startsWith('custom-')}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="page-drag-wrapper"
						class:dragging={dragPageId === page.id}
						draggable={!editMode}
						ondragstart={(e) => handlePageDragStart(e, page.id)}
						ondragover={handlePageDragOver}
						ondrop={(e) => handlePageDrop(e, page.id)}
						ondragend={handlePageDragEnd}
					>
						<TodoPage
							pageId={page.id}
							title={page.customTitle ?? config?.label}
							maximized={page.maximized}
							{editMode}
							filterConfig={isCustom ? config?.filter : undefined}
							pageIcon={isCustom ? config?.icon : undefined}
							pageColor={isCustom && config?.icon ? undefined : undefined}
							customPageConfig={isCustom ? config : undefined}
							isFirst={pageIdx === 0}
							isLast={pageIdx === expandedPages.length - 1}
							onClose={() => handleRemovePage(page.id)}
							onMinimize={() => handleMinimizePage(page.id)}
							onMaximize={() => handleMaximizePage(page.id)}
							onRename={(name) => handleRenamePage(page.id, name)}
							onUpdateConfig={isCustom
								? (data) => handleUpdateCustomPage(page.id, data)
								: undefined}
							onMoveLeft={editMode ? () => handleMovePageLeft(page.id) : undefined}
							onMoveRight={editMode ? () => handleMovePageRight(page.id) : undefined}
							onDelete={editMode ? () => handleDeletePage(page.id) : undefined}
						/>
					</div>
				{/each}

				<!-- Page picker / add button -->
				{#if expandedPages.length === 0}
					<div class="empty-pages-wrapper">
						{#if showPagePicker}
							<PagePicker
								onSelect={handleAddPage}
								onClose={() => (showPagePicker = false)}
								onCreateCustom={handleCreateCustomPage}
								activePageIds={openPages.map((p) => p.id)}
							/>
						{:else}
							<button
								class="neue-seite-card alone"
								onclick={togglePagePicker}
								title="Neue Seite hinzufügen"
							>
								<Plus size={24} />
								<span class="neue-seite-label">Seite hinzufügen</span>
							</button>
						{/if}
					</div>
				{:else if showPagePicker}
					<div bind:this={pagePickerEl}>
						<PagePicker
							onSelect={handleAddPage}
							onClose={() => (showPagePicker = false)}
							onCreateCustom={handleCreateCustomPage}
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

	<!-- Edit FAB -->
	<button
		class="edit-fab"
		class:active={editMode}
		onclick={toggleEditMode}
		title={editMode ? 'Bearbeitung beenden' : 'Seiten bearbeiten'}
	>
		{#if editMode}
			<X size={20} />
		{:else}
			<PencilSimple size={20} />
		{/if}
	</button>
</div>

<style>
	.board-page {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* Edit toolbar with width pills */
	.edit-toolbar {
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
		animation: fadeDown 0.2s ease-out;
	}

	@keyframes fadeDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.width-pills {
		display: flex;
		gap: 0.25rem;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 0.5rem;
		padding: 0.125rem;
	}
	:global(.dark) .width-pills {
		background: rgba(255, 255, 255, 0.06);
	}

	.width-pill {
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: #6b7280;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.width-pill:hover {
		color: #374151;
		background: rgba(0, 0, 0, 0.04);
	}
	.width-pill.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}
	:global(.dark) .width-pill {
		color: #9ca3af;
	}
	:global(.dark) .width-pill:hover {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .width-pill.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
	}

	/* Page drag */
	.page-drag-wrapper {
		flex: 0 0 auto;
		transition: opacity 0.15s;
	}
	.page-drag-wrapper.dragging {
		opacity: 0.4;
	}

	/* Add page button */
	.neue-seite-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 2px dashed rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s;
	}
	.empty-pages-wrapper {
		flex: 0 0 auto;
		width: var(--sheet-width, min(480px, 85vw));
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}

	.neue-seite-card.alone {
		width: 100%;
		min-height: 60vh;
		border-color: rgba(0, 0, 0, 0.12);
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
	:global(.dark) .neue-seite-card.alone {
		border-color: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
	:global(.dark) .neue-seite-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 8%, transparent);
	}

	.neue-seite-label {
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	/* Edit FAB */
	.edit-fab {
		position: fixed;
		bottom: 5.5rem;
		right: 1.25rem;
		width: 44px;
		height: 44px;
		border-radius: 9999px;
		border: none;
		background: #fffef5;
		color: #6b7280;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 40;
	}
	.edit-fab:hover {
		color: var(--color-primary, #8b5cf6);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		transform: scale(1.05);
	}
	.edit-fab.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
		box-shadow:
			0 4px 12px rgba(139, 92, 246, 0.3),
			0 0 0 1px rgba(139, 92, 246, 0.5);
	}
	.edit-fab.active:hover {
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 85%, black);
		color: white;
	}
	:global(.dark) .edit-fab {
		background: #252220;
		color: #9ca3af;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .edit-fab:hover {
		color: var(--color-primary, #8b5cf6);
	}
	:global(.dark) .edit-fab.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
	}
</style>
