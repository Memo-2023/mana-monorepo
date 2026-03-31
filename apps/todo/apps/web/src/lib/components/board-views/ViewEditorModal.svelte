<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import type { LocalBoardView, ViewColumn } from '$lib/data/local-store';
	import {
		X,
		Plus,
		Columns,
		GridFour,
		Flag,
		Folder,
		CalendarBlank,
		List,
		Star,
		Tag,
		Clock,
		Crosshair,
		Lightning,
		Heart,
		DotsSixVertical,
	} from '@manacore/shared-icons';
	import type { ComponentType } from 'svelte';

	// Map icon names to Phosphor components
	const phosphorIconMap: Record<string, ComponentType> = {
		columns: Columns,
		'grid-four': GridFour,
		flag: Flag,
		folders: Folder,
		calendar: CalendarBlank,
		list: List,
		star: Star,
		tag: Tag,
		clock: Clock,
		target: Crosshair,
		lightning: Lightning,
		heart: Heart,
	};

	interface Props {
		open: boolean;
		view?: LocalBoardView | null;
		onSave: (data: Partial<LocalBoardView>) => void;
		onDelete?: () => void;
		onClose: () => void;
	}

	let { open, view = null, onSave, onDelete, onClose }: Props = $props();

	const isEditMode = $derived(!!view);

	// ─── Icon options ───────────────────────────────────────
	const iconOptions = [
		{ value: 'columns', label: 'Kanban' },
		{ value: 'grid-four', label: 'Matrix' },
		{ value: 'flag', label: 'Flagge' },
		{ value: 'folders', label: 'Ordner' },
		{ value: 'calendar', label: 'Kalender' },
		{ value: 'list', label: 'Liste' },
		{ value: 'star', label: 'Stern' },
		{ value: 'tag', label: 'Tag' },
		{ value: 'clock', label: 'Uhr' },
		{ value: 'target', label: 'Ziel' },
		{ value: 'lightning', label: 'Blitz' },
		{ value: 'heart', label: 'Herz' },
	] as const;

	// ─── GroupBy options ────────────────────────────────────
	const groupByOptions = [
		{ value: 'status', label: 'Status' },
		{ value: 'priority', label: 'Priorität' },
		{ value: 'dueDate', label: 'Fälligkeit' },
		{ value: 'tag', label: 'Tag' },
		{ value: 'custom', label: 'Manuell' },
	] as const;

	// ─── Preset colors ─────────────────────────────────────
	const presetColors = [
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#14b8a6',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#6b7280',
	];

	// ─── Form state ────────────────────────────────────────
	let name = $state('');
	let icon = $state('columns');
	let groupBy = $state<LocalBoardView['groupBy']>('status');
	let layout = $state<'kanban' | 'grid'>('kanban');
	let columns = $state<ViewColumn[]>([]);
	let confirmDelete = $state(false);

	// Color picker state
	let colorPickerColumnId = $state<string | null>(null);

	// Reset form when modal opens or view changes
	$effect(() => {
		if (open) {
			if (view) {
				name = view.name;
				icon = view.icon;
				groupBy = view.groupBy;
				layout = view.layout;
				columns = structuredClone(view.columns);
			} else {
				name = '';
				icon = 'columns';
				groupBy = 'status';
				layout = 'kanban';
				columns = getDefaultColumns('status');
			}
			confirmDelete = false;
			colorPickerColumnId = null;
		}
	});

	// Update columns when groupBy changes (only in create mode or if user switches groupBy)
	let previousGroupBy = $state<string | null>(null);
	$effect(() => {
		if (open && groupBy !== previousGroupBy) {
			// Don't reset columns on initial load in edit mode
			if (previousGroupBy !== null) {
				columns = getDefaultColumns(groupBy);
			}
			previousGroupBy = groupBy;
		}
	});

	function getDefaultColumns(group: LocalBoardView['groupBy']): ViewColumn[] {
		switch (group) {
			case 'status':
				return [
					{
						id: crypto.randomUUID(),
						name: 'To Do',
						color: '#6b7280',
						match: { type: 'status', value: 'pending' },
						onDrop: { setCompleted: false },
					},
					{
						id: crypto.randomUUID(),
						name: 'Erledigt',
						color: '#22c55e',
						match: { type: 'status', value: 'completed' },
						onDrop: { setCompleted: true },
					},
				];
			case 'priority':
				return [
					{
						id: crypto.randomUUID(),
						name: 'Dringend',
						color: '#ef4444',
						match: { type: 'priority', value: 'urgent' },
						onDrop: { setPriority: 'urgent' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Hoch',
						color: '#f97316',
						match: { type: 'priority', value: 'high' },
						onDrop: { setPriority: 'high' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Mittel',
						color: '#3b82f6',
						match: { type: 'priority', value: 'medium' },
						onDrop: { setPriority: 'medium' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Niedrig',
						color: '#6b7280',
						match: { type: 'priority', value: 'low' },
						onDrop: { setPriority: 'low' },
					},
				];
			case 'dueDate':
				return [
					{
						id: crypto.randomUUID(),
						name: 'Überfällig',
						color: '#ef4444',
						match: { type: 'dueDate', value: 'overdue' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Heute',
						color: '#f97316',
						match: { type: 'dueDate', value: 'today' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Morgen',
						color: '#3b82f6',
						match: { type: 'dueDate', value: 'tomorrow' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Diese Woche',
						color: '#8b5cf6',
						match: { type: 'dueDate', value: 'week' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Später',
						color: '#6b7280',
						match: { type: 'dueDate', value: 'later' },
					},
					{
						id: crypto.randomUUID(),
						name: 'Ohne Datum',
						color: '#9ca3af',
						match: { type: 'dueDate', value: 'none' },
					},
				];
			case 'tag':
				return []; // dynamically generated
			case 'custom':
				return [
					{
						id: crypto.randomUUID(),
						name: 'Spalte 1',
						color: '#3b82f6',
						match: { type: 'custom', value: 'col-1', taskIds: [] },
					},
					{
						id: crypto.randomUUID(),
						name: 'Spalte 2',
						color: '#22c55e',
						match: { type: 'custom', value: 'col-2', taskIds: [] },
					},
				];
			default:
				return [];
		}
	}

	// Whether columns are user-editable for this groupBy
	let columnsEditable = $derived(groupBy === 'status' || groupBy === 'custom');

	function addColumn() {
		const num = columns.length + 1;
		columns = [
			...columns,
			{
				id: crypto.randomUUID(),
				name: groupBy === 'status' ? `Status ${num}` : `Spalte ${num}`,
				color: presetColors[num % presetColors.length],
				match: {
					type: groupBy as 'status' | 'custom',
					value: groupBy === 'status' ? `custom-${num}` : `col-${num}`,
					...(groupBy === 'custom' ? { taskIds: [] } : {}),
				},
				...(groupBy === 'status' ? { onDrop: { setCompleted: false } } : {}),
			},
		];
	}

	function removeColumn(id: string) {
		columns = columns.filter((c) => c.id !== id);
	}

	function updateColumnName(id: string, newName: string) {
		columns = columns.map((c) => (c.id === id ? { ...c, name: newName } : c));
	}

	function updateColumnColor(id: string, color: string) {
		columns = columns.map((c) => (c.id === id ? { ...c, color } : c));
		colorPickerColumnId = null;
	}

	function toggleColorPicker(columnId: string) {
		colorPickerColumnId = colorPickerColumnId === columnId ? null : columnId;
	}

	// ─── Column DnD ────────────────────────────────────────
	const columnFlipDurationMs = 150;

	function handleColumnDndConsider(e: CustomEvent<DndEvent<ViewColumn>>) {
		columns = e.detail.items;
	}

	function handleColumnDndFinalize(e: CustomEvent<DndEvent<ViewColumn>>) {
		columns = e.detail.items.filter((c) => c.id !== SHADOW_PLACEHOLDER_ITEM_ID);
	}

	function handleSave() {
		if (!name.trim()) return;
		onSave({
			name: name.trim(),
			icon,
			groupBy,
			layout,
			columns,
		});
	}

	function handleDelete() {
		if (!confirmDelete) {
			confirmDelete = true;
			return;
		}
		onDelete?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label={isEditMode ? 'View bearbeiten' : 'Neue View erstellen'}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 class="modal-title">{isEditMode ? 'View bearbeiten' : 'Neue View'}</h2>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Schließen">
					<X size={20} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<!-- Name -->
				<div class="field">
					<label class="field-label" for="view-name">Name</label>
					<input
						id="view-name"
						type="text"
						class="field-input"
						placeholder="z.B. Mein Kanban Board"
						bind:value={name}
						autofocus
					/>
				</div>

				<!-- Icon -->
				<div class="field">
					<label class="field-label">Icon</label>
					<div class="icon-grid">
						{#each iconOptions as opt (opt.value)}
							<button
								type="button"
								class="icon-option"
								class:selected={icon === opt.value}
								onclick={() => (icon = opt.value)}
								title={opt.label}
							>
								{#if phosphorIconMap[opt.value]}
									{@const IconComp = phosphorIconMap[opt.value]}
									<IconComp size={20} />
								{/if}
								<span class="icon-label">{opt.label}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Group By -->
				<div class="field">
					<label class="field-label" for="view-groupby">Gruppierung</label>
					<select id="view-groupby" class="field-input" bind:value={groupBy}>
						{#each groupByOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Layout -->
				<div class="field">
					<label class="field-label">Layout</label>
					<div class="layout-toggle">
						<button
							type="button"
							class="layout-option"
							class:selected={layout === 'kanban'}
							onclick={() => (layout = 'kanban')}
						>
							<Columns size={16} />
							Kanban
						</button>
						<button
							type="button"
							class="layout-option"
							class:selected={layout === 'grid'}
							onclick={() => (layout = 'grid')}
						>
							<GridFour size={16} />
							Grid
						</button>
					</div>
				</div>

				<!-- Columns -->
				<div class="field">
					<div class="field-label-row">
						<label class="field-label">Spalten</label>
						{#if columnsEditable}
							<button type="button" class="add-col-btn" onclick={addColumn}>
								<Plus size={14} />
								Hinzufügen
							</button>
						{/if}
					</div>

					{#if columns.length === 0}
						<p class="columns-empty">
							{#if groupBy === 'project'}
								Spalten werden automatisch aus deinen Projekten generiert.
							{:else if groupBy === 'tag'}
								Spalten werden automatisch aus deinen Labels generiert.
							{:else}
								Keine Spalten definiert.
							{/if}
						</p>
					{:else}
						<div
							class="columns-list"
							use:dndzone={{
								items: columns,
								flipDurationMs: columnFlipDurationMs,
								dropTargetStyle: {},
								dropTargetClasses: ['columns-drop-target'],
								type: 'editor-columns',
								dragDisabled: !columnsEditable,
							}}
							onconsider={handleColumnDndConsider}
							onfinalize={handleColumnDndFinalize}
						>
							{#each columns.filter((c) => c.id !== SHADOW_PLACEHOLDER_ITEM_ID) as col (col.id)}
								<div class="column-item">
									<!-- Drag handle -->
									{#if columnsEditable}
										<span class="drag-handle" aria-label="Spalte verschieben">
											<DotsSixVertical size={16} weight="bold" />
										</span>
									{/if}

									<!-- Color dot -->
									<div class="color-dot-wrapper">
										<button
											type="button"
											class="color-dot"
											style="background: {col.color}"
											onclick={() => toggleColorPicker(col.id)}
											title="Farbe ändern"
										></button>
										{#if colorPickerColumnId === col.id}
											<div class="color-picker-dropdown">
												{#each presetColors as color (color)}
													<button
														type="button"
														class="color-swatch"
														class:selected={col.color === color}
														style="background: {color}"
														onclick={() => updateColumnColor(col.id, color)}
													></button>
												{/each}
											</div>
										{/if}
									</div>

									<!-- Name input -->
									{#if columnsEditable}
										<input
											type="text"
											class="column-name-input"
											value={col.name}
											oninput={(e) =>
												updateColumnName(col.id, (e.target as HTMLInputElement).value)}
										/>
									{:else}
										<span class="column-name-text">{col.name}</span>
									{/if}

									<!-- Delete button -->
									{#if columnsEditable}
										<button
											type="button"
											class="column-delete-btn"
											onclick={() => removeColumn(col.id)}
											title="Spalte entfernen"
										>
											<X size={14} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Column Preview -->
				{#if columns.length > 0}
					<div class="field">
						<label class="field-label">Vorschau</label>
						<div class="columns-preview" class:grid-preview={layout === 'grid'}>
							{#each columns as col (col.id)}
								<div class="preview-col">
									<div class="preview-col-header" style="border-color: {col.color}">
										<span class="preview-dot" style="background: {col.color}"></span>
										<span class="preview-name">{col.name}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				{#if isEditMode && onDelete}
					<button
						type="button"
						class="delete-btn"
						class:confirm={confirmDelete}
						onclick={handleDelete}
					>
						{confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
					</button>
				{:else}
					<div></div>
				{/if}

				<div class="footer-actions">
					<button type="button" class="cancel-btn" onclick={onClose}>Abbrechen</button>
					<button type="button" class="save-btn" disabled={!name.trim()} onclick={handleSave}>
						{isEditMode ? 'Speichern' : 'Erstellen'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ─── Backdrop ──────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		padding: 1rem;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* ─── Modal ─────────────────────────────────────────────── */
	.modal-content {
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.25rem;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		animation: slideUp 0.2s ease-out;
	}

	:global(.dark) .modal-content {
		background: rgba(30, 30, 40, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* ─── Header ────────────────────────────────────────────── */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgba(255, 255, 255, 0.08);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .modal-title {
		color: #f3f4f6;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 0.5rem;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	/* ─── Body ──────────────────────────────────────────────── */
	.modal-body {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.field {
		margin-bottom: 1.25rem;
	}

	.field:last-child {
		margin-bottom: 0;
	}

	.field-label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6b7280;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.dark) .field-label {
		color: #9ca3af;
	}

	.field-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.field-label-row .field-label {
		margin-bottom: 0;
	}

	.field-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.875rem;
		color: #111827;
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		outline: none;
		transition: all 0.15s;
	}

	.field-input:focus {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
	}

	:global(.dark) .field-input {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .field-input:focus {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25);
	}

	/* ─── Icon Grid ─────────────────────────────────────────── */
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.375rem;
	}

	@media (max-width: 480px) {
		.icon-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.icon-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.25rem;
		border: 1px solid transparent;
		border-radius: 0.625rem;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-option:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}

	:global(.dark) .icon-option {
		color: #9ca3af;
	}

	:global(.dark) .icon-option:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}

	.icon-option.selected {
		background: rgba(139, 92, 246, 0.1);
		border-color: #8b5cf6;
		color: #8b5cf6;
	}

	:global(.dark) .icon-option.selected {
		background: rgba(139, 92, 246, 0.2);
		border-color: #8b5cf6;
		color: #a78bfa;
	}

	.icon-label {
		font-size: 0.625rem;
		font-weight: 500;
		text-align: center;
		line-height: 1.2;
	}

	/* ─── Layout Toggle ─────────────────────────────────────── */
	.layout-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.layout-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.layout-option:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .layout-option {
		color: #9ca3af;
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .layout-option:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.18);
	}

	.layout-option.selected {
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
		border-color: #8b5cf6;
	}

	:global(.dark) .layout-option.selected {
		color: #a78bfa;
		background: rgba(139, 92, 246, 0.15);
		border-color: #8b5cf6;
	}

	/* ─── Columns List ──────────────────────────────────────── */
	.columns-empty {
		font-size: 0.8125rem;
		color: #9ca3af;
		font-style: italic;
		margin: 0;
	}

	.add-col-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.add-col-btn:hover {
		background: rgba(139, 92, 246, 0.2);
	}

	.columns-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.column-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 0.625rem;
		transition: all 0.15s;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #d1d5db;
		cursor: grab;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.column-item:hover .drag-handle {
		opacity: 1;
	}

	:global(.dark) .drag-handle {
		color: #4b5563;
	}

	:global(.columns-drop-target) {
		outline: 2px dashed #8b5cf6;
		outline-offset: -2px;
		border-radius: 0.625rem;
		background: rgba(139, 92, 246, 0.05);
	}

	:global(.dark) .column-item {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.color-dot-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.color-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: transform 0.15s;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
	}

	.color-dot:hover {
		transform: scale(1.15);
	}

	.color-picker-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 10;
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		margin-top: 0.25rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .color-picker-dropdown {
		background: rgba(30, 30, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.color-swatch {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
	}

	.color-swatch:hover {
		transform: scale(1.2);
	}

	.color-swatch.selected {
		border-color: white;
		box-shadow: 0 0 0 2px currentColor;
	}

	.column-name-input {
		flex: 1;
		min-width: 0;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: #374151;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		outline: none;
		transition: all 0.15s;
	}

	.column-name-input:focus {
		background: rgba(255, 255, 255, 0.5);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .column-name-input {
		color: #e5e7eb;
	}

	:global(.dark) .column-name-input:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.column-name-text {
		flex: 1;
		font-size: 0.8125rem;
		color: #374151;
	}

	:global(.dark) .column-name-text {
		color: #e5e7eb;
	}

	.column-delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: #d1d5db;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.column-delete-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	/* ─── Column Preview ────────────────────────────────────── */
	.columns-preview {
		display: flex;
		gap: 0.375rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.columns-preview.grid-preview {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		overflow-x: visible;
	}

	.preview-col {
		flex: 1;
		min-width: 80px;
	}

	.preview-col-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-top: 2px solid;
		border-radius: 0.5rem;
		font-size: 0.75rem;
	}

	:global(.dark) .preview-col-header {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.preview-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.preview-name {
		color: #6b7280;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .preview-name {
		color: #9ca3af;
	}

	/* ─── Footer ────────────────────────────────────────────── */
	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .modal-footer {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	.footer-actions {
		display: flex;
		gap: 0.5rem;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.cancel-btn:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .cancel-btn {
		color: #9ca3af;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .cancel-btn:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.save-btn {
		padding: 0.5rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		background: #8b5cf6;
		border: none;
		border-radius: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
		box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
	}

	.save-btn:hover:not(:disabled) {
		background: #7c3aed;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(139, 92, 246, 0.4);
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.delete-btn {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.15);
	}

	.delete-btn.confirm {
		background: #ef4444;
		color: white;
		border-color: #ef4444;
	}

	.delete-btn.confirm:hover {
		background: #dc2626;
		border-color: #dc2626;
	}
</style>
