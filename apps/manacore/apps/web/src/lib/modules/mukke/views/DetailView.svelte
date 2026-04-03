<!--
  Mukke — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { libraryStore } from '../stores/library.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Heart, Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalSong } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let songId = $derived(params.songId as string);

	let song = $state<LocalSong | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editArtist = $state('');
	let editAlbum = $state('');
	let editGenre = $state('');
	let editYear = $state<number | null>(null);
	let editBpm = $state<number | null>(null);

	let focused = $state(false);

	$effect(() => {
		songId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalSong>('songs').get(songId)).subscribe((val) => {
			song = val ?? null;
			if (val && !focused) {
				editTitle = val.title;
				editArtist = val.artist ?? '';
				editAlbum = val.album ?? '';
				editGenre = val.genre ?? '';
				editYear = val.year ?? null;
				editBpm = val.bpm ?? null;
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await libraryStore.updateMetadata(songId, {
			title: editTitle.trim() || song?.title || 'Ohne Titel',
			artist: editArtist.trim() || undefined,
			album: editAlbum.trim() || undefined,
			genre: editGenre.trim() || undefined,
			year: editYear,
			bpm: editBpm,
		});
	}

	async function toggleFavorite() {
		await libraryStore.toggleFavorite(songId);
	}

	async function deleteSong() {
		const id = songId;
		await libraryStore.delete(id);
		goBack();
		toastStore.undo('Song gelöscht', () => {
			db.table('songs').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}

	function formatDuration(sec?: number | null): string {
		if (!sec) return '--:--';
		const m = Math.floor(sec / 60);
		const s = Math.round(sec % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<div class="detail-view">
	{#if !song}
		<p class="empty">Song nicht gefunden</p>
	{:else}
		<!-- Title row with favorite -->
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editTitle}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Titel..."
			/>
			<button class="fav-btn" onclick={toggleFavorite}>
				<Heart size={18} weight={song.favorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Künstler</span>
				<input
					class="prop-input"
					bind:value={editArtist}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Unbekannt"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Album</span>
				<input
					class="prop-input"
					bind:value={editAlbum}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="--"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Genre</span>
				<input
					class="prop-input"
					bind:value={editGenre}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="--"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Jahr</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editYear}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="--"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">BPM</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editBpm}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="--"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Dauer</span>
				<span class="prop-value">{formatDuration(song.duration)}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Wiedergaben</span>
				<span class="prop-value">{song.playCount}</span>
			</div>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(song.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if song.updatedAt}
				<span>Bearbeitet: {new Date(song.updatedAt).toLocaleDateString('de')}</span>
			{/if}
			{#if song.lastPlayedAt}
				<span>Zuletzt gehört: {new Date(song.lastPlayedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Song wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteSong}>Löschen</button>
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

	/* Title row */
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
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
	.fav-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: #ef4444;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.fav-btn:hover {
		transform: scale(1.15);
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
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
		text-align: right;
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

	/* Number inputs — hide spinners */
	.prop-input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.prop-input[type='number']::-webkit-inner-spin-button,
	.prop-input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
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
