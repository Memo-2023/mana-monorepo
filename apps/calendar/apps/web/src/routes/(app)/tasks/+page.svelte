<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import type { Task } from '$lib/api/todos';
	import type { CalendarEvent } from '@calendar/shared';
	import AgendaItem from '$lib/components/agenda/AgendaItem.svelte';
	import AgendaFilters from '$lib/components/agenda/AgendaFilters.svelte';
	import TodoDetailModal from '$lib/components/todo/TodoDetailModal.svelte';
	import QuickAddTodo from '$lib/components/todo/QuickAddTodo.svelte';
	import { AgendaSkeleton } from '$lib/components/skeletons';
	import {
		format,
		parseISO,
		isToday,
		isTomorrow,
		addDays,
		startOfDay,
		endOfDay,
		isBefore,
	} from 'date-fns';
	import { de } from 'date-fns/locale';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { CheckSquare, AlertTriangle, Plus } from 'lucide-svelte';

	// State
	let loading = $state(true);
	let showEvents = $state(true);
	let showTodos = $state(true);
	let timeRange = $state<'7' | '30' | 'all'>('30');
	let selectedTask = $state<Task | null>(null);
	let showQuickAdd = $state(false);

	// Combined and grouped items
	type AgendaGroup = {
		date: Date;
		items: Array<{ type: 'event' | 'todo'; event?: CalendarEvent; todo?: Task }>;
	};

	let groupedItems = $derived.by(() => {
		const groups = new Map<string, AgendaGroup['items']>();
		const today = startOfDay(new Date());

		// Add events
		if (showEvents) {
			const currentEvents = eventsStore.events ?? [];
			if (Array.isArray(currentEvents)) {
				for (const event of currentEvents) {
					const start = toDate(event.startTime);
					const dateKey = format(start, 'yyyy-MM-dd');

					if (!groups.has(dateKey)) {
						groups.set(dateKey, []);
					}
					groups.get(dateKey)!.push({ type: 'event', event });
				}
			}
		}

		// Add todos
		if (showTodos) {
			const currentTodos = todosStore.todos ?? [];
			if (Array.isArray(currentTodos)) {
				for (const todo of currentTodos) {
					if (todo.isCompleted) continue; // Skip completed todos

					let dateKey: string;
					if (todo.dueDate) {
						const dueDate =
							typeof todo.dueDate === 'string' ? parseISO(todo.dueDate) : todo.dueDate;
						// Group overdue todos under today
						if (isBefore(startOfDay(dueDate), today)) {
							dateKey = format(today, 'yyyy-MM-dd');
						} else {
							dateKey = format(dueDate, 'yyyy-MM-dd');
						}
					} else {
						// Todos without due date go under today
						dateKey = format(today, 'yyyy-MM-dd');
					}

					if (!groups.has(dateKey)) {
						groups.set(dateKey, []);
					}
					groups.get(dateKey)!.push({ type: 'todo', todo });
				}
			}
		}

		// Sort groups by date and items within each group
		return Array.from(groups.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateKey, items]) => ({
				date: parseISO(dateKey),
				items: items.sort((a, b) => {
					// Todos before events
					if (a.type !== b.type) return a.type === 'todo' ? -1 : 1;

					// Sort events by time
					if (a.type === 'event' && b.type === 'event' && a.event && b.event) {
						const aStart = toDate(a.event.startTime);
						const bStart = toDate(b.event.startTime);
						return aStart.getTime() - bStart.getTime();
					}

					// Sort todos by priority
					if (a.type === 'todo' && b.type === 'todo' && a.todo && b.todo) {
						const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
						return priorityOrder[a.todo.priority] - priorityOrder[b.todo.priority];
					}

					return 0;
				}),
			}));
	});

	// Stats
	const overdueCount = $derived(todosStore.overdueTodos.length);
	const todayCount = $derived(todosStore.todaysTodos.length);
	const totalActiveCount = $derived(todosStore.activeTodosCount);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch data based on time range
		await fetchData();
		loading = false;
	});

	async function fetchData() {
		const start = startOfDay(new Date());
		const days = timeRange === '7' ? 7 : timeRange === '30' ? 30 : 90;
		const end = endOfDay(addDays(start, days));

		await Promise.all([
			eventsStore.fetchEvents(start, end),
			todosStore.fetchTodos(start, end),
			todosStore.fetchTodayTodos(),
		]);
	}

	function formatDateHeader(date: Date) {
		if (isToday(date)) {
			return 'Heute';
		}
		if (isTomorrow(date)) {
			return 'Morgen';
		}
		return format(date, 'EEEE, d. MMMM', { locale: de });
	}

	function handleEventClick(eventId: string) {
		goto(`/?event=${eventId}`);
	}

	function handleTodoClick(task: Task) {
		selectedTask = task;
	}

	function handleModalClose() {
		selectedTask = null;
	}

	function toggleEvents() {
		showEvents = !showEvents;
	}

	function toggleTodos() {
		showTodos = !showTodos;
	}

	function handleRangeChange(range: '7' | '30' | 'all') {
		timeRange = range;
		loading = true;
		fetchData().then(() => (loading = false));
	}
