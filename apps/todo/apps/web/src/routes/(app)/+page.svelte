<script lang="ts">
	import { getContext } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { todoSettings, type PageWidth } from '$lib/stores/settings.svelte';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';
	import { Plus, Minus, X } from '@manacore/shared-icons';
	import PagePicker from '$lib/components/pages/PagePicker.svelte';
	import SecondaryPage from '$lib/components/pages/SecondaryPage.svelte';

	// Get active view + edit mode from layout context
	const activeViewCtx: { readonly value: LocalBoardView | null } = getContext('activeView');
	const editModeCtx: { readonly active: boolean; toggle(): void; set(val: boolean): void } =
		getContext('editMode');

	let editMode = $derived(editModeCtx.active);
	let activeView = $derived(activeViewCtx.value);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');

	// ── Secondary Pages ─────────────────────────────────────
	let showPagePicker = $state(false);
	let openPages = $state<{ id: string; minimized: boolean }[]>([]);

	let expandedPages = $derived(openPages.filter((p) => !p.minimized));
	let minimizedPages = $derived(openPages.filter((p) => p.minimized));

	function handleAddPage(pageId: string) {
		if (!openPages.some((p) => p.id === pageId)) {
			openPages = [...openPages, { id: pageId, minimized: false }];
		} else {
			// Restore if minimized
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

	function togglePagePicker() {
		showPagePicker = !showPagePicker;
	}

	function handleColumnClose(colIdx: number) {
		if (!activeView) return;
		const columns = $state.snapshot(activeView.columns).filter((_, i) => i !== colIdx);
		updateView({ columns });
	}

	// ── Edit helpers ────────────────────────────────────────

	const GROUPBY_OPTIONS = [
		{ value: 'status', label: 'Status' },
		{ value: 'priority', label: 'Priorität' },
		{ value: 'dueDate', label: 'Fälligkeit' },
		{ value: 'custom', label: 'Benutzerdefiniert' },
	];

	const WIDTH_OPTIONS: { value: PageWidth; label: string }[] = [
		{ value: 'narrow', label: 'S' },
		{ value: 'medium', label: 'M' },
		{ value: 'wide', label: 'L' },
		{ value: 'full', label: 'XL' },
	];

	const COLUMN_COLORS = [
		'#EF4444',
		'#F59E0B',
		'#22C55E',
		'#3B82F6',
		'#8B5CF6',
		'#EC4899',
		'#14B8A6',
		'#F97316',
		'#6B7280',
	];

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

	function addColumn() {
		if (!activeView) return;
		const newCol = {
			id: `col-${crypto.randomUUID().slice(0, 8)}`,
			name: 'Neue Spalte',
			color: COLUMN_COLORS[activeView.columns.length % COLUMN_COLORS.length],
			match: { type: 'custom' as const, value: `custom-${Date.now()}` },
		};
		updateView({ columns: [...$state.snapshot(activeView.columns), newCol] });
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

	const PAGE_META: Record<string, { title: string; color: string }> = {
		todo: { title: 'To Do', color: '#6B7280' },
		completed: { title: 'Erledigt', color: '#22C55E' },
		today: { title: 'Heute', color: '#F59E0B' },
		overdue: { title: 'Überfällig', color: '#EF4444' },
		all: { title: 'Alle Aufgaben', color: '#3B82F6' },
		'high-priority': { title: 'Hohe Priorität', color: '#EF4444' },
		'this-week': { title: 'Diese Woche', color: '#8B5CF6' },
		'no-date': { title: 'Ohne Datum', color: '#6B7280' },
	};

	let pagePickerEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (showPagePicker && pagePickerEl) {
			pagePickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && editMode) {
			editModeCtx.set(false);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{pageTitle} - Todo</title>
</svelte:head>

<div class="board-page" class:edit-mode={editMode}>
	<!-- Edit Toolbar -->
	{#if editMode && activeView}
		<div class="edit-toolbar">
			<input
				class="edit-name-input"
				type="text"
				value={activeView.name}
				oninput={(e) => updateView({ name: e.currentTarget.value })}
				placeholder="View-Name"
			/>

			<div class="edit-group">
				<span class="edit-label">Gruppierung</span>
				<div class="edit-pills">
					{#each GROUPBY_OPTIONS as opt}
						<button
							class="edit-pill"
							class:active={activeView.groupBy === opt.value}
							onclick={() => updateView({ groupBy: opt.value as LocalBoardView['groupBy'] })}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="edit-group">
				<span class="edit-label">Breite</span>
				<div class="edit-pills">
					{#each WIDTH_OPTIONS as opt}
						<button
							class="edit-pill"
							class:active={todoSettings.pageWidth === opt.value}
							onclick={() => todoSettings.set('pageWidth', opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Minimized Page Tabs -->
	{#if minimizedPages.length > 0}
		<div class="minimized-tabs">
			{#each minimizedPages as page (page.id)}
				{@const meta = PAGE_META[page.id] ?? { title: page.id, color: '#6B7280' }}
				<div
					class="minimized-tab"
					role="button"
					tabindex="0"
					onclick={() => handleRestorePage(page.id)}
				>
					<span class="minimized-tab-dot" style="background-color: {meta.color}"></span>
					<span class="minimized-tab-title">{meta.title}</span>
					<button
						class="minimized-tab-close"
						onclick={(e) => {
							e.stopPropagation();
							handleRemovePage(page.id);
						}}
						title="Schließen"
					>
						<X size={10} />
					</button>
				</div>
			{/each}
			<button class="minimized-tab-add" onclick={togglePagePicker} title="Neue Seite hinzufügen">
				<Plus size={14} />
			</button>
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
			onAddColumn={columnsEditable && editMode ? addColumn : undefined}
		>
			{#snippet trailing()}
				<!-- Secondary Pages -->
				{#each expandedPages as page (page.id)}
					<SecondaryPage
						pageId={page.id}
						onClose={() => handleRemovePage(page.id)}
						onMinimize={() => handleMinimizePage(page.id)}
					/>
				{/each}

				<!-- Neue Seite button (always last in track) -->
				{#if !editMode}
					{#if showPagePicker}
						<div bind:this={pagePickerEl}>
							<PagePicker
								onSelect={handleAddPage}
								onClose={() => (showPagePicker = false)}
								activePageIds={openPages.map((p) => p.id)}
							/>
						</div>
					{:else}
						<button
							class="neue-seite-card"
							onclick={togglePagePicker}
							title="Neue Seite hinzufügen"
						>
							<Plus size={18} />
						</button>
					{/if}
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

	/* ── Minimized Tabs ──────────────────────────────────── */
	.minimized-tabs {
		display: flex;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 1.5rem 0.25rem;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.minimized-tabs::-webkit-scrollbar {
		display: none;
	}

	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.4rem 0.75rem 0.4rem 0.75rem;
		background: #fffef5;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.minimized-tab:hover {
		background: #fffdf0;
		border-color: rgba(0, 0, 0, 0.12);
	}
	:global(.dark) .minimized-tab {
		background: #252220;
		border-color: rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .minimized-tab:hover {
		background: #2a2725;
		border-color: rgba(255, 255, 255, 0.14);
	}

	.minimized-tab-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.minimized-tab-title {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}
	:global(.dark) .minimized-tab-title {
		color: #9ca3af;
	}

	.minimized-tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: none;
		background: transparent;
		color: #d1d5db;
		border-radius: 0.125rem;
		cursor: pointer;
		padding: 0;
		transition: all 0.15s;
	}
	.minimized-tab-close:hover {
		color: #6b7280;
		background: rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .minimized-tab-close {
		color: #4b5563;
	}
	:global(.dark) .minimized-tab-close:hover {
		color: #9ca3af;
		background: rgba(255, 255, 255, 0.08);
	}

	.minimized-tab-add {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.375rem;
		border: 1px dashed rgba(0, 0, 0, 0.15);
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.minimized-tab-add:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, transparent);
	}
	:global(.dark) .minimized-tab-add {
		border-color: rgba(255, 255, 255, 0.1);
		color: #4b5563;
	}
	:global(.dark) .minimized-tab-add:hover {
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

	/* ── Edit Toolbar ─────────────────────────────────────── */
	.edit-toolbar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1.5rem;
		background: rgba(139, 92, 246, 0.06);
		border-bottom: 1px solid rgba(139, 92, 246, 0.15);
		flex-shrink: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.edit-toolbar::-webkit-scrollbar {
		display: none;
	}
	:global(.dark) .edit-toolbar {
		background: rgba(139, 92, 246, 0.1);
		border-bottom-color: rgba(139, 92, 246, 0.2);
	}

	.edit-name-input {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		background: transparent;
		border: none;
		border-bottom: 2px solid rgba(139, 92, 246, 0.3);
		padding: 0.25rem 0;
		outline: none;
		min-width: 120px;
		max-width: 200px;
	}
	.edit-name-input:focus {
		border-bottom-color: #8b5cf6;
	}
	:global(.dark) .edit-name-input {
		color: #f3f4f6;
	}

	.edit-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.edit-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		white-space: nowrap;
	}
	:global(.dark) .edit-label {
		color: #9ca3af;
	}

	.edit-pills {
		display: flex;
		gap: 0.25rem;
	}

	.edit-pill {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.8);
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}
	:global(.dark) .edit-pill {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
		color: #d1d5db;
	}
	.edit-pill:hover {
		border-color: rgba(139, 92, 246, 0.4);
	}
	.edit-pill.active {
		background: #8b5cf6;
		border-color: #8b5cf6;
		color: white;
	}
</style>
