<!--
  Inventar — DetailView (inline editable overlay)
  Collection details, always editable, auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { collectionsStore } from '../stores/collections.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalCollection, LocalItem } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let collectionId = $derived(params.collectionId as string);

	let collection = $state<LocalCollection | null>(null);
	let itemCount = $state(0);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');
	let editDescription = $state('');
	let editIcon = $state('');
	let editColor = $state('');

	let focused = $state(false);

	$effect(() => {
		collectionId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() =>
			db.table<LocalCollection>('invCollections').get(collectionId)
		).subscribe((val) => {
			collection = val ?? null;
			if (val && !focused) {
				editName = val.name;
				editDescription = val.description ?? '';
				editIcon = val.icon ?? '';
				editColor = val.color ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalItem>('invItems')
				.where('collectionId')
				.equals(collectionId)
				.filter((i) => !i.deletedAt)
				.count();
		}).subscribe((val) => {
			itemCount = val ?? 0;
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await collectionsStore.update(collectionId, {
			name: editName.trim() || collection?.name || 'Unbenannt',
			description: editDescription.trim() || null,
			icon: editIcon.trim() || null,
			color: editColor.trim() || null,
		});
	}

	async function deleteCollection() {
		const id = collectionId;
		await collectionsStore.delete(id);
		goBack();
		toastStore.undo('Sammlung gelöscht', () => {
			db.table('invCollections').update(id, {
				deletedAt: undefined,
				updatedAt: new Date().toISOString(),
			});
		});
	}
</script>

<div class="detail-view">
	{#if !collection}
		<p class="empty">Sammlung nicht gefunden</p>
	{:else}
		<!-- Icon + Title -->
		<div class="title-row">
			{#if collection.icon}
				<span class="title-icon">{collection.icon}</span>
			{/if}
			<input
				class="title-input"
				bind:value={editName}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Name..."
			/>
		</div>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Icon</span>
				<input
					class="prop-input"
					bind:value={editIcon}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="z.B. &#128230;"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Farbe</span>
				<input
					class="prop-input"
					bind:value={editColor}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="z.B. #78716C"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Gegenstaende</span>
				<span class="prop-value">{itemCount}</span>
			</div>
		</div>

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufuegen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(collection.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if collection.updatedAt}
				<span>Bearbeitet: {new Date(collection.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Sammlung wirklich loeschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteCollection}>Loeschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loeschen
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
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.title-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		padding-top: 0.125rem;
	}
	.title-input {
		flex: 1;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
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
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-input:hover,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
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
</style>
