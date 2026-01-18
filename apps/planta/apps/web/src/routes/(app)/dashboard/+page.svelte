<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { plantsApi } from '$lib/api/plants';
	import { wateringApi } from '$lib/api/watering';
	import type { Plant, WateringStatus } from '@planta/shared';

	let plants = $state<Plant[]>([]);
	let wateringStatus = $state<WateringStatus[]>([]);
	let loading = $state(true);

	onMount(async () => {
		const [plantsData, wateringData] = await Promise.all([
			plantsApi.getAll(),
			wateringApi.getUpcoming(),
		]);
		plants = plantsData;
		wateringStatus = wateringData;
		loading = false;
	});

	function getWateringStatusForPlant(plantId: string): WateringStatus | undefined {
		return wateringStatus.find((s) => s.plantId === plantId);
	}

	function getWateringClass(status: WateringStatus | undefined): string {
		if (!status) return '';
		if (status.isOverdue) return 'overdue';
		if (status.daysUntilWatering <= 1) return 'soon';
		return 'ok';
	}

	function getWateringText(status: WateringStatus | undefined): string {
		if (!status) return '';
		if (status.isOverdue) return 'Überfällig!';
		if (status.daysUntilWatering === 0) return 'Heute gießen';
		if (status.daysUntilWatering === 1) return 'Morgen gießen';
		return `In ${status.daysUntilWatering} Tagen`;
	}

	async function handleWater(plantId: string, e: Event) {
		e.stopPropagation();
		const success = await wateringApi.logWatering(plantId);
		if (success) {
			// Refresh watering status
			wateringStatus = await wateringApi.getUpcoming();
		}
	}
</script>

<svelte:head>
	<title>Meine Pflanzen - Planta</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Meine Pflanzen</h1>
		<a href="/add" class="btn btn-success"> + Pflanze hinzufügen </a>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
		</div>
	{:else if plants.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">🌱</div>
			<h2 class="text-xl font-semibold mb-2">Noch keine Pflanzen</h2>
			<p class="text-muted-foreground mb-4">
				Füge deine erste Pflanze hinzu und lass sie von der KI analysieren.
			</p>
			<a href="/add" class="btn btn-success"> Erste Pflanze hinzufügen </a>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each plants as plant (plant.id)}
				{@const status = getWateringStatusForPlant(plant.id)}
				<button
					type="button"
					class="card plant-card cursor-pointer text-left"
					onclick={() => goto(`/plants/${plant.id}`)}
				>
					{#if plant.primaryPhoto?.publicUrl}
						<img src={plant.primaryPhoto.publicUrl} alt={plant.name} />
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
						{#if status}
							<div class="water-status {getWateringClass(status)} mt-1">
								<span>💧</span>
								<span>{getWateringText(status)}</span>
							</div>
						{/if}
					</div>
					{#if status && (status.isOverdue || status.daysUntilWatering <= 1)}
						<button
							type="button"
							class="absolute top-2 right-2 rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
							onclick={(e) => handleWater(plant.id, e)}
							title="Als gegossen markieren"
						>
							💧
						</button>
					{/if}
				</button>
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
