<!--
  Cards — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { deckStore } from '../stores/decks.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalDeck, LocalCard } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let deckId = $derived(params.deckId as string);

	let deck = $state<LocalDeck | null>(null);
	let cardCount = $state(0);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');
	let editDescription = $state('');
	let editColor = $state('#6366f1');
	let editIsPublic = $state(false);

	let focused = $state(false);

	$effect(() => {
		deckId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalDeck>('decks').get(deckId)).subscribe((val) => {
			deck = val ?? null;
			if (val && !focused) {
				editName = val.name;
				editDescription = val.description ?? '';
				editColor = val.color ?? '#6366f1';
				editIsPublic = val.isPublic;
			}
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalCard>('cards')
				.where('deckId')
				.equals(deckId)
				.filter((c) => !c.deletedAt)
				.count();
		}).subscribe((val) => {
			cardCount = val ?? 0;
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await deckStore.updateDeck(deckId, {
			title: editName.trim() || deck?.name || 'Unbenannt',
			description: editDescription.trim() || undefined,
			isPublic: editIsPublic,
		});
		// Color is not in UpdateDeckInput, update directly
		await db.table('decks').update(deckId, {
			color: editColor,
			updatedAt: new Date().toISOString(),
		});
	}

	async function handlePublicToggle() {
		editIsPublic = !editIsPublic;
		await deckStore.updateDeck(deckId, { isPublic: editIsPublic });
	}

	async function deleteDeck() {
		const id = deckId;
		await deckStore.deleteDeck(id);
		goBack();
		toastStore.undo('Deck gelöscht', () => {
			db.table('decks').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}
</script>

<div class="detail-view">
	{#if !deck}
		<p class="empty">Deck nicht gefunden</p>
	{:else}
		<!-- Name -->
		<input
			class="title-input"
			bind:value={editName}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Deck-Name..."
		/>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Farbe</span>
				<input
					type="color"
					class="color-input"
					bind:value={editColor}
					onfocus={() => (focused = true)}
					onblur={saveField}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Öffentlich</span>
				<button class="toggle-btn" class:active={editIsPublic} onclick={handlePublicToggle}>
					{editIsPublic ? 'Ja' : 'Nein'}
				</button>
			</div>

			<div class="prop-row">
				<span class="prop-label">Karten</span>
				<span class="prop-value">{cardCount}</span>
			</div>

			{#if deck.lastStudied}
				<div class="prop-row">
					<span class="prop-label">Zuletzt gelernt</span>
					<span class="prop-value">{new Date(deck.lastStudied).toLocaleDateString('de')}</span>
				</div>
			{/if}
		</div>

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(deck.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if deck.updatedAt}
				<span>Bearbeitet: {new Date(deck.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Deck wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteDeck}>Löschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Löschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Title */
	.title-input {
		font-size: 1.125rem;
		font-weight: 600;
		border: 1px solid transparent;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0.125rem 0;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
	}
	.title-input:hover,
	.title-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:hover,
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Properties */
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-value {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.color-input {
		width: 28px;
		height: 24px;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		padding: 0;
		cursor: pointer;
		background: transparent;
	}
	.color-input:hover {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .color-input:hover {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.toggle-btn {
		font-size: 0.8125rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.toggle-btn:hover {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.toggle-btn.active {
		color: #22c55e;
	}
	:global(.dark) .toggle-btn {
		color: #6b7280;
	}
	:global(.dark) .toggle-btn:hover {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .toggle-btn.active {
		color: #22c55e;
	}

	/* Sections */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
		color: #4b5563;
	}

	/* Meta & actions */
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.action-btn,
		.toggle-btn,
		.color-input {
			min-height: 44px;
		}
	}
</style>
