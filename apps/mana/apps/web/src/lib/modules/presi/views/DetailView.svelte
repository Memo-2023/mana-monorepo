<!--
  Presi — DetailView (inline editable overlay)
  Presentation deck details. All fields auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { decksStore } from '../stores/decks.svelte';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalDeck, LocalSlide } from '../types';

	let { params, goBack }: ViewProps = $props();
	let deckId = $derived(params.deckId as string);

	let editTitle = $state('');
	let editDescription = $state('');

	const detail = useDetailEntity<LocalDeck>({
		id: () => deckId,
		table: 'presiDecks',
		onLoad: (val) => {
			editTitle = val.title;
			editDescription = val.description ?? '';
		},
	});

	let slideCount = $state(0);
	$effect(() => {
		const sub = liveQuery(async () =>
			db
				.table<LocalSlide>('slides')
				.where('deckId')
				.equals(deckId)
				.filter((s) => !s.deletedAt)
				.count()
		).subscribe((val) => {
			slideCount = val ?? 0;
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		detail.blur();
		await decksStore.updateDeck(deckId, {
			title: editTitle.trim() || detail.entity?.title || 'Unbenannt',
			description: editDescription.trim() || undefined,
		});
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Präsentation nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Präsentation wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Präsentation gelöscht',
			// deleteDeck returns Promise<boolean>; the deleteWithUndo helper
			// expects Promise<void>, so we discard the result.
			delete: async () => {
				await decksStore.deleteDeck(deckId);
			},
			goBack,
		})}
>
	{#snippet body(deck)}
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Titel..."
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Sichtbarkeit</span>
				<VisibilityPicker
					level={deck.visibility ?? 'space'}
					onChange={(next: VisibilityLevel) => decksStore.setVisibility(deckId, next)}
					disabledLevels={['unlisted']}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Folien</span>
				<span class="prop-value">{slideCount}</span>
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
			<span>Erstellt: {formatDate(new Date(deck.createdAt ?? ''))}</span>
			{#if deck.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(deck.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