</script>

<svelte:head>
	<title>Aufgaben | Kalender</title>
</svelte:head>

<div class="tasks-page">
	<header class="page-header">
		<div class="header-content">
			<div class="header-icon">
				<CheckSquare size={24} />
			</div>
			<div>
				<h1>Aufgaben</h1>
				<p class="subtitle">Ihre Termine und Aufgaben auf einen Blick</p>
			</div>
		</div>

		<!-- Stats -->
		<div class="stats">
			{#if overdueCount > 0}
				<span class="stat overdue">
					<AlertTriangle size={14} />
					{overdueCount} überfällig
				</span>
			{/if}
			<span class="stat">{todayCount} heute</span>
			<span class="stat">{totalActiveCount} gesamt</span>
		</div>
	</header>

	<!-- Filters -->
	<AgendaFilters
		{showEvents}
		{showTodos}
		{timeRange}
		onToggleEvents={toggleEvents}
		onToggleTodos={toggleTodos}
		onRangeChange={handleRangeChange}
	/>

	<!-- Quick Add -->
	<div class="quick-add-section">
		{#if showQuickAdd}
			<QuickAddTodo
				placeholder="Neue Aufgabe hinzufügen..."
				autofocus
				showButton={false}
				onsubmit={() => (showQuickAdd = false)}
				oncancel={() => (showQuickAdd = false)}
			/>
		{:else}
			<button type="button" class="quick-add-button" onclick={() => (showQuickAdd = true)}>
				<Plus size={16} />
				<span>Neue Aufgabe</span>
			</button>
		{/if}
	</div>

	<!-- Content -->
	{#if loading}
		<AgendaSkeleton />
	{:else if !todosStore.serviceAvailable}
		<div class="error-state card">
			<AlertTriangle size={24} />
			<p>Todo-Service ist nicht erreichbar</p>
			<p class="hint">Bitte versuchen Sie es später erneut</p>
		</div>
	{:else if groupedItems.length === 0}
		<div class="empty-state card">
			<CheckSquare size={32} />
			<p>Keine Einträge gefunden</p>
			<p class="hint">
				{#if !showEvents && !showTodos}
					Aktivieren Sie mindestens einen Filter
				{:else}
					Erstellen Sie eine neue Aufgabe oder ändern Sie den Zeitraum
				{/if}
			</p>
		</div>
	{:else}
		<div class="item-list">
			{#each groupedItems as group}
				<div class="date-group">
					<h2 class="date-header" class:today={isToday(group.date)}>
						{formatDateHeader(group.date)}
						<span class="item-count">({group.items.length})</span>
					</h2>

					<div class="items">
						{#each group.items as item}
							{#if item.type === 'event' && item.event}
								<AgendaItem
									type="event"
									event={item.event}
									onclick={() => handleEventClick(item.event!.id)}
								/>
							{:else if item.type === 'todo' && item.todo}
								<AgendaItem
									type="todo"
									todo={item.todo}
									onclick={() => handleTodoClick(item.todo!)}
								/>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if selectedTask}
	<TodoDetailModal task={selectedTask} onClose={handleModalClose} />
{/if}

<style>
	.tasks-page {
		max-width: 700px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.subtitle {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.25rem 0 0;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0.5rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-sm);
	}

	.stat.overdue {
		color: hsl(var(--color-danger));
		background: hsl(var(--color-danger) / 0.1);
	}

	.quick-add-section {
		margin-bottom: 0.5rem;
	}

	.quick-add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		border-radius: var(--radius-lg);
		border: 1px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.quick-add-button:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.date-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-header {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.date-header.today {
		color: hsl(var(--color-primary));
	}

	.item-count {
		font-weight: 400;
		font-size: 0.75rem;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem 1.5rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}

	.empty-state :global(svg),
	.error-state :global(svg) {
		opacity: 0.5;
	}

	.error-state {
		color: hsl(var(--color-danger));
	}

	.hint {
		font-size: 0.8125rem;
		opacity: 0.7;
		margin: 0;
	}

	.card {
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
	}

	@media (max-width: 640px) {
		.tasks-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.stats {
			justify-content: flex-start;
		}
	}
</style>
