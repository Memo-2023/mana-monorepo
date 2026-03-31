<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { CaretLeft } from '@manacore/shared-icons';
	import { getContext } from 'svelte';
	import { collectionsStore } from '$lib/stores/collections.svelte';
	import { getCollectionById } from '$lib/data/queries';
	import type { Collection, CollectionSchema } from '@inventar/shared';
	import SchemaEditor from '$lib/components/fields/SchemaEditor.svelte';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');

	let collectionId = $derived($page.params.id);
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
			schema = { fields: [...collection.schema.fields] };
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
		goto(`/collections/${collection.id}`);
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]';
</script>

<svelte:head>
	<title>{$_('collection.edit')} | Inventar</title>
</svelte:head>

{#if !collection}
	<p class="text-[hsl(var(--muted-foreground))]">Sammlung nicht gefunden</p>
{:else}
	<div class="mx-auto max-w-2xl space-y-6">
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto(`/collections/${collection.id}`)}
				class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
			>
				<CaretLeft size={20} />
			</button>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('collection.edit')}</h1>
		</div>

		<div class="space-y-4">
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={icon}
					placeholder="📁"
					class="h-12 w-12 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-center text-2xl"
					maxlength="2"
				/>
				<input
					type="text"
					bind:value={name}
					placeholder={$_('collection.name')}
					class="{inputClass} flex-1"
				/>
			</div>

			<textarea
				bind:value={description}
				placeholder={$_('collection.description')}
				rows="2"
				class={inputClass}
			></textarea>

			<div>
				<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
					{$_('collection.customFields')}
				</h3>
				<SchemaEditor fields={schema.fields} onchange={(fields) => (schema = { fields })} />
			</div>

			<div class="flex justify-end gap-3 pt-4">
				<button
					onclick={() => goto(`/collections/${collection.id}`)}
					class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					{$_('common.cancel')}
				</button>
				<button
					onclick={handleSave}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
				>
					{$_('common.save')}
				</button>
			</div>
		</div>
	</div>
{/if}
