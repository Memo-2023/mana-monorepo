<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { plantMutations, wateringMutations } from '$lib/modules/planta/mutations';
	import {
		getPlantById,
		getPhotosForPlant,
		getScheduleForPlant,
		getLogsForPlant,
	} from '$lib/modules/planta/queries';
	import type { Plant, PlantPhoto, WateringSchedule, WateringLog } from '$lib/modules/planta/types';

	const allPlants: { readonly value: Plant[] } = getContext('plants');
	const allPlantPhotos: { readonly value: PlantPhoto[] } = getContext('plantPhotos');
	const allWateringSchedules: { readonly value: WateringSchedule[] } =
		getContext('wateringSchedules');
	const allWateringLogs: { readonly value: WateringLog[] } = getContext('wateringLogs');

	// SvelteKit's params type allows undefined; coerce to '' so the helper
	// signatures stay strict and we still resolve to "not found" for missing.
	const plantId = $derived($page.params.id ?? '');

	// Derived reactive data from live queries (auto-updates on any change)
	let plant = $derived(getPlantById(allPlants.value, plantId));
	let photos = $derived(getPhotosForPlant(allPlantPhotos.value, plantId));
	let wateringSchedule = $derived(getScheduleForPlant(allWateringSchedules.value, plantId));
	let wateringHistory = $derived(getLogsForPlant(allWateringLogs.value, plantId));

	let watering = $state(false);

	async function handleWater() {
		if (!plant) return;
		watering = true;
		try {
			await wateringMutations.logWatering(plant.id);
			toast.success($_('planta.success.plantWatered'));
		} catch (err) {
			console.error('logWatering failed:', err);
			toast.error($_('planta.errors.wateringFailed'));
		} finally {
			watering = false;
		}
	}

	async function handleDelete() {
		if (!plant) return;
		if (!confirm($_('planta.plant.confirmDelete'))) return;

		try {
			await plantMutations.delete(plant.id);
			toast.success($_('planta.success.plantDeleted'));
			goto('/planta');
		} catch (err) {
			console.error('delete plant failed:', err);
			toast.error($_('planta.errors.deleteFailed'));
		}
	}

	function formatDate(date: Date | string | undefined | null): string {
		if (!date) return '–';
		return new Date(date).toLocaleDateString(undefined, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getHealthBadgeClass(status: string | null | undefined): string {
		if (status === 'needs_attention') return 'needs_attention';
		if (status === 'sick') return 'sick';
		return 'healthy';
	}

	function getHealthText(status: string | null | undefined): string {
		if (status === 'needs_attention') return $_('planta.health.needsAttention');
		if (status === 'sick') return $_('planta.health.sick');
		return $_('planta.health.healthy');
	}

	function getLightText(light: string | null | undefined): string {
		switch (light) {
			case 'low':
				return $_('planta.light.low');
			case 'medium':
				return $_('planta.light.medium');
			case 'bright':
				return $_('planta.light.bright');
			case 'direct':
				return $_('planta.light.direct');
			default:
				return $_('planta.common.none');
		}
	}

	function getHumidityText(humidity: string | null | undefined): string {
		switch (humidity) {
			case 'low':
				return $_('planta.humidity.low');
			case 'medium':
				return $_('planta.humidity.medium');
			case 'high':
				return $_('planta.humidity.high');
			default:
				return $_('planta.common.none');
		}
	}
</script>

<svelte:head>
	<title>{plant?.name || $_('planta.app.name')} - Planta</title>
</svelte:head>

{#if !plant}
	<div class="text-center py-12">
		<p class="text-lg">{$_('planta.plant.notFound')}</p>
		<a href="/planta" class="btn btn-primary mt-4">{$_('planta.nav.plants')}</a>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold">{plant.name}</h1>
				{#if plant.scientificName}
					<p class="text-muted-foreground italic">{plant.scientificName}</p>
				{/if}
				{#if plant.commonName && plant.commonName !== plant.name}
					<p class="text-muted-foreground">{plant.commonName}</p>
				{/if}
			</div>
			<span class="health-badge {getHealthBadgeClass(plant.healthStatus)}">
				{getHealthText(plant.healthStatus)}
			</span>
		</div>

		<!-- Photo Gallery -->
		{#if photos.length > 0}
			<div class="grid grid-cols-3 gap-2">
				{#each photos as photo (photo.id)}
					<img
						src={photo.publicUrl}
						alt={plant.name}
						class="w-full aspect-square object-cover rounded-lg"
						class:ring-2={photo.isPrimary}
						class:ring-primary={photo.isPrimary}
					/>
				{/each}
			</div>
		{/if}

		<!-- Care Info -->
		<div class="card">
			<h2 class="font-semibold mb-4">{$_('planta.plant.careNotes')}</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">{$_('planta.plant.light')}</p>
					<p class="font-medium">{getLightText(plant.lightRequirements)}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('planta.watering.water')}</p>
					<p class="font-medium">
						{plant.wateringFrequencyDays
							? $_('planta.list.everyXDays', { values: { days: plant.wateringFrequencyDays } })
							: $_('planta.common.none')}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('planta.humidity.medium')}</p>
					<p class="font-medium">{getHumidityText(plant.humidity)}</p>
				</div>
			</div>
			{#if plant.careNotes}
				<div class="mt-4 pt-4 border-t">
					<p class="text-sm text-muted-foreground mb-1">{$_('planta.plant.careNotes')}</p>
					<p class="text-sm whitespace-pre-line">{plant.careNotes}</p>
				</div>
			{/if}
		</div>

		<!-- Watering Schedule -->
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold">{$_('planta.nav.watering')}</h2>
				<button type="button" class="btn btn-success" onclick={handleWater} disabled={watering}>
					{#if watering}
						<span
							class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
						></span>
					{:else}
						{$_('planta.watering.water')}
					{/if}
				</button>
			</div>

			{#if wateringSchedule}
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<p class="text-sm text-muted-foreground">{$_('planta.watering.lastWatered')}</p>
						<p class="font-medium">{formatDate(wateringSchedule.lastWateredAt)}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">{$_('planta.watering.nextWatering')}</p>
						<p class="font-medium">{formatDate(wateringSchedule.nextWateringAt)}</p>
					</div>
				</div>
			{/if}

			{#if wateringHistory.length > 0}
				<div class="border-t pt-4">
					<p class="text-sm text-muted-foreground mb-2">{$_('planta.watering.watered')}</p>
					<ul class="space-y-1">
						{#each wateringHistory.slice(0, 5) as log (log.id)}
							<li class="text-sm flex justify-between">
								<span>{$_('planta.watering.watered')}</span>
								<span class="text-muted-foreground">{formatDate(log.wateredAt)}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex gap-4">
			<a href="/planta" class="btn flex-1 bg-muted text-foreground">{$_('planta.nav.plants')}</a>
			<button type="button" class="btn bg-destructive text-white" onclick={handleDelete}>
				{$_('planta.plant.delete')}
			</button>
		</div>
	</div>
{/if}
