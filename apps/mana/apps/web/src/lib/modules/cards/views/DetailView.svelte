<!--
  Cards — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { deckStore } from '../stores/decks.svelte';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalDeck, LocalCard } from '../types';
	import { _ } from 'svelte-i18n';

	let { params, goBack }: ViewProps = $props();
	let deckId = $derived(params.deckId as string);

	let editName = $state('');
	let editDescription = $state('');
	let editColor = $state('#6366f1');

	const detail = useDetailEntity<LocalDeck>({
		id: () => deckId,
		table: 'decks',
		onLoad: (val) => {
			editName = val.name;
			editDescription = val.description ?? '';
			editColor = val.color ?? '#6366f1';
		},
	});

	let cardCount = $state(0);
	$effect(() => {
		const sub = liveQuery(async () =>
			db
				.table<LocalCard>('cards')
				.where('deckId')
				.equals(deckId)
				.filter((c) => !c.deletedAt)
				.count()
		).subscribe((val) => {
			cardCount = val ?? 0;
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		detail.blur();
		await deckStore.updateDeck(deckId, {
			title: editName.trim() || detail.entity?.name || $_('cards.detail.name_fallback'),
			description: editDescription.trim() || undefined,
		});
		// Color is not in UpdateDeckInput, update directly
		await db.table('decks').update(deckId, {
			color: editColor,
		});
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel={$_('cards.detail.not_found')}
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel={$_('cards.detail.confirm_delete')}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: $_('cards.detail.toast_deleted'),
			delete: () => deckStore.deleteDeck(deckId),
			goBack,
		})}
>
	{#snippet body(deck)}
		<input
			class="title-input"
			bind:value={editName}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder={$_('cards.detail.placeholder_name')}
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">{$_('cards.detail.prop_color')}</span>
				<input
					type="color"
					class="color-input"
					bind:value={editColor}
					onfocus={detail.focus}
					onblur={saveField}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('cards.detail.prop_visibility')}</span>
				<VisibilityPicker
					level={deck.visibility ?? 'space'}
					onChange={(next: VisibilityLevel) => deckStore.setVisibility(deckId, next)}
					disabledLevels={['unlisted']}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('cards.detail.prop_cards')}</span>
				<span class="prop-value">{cardCount}</span>
			</div>

			{#if deck.lastStudied}
				<div class="prop-row">
					<span class="prop-label">{$_('cards.detail.prop_last_studied')}</span>
					<span class="prop-value">{formatDate(new Date(deck.lastStudied))}</span>
				</div>
			{/if}
		</div>

		<div class="section">
			<span class="section-label">{$_('cards.detail.section_description')}</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder={$_('cards.detail.placeholder_description')}
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			<span
				>{$_('cards.detail.meta_created', {
					values: { date: formatDate(new Date(deck.createdAt ?? '')) },
				})}</span
			>
			{#if deck.updatedAt}
				<span
					>{$_('cards.detail.meta_updated', {
						values: { date: formatDate(new Date(deck.updatedAt)) },
					})}</span
				>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
