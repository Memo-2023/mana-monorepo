<script lang="ts">
	import type { CalendarEvent } from '@calendar/shared';
	import type { Task } from '$lib/api/todos';
	import { PRIORITY_COLORS, PRIORITY_LABELS } from '$lib/api/todos';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import PriorityBadge from '$lib/components/todo/PriorityBadge.svelte';
	import { Calendar, MapPin, Clock } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { toDate } from '$lib/utils/eventDateHelpers';

	type ItemType = 'event' | 'todo';

	interface Props {
		type: ItemType;
		event?: CalendarEvent;
		todo?: Task;
		onclick?: () => void;
	}

	let { type, event, todo, onclick }: Props = $props();

	let isToggling = $state(false);

	// Event helpers
	const eventColor = $derived(event ? calendarsStore.getColor(event.calendarId) : undefined);
	const eventTimeLabel = $derived.by(() => {
		if (!event) return '';
		if (event.isAllDay) return 'Ganztägig';

		const start = toDate(event.startTime);
		const end = toDate(event.endTime);

		return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
	});

	// Todo helpers
	const todoTimeLabel = $derived.by(() => {
		if (!todo) return '';
		if (todo.dueTime) return `Fällig: ${todo.dueTime}`;
		return 'Heute fällig';
	});

	async function handleToggleTodo() {
		if (!todo) return;
		isToggling = true;
		await todosStore.toggleComplete(todo.id);
		isToggling = false;
	}
</script>

{#if type === 'event' && event}
	<button type="button" class="agenda-item event" style="--item-color: {eventColor};" {onclick}>
		<div class="item-indicator">
			<Calendar size={14} />
		</div>
		<div class="item-content">
			<div class="item-header">
				<span class="item-time">{eventTimeLabel}</span>
			</div>
			<span class="item-title">{event.title}</span>
			{#if event.location}
				<div class="item-meta">
					<MapPin size={12} />
					<span>{event.location}</span>
				</div>
			{/if}
		</div>
	</button>
{:else if type === 'todo' && todo}
	<div
		class="agenda-item todo"
		class:completed={todo.isCompleted}
		style="--item-color: {PRIORITY_COLORS[todo.priority]};"
	>
		<div class="item-checkbox">
			<TodoCheckbox
				checked={todo.isCompleted}
				loading={isToggling}
				size="md"
				onchange={handleToggleTodo}
			/>
		</div>
		<button type="button" class="item-content" {onclick}>
			<div class="item-header">
				<PriorityBadge priority={todo.priority} variant="dot" size="sm" />
				<span class="item-time">{todoTimeLabel}</span>
			</div>
			<span class="item-title">{todo.title}</span>
			{#if todo.project}
				<div class="item-meta">
					<span class="project-tag" style="color: {todo.project.color};">
						{todo.project.name}
					</span>
				</div>
			{/if}
		</button>
	</div>
{/if}

<style>
	.agenda-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: hsl(var(--color-surface));
		transition: all 150ms ease;
	}

	.agenda-item.event {
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-left: 4px solid var(--item-color);
	}

	.agenda-item.event:hover {
		background: hsl(var(--color-muted) / 0.5);
		transform: translateX(4px);
	}

	.agenda-item.todo {
		border-left: 3px solid var(--item-color);
	}

	.agenda-item.todo.completed {
		opacity: 0.6;
	}

	.agenda-item.todo.completed .item-title {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.item-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-sm);
		background: var(--item-color);
		color: white;
		flex-shrink: 0;
	}

	.item-checkbox {
		flex-shrink: 0;
		padding-top: 2px;
	}

	.item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.todo .item-content {
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	.todo .item-content:hover .item-title {
		color: hsl(var(--color-primary));
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.item-time {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.item-title {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 150ms ease;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.item-meta :global(svg) {
		flex-shrink: 0;
	}

	.project-tag {
		font-size: 0.6875rem;
		font-weight: 500;
		background: color-mix(in srgb, currentColor 15%, transparent);
		padding: 1px 6px;
		border-radius: 4px;
	}
</style>
