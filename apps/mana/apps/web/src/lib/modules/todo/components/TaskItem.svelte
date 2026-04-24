<script lang="ts">
	import { getDateFnsLocale } from '$lib/i18n/format';
	import type { Task, TaskPriority } from '../types';
	import { getPriorityLabel, getPriorityColor } from '../queries';
	import { Check, Circle, CalendarBlank, CheckSquare } from '@mana/shared-icons';
	import { TagChip } from '@mana/shared-ui';
	import { isToday, isPast, format } from 'date-fns';
	interface Props {
		task: Task;
		tags?: { id: string; name: string; color: string }[];
		compact?: boolean;
		onToggleComplete: () => void;
		onClick: () => void;
		onContextMenu: (e: MouseEvent) => void;
	}

	let {
		task,
		tags = [],
		compact = false,
		onToggleComplete,
		onClick,
		onContextMenu,
	}: Props = $props();

	let taskLabelIds = $derived((task.metadata as { labelIds?: string[] })?.labelIds ?? []);
	let taskTags = $derived(
		taskLabelIds
			.map((id) => tags.find((t) => t.id === id))
			.filter((t): t is NonNullable<typeof t> => t != null)
			.slice(0, 3)
	);

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

	let subtaskInfo = $derived.by(() => {
		if (!task.subtasks?.length) return null;
		const done = task.subtasks.filter((s) => s.isCompleted).length;
		return { done, total: task.subtasks.length };
	});
</script>

<div
	class="group flex select-none items-start gap-3 rounded-lg border border-transparent px-3 transition-colors [-webkit-touch-callout:none] hover:border-border hover:bg-card {compact
		? 'py-1.5'
		: 'py-2.5'}"
	role="button"
	tabindex="0"
	onclick={onClick}
	oncontextmenu={(e) => {
		e.preventDefault();
		onContextMenu(e);
	}}
	onkeydown={(e) => e.key === 'Enter' && onClick()}
>
	<!-- Completion toggle -->
	<button
		onclick={(e) => {
			e.stopPropagation();
			onToggleComplete();
		}}
		class="mt-0.5 flex-shrink-0 transition-colors {task.isCompleted
			? 'text-green-500'
			: 'text-muted-foreground hover:text-primary'}"
	>
		{#if task.isCompleted}
			<Check size={20} weight="bold" />
		{:else}
			<Circle size={20} />
		{/if}
	</button>

	<!-- Content -->
	<div class="min-w-0 flex-1">
		<span
			class="text-sm {task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}"
		>
			{task.title}
		</span>

		<!-- Meta row -->
		<div class="mt-0.5 flex items-center gap-2.5 text-xs">
			{#if dueInfo}
				<span
					class="inline-flex items-center gap-1 {dueInfo.overdue
						? 'text-red-500'
						: dueInfo.today
							? 'text-amber-500'
							: 'text-muted-foreground'}"
				>
					<CalendarBlank size={11} />
					{dueInfo.text}
				</span>
			{/if}
			{#if task.priority !== 'medium'}
				<span style="color: {getPriorityColor(task.priority)}">
					{getPriorityLabel(task.priority)}
				</span>
			{/if}
			{#if subtaskInfo}
				<span class="inline-flex items-center gap-1 text-muted-foreground">
					<CheckSquare size={11} />
					{subtaskInfo.done}/{subtaskInfo.total}
				</span>
			{/if}
			{#each taskTags as tag (tag.id)}
				<TagChip name={tag.name} color={tag.color} />
			{/each}
		</div>
	</div>

	<!-- Priority dot -->
	{#if task.priority === 'urgent' || task.priority === 'high'}
		<div
			class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
			style="background-color: {getPriorityColor(task.priority)}"
		></div>
	{/if}
</div>
