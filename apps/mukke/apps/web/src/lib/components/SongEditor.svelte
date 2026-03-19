<script lang="ts">
	import type { Song } from '@mukke/shared';
	import { libraryStore } from '$lib/stores/library.svelte';

	interface Props {
		song: Song;
		open: boolean;
		onclose: () => void;
	}

	let { song, open, onclose }: Props = $props();

	let title = $state('');
	let artist = $state('');
	let album = $state('');
	let albumArtist = $state('');
	let genre = $state('');
	let trackNumber = $state('');
	let year = $state('');
	let bpm = $state('');
	let coverUrl = $state<string | null>(null);
	let saving = $state(false);
	let writingTags = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	const isMp3 = $derived(song.storagePath.toLowerCase().endsWith('.mp3'));

	$effect(() => {
		if (open && song) {
			title = song.title ?? '';
			artist = song.artist ?? '';
			album = song.album ?? '';
			albumArtist = song.albumArtist ?? '';
			genre = song.genre ?? '';
			trackNumber = song.trackNumber ? String(song.trackNumber) : '';
			year = song.year ? String(song.year) : '';
			bpm = song.bpm ? String(song.bpm) : '';
			error = null;
			success = null;
			loadCoverUrl();
		}
	});

	async function loadCoverUrl() {
		coverUrl = null;
		if (song.coverArtPath) {
			try {
				coverUrl = await libraryStore.getCoverUrl(song.id);
			} catch {
				// ignore
			}
		}
	}

	async function handleSave() {
		saving = true;
		error = null;
		success = null;
		try {
			await libraryStore.updateSongMetadata(song.id, {
				title: title || undefined,
				artist: artist || undefined,
				album: album || undefined,
				albumArtist: albumArtist || undefined,
				genre: genre || undefined,
				trackNumber: trackNumber ? parseInt(trackNumber) : undefined,
				year: year ? parseInt(year) : undefined,
				bpm: bpm ? parseFloat(bpm) : undefined,
			});
			success = 'Metadata saved';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}

	async function handleWriteTags() {
		writingTags = true;
		error = null;
		success = null;
		try {
			await libraryStore.writeTags(song.id);
			success = 'Tags written to file';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to write tags';
		} finally {
			writingTags = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Edit song metadata"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="bg-surface rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h2 class="text-lg font-semibold">Edit Song</h2>
				<button
					onclick={onclose}
					class="p-1 text-foreground-secondary hover:text-foreground transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="p-4 space-y-4">
				<!-- Cover Art -->
				{#if coverUrl}
					<div class="flex justify-center">
						<img
							src={coverUrl}
							alt="Cover art"
							class="w-32 h-32 object-cover rounded-lg shadow-md"
						/>
					</div>
				{/if}

				<!-- Form Fields -->
				<div class="grid grid-cols-1 gap-3">
					<div>
						<label for="edit-title" class="block text-xs font-medium text-foreground-secondary mb-1"
							>Title</label
						>
						<input
							id="edit-title"
							type="text"
							bind:value={title}
							class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label
								for="edit-artist"
								class="block text-xs font-medium text-foreground-secondary mb-1">Artist</label
							>
							<input
								id="edit-artist"
								type="text"
								bind:value={artist}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="Artist"
							/>
						</div>
						<div>
							<label
								for="edit-album"
								class="block text-xs font-medium text-foreground-secondary mb-1">Album</label
							>
							<input
								id="edit-album"
								type="text"
								bind:value={album}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="Album"
							/>
						</div>
					</div>
					<div>
						<label
							for="edit-album-artist"
							class="block text-xs font-medium text-foreground-secondary mb-1">Album Artist</label
						>
						<input
							id="edit-album-artist"
							type="text"
							bind:value={albumArtist}
							class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
							placeholder="Album Artist"
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label
								for="edit-genre"
								class="block text-xs font-medium text-foreground-secondary mb-1">Genre</label
							>
							<input
								id="edit-genre"
								type="text"
								bind:value={genre}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="Genre"
							/>
						</div>
						<div>
							<label
								for="edit-year"
								class="block text-xs font-medium text-foreground-secondary mb-1">Year</label
							>
							<input
								id="edit-year"
								type="text"
								bind:value={year}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="Year"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label
								for="edit-track"
								class="block text-xs font-medium text-foreground-secondary mb-1">Track #</label
							>
							<input
								id="edit-track"
								type="text"
								bind:value={trackNumber}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="1"
							/>
						</div>
						<div>
							<label for="edit-bpm" class="block text-xs font-medium text-foreground-secondary mb-1"
								>BPM</label
							>
							<input
								id="edit-bpm"
								type="text"
								bind:value={bpm}
								class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								placeholder="120"
							/>
						</div>
					</div>
				</div>

				<!-- Messages -->
				{#if error}
					<p class="text-sm text-red-500">{error}</p>
				{/if}
				{#if success}
					<p class="text-sm text-green-500">{success}</p>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-between pt-2 border-t border-border">
					{#if isMp3}
						<button
							onclick={handleWriteTags}
							disabled={writingTags || saving}
							class="px-3 py-2 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-50 transition-colors"
						>
							{writingTags ? 'Writing...' : 'Write to File'}
						</button>
					{:else}
						<div></div>
					{/if}
					<div class="flex gap-2">
						<button
							onclick={onclose}
							class="px-3 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							onclick={handleSave}
							disabled={saving || writingTags}
							class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
						>
							{saving ? 'Saving...' : 'Save'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
