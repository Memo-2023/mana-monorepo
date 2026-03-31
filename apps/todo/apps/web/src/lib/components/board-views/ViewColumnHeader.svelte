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

	const COLORS = [
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
</script>

<div class="column-header" class:editing={editable}>
	{#if editable}
		<!-- Edit mode: color dots + name input + actions -->
		<div class="edit-header">
			<div class="color-row">
				{#each COLORS as c}
					<button
						class="color-pick"
						class:active={color === c}
						style="background-color: {c}"
						onclick={() => onColorChange?.(c)}
					></button>
				{/each}
			</div>
			<div class="edit-row">
				<input
					class="name-input"
					type="text"
					value={name}
					oninput={(e) => onRename?.(e.currentTarget.value)}
				/>
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
			</div>
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

	.column-header.editing {
		padding: 0.5rem 0.75rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
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
	.edit-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.color-row {
		display: flex;
		gap: 0.2rem;
	}

	.color-pick {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
	}
	.color-pick:hover {
		transform: scale(1.25);
	}
	.color-pick.active {
		border-color: white;
		box-shadow: 0 0 0 1.5px currentColor;
		transform: scale(1.15);
	}

	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.name-input {
		flex: 1;
		font-size: 0.8125rem;
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
</style>
