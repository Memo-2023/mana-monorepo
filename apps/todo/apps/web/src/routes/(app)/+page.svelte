<script lang="ts">
	import { getContext } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { todoSettings, type PageWidth } from '$lib/stores/settings.svelte';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';
	import { ArrowLeft, ArrowRight, Plus, Trash } from '@manacore/shared-icons';

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

		<!-- Column Editor -->
		{#if columnsEditable}
			<div class="column-editor">
				{#each activeView.columns as col, i (col.id)}
					<div class="col-edit-card">
						<div class="col-colors">
							{#each COLUMN_COLORS as c}
								<button
									class="col-color-dot"
									class:active={col.color === c}
									style="background-color: {c}"
									onclick={() => updateColumn(i, { color: c })}
								></button>
							{/each}
						</div>
						<input
							class="col-name-input"
							type="text"
							value={col.name}
							oninput={(e) => updateColumn(i, { name: e.currentTarget.value })}
						/>
						<div class="col-actions">
							<button
								class="col-action-btn"
								onclick={() => moveColumn(i, -1)}
								disabled={i === 0}
								title="Nach links"
							>
								<ArrowLeft size={14} />
							</button>
							<button
								class="col-action-btn"
								onclick={() => moveColumn(i, 1)}
								disabled={i === activeView.columns.length - 1}
								title="Nach rechts"
							>
								<ArrowRight size={14} />
							</button>
							<button
								class="col-action-btn col-delete-btn"
								onclick={() => removeColumn(i)}
								disabled={activeView.columns.length <= 1}
								title="Spalte löschen"
							>
								<Trash size={14} />
							</button>
						</div>
					</div>
				{/each}
				<button class="col-add-btn" onclick={addColumn} title="Spalte hinzufügen">
					<Plus size={16} />
				</button>
			</div>
		{:else}
			<p class="columns-hint">Spalten werden automatisch aus der Gruppierung erzeugt.</p>
		{/if}
	{/if}

	<!-- Board Content -->
	{#if activeView}
		<BoardViewRenderer view={activeView} {layoutOverride} />
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

	/* ── Column Editor ────────────────────────────────────── */
	.column-editor {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		flex-shrink: 0;
		background: rgba(139, 92, 246, 0.03);
		border-bottom: 1px solid rgba(139, 92, 246, 0.08);
	}
	.column-editor::-webkit-scrollbar {
		display: none;
	}
	:global(.dark) .column-editor {
		background: rgba(139, 92, 246, 0.05);
		border-bottom-color: rgba(139, 92, 246, 0.12);
	}

	.col-edit-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.5rem;
		min-width: 140px;
		flex-shrink: 0;
	}
	:global(.dark) .col-edit-card {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.col-colors {
		display: flex;
		gap: 0.25rem;
	}

	.col-color-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
	}
	.col-color-dot:hover {
		transform: scale(1.2);
	}
	.col-color-dot.active {
		border-color: white;
		box-shadow: 0 0 0 2px currentColor;
		transform: scale(1.15);
	}

	.col-name-input {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #374151;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		padding: 0.125rem 0;
		outline: none;
		width: 100%;
	}
	.col-name-input:focus {
		border-bottom-color: #8b5cf6;
	}
	:global(.dark) .col-name-input {
		color: #f3f4f6;
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.col-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.col-action-btn {
		padding: 0.25rem;
		border-radius: 0.25rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
		background: transparent;
		border: none;
	}
	.col-action-btn:hover:not(:disabled) {
		color: #374151;
		background: rgba(0, 0, 0, 0.05);
	}
	.col-action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	:global(.dark) .col-action-btn {
		color: #9ca3af;
	}
	:global(.dark) .col-action-btn:hover:not(:disabled) {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.1);
	}

	.col-delete-btn:hover:not(:disabled) {
		color: #ef4444 !important;
		background: rgba(239, 68, 68, 0.1) !important;
	}

	.col-add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		border: 2px dashed rgba(139, 92, 246, 0.3);
		color: #8b5cf6;
		background: transparent;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		align-self: center;
	}
	.col-add-btn:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.08);
	}

	.columns-hint {
		padding: 0.5rem 1.5rem;
		font-size: 0.75rem;
		color: #9ca3af;
		flex-shrink: 0;
	}
</style>
