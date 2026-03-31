<script lang="ts">
	import type { Subtask } from '@todo/shared';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { Check, Plus, X, DotsSixVertical } from '@manacore/shared-icons';

	interface Props {
		subtasks: Subtask[];
		onChange: (subtasks: Subtask[]) => void;
	}

	let { subtasks, onChange }: Props = $props();

	let newSubtaskTitle = $state('');
	let editingId = $state<string | null>(null);
	let editingTitle = $state('');

	// Convert subtasks to items with id for dnd
	let items = $derived(
		subtasks.map((s, index) => ({
			...s,
			id: s.id,
			order: index,
		}))
	);

	function handleDndConsider(e: CustomEvent<{ items: Subtask[] }>) {
		onChange(e.detail.items.map((item, index) => ({ ...item, order: index })));
	}

	function handleDndFinalize(e: CustomEvent<{ items: Subtask[] }>) {
		onChange(e.detail.items.map((item, index) => ({ ...item, order: index })));
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

	function startEditing(subtask: Subtask) {
		editingId = subtask.id;
		editingTitle = subtask.title;
	}

	function saveEdit() {
		if (!editingId || !editingTitle.trim()) {
			cancelEdit();
			return;
		}
		const updated = subtasks.map((s) =>
			s.id === editingId ? { ...s, title: editingTitle.trim() } : s
		);
		onChange(updated);
		cancelEdit();
	}

	function cancelEdit() {
		editingId = null;
		editingTitle = '';
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveEdit();
		} else if (e.key === 'Escape') {
			cancelEdit();
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
				<div class="subtask-item" animate:flip={{ duration: 200 }}>
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

					<!-- Title (editable) -->
					{#if editingId === subtask.id}
						<input
							type="text"
							class="subtask-edit-input"
							bind:value={editingTitle}
							onkeydown={handleEditKeydown}
							onblur={saveEdit}
						/>
					{:else}
						<button
							type="button"
							class="subtask-title"
							class:completed={subtask.isCompleted}
							ondblclick={() => startEditing(subtask)}
						>
							{subtask.title}
						</button>
					{/if}

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
		background: rgba(0, 0, 0, 0.03);
		transition: all 0.15s;
	}

	:global(.dark) .subtask-item {
		background: rgba(255, 255, 255, 0.05);
	}

	.subtask-item:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .subtask-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.drag-handle {
		cursor: grab;
		color: #9ca3af;
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
		border: 2px solid rgba(0, 0, 0, 0.2);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	:global(.dark) .subtask-checkbox {
		border-color: rgba(255, 255, 255, 0.3);
	}

	.subtask-checkbox:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
	}

	.subtask-checkbox.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.check-icon {
		width: 0.625rem;
		height: 0.625rem;
		color: white;
	}

	.subtask-title {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		font-size: 0.875rem;
		color: #374151;
		cursor: text;
	}

	:global(.dark) .subtask-title {
		color: #e5e7eb;
	}

	.subtask-title.completed {
		text-decoration: line-through;
		color: #9ca3af;
	}

	.subtask-edit-input {
		flex: 1;
		background: white;
		border: 1px solid #8b5cf6;
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		outline: none;
	}

	:global(.dark) .subtask-edit-input {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}

	.subtask-delete {
		opacity: 0;
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.15s;
	}

	.subtask-item:hover .subtask-delete {
		opacity: 1;
	}

	.subtask-delete:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	/* Add subtask */
	.add-subtask {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		border: 1px dashed rgba(0, 0, 0, 0.15);
		transition: all 0.15s;
	}

	:global(.dark) .add-subtask {
		border-color: rgba(255, 255, 255, 0.15);
	}

	.add-subtask:focus-within {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.05);
	}

	.add-icon {
		color: #9ca3af;
	}

	.add-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.875rem;
		color: #374151;
	}

	.add-input::placeholder {
		color: #9ca3af;
	}

	:global(.dark) .add-input {
		color: #e5e7eb;
	}

	.add-btn {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: white;
		background: #8b5cf6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.add-btn:hover {
		background: #7c3aed;
	}
</style>
