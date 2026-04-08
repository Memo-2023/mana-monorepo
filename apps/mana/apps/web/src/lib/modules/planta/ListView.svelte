<!--
  Planta — Workbench ListView
  Plant overview with watering schedule.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlant, LocalWateringSchedule } from './types';

	let { navigate }: ViewProps = $props();

	const plantsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPlant>('plants').toArray();
		return all.filter((p) => !p.deletedAt && p.isActive);
	}, [] as LocalPlant[]);

	const schedulesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalWateringSchedule>('wateringSchedules').toArray();
		return all.filter((s) => !s.deletedAt);
	}, [] as LocalWateringSchedule[]);

	const plants = $derived(plantsQuery.value);
	const schedules = $derived(schedulesQuery.value);

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

<BaseListView items={plants} getKey={(p) => p.id} emptyTitle="Keine Pflanzen">
	{#snippet header()}
		<span>{plants.length} Pflanzen</span>
		{#if dueForWatering.length > 0}
			<span class="text-blue-400">{dueForWatering.length} giessen</span>
		{/if}
		{#if needsAttention.length > 0}
			<span class="text-amber-400">{needsAttention.length} brauchen Pflege</span>
		{/if}
	{/snippet}

	{#snippet item(plant)}
		{@const schedule = getSchedule(plant.id)}
		{@const waterDue = needsWater(schedule)}
		<button
			onclick={() =>
				navigate('detail', {
					plantId: plant.id,
					_siblingIds: plants.map((p) => p.id),
					_siblingKey: 'plantId',
				})}
			class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5 min-h-[44px]"
		>
			<div class="flex items-center gap-2">
				<span class="text-sm">
					{@html healthIcons[plant.healthStatus ?? 'healthy'] ?? '&#127793;'}
				</span>
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
	{/snippet}
</BaseListView>
