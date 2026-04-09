<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { toast } from '$lib/stores/toast.svelte';
	import { plantMutations } from '$lib/modules/planta/mutations';

	let plantName = $state('');
	let scientificName = $state('');
	let commonName = $state('');
	let error = $state('');
	let saving = $state(false);

	async function savePlant() {
		if (!plantName.trim()) {
			error = $_('planta.errors.saveFailed');
			return;
		}

		saving = true;
		error = '';

		try {
			const plant = await plantMutations.create({
				name: plantName.trim(),
				scientificName: scientificName.trim() || undefined,
				commonName: commonName.trim() || undefined,
			});
			toast.success($_('planta.success.plantAdded'));
			goto(`/planta/${plant.id}`);
		} catch (err) {
			console.error('Failed to create plant:', err);
			error = $_('planta.errors.saveFailed');
			toast.error($_('planta.errors.saveFailed'));
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('planta.plant.add')} - Planta</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<h1 class="text-2xl font-bold">{$_('planta.plant.add')}</h1>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	<div class="card p-6 space-y-4">
		<div>
			<label for="plant-name" class="block text-sm font-medium mb-2">
				{$_('planta.plant.name')} *
			</label>
			<input
				id="plant-name"
				type="text"
				bind:value={plantName}
				class="input w-full"
				placeholder={$_('planta.plant.namePlaceholder')}
			/>
		</div>

		<div>
			<label for="scientific-name" class="block text-sm font-medium mb-2">
				{$_('planta.plant.scientificName')}
			</label>
			<input
				id="scientific-name"
				type="text"
				bind:value={scientificName}
				class="input w-full"
				placeholder={$_('planta.common.none')}
			/>
		</div>

		<div>
			<label for="common-name" class="block text-sm font-medium mb-2">
				{$_('planta.plant.species')}
			</label>
			<input
				id="common-name"
				type="text"
				bind:value={commonName}
				class="input w-full"
				placeholder={$_('planta.common.none')}
			/>
		</div>

		<button type="button" class="btn btn-success w-full mt-4" onclick={savePlant} disabled={saving}>
			{#if saving}
				<span
					class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
				></span>
			{:else}
				{$_('planta.common.save')}
			{/if}
		</button>
	</div>

	<div class="text-center">
		<a href="/planta" class="text-sm text-muted-foreground hover:text-foreground">
			{$_('planta.nav.plants')}
		</a>
	</div>
</div>
