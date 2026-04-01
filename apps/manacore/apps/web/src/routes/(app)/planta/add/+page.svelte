<script lang="ts">
	import { goto } from '$app/navigation';
	import { plantMutations } from '$lib/modules/planta/mutations';
	import { trackEvent } from '@manacore/shared-utils/analytics';

	let plantName = $state('');
	let scientificName = $state('');
	let commonName = $state('');
	let error = $state('');
	let saving = $state(false);

	async function savePlant() {
		if (!plantName.trim()) {
			error = 'Bitte gib einen Namen fuer die Pflanze ein';
			return;
		}

		saving = true;
		error = '';

		const plant = await plantMutations.create({
			name: plantName.trim(),
			scientificName: scientificName.trim() || undefined,
			commonName: commonName.trim() || undefined,
		});

		if (!plant) {
			error = 'Pflanze konnte nicht gespeichert werden';
			saving = false;
			return;
		}

		trackEvent('plant_created');
		goto(`/planta/${plant.id}`);
	}
</script>

<svelte:head>
	<title>Pflanze hinzufuegen - Planta</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<h1 class="text-2xl font-bold">Pflanze hinzufuegen</h1>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	<div class="card p-6 space-y-4">
		<div>
			<label for="plant-name" class="block text-sm font-medium mb-2"> Name * </label>
			<input
				id="plant-name"
				type="text"
				bind:value={plantName}
				class="input w-full"
				placeholder="z.B. Meine Monstera"
			/>
		</div>

		<div>
			<label for="scientific-name" class="block text-sm font-medium mb-2">
				Wissenschaftlicher Name
			</label>
			<input
				id="scientific-name"
				type="text"
				bind:value={scientificName}
				class="input w-full"
				placeholder="z.B. Monstera deliciosa"
			/>
		</div>

		<div>
			<label for="common-name" class="block text-sm font-medium mb-2"> Allgemeiner Name </label>
			<input
				id="common-name"
				type="text"
				bind:value={commonName}
				class="input w-full"
				placeholder="z.B. Fensterblatt"
			/>
		</div>

		<button type="button" class="btn btn-success w-full mt-4" onclick={savePlant} disabled={saving}>
			{#if saving}
				<span
					class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
				></span>
			{:else}
				Pflanze speichern
			{/if}
		</button>
	</div>

	<div class="text-center">
		<a href="/planta" class="text-sm text-muted-foreground hover:text-foreground">
			Zurueck zur Uebersicht
		</a>
	</div>
</div>
