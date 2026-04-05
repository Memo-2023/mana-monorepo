<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Subtask } from '../types';
	import { Check, Circle, Plus, X } from '@mana/shared-icons';

	interface Props {
		subtasks: Subtask[];
		onChange: (subtasks: Subtask[]) => void;
		readonly?: boolean;
	}

	let { subtasks, onChange, readonly = false }: Props = $props();

	let newTitle = $state('');

	function toggleSubtask(id: string) {
		onChange(
			subtasks.map((s) =>
				s.id === id
					? {
							...s,
							isCompleted: !s.isCompleted,
							completedAt: !s.isCompleted ? new Date().toISOString() : null,
						}
					: s
			)
		);
	}

	function removeSubtask(id: string) {
		onChange(subtasks.filter((s) => s.id !== id));
	}

	function addSubtask() {
		const text = newTitle.trim();
		if (!text) return;
		onChange([
			...subtasks,
			{
				id: crypto.randomUUID(),
				title: text,
				isCompleted: false,
				order: subtasks.length,
			},
		]);
		newTitle = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addSubtask();
		}
	}
</script>

<div class="space-y-1">
	{#each subtasks as subtask (subtask.id)}
		<div class="group flex items-center gap-2">
			<button
				type="button"
				onclick={() => toggleSubtask(subtask.id)}
				class="flex-shrink-0 transition-colors {subtask.isCompleted
					? 'text-green-500'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				{#if subtask.isCompleted}
					<Check size={14} weight="bold" />
				{:else}
					<Circle size={14} />
				{/if}
			</button>
			<span
				class="flex-1 text-sm {subtask.isCompleted
					? 'text-muted-foreground line-through'
					: 'text-foreground'}"
			>
				{subtask.title}
			</span>
			{#if !readonly}
				<button
					type="button"
					onclick={() => removeSubtask(subtask.id)}
					class="flex-shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
				>
					<X size={12} />
				</button>
			{/if}
		</div>
	{/each}

	{#if !readonly}
		<div class="flex items-center gap-2">
			<Plus size={14} class="flex-shrink-0 text-muted-foreground" />
			<input
				type="text"
				bind:value={newTitle}
				onkeydown={handleKeydown}
				placeholder={$_('todo.addSubtask')}
				class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
			/>
		</div>
	{/if}
</div>
