<script lang="ts">
	import { getContext } from 'svelte';
	import { ArrowLeft, ArrowRight, Trash } from '@manacore/shared-icons';

	interface Props {
		name: string;
		color: string;
		taskCount: number;
		columnIndex?: number;
		totalColumns?: number;
		onRename?: (name: string) => void;
		onColorChange?: (color: string) => void;
		onMove?: (dir: -1 | 1) => void;
		onDelete?: () => void;
	}

	let {
		name,
		color,
		taskCount,
		columnIndex = 0,
		totalColumns = 1,
		onRename,
		onColorChange,
		onMove,
		onDelete,
	}: Props = $props();

	const editModeCtx: { readonly active: boolean } | undefined = getContext('editMode');
	let editMode = $derived(editModeCtx?.active ?? false);
	let editable = $derived(editMode && !!onRename);

	let showColorPicker = $state(false);

	const PRESET_COLORS = [
		'#EF4444',
		'#F97316',
		'#F59E0B',
		'#EAB308',
		'#22C55E',
		'#14B8A6',
		'#06B6D4',
		'#3B82F6',
		'#6366F1',
		'#8B5CF6',
		'#A855F7',
		'#EC4899',
		'#F43F5E',
		'#78716C',
		'#6B7280',
		'#334155',
	];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showColorPicker}
	<div class="picker-backdrop" onclick={() => (showColorPicker = false)}></div>
{/if}

<div class="column-header" class:editing={editable}>
	{#if editable}
		<!-- Edit mode: same layout, color dot is clickable, name is input -->
		<div class="header-left">
			<div class="color-dot-wrapper">
				<button
					class="color-dot editable"
					style="background-color: {color}"
					onclick={() => (showColorPicker = !showColorPicker)}
					title="Farbe ändern"
				></button>

				{#if showColorPicker}
					<div class="color-picker" onclick={(e) => e.stopPropagation()}>
						<div class="picker-grid">
							{#each PRESET_COLORS as c}
								<button
									class="picker-swatch"
									class:active={color === c}
									style="background-color: {c}"
									onclick={() => {
										onColorChange?.(c);
										showColorPicker = false;
									}}
								></button>
							{/each}
						</div>
						<label class="custom-color-row">
							<span class="custom-label">Eigene:</span>
							<input
								type="color"
								value={color}
								oninput={(e) => onColorChange?.(e.currentTarget.value)}
								class="custom-color-input"
							/>
						</label>
					</div>
				{/if}
			</div>

			<input
				class="name-input"
				type="text"
				value={name}
				oninput={(e) => onRename?.(e.currentTarget.value)}
			/>
		</div>

		<div class="edit-actions">
			<button
				class="act-btn"
				onclick={() => onMove?.(-1)}
				disabled={columnIndex === 0}
				title="Nach links"
			>
				<ArrowLeft size={12} />
			</button>
			<button
				class="act-btn"
				onclick={() => onMove?.(1)}
				disabled={columnIndex >= totalColumns - 1}
				title="Nach rechts"
			>
				<ArrowRight size={12} />
			</button>
			<button
				class="act-btn del-btn"
				onclick={() => onDelete?.()}
				disabled={totalColumns <= 1}
				title="Spalte löschen"
			>
				<Trash size={12} />
			</button>
		</div>
	{:else}
		<!-- Normal mode -->
		<div class="header-left">
			<span class="color-dot" style="background-color: {color}"></span>
			<span class="column-name">{name}</span>
		</div>
		<span class="task-count">{taskCount}</span>
	{/if}
</div>

<style>
	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		flex: 1;
	}

	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.column-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .column-name {
		color: #f3f4f6;
	}

	.task-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	:global(.dark) .task-count {
		background: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}

	/* ── Edit mode ────────────────────────────────────────── */

	.color-dot-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.color-dot.editable {
		width: 0.875rem;
		height: 0.875rem;
		cursor: pointer;
		border: none;
		padding: 0;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
		transition: all 0.15s;
	}
	.color-dot.editable:hover {
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.7);
		transform: scale(1.15);
	}

	.name-input {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(139, 92, 246, 0.3);
		padding: 0.125rem 0;
		outline: none;
		min-width: 0;
	}
	.name-input:focus {
		border-bottom-color: #8b5cf6;
	}
	:global(.dark) .name-input {
		color: #f3f4f6;
	}

	.edit-actions {
		display: flex;
		gap: 0.125rem;
		flex-shrink: 0;
		margin-left: 0.375rem;
	}

	.act-btn {
		padding: 0.2rem;
		border-radius: 0.25rem;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
		background: transparent;
		border: none;
		line-height: 0;
	}
	.act-btn:hover:not(:disabled) {
		color: #374151;
		background: rgba(0, 0, 0, 0.06);
	}
	.act-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
	:global(.dark) .act-btn:hover:not(:disabled) {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.1);
	}
	.del-btn:hover:not(:disabled) {
		color: #ef4444 !important;
		background: rgba(239, 68, 68, 0.1) !important;
	}

	/* ── Color Picker Popup ──────────────────────────────── */

	.picker-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.color-picker {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		z-index: 51;
		background: var(--color-surface-elevated-3);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		box-shadow: var(--shadow-xl);
		padding: 0.625rem;
		min-width: 170px;
	}

	.picker-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.picker-swatch {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
	}
	.picker-swatch:hover {
		transform: scale(1.15);
	}
	.picker-swatch.active {
		border-color: var(--color-surface-elevated-3);
		box-shadow: 0 0 0 2px currentColor;
	}

	.custom-color-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.375rem;
		border-top: 1px solid var(--color-border);
	}

	.custom-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--color-muted-foreground);
	}

	.custom-color-input {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		background: transparent;
	}
	.custom-color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	.custom-color-input::-webkit-color-swatch {
		border: 2px solid var(--color-border);
		border-radius: 50%;
	}
</style>
