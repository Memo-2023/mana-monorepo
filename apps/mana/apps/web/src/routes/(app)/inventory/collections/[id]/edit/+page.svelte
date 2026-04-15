<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CaretLeft } from '@mana/shared-icons';
	import { getContext } from 'svelte';
	import { collectionsStore } from '$lib/modules/inventory/stores/collections.svelte';
	import { getCollectionById } from '$lib/modules/inventory/queries';
	import type { Collection } from '$lib/modules/inventory/queries';
	import type { CollectionSchema, FieldDefinition } from '$lib/modules/inventory/constants';
	import SchemaEditor from '$lib/modules/inventory/components/fields/SchemaEditor.svelte';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');

	let collectionId = $derived($page.params.id ?? '');
	let collection = $derived(getCollectionById(collectionsCtx.value, collectionId));

	let name = $state('');
	let description = $state('');
	let icon = $state('');
	let schema = $state<CollectionSchema>({ fields: [] });
	let loaded = $state(false);

	$effect(() => {
		if (collection && !loaded) {
			name = collection.name;
			description = collection.description || '';
			icon = collection.icon || '';
			// `collection.schema.fields` round-trips through JSON in the
			// Dexie row, which widens `type` to plain `string`. Cast back
			// to the FieldDefinition union — the runtime values match the
			// FieldType union, the loss is purely at the type layer.
			schema = { fields: [...collection.schema.fields] as FieldDefinition[] };
			loaded = true;
		}
	});

	async function handleSave() {
		if (!collection || !name.trim()) return;
		await collectionsStore.update(collection.id, {
			name: name.trim(),
			description: description.trim() || undefined,
			icon: icon || undefined,
			schema,
		});
		goto(`/inventory/collections/${collection.id}`);
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-3 text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]';
</script>

<svelte:head>
	<title>Sammlung bearbeiten - Inventar - Mana</title>
</svelte:head>

{#if !collection}
	<p class="text-[hsl(var(--color-muted-foreground))]">Sammlung nicht gefunden</p>
{:else}
	<div class="mx-auto max-w-2xl space-y-6">
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto(`/inventory/collections/${collection.id}`)}
				class="text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
			>
				<CaretLeft size={20} />
			</button>
			<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Sammlung bearbeiten</h1>
		</div>

		<div class="space-y-4">
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={icon}
					placeholder="📁"
					class="h-12 w-12 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] text-center text-2xl"
					maxlength="2"
				/>
				<input
					type="text"
					bind:value={name}
					placeholder="Sammlungsname"
					class="{inputClass} flex-1"
				/>
			</div>

			<textarea
				bind:value={description}
				placeholder="Beschreibung (optional)"
				rows="2"
				class={inputClass}
			></textarea>

			<div>
				<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">
					Eigene Felder
				</h3>
				<SchemaEditor fields={schema.fields} onchange={(fields) => (schema = { fields })} />
			</div>

			<div class="flex justify-end gap-3 pt-4">
				<button
					onclick={() => goto(`/inventory/collections/${collection.id}`)}
					class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))]"
				>
					Abbrechen
				</button>
				<button
					onclick={handleSave}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--color-primary))] px-6 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] disabled:opacity-50"
				>
					Speichern
				</button>
			</div>
		</div>
	</div>
{/if}
