<!--
  Inventar — DetailView (inline editable overlay)
  Collection details, always editable, auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { collectionsStore } from '../stores/collections.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalCollection, LocalItem } from '../types';

	let { params, goBack }: ViewProps = $props();
	let collectionId = $derived(params.collectionId as string);

	let editName = $state('');
	let editDescription = $state('');
	let editIcon = $state('');
	let editColor = $state('');

	const detail = useDetailEntity<LocalCollection>({
		id: () => collectionId,
		table: 'invCollections',
		onLoad: (val) => {
			editName = val.name;
			editDescription = val.description ?? '';
			editIcon = val.icon ?? '';
			editColor = val.color ?? '';
		},
	});

	const itemCountQuery = useLiveQueryWithDefault(
		async () =>
			db
				.table<LocalItem>('invItems')
				.where('collectionId')
				.equals(collectionId)
				.filter((i) => !i.deletedAt)
				.count(),
		0
	);
	let itemCount = $derived(itemCountQuery.value);

	async function saveField() {
		detail.blur();
		await collectionsStore.update(collectionId, {
			name: editName.trim() || detail.entity?.name || 'Unbenannt',
			description: editDescription.trim() || null,
			icon: editIcon.trim() || null,
			color: editColor.trim() || null,
		});
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Sammlung nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Sammlung wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Sammlung gelöscht',
			delete: () => collectionsStore.delete(collectionId),
			goBack,
		})}
>
	{#snippet body(collection)}
		<div class="title-row">
			{#if collection.icon}
				<span class="title-icon">{collection.icon}</span>
			{/if}
			<input
				class="title-input"
				bind:value={editName}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Name..."
			/>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Icon</span>
				<input
					class="prop-input"
					bind:value={editIcon}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="z.B. 📦"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Farbe</span>
				<input
					class="prop-input"
					bind:value={editColor}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="z.B. #78716C"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Gegenstände</span>
				<span class="prop-value">{itemCount}</span>
			</div>
		</div>

		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			<span>Erstellt: {formatDate(new Date(collection.createdAt ?? ''))}</span>
			{#if collection.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(collection.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
