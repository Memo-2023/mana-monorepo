<script lang="ts">
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

	let showColorPicker = $state(false);
	let isEditingName = $state(false);
	let editInputEl = $state<HTMLInputElement | null>(null);

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

	function startEditing() {
		if (!onRename) return;
		isEditingName = true;
		requestAnimationFrame(() => {
			editInputEl?.select();
		});
	}

	function finishEditing() {
		isEditingName = false;
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') {
			e.preventDefault();
			finishEditing();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showColorPicker}
	<div class="picker-backdrop" onclick={() => (showColorPicker = false)}></div>
{/if}

<div class="column-header">
	<div class="header-left">
		{#if onColorChange}
			<div class="color-dot-wrapper">
				<button
					class="color-dot clickable"
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
										onColorChange(c);
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
								oninput={(e) => onColorChange(e.currentTarget.value)}
								class="custom-color-input"
							/>
						</label>
					</div>
				{/if}
			</div>
		{:else}
			<span class="color-dot" style="background-color: {color}"></span>
		{/if}

		{#if isEditingName && onRename}
			<input
				bind:this={editInputEl}
				class="name-input"
				type="text"
				value={name}
				oninput={(e) => onRename(e.currentTarget.value)}
				onblur={finishEditing}
				onkeydown={handleNameKeydown}
			/>
		{:else}
			<span
				class="column-name"
				class:editable={!!onRename}
				role={onRename ? 'button' : undefined}
				tabindex={onRename ? 0 : undefined}
				onclick={startEditing}
				onkeydown={(e) => {
					if (e.key === 'Enter') startEditing();
				}}>{name}</span
			>
		{/if}
	</div>
	<span class="task-count">{taskCount}</span>
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

	.color-dot-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.color-dot.clickable {
		width: 0.75rem;
		height: 0.75rem;
		cursor: pointer;
		border: none;
		padding: 0;
		transition: all 0.15s;
	}
	.color-dot.clickable:hover {
		transform: scale(1.25);
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .color-dot.clickable:hover {
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
	}

	.column-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.column-name.editable {
		cursor: text;
		border-radius: 0.125rem;
		padding: 0.0625rem 0.25rem;
		margin: -0.0625rem -0.25rem;
	}
	.column-name.editable:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .column-name.editable:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	:global(.dark) .column-name {
		color: #f3f4f6;
	}

	.name-input {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(139, 92, 246, 0.4);
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
