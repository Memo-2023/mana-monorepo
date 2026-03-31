<script lang="ts">
	import type { Subtask } from '@todo/shared';
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { untrack } from 'svelte';
	import { Check, Plus, X, DotsSixVertical } from '@manacore/shared-icons';

	interface Props {
		subtasks: Subtask[];
		onChange: (subtasks: Subtask[]) => void;
	}

	let { subtasks, onChange }: Props = $props();

	let newSubtaskTitle = $state('');
	let items = $state<Subtask[]>([]);
	let dropInProgress = false;

	$effect(() => {
		const current = subtasks;
		untrack(() => {
			const currentIds = new Set(current.map((s) => s.id));
			const itemIds = new Set(items.filter((i) => i.id !== SHADOW_PLACEHOLDER_ITEM_ID).map((i) => i.id));
			const idsChanged =
				currentIds.size !== itemIds.size || current.some((s) => !itemIds.has(s.id));

			if (idsChanged) {
				items = current.map((s, i) => ({ ...s, order: i }));
				dropInProgress = false;
			} else if (!dropInProgress) {
				const map = new Map(current.map((s) => [s.id, s]));
				items = items.map((item) => map.get(item.id) ?? item);
			}
		});
	});

	function handleDndConsider(e: CustomEvent<{ items: Subtask[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: Subtask[] }>) {
		items = e.detail.items.filter((item) => item.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		onChange(items.map((item, index) => ({ ...item, order: index })));
		dropInProgress = true;
		setTimeout(() => { dropInProgress = false; }, 500);
	}

	function toggleComplete(id: string) {
		const updated = subtasks.map((s) =>
			s.id === id
				? {
						...s,
						isCompleted: !s.isCompleted,
						completedAt: !s.isCompleted ? new Date().toISOString() : null,
					}
				: s
		);
		onChange(updated);
	}

	function deleteSubtask(id: string) {
		onChange(subtasks.filter((s) => s.id !== id));
	}

	function handleTitleBlur(e: FocusEvent, subtask: Subtask) {
		const el = e.target as HTMLElement;
		const trimmed = (el.textContent || '').trim();
		if (trimmed && trimmed !== subtask.title) {
			onChange(subtasks.map((s) => (s.id === subtask.id ? { ...s, title: trimmed } : s)));
		} else {
			el.textContent = subtask.title;
		}
	}

	function handleTitleKeydown(e: KeyboardEvent, subtask: Subtask) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		} else if (e.key === 'Escape') {
			const el = e.target as HTMLElement;
			el.textContent = subtask.title;
			el.blur();
		}
	}

	function addSubtask() {
		if (!newSubtaskTitle.trim()) return;

		const newSubtask: Subtask = {
			id: crypto.randomUUID(),
			title: newSubtaskTitle.trim(),
			isCompleted: false,
			order: subtasks.length,
		};

		onChange([...subtasks, newSubtask]);
		newSubtaskTitle = '';
	}

	function handleAddKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addSubtask();
		}
	}
</script>

<div class="subtask-list">
	{#if items.length > 0}
		<div
			class="subtask-items"
			use:dndzone={{ items, flipDurationMs: 200, dropTargetStyle: {} }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each items as subtask (subtask.id)}
				<div
					class="subtask-item"
					animate:flip={{ duration: 200 }}
					onpointerdown={(e) => {
						if (!(e.target as HTMLElement).closest('.drag-handle')) e.stopPropagation();
					}}
				>
					<!-- Drag handle -->
					<div class="drag-handle" aria-label="Ziehen zum Sortieren">
						<DotsSixVertical size={16} />
					</div>

					<!-- Checkbox -->
					<button
						type="button"
						class="subtask-checkbox"
						class:checked={subtask.isCompleted}
						onclick={() => toggleComplete(subtask.id)}
					>
						{#if subtask.isCompleted}
							<Check size={20} class="check-icon" />
						{/if}
					</button>

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						class="subtask-title"
						class:completed={subtask.isCompleted}
						contenteditable="true"
						role="textbox"
						spellcheck="false"
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => handleTitleKeydown(e, subtask)}
						onblur={(e) => handleTitleBlur(e, subtask)}
					>{subtask.title}</span>

					<!-- Delete button -->
					<button
						type="button"
						class="subtask-delete"
						onclick={() => deleteSubtask(subtask.id)}
						title="Löschen"
					>
						<X size={16} />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add new subtask -->
	<div class="add-subtask">
		<div class="add-icon">
			<Plus size={16} />
		</div>
		<input
			type="text"
			class="add-input"
			placeholder="Subtask hinzufügen..."
			bind:value={newSubtaskTitle}
			onkeydown={handleAddKeydown}
		/>
		{#if newSubtaskTitle.trim()}
			<button type="button" class="add-btn" onclick={addSubtask}> Hinzufügen </button>
		{/if}
	</div>
</div>

<style>
	.subtask-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.subtask-items {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.subtask-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		background: var(--color-surface);
		transition: all 0.15s;
	}

	.subtask-item:hover {
		background: var(--color-surface-hover);
	}

	.drag-handle {
		cursor: grab;
		color: var(--color-muted-foreground);
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 0.15s;
	}

	.subtask-item:hover .drag-handle {
		opacity: 1;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.subtask-checkbox {
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 0.25rem;
		border: 2px solid var(--color-border);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	.subtask-checkbox:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.subtask-checkbox.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.check-icon {
		width: 0.625rem;
		height: 0.625rem;
		color: white;
	}

	.subtask-title {
		flex: 1;
		font-size: 0.875rem;
		color: var(--color-foreground);
		cursor: text;
		outline: none;
		word-break: break-word;
		min-width: 0;
	}

	.subtask-title.completed {
		text-decoration: line-through;
		color: var(--color-muted-foreground);
	}

	.subtask-delete {
		opacity: 0;
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.15s;
	}

	.subtask-item:hover .subtask-delete {
		opacity: 1;
	}

	.subtask-delete:hover {
		color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
	}

	/* Add subtask */
	.add-subtask {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		border: 1px dashed var(--color-border);
		transition: all 0.15s;
	}

	.add-subtask:focus-within {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, transparent);
	}

	.add-icon {
		color: var(--color-muted-foreground);
	}

	.add-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.875rem;
		color: var(--color-foreground);
	}

	.add-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.add-btn {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: white;
		background: var(--color-primary);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.add-btn:hover {
		background: var(--color-primary-hover);
	}
</style>
