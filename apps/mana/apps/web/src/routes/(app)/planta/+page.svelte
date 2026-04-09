<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { wateringMutations } from '$lib/modules/planta/mutations';
	import {
		getActivePlants,
		getPrimaryPhoto,
		getScheduleForPlant,
		getDaysUntilWatering,
		isWateringOverdue,
	} from '$lib/modules/planta/queries';
	import type { Plant, PlantPhoto, WateringSchedule } from '$lib/modules/planta/types';

	const allPlants: { readonly value: Plant[] } = getContext('plants');
	const allPlantPhotos: { readonly value: PlantPhoto[] } = getContext('plantPhotos');
	const allWateringSchedules: { readonly value: WateringSchedule[] } =
		getContext('wateringSchedules');

	// Derived reactive data from live queries
	let plants = $derived(getActivePlants(allPlants.value));

	function getWateringClass(plantId: string): string {
		const schedule = getScheduleForPlant(allWateringSchedules.value, plantId);
		if (!schedule) return '';
		if (isWateringOverdue(schedule)) return 'overdue';
		const days = getDaysUntilWatering(schedule);
		if (days !== null && days <= 1) return 'soon';
		return 'ok';
	}

	function getWateringText(plantId: string): string {
		const schedule = getScheduleForPlant(allWateringSchedules.value, plantId);
		if (!schedule) return '';
		const days = getDaysUntilWatering(schedule);
		if (days === null) return '';
		if (days < 0) return $_('planta.watering.overdue');
		if (days === 0) return $_('planta.watering.today');
		return $_('planta.watering.daysUntil', { values: { days } });
	}

	function shouldShowWaterButton(plantId: string): boolean {
		const schedule = getScheduleForPlant(allWateringSchedules.value, plantId);
		if (!schedule) return false;
		const days = getDaysUntilWatering(schedule);
		return days !== null && days <= 1;
	}

	async function handleWater(plantId: string, e: Event) {
		e.stopPropagation();
		try {
			await wateringMutations.logWatering(plantId);
			toast.success($_('planta.success.plantWatered'));
		} catch (err) {
			console.error('logWatering failed:', err);
			toast.error($_('planta.errors.wateringFailed'));
		}
	}
</script>

<svelte:head>
	<title>{$_('planta.nav.plants')} - Planta</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{$_('planta.nav.plants')}</h1>
		<a href="/planta/add" class="btn btn-success">{$_('planta.plant.add')}</a>
	</div>

	{#if plants.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">🌱</div>
			<h2 class="text-xl font-semibold mb-2">{$_('planta.plant.noPlants')}</h2>
			<p class="text-muted-foreground mb-4">{$_('planta.app.tagline')}</p>
			<a href="/planta/add" class="btn btn-success">{$_('planta.plant.addFirst')}</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each plants as plant (plant.id)}
				{@const primaryPhoto = getPrimaryPhoto(allPlantPhotos.value, plant.id)}
				<!-- Outer is a div with role=link so we can nest a real
					 <button> inside without violating HTML's "no interactive
					 inside interactive" rule. Keyboard nav: Enter/Space opens. -->
				<div
					role="link"
					tabindex="0"
					class="card plant-card text-left"
					onclick={() => goto(`/planta/${plant.id}`)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							goto(`/planta/${plant.id}`);
						}
					}}
				>
					{#if primaryPhoto?.publicUrl}
						<img src={primaryPhoto.publicUrl} alt={plant.name} />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-muted text-4xl">🌿</div>
					{/if}
					<div
						class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3"
					>
						<h3 class="font-semibold text-white truncate">{plant.name}</h3>
						{#if plant.commonName}
							<p class="text-xs text-white/70 truncate">{plant.commonName}</p>
						{/if}
						{#if getWateringText(plant.id)}
							<div class="water-status {getWateringClass(plant.id)} mt-1">
								<span>{getWateringText(plant.id)}</span>
							</div>
						{/if}
					</div>
					{#if shouldShowWaterButton(plant.id)}
						<button
							type="button"
							class="absolute top-2 right-2 rounded-full bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
							onclick={(e) => handleWater(plant.id, e)}
							title={$_('planta.watering.water')}
						>
							{$_('planta.watering.water')}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.plant-card {
		position: relative;
		overflow: hidden;
		aspect-ratio: 1;
		padding: 0;
	}

	.plant-card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
