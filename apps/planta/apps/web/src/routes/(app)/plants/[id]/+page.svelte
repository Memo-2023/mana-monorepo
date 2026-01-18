<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { plantsApi } from '$lib/api/plants';
	import { wateringApi } from '$lib/api/watering';
	import type { PlantWithDetails, WateringLog } from '@planta/shared';

	let plant = $state<PlantWithDetails | null>(null);
	let wateringHistory = $state<WateringLog[]>([]);
	let loading = $state(true);
	let watering = $state(false);

	$effect(() => {
		const plantId = $page.params.id;
		if (plantId) {
			loadPlant(plantId);
		}
	});

	async function loadPlant(id: string) {
		loading = true;
		const [plantData, historyData] = await Promise.all([
			plantsApi.getById(id),
			wateringApi.getHistory(id),
		]);
		plant = plantData;
		wateringHistory = historyData;
		loading = false;
	}

	async function handleWater() {
		if (!plant) return;
		watering = true;
		const success = await wateringApi.logWatering(plant.id);
		if (success) {
			// Reload plant data
			await loadPlant(plant.id);
		}
		watering = false;
	}

	async function handleDelete() {
		if (!plant) return;
		if (!confirm(`Möchtest du "${plant.name}" wirklich löschen?`)) return;

		const success = await plantsApi.delete(plant.id);
		if (success) {
			goto('/dashboard');
		}
	}

	function formatDate(date: Date | string | undefined | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getHealthBadgeClass(status: string | null | undefined): string {
		if (!status) return 'healthy';
		if (status === 'needs_attention') return 'needs_attention';
		if (status === 'sick') return 'sick';
		return 'healthy';
	}

	function getHealthText(status: string | null | undefined): string {
		const map: Record<string, string> = {
			healthy: 'Gesund',
			needs_attention: 'Braucht Aufmerksamkeit',
			sick: 'Krank',
		};
		return map[status || ''] || 'Gesund';
	}

	function getLightText(light: string | null | undefined): string {
		const map: Record<string, string> = {
			low: 'Wenig Licht',
			medium: 'Mittleres Licht',
			bright: 'Helles Licht',
			direct: 'Direkte Sonne',
		};
		return map[light || ''] || '-';
	}

	function getHumidityText(humidity: string | null | undefined): string {
		const map: Record<string, string> = {
			low: 'Niedrig',
			medium: 'Mittel',
			high: 'Hoch',
		};
		return map[humidity || ''] || '-';
	}
</script>

<svelte:head>
	<title>{plant?.name || 'Pflanze'} - Planta</title>
</svelte:head>

{#if loading}
	<div class="flex justify-center py-12">
		<div
			class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
		></div>
	</div>
{:else if !plant}
	<div class="text-center py-12">
		<p class="text-lg">Pflanze nicht gefunden</p>
		<a href="/dashboard" class="btn btn-primary mt-4">Zurück zur Übersicht</a>
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
		{#if plant.photos && plant.photos.length > 0}
			<div class="grid grid-cols-3 gap-2">
				{#each plant.photos as photo (photo.id)}
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
			<h2 class="font-semibold mb-4">Pflege</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">Licht</p>
					<p class="font-medium">☀️ {getLightText(plant.lightRequirements)}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Gießen</p>
					<p class="font-medium">
						💧 {plant.wateringFrequencyDays ? `Alle ${plant.wateringFrequencyDays} Tage` : '-'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Luftfeuchtigkeit</p>
					<p class="font-medium">💨 {getHumidityText(plant.humidity)}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Temperatur</p>
					<p class="font-medium">🌡️ {plant.temperature || '-'}</p>
				</div>
			</div>
			{#if plant.careNotes}
				<div class="mt-4 pt-4 border-t">
					<p class="text-sm text-muted-foreground mb-1">Pflegehinweise</p>
					<p class="text-sm whitespace-pre-line">{plant.careNotes}</p>
				</div>
			{/if}
		</div>

		<!-- Watering Schedule -->
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold">Gießplan</h2>
				<button type="button" class="btn btn-success" onclick={handleWater} disabled={watering}>
					{#if watering}
						<span
							class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
						></span>
					{:else}
						💧 Jetzt gießen
					{/if}
				</button>
			</div>

			{#if plant.wateringSchedule}
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<p class="text-sm text-muted-foreground">Zuletzt gegossen</p>
						<p class="font-medium">{formatDate(plant.wateringSchedule.lastWateredAt)}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Nächstes Gießen</p>
						<p class="font-medium">{formatDate(plant.wateringSchedule.nextWateringAt)}</p>
					</div>
				</div>
			{/if}

			{#if wateringHistory.length > 0}
				<div class="border-t pt-4">
					<p class="text-sm text-muted-foreground mb-2">Letzte Gießvorgänge</p>
					<ul class="space-y-1">
						{#each wateringHistory.slice(0, 5) as log (log.id)}
							<li class="text-sm flex justify-between">
								<span>💧 Gegossen</span>
								<span class="text-muted-foreground">{formatDate(log.wateredAt)}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex gap-4">
			<a href="/dashboard" class="btn flex-1 bg-muted text-foreground"> ← Zurück </a>
			<button type="button" class="btn bg-destructive text-white" onclick={handleDelete}>
				Löschen
			</button>
		</div>
	</div>
{/if}
