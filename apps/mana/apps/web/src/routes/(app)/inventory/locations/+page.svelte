<script lang="ts">
	import { getContext } from 'svelte';
	import { locationsStore } from '$lib/modules/inventory/stores/locations.svelte';
	import { getLocationTree } from '$lib/modules/inventory/queries';
	import type { Location } from '$lib/modules/inventory/queries';
	import { Plus } from '@mana/shared-icons';

	const locationsCtx: { readonly value: Location[] } = getContext('locations');

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let parentId = $state<string | undefined>();
	let name = $state('');
	let icon = $state('');

	function startCreate(parent?: string) {
		parentId = parent;
		name = '';
		icon = '';
		editingId = null;
		showForm = true;
	}

	function startEdit(location: Location) {
		editingId = location.id;
		name = location.name;
		icon = location.icon || '';
		parentId = location.parentId;
		showForm = true;
	}

	async function save() {
		if (!name.trim()) return;
		if (editingId) {
			await locationsStore.update(editingId, { name: name.trim(), icon: icon || undefined });
		} else {
			await locationsStore.create({ name: name.trim(), icon: icon || undefined, parentId });
		}
		showForm = false;
		name = '';
		icon = '';
		editingId = null;
	}

	async function deleteLocation(id: string) {
		if (confirm('Standort und alle Unterstandorte loschen?')) {
			await locationsStore.delete(id);
		}
	}

	let tree = $derived(getLocationTree(locationsCtx.value));

	const inputClass =
		'rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]';
</script>

<svelte:head>
	<title>Standorte - Inventar - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Standorte</h1>
		<button
			onclick={() => startCreate()}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
		>
			<Plus size={20} />
			Neuer Standort
		</button>
	</div>

	{#if showForm}
		<div
			class="rounded-xl border border-[hsl(var(--color-primary)/0.3)] bg-[hsl(var(--color-card))] p-4"
		>
			<h3 class="mb-3 text-sm font-semibold">
				{editingId ? 'Standort bearbeiten' : 'Neuer Standort'}
			</h3>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={icon}
					placeholder="📍"
					class="{inputClass} w-12 text-center text-lg"
					maxlength="2"
				/>
				<input
					type="text"
					bind:value={name}
					placeholder="Standortname"
					class="{inputClass} flex-1"
					onkeydown={(e) => e.key === 'Enter' && save()}
				/>
				<button
					onclick={save}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--color-primary))] px-4 text-sm text-[hsl(var(--color-primary-foreground))] disabled:opacity-50"
				>
					Speichern
				</button>
				<button
					onclick={() => (showForm = false)}
					class="rounded-lg border border-[hsl(var(--color-border))] px-3 text-sm"
				>
					Abbrechen
				</button>
			</div>
		</div>
	{/if}

	{#if tree.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-16"
		>
			<span class="mb-4 text-4xl">📍</span>
			<p class="text-[hsl(var(--color-muted-foreground))]">Keine Standorte vorhanden</p>
		</div>
	{:else}
		<div class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]">
			{#snippet renderTree(locations: Location[], depth: number)}
				{#each locations as location (location.id)}
					<div class="border-b border-[hsl(var(--color-border))] last:border-b-0">
						<div
							class="flex items-center gap-2 px-4 py-2.5"
							style="padding-left: {16 + depth * 24}px"
						>
							<span class="text-lg">{location.icon || '📍'}</span>
							<span class="flex-1 text-sm font-medium text-[hsl(var(--color-foreground))]"
								>{location.name}</span
							>
							<button
								onclick={() => startCreate(location.id)}
								class="rounded p-1 text-xs text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-primary))]"
								title="Unterstandort hinzufugen">+</button
							>
							<button
								onclick={() => startEdit(location)}
								class="rounded p-1 text-xs text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
								>&#9998;</button
							>
							<button
								onclick={() => deleteLocation(location.id)}
								class="rounded p-1 text-xs text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
								>&times;</button
							>
						</div>
						{#if location.children?.length}
							{@render renderTree(location.children, depth + 1)}
						{/if}
					</div>
				{/each}
			{/snippet}
			{@render renderTree(tree, 0)}
		</div>
	{/if}
</div>
