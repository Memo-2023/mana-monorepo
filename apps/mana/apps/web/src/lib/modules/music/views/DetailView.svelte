<!--
  Music — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { libraryStore } from '../stores/library.svelte';
	import { Heart } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalSong } from '../types';

	let { params, goBack }: ViewProps = $props();
	let songId = $derived(params.songId as string);

	let editTitle = $state('');
	let editArtist = $state('');
	let editAlbum = $state('');
	let editGenre = $state('');
	let editYear = $state<number | null>(null);
	let editBpm = $state<number | null>(null);

	const detail = useDetailEntity<LocalSong>({
		id: () => songId,
		table: 'songs',
		decrypt: true,
		onLoad: (val) => {
			editTitle = val.title;
			editArtist = val.artist ?? '';
			editAlbum = val.album ?? '';
			editGenre = val.genre ?? '';
			editYear = val.year ?? null;
			editBpm = val.bpm ?? null;
		},
	});

	async function saveField() {
		detail.blur();
		await libraryStore.updateMetadata(songId, {
			title: editTitle.trim() || detail.entity?.title || 'Ohne Titel',
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

	function formatDuration(sec?: number | null): string {
		if (!sec) return '--:--';
		const m = Math.floor(sec / 60);
		const s = Math.round(sec % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Song nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Song wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Song gelöscht',
			delete: () => libraryStore.delete(songId),
			goBack,
		})}
>
	{#snippet body(song)}
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editTitle}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Titel..."
			/>
			<button class="fav-btn" class:active={song.favorite} onclick={toggleFavorite}>
				<Heart size={18} weight={song.favorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Künstler</span>
				<input
					class="prop-input"
					bind:value={editArtist}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Unbekannt"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Album</span>
				<input
					class="prop-input"
					bind:value={editAlbum}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Genre</span>
				<input
					class="prop-input"
					bind:value={editGenre}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Jahr</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editYear}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">BPM</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editBpm}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="—"
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

		<div class="meta">
			<span>Erstellt: {formatDate(new Date(song.createdAt ?? ''))}</span>
			{#if song.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(song.updatedAt))}</span>
			{/if}
			{#if song.lastPlayedAt}
				<span>Zuletzt gehört: {formatDate(new Date(song.lastPlayedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
