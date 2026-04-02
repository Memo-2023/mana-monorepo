<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { locationsStore } from '$lib/stores/locations.svelte';
	import { getLocationTree } from '$lib/data/queries';
	import type { Location } from '@inventar/shared';
	import { Plus } from '@manacore/shared-icons';

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
		if (confirm('Standort und alle Unterstandorte löschen?')) {
			await locationsStore.delete(id);
		}
	}

	let tree = $derived(getLocationTree(locationsCtx.value));

	const inputClass =
		'rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]';
</script>

<svelte:head>
	<title>{$_('nav.locations')} | Inventar</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.locations')}</h1>
		<button
			onclick={() => startCreate()}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
		>
			<Plus size={20} />
			{$_('location.create')}
		</button>
	</div>

	{#if showForm}
		<div class="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))] p-4">
			<h3 class="mb-3 text-sm font-semibold">
				{editingId ? $_('location.edit') : $_('location.create')}
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
					placeholder={$_('location.name')}
					class="{inputClass} flex-1"
					onkeydown={(e) => e.key === 'Enter' && save()}
				/>
				<button
					onclick={save}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--primary))] px-4 text-sm text-[hsl(var(--primary-foreground))] disabled:opacity-50"
				>
					{$_('common.save')}
				</button>
				<button
					onclick={() => (showForm = false)}
					class="rounded-lg border border-[hsl(var(--border))] px-3 text-sm"
				>
					{$_('common.cancel')}
				</button>
			</div>
		</div>
	{/if}

	{#if tree.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-4xl">📍</span>
			<p class="text-[hsl(var(--muted-foreground))]">{$_('location.noLocations')}</p>
		</div>
	{:else}
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
			{#snippet renderTree(locations: Location[], depth: number)}
				{#each locations as location (location.id)}
					<div class="location-tree-item border-b border-[hsl(var(--border))] last:border-b-0">
						<div
							class="flex items-center gap-2 px-4 py-2.5"
							style="padding-left: {16 + depth * 24}px"
						>
							<span class="text-lg">{location.icon || '📍'}</span>
							<span class="flex-1 text-sm font-medium text-[hsl(var(--foreground))]"
								>{location.name}</span
							>
							<button
								onclick={() => startCreate(location.id)}
								class="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
								title={$_('location.addSub')}>+</button
							>
							<button
								onclick={() => startEdit(location)}
								class="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
								>✎</button
							>
							<button
								onclick={() => deleteLocation(location.id)}
								class="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-500"
								>×</button
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
