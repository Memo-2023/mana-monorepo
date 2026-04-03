<!--
  Storage — DetailView (inline editable overlay)
  File details with editable name, favorite toggle. Auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { filesStore } from '../stores/files.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Heart, Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalFile } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let fileId = $derived(params.fileId as string);

	let file = $state<LocalFile | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');

	let focused = $state(false);

	$effect(() => {
		fileId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalFile>('files').get(fileId)).subscribe((val) => {
			file = val ?? null;
			if (val && !focused) {
				editName = val.name;
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		const name = editName.trim() || file?.name || 'Unbenannt';
		await filesStore.renameFile(fileId, name);
	}

	async function toggleFavorite() {
		await filesStore.toggleFileFavorite(fileId);
	}

	async function deleteFile() {
		const id = fileId;
		await filesStore.deleteFile(id);
		goBack();
		toastStore.undo('Datei gelöscht', () => {
			db.table('files').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
		return (bytes / 1073741824).toFixed(1) + ' GB';
	}
</script>

<div class="detail-view">
	{#if !file}
		<p class="empty">Datei nicht gefunden</p>
	{:else}
		<!-- Name -->
		<input
			class="title-input"
			bind:value={editName}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Dateiname..."
		/>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Originalname</span>
				<span class="prop-value">{file.originalName}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Typ</span>
				<span class="prop-value">{file.mimeType}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Größe</span>
				<span class="prop-value">{formatSize(file.size)}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Favorit</span>
				<button class="fav-btn" class:active={file.isFavorite} onclick={toggleFavorite}>
					<Heart size={16} weight={file.isFavorite ? 'fill' : 'regular'} />
				</button>
			</div>

			{#if file.checksum}
				<div class="prop-row">
					<span class="prop-label">Prüfsumme</span>
					<span class="prop-value mono">{file.checksum.slice(0, 16)}...</span>
				</div>
			{/if}
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(file.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if file.updatedAt}
				<span>Bearbeitet: {new Date(file.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Datei wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteFile}>Löschen</button>
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
		max-width: 60%;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.prop-value.mono {
		font-family: monospace;
		font-size: 0.75rem;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.fav-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: #9ca3af;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}
	.fav-btn:hover {
		color: #ef4444;
	}
	.fav-btn.active {
		color: #ef4444;
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
</style>
