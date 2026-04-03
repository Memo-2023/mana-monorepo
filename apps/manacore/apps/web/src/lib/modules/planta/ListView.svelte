<!--
  Planta — Workbench ListView
  Plant overview with watering schedule.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlant, LocalWateringSchedule } from './types';

	let { navigate, goBack, params }: ViewProps = $props();

	let plants = $state<LocalPlant[]>([]);
	let schedules = $state<LocalWateringSchedule[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalPlant>('plants')
				.toArray()
				.then((all) => all.filter((p) => !p.deletedAt && p.isActive));
		}).subscribe((val) => {
			plants = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalWateringSchedule>('wateringSchedules')
				.toArray()
				.then((all) => all.filter((s) => !s.deletedAt));
		}).subscribe((val) => {
			schedules = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function getSchedule(plantId: string): LocalWateringSchedule | undefined {
		return schedules.find((s) => s.plantId === plantId);
	}

	function needsWater(schedule?: LocalWateringSchedule): boolean {
		if (!schedule?.nextWateringAt) return false;
		return new Date(schedule.nextWateringAt) <= new Date();
	}

	const needsAttention = $derived(
		plants.filter((p) => p.healthStatus === 'needs_attention' || p.healthStatus === 'sick')
	);
	const dueForWatering = $derived(plants.filter((p) => needsWater(getSchedule(p.id))));

	const healthIcons: Record<string, string> = {
		healthy: '&#127793;',
		needs_attention: '&#9888;',
		sick: '&#129298;',
	};
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{plants.length} Pflanzen</span>
		{#if dueForWatering.length > 0}
			<span class="text-blue-400">{dueForWatering.length} giessen</span>
		{/if}
		{#if needsAttention.length > 0}
			<span class="text-amber-400">{needsAttention.length} brauchen Pflege</span>
		{/if}
	</div>

	<div class="flex-1 overflow-auto">
		{#each plants as plant (plant.id)}
			{@const schedule = getSchedule(plant.id)}
			{@const waterDue = needsWater(schedule)}
			<button
				onclick={() =>
					navigate('detail', {
						plantId: plant.id,
						_siblingIds: plants.map((p) => p.id),
						_siblingKey: 'plantId',
					})}
				class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
			>
				<div class="flex items-center gap-2">
					<span class="text-sm"
						>{@html healthIcons[plant.healthStatus ?? 'healthy'] ?? '&#127793;'}</span
					>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-white/80">{plant.name}</p>
						{#if plant.scientificName}
							<p class="truncate text-xs italic text-white/30">{plant.scientificName}</p>
						{/if}
					</div>
					{#if waterDue}
						<span class="text-xs text-blue-400">&#128167;</span>
					{/if}
				</div>
				{#if schedule}
					<p class="mt-1 text-xs text-white/30">
						Alle {schedule.frequencyDays} Tage giessen
					</p>
				{/if}
			</button>
		{/each}

		{#if plants.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Pflanzen</p>
		{/if}
	</div>
</div>
