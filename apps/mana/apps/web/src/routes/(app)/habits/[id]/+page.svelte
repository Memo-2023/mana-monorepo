<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import type { Habit, HabitLog } from '$lib/modules/habits/types';
	import HabitDetail from '$lib/modules/habits/components/HabitDetail.svelte';
	import { RoutePage } from '$lib/components/shell';

	const allHabits$: Observable<Habit[]> = getContext('habits');
	const allLogs$: Observable<HabitLog[]> = getContext('habitLogs');

	let habits = $state<Habit[]>([]);
	let logs = $state<HabitLog[]>([]);

	$effect(() => {
		const sub = allHabits$.subscribe((h) => (habits = h));
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allLogs$.subscribe((l) => (logs = l));
		return () => sub.unsubscribe();
	});

	let habitId = $derived($page.params.id);
	let habit = $derived(habits.find((h) => h.id === habitId));

	function handleBack() {
		goto('/habits');
	}
</script>

<svelte:head>
	<title>{habit ? habit.title : 'Habit'} - Mana</title>
</svelte:head>

<RoutePage appId="habits" backHref="/habits" title="Gewohnheit">
	<div class="detail-page">
		{#if habit}
			<HabitDetail {habit} {logs} onBack={handleBack} />
		{:else if habits.length > 0}
			<div class="not-found">
				<p>Habit nicht gefunden.</p>
				<button onclick={handleBack}>Zurück</button>
			</div>
		{:else}
			<div class="loading">Laden...</div>
		{/if}
	</div>
</RoutePage>

<style>
	.detail-page {
		padding: 0 1rem;
	}

	.not-found {
		text-align: center;
		padding: 3rem 0;
		color: hsl(var(--color-muted-foreground));
	}

	.not-found button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		cursor: pointer;
	}

	.loading {
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 3rem 0;
	}
</style>
