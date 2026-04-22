<!--
  Plants — Workbench ListView
  Plant overview with watering schedule.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlant, LocalWateringSchedule } from './types';
	import { plantMutations } from './mutations';

	let { navigate }: ViewProps = $props();

	let creating = $state(false);
	let newName = $state('');
	let newScientific = $state('');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		const plant = await plantMutations.create({
			name,
			scientificName: newScientific.trim() || undefined,
		});
		newName = '';
		newScientific = '';
		creating = false;
		navigate('detail', {
			plantId: plant.id,
			_siblingIds: [...plants.map((p) => p.id), plant.id],
			_siblingKey: 'plantId',
		});
	}

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

<BaseListView items={plants} getKey={(p) => p.id} emptyTitle={$_('plants.list.empty')}>
	{#snippet toolbar()}
		<div class="flex items-center justify-end">
			<button
				type="button"
				class="text-xs text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => (creating = !creating)}
			>
				{creating
					? $_('plants.create.cancel', { default: 'Abbrechen' })
					: $_('plants.create.new', { default: '+ Neue Pflanze' })}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-muted/30 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newName}
					placeholder={$_('plants.create.namePlaceholder', { default: 'Name (z. B. Monstera)' })}
					required
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newScientific}
					placeholder={$_('plants.create.scientificPlaceholder', {
						default: 'Botanischer Name (optional)',
					})}
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newName.trim()}
				>
					{$_('plants.create.save', { default: 'Pflanze anlegen' })}
				</button>
			</form>
		{/if}
	{/snippet}

	{#snippet header()}
		<span>{$_('plants.list.count', { values: { count: plants.length } })}</span>
		{#if dueForWatering.length > 0}
			<span class="text-primary"
				>{$_('plants.list.dueWatering', { values: { count: dueForWatering.length } })}</span
			>
		{/if}
		{#if needsAttention.length > 0}
			<span class="text-warning"
				>{$_('plants.list.needsCare', { values: { count: needsAttention.length } })}</span
			>
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
			class="mb-2 w-full rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-h-[44px]"
		>
			<div class="flex items-center gap-2">
				<span class="text-sm">
					{@html healthIcons[plant.healthStatus ?? 'healthy'] ?? '&#127793;'}
				</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-foreground">{plant.name}</p>
					{#if plant.scientificName}
						<p class="truncate text-xs italic text-muted-foreground/70">{plant.scientificName}</p>
					{/if}
				</div>
				{#if waterDue}
					<span class="text-xs text-primary">&#128167;</span>
				{/if}
			</div>
			{#if schedule}
				<p class="mt-1 text-xs text-muted-foreground/70">
					{$_('plants.list.everyXDays', { values: { days: schedule.frequencyDays } })}
				</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>
