<!--
  Todo — Split-Screen AppView
  Compact task list with quick add, filter by inbox/today/overdue.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import {
		useAllTasks,
		filterIncomplete,
		filterToday,
		filterOverdue,
		sortTasks,
		getTaskStats,
	} from './queries';
	import { tasksStore } from './stores/tasks.svelte';

	type ViewFilter = 'inbox' | 'today' | 'overdue';

	let filter = $state<ViewFilter>('inbox');
	let newTitle = $state('');
	let tasks$ = useAllTasks();
	let tasks = $state<import('./types').Task[]>([]);

	$effect(() => {
		const sub = tasks$.subscribe((val) => {
			tasks = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const stats = $derived(getTaskStats(tasks));
	const filtered = $derived(() => {
		const incomplete = filterIncomplete(tasks);
		switch (filter) {
			case 'today':
				return filterToday(tasks);
			case 'overdue':
				return filterOverdue(tasks);
			default:
				return sortTasks(incomplete, 'order');
		}
	});

	async function addTask() {
		const title = newTitle.trim();
		if (!title) return;
		await tasksStore.createTask({ title });
		newTitle = '';
	}

	async function toggle(id: string) {
		await tasksStore.toggleComplete(id);
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<!-- Stats -->
	<div class="flex gap-3 text-xs text-white/50">
		<span>{stats.total} gesamt</span>
		<span>{stats.today} heute</span>
		<span class:text-red-400={stats.overdue > 0}>{stats.overdue} überfällig</span>
	</div>

	<!-- Filter tabs -->
	<div class="flex gap-1">
		{#each ['inbox', 'today', 'overdue'] as f}
			<button
				onclick={() => (filter = f as ViewFilter)}
				class="rounded-md px-2.5 py-1 text-xs transition-colors
					{filter === f ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}"
			>
				{f === 'inbox' ? 'Inbox' : f === 'today' ? 'Heute' : 'Überfällig'}
			</button>
		{/each}
	</div>

	<!-- Quick add -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			addTask();
		}}
		class="flex gap-2"
	>
		<input
			bind:value={newTitle}
			placeholder="Neue Aufgabe..."
			class="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
		/>
		<button
			type="submit"
			class="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15"
			>+</button
		>
	</form>

	<!-- Task list -->
	<div class="flex-1 overflow-auto">
		{#each filtered() as task (task.id)}
			<button
				onclick={() => toggle(task.id)}
				class="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5"
			>
				<div
					class="mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors
						{task.isCompleted ? 'border-green-500 bg-green-500/20' : 'border-white/20'}"
				></div>
				<div class="min-w-0 flex-1">
					<p
						class="truncate text-sm {task.isCompleted
							? 'text-white/30 line-through'
							: 'text-white/80'}"
					>
						{task.title}
					</p>
					{#if task.dueDate}
						<p class="text-xs text-white/30">{new Date(task.dueDate).toLocaleDateString('de')}</p>
					{/if}
				</div>
			</button>
		{/each}

		{#if filtered().length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Aufgaben</p>
		{/if}
	</div>
</div>
