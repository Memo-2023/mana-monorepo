<script lang="ts">
	import { getDateFnsLocale } from '$lib/i18n/format';
	import type { Task } from '../../types';
	import { isToday, isPast, format } from 'date-fns';
	import { Check, Circle, CalendarBlank, CheckSquare, Flag, Trash } from '@mana/shared-icons';
	import { TagChip } from '@mana/shared-ui';

	interface Props {
		task: Task;
		labels?: { id: string; name: string; color: string }[];
		onToggleComplete?: () => void;
		onSave?: (data: Partial<Task>) => void;
		onDelete?: () => void;
	}

	let { task, labels = [], onToggleComplete, onSave, onDelete }: Props = $props();

	// Label resolution
	let taskLabelIds = $derived((task.metadata as { labelIds?: string[] })?.labelIds ?? []);
	let taskLabels = $derived(
		taskLabelIds
			.map((id) => labels.find((l) => l.id === id))
			.filter((l): l is NonNullable<typeof l> => l != null)
			.slice(0, 3)
	);

	// Due date display
	let dueInfo = $derived.by(() => {
		if (!task.dueDate) return null;
		const d = new Date(task.dueDate);
		const overdue = isPast(d) && !isToday(d) && !task.isCompleted;
		const today = isToday(d);
		return {
			text: today ? 'Heute' : format(d, 'd. MMM', { locale: getDateFnsLocale() }),
			overdue,
			today,
		};
	});

	// Subtask progress
	let subtaskInfo = $derived.by(() => {
		if (!task.subtasks?.length) return null;
		const done = task.subtasks.filter((s) => s.isCompleted).length;
		return { done, total: task.subtasks.length };
	});

	// Priority colors
	const priorityColors: Record<string, string> = {
		urgent: '#ef4444',
		high: '#f59e0b',
		medium: '#3b82f6',
		low: '#9ca3af',
	};

	// Inline title editing
	let isEditing = $state(false);
	let editTitle = $state('');

	function startEdit(e: MouseEvent) {
		e.stopPropagation();
		editTitle = task.title;
		isEditing = true;
	}

	function saveTitle() {
		const trimmed = editTitle.trim();
		if (trimmed && trimmed !== task.title) {
			onSave?.({ title: trimmed });
		}
		isEditing = false;
	}
</script>

<div
	class="group relative rounded-lg border border-border bg-card p-2.5 transition-shadow hover:shadow-md"
	style="border-left: 3px solid {priorityColors[task.priority] ?? priorityColors.medium}"
>
	<div class="flex items-start gap-2">
		<!-- Complete toggle -->
		{#if onToggleComplete}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onToggleComplete?.();
				}}
				class="mt-0.5 flex-shrink-0 rounded-full p-0.5 transition-colors {task.isCompleted
					? 'text-green-500'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				{#if task.isCompleted}
					<Check size={16} weight="bold" />
				{:else}
					<Circle size={16} />
				{/if}
			</button>
		{/if}

		<!-- Content -->
		<div class="min-w-0 flex-1">
			{#if isEditing}
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={editTitle}
					onblur={saveTitle}
					onkeydown={(e) => {
						if (e.key === 'Enter') saveTitle();
						if (e.key === 'Escape') isEditing = false;
					}}
					class="w-full bg-transparent text-sm text-foreground outline-none"
					autofocus
				/>
			{:else}
				<span
					onclick={startEdit}
					onkeydown={(e) => e.key === 'Enter' && startEdit(e as unknown as MouseEvent)}
					role="button"
					tabindex="0"
					class="block cursor-text text-sm leading-snug {task.isCompleted
						? 'text-muted-foreground line-through'
						: 'text-foreground'}"
				>
					{task.title}
				</span>
			{/if}

			<!-- Meta row -->
			{#if dueInfo || subtaskInfo || taskLabels.length > 0}
				<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
					{#if dueInfo}
						<span
							class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-medium {dueInfo.overdue
								? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
								: dueInfo.today
									? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
									: 'bg-muted text-muted-foreground'}"
						>
							<CalendarBlank size={10} />
							{dueInfo.text}
						</span>
					{/if}

					{#if subtaskInfo}
						<span class="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground">
							<CheckSquare size={10} />
							{subtaskInfo.done}/{subtaskInfo.total}
						</span>
					{/if}

					{#each taskLabels as label (label.id)}
						<TagChip name={label.name} color={label.color} />
					{/each}
				</div>
			{/if}
		</div>

		<!-- Delete (hover) -->
		{#if onDelete}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onDelete?.();
				}}
				class="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
			>
				<Trash size={14} />
			</button>
		{/if}
	</div>
</div>
