<script lang="ts">
	import { getContext } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { todoSettings, type PageWidth } from '$lib/stores/settings.svelte';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';

	// Get active view + edit mode from layout context
	const activeViewCtx: { readonly value: LocalBoardView | null } = getContext('activeView');
	const editModeCtx: { readonly active: boolean; toggle(): void; set(val: boolean): void } =
		getContext('editMode');

	let editMode = $derived(editModeCtx.active);

	const LAYOUT_MAP = {
		fokus: 'fokus',
		uebersicht: 'kanban',
		matrix: 'grid',
	} as const;

	let layoutOverride = $derived(LAYOUT_MAP[todoSettings.activeLayoutMode]);
	let activeView = $derived(activeViewCtx.value);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');

	// ── Edit helpers ────────────────────────────────────────

	const GROUPBY_OPTIONS = [
		{ value: 'status', label: 'Status' },
		{ value: 'priority', label: 'Priorität' },
		{ value: 'project', label: 'Projekt' },
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
		const cols = activeView.columns.map((c, i) => (i === colIdx ? { ...c, ...data } : { ...c }));
		updateView({ columns: cols });
	}

	function removeColumn(colIdx: number) {
		if (!activeView || activeView.columns.length <= 1) return;
		updateView({ columns: activeView.columns.filter((_, i) => i !== colIdx) });
	}

	function addColumn() {
		if (!activeView) return;
		const newCol = {
			id: `col-${crypto.randomUUID().slice(0, 8)}`,
			name: 'Neue Spalte',
			color: COLUMN_COLORS[activeView.columns.length % COLUMN_COLORS.length],
			match: { type: 'custom' as const, value: `custom-${Date.now()}` },
		};
		updateView({ columns: [...activeView.columns, newCol] });
	}

	function moveColumn(colIdx: number, dir: -1 | 1) {
		if (!activeView) return;
		const cols = [...activeView.columns];
		const target = colIdx + dir;
		if (target < 0 || target >= cols.length) return;
		[cols[colIdx], cols[target]] = [cols[target], cols[colIdx]];
		updateView({ columns: cols });
	}

	let columnsEditable = $derived(
		activeView?.groupBy === 'status' || activeView?.groupBy === 'custom'
	);

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

	<!-- Board Content -->
	{#if activeView}
		<BoardViewRenderer
			view={activeView}
			{layoutOverride}
			onColumnRename={columnsEditable ? (i, name) => updateColumn(i, { name }) : undefined}
			onColumnColorChange={columnsEditable ? (i, color) => updateColumn(i, { color }) : undefined}
			onColumnMove={columnsEditable ? moveColumn : undefined}
			onColumnDelete={columnsEditable ? removeColumn : undefined}
			onAddColumn={columnsEditable && editMode ? addColumn : undefined}
		/>
	{:else}
		<div class="empty-state">
			<p class="text-muted-foreground">Views werden geladen...</p>
		</div>
	{/if}
</div>

<style>
	.board-page {
		height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
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
