<script lang="ts">
	/**
	 * PlantWateringWidget — Pflanzen die heute gegossen werden müssen.
	 *
	 * Liest direkt aus der unified IndexedDB (plants + wateringSchedules tables).
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { BaseRecord } from '@mana/local-store';

	interface Plant extends BaseRecord {
		name: string;
		isActive: boolean;
		healthStatus?: string | null;
	}

	interface WateringSchedule extends BaseRecord {
		plantId: string;
		frequencyDays: number;
		nextWateringAt?: string | null;
	}

	interface PlantWithWatering {
		id: string;
		name: string;
		healthStatus?: string | null;
		daysUntil: number;
		nextWateringAt: string;
	}

	let plantsToWater: PlantWithWatering[] = $state([]);
	let totalActive = $state(0);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const [plants, schedules] = await Promise.all([
				db.table<Plant>('plants').toArray(),
				db.table<WateringSchedule>('wateringSchedules').toArray(),
			]);

			const activePlants = plants.filter((p) => p.isActive && !p.deletedAt);
			const scheduleMap = new Map(schedules.filter((s) => !s.deletedAt).map((s) => [s.plantId, s]));

			const now = new Date();
			const result: PlantWithWatering[] = [];

			for (const plant of activePlants) {
				const schedule = scheduleMap.get(plant.id);
				if (!schedule?.nextWateringAt) continue;

				const nextDate = new Date(schedule.nextWateringAt);
				const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

				// Show plants due today or overdue
				if (daysUntil <= 1) {
					result.push({
						id: plant.id,
						name: plant.name,
						healthStatus: plant.healthStatus,
						daysUntil,
						nextWateringAt: schedule.nextWateringAt,
					});
				}
			}

			return {
				plants: result.sort((a, b) => a.daysUntil - b.daysUntil),
				totalActive: activePlants.length,
			};
		}).subscribe({
			next: (val) => {
				plantsToWater = val.plants;
				totalActive = val.totalActive;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	function getHealthIcon(status?: string | null): string {
		switch (status) {
			case 'healthy':
				return '&#127793;';
			case 'needs_attention':
				return '&#128310;';
			case 'sick':
				return '&#128308;';
			default:
				return '&#127793;';
		}
	}

	function getDueLabel(daysUntil: number): string {
		if (daysUntil < 0)
			return `${Math.abs(daysUntil)} Tag${Math.abs(daysUntil) !== 1 ? 'e' : ''} überfällig`;
		if (daysUntil === 0) return 'Heute fällig';
		return 'Morgen fällig';
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Pflanzenpflege</h3>
		{#if plantsToWater.length > 0}
			<span class="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-sm font-medium text-blue-500">
				{plantsToWater.length}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if totalActive === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#127793;</div>
			<p class="text-sm text-muted-foreground">Noch keine Pflanzen angelegt.</p>
			<a
				href="/plants"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Pflanze hinzufügen
			</a>
		</div>
	{:else if plantsToWater.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#128167;</div>
			<p class="text-sm text-muted-foreground">Alle Pflanzen sind versorgt!</p>
			<p class="mt-1 text-xs text-muted-foreground">{totalActive} aktive Pflanzen</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each plantsToWater as plant (plant.id)}
				<a
					href="/plants"
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<span class="text-lg">{@html getHealthIcon(plant.healthStatus)}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{plant.name}</p>
						<p
							class="text-xs {plant.daysUntil < 0 ? 'font-semibold text-red-500' : 'text-blue-500'}"
						>
							{getDueLabel(plant.daysUntil)}
						</p>
					</div>
					<span class="text-lg">&#128167;</span>
				</a>
			{/each}
		</div>

		<a href="/plants" class="mt-3 block text-center text-sm text-primary hover:underline">
			Alle Pflanzen anzeigen
		</a>
	{/if}
</div>
