<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Observable } from 'dexie';
	import type { Habit, HabitLog } from '$lib/modules/habits/types';
	import { todayStr, getLogsForDate } from '$lib/modules/habits/queries';
	import HabitBoard from '$lib/modules/habits/components/HabitBoard.svelte';
	import DayTimeline from '$lib/modules/habits/components/DayTimeline.svelte';

	const allHabits$: Observable<Habit[]> = getContext('habits');
	const allLogs$: Observable<HabitLog[]> = getContext('habitLogs');

	let habits = $state<Habit[]>([]);
	let logs = $state<HabitLog[]>([]);
	let isLoaded = $state(false);

	$effect(() => {
		const sub = allHabits$.subscribe((h) => {
			habits = h;
			isLoaded = true;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allLogs$.subscribe((l) => (logs = l));
		return () => sub.unsubscribe();
	});

	let today = todayStr();
	let todayLogs = $derived(getLogsForDate(logs, today));

	function handleDetail(habit: Habit) {
		goto(`/habits/${habit.id}`);
	}
</script>

<svelte:head>
	<title>Habits - ManaCore</title>
</svelte:head>

<div class="habits-page">
	<header class="habits-header">
		<div>
			<h1 class="habits-title">Habits</h1>
			{#if isLoaded}
				<div class="habits-stats">
					<span>{habits.filter((h) => !h.isArchived).length} Habits</span>
					<span>{todayLogs.length} Einträge heute</span>
				</div>
			{/if}
		</div>
	</header>

	{#if isLoaded}
		<section class="board-section">
			<HabitBoard {habits} {logs} onDetail={handleDetail} />
		</section>

		{#if todayLogs.length > 0}
			<section class="timeline-section">
				<h2 class="section-title">Heute</h2>
				<DayTimeline {logs} {habits} date={today} />
			</section>
		{/if}
	{:else}
		<div class="loading">Laden...</div>
	{/if}
</div>

<style>
	.habits-page {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0 1rem;
		max-width: 640px;
	}

	.habits-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.habits-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.habits-stats {
		display: flex;
		gap: 1rem;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.board-section {
		/* main content */
	}

	.timeline-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.loading {
		color: var(--color-muted-foreground);
		text-align: center;
		padding: 3rem 0;
	}
</style>
