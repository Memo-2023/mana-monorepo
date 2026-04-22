<!--
  Music — Workbench ListView
  Song library with recent plays, drag-to-upload for audio files.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import { UploadSimple, Check, X, SpinnerGap } from '@mana/shared-icons';
	import type { LocalSong, LocalPlaylist } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { libraryStore } from './stores/library.svelte';
	import { getManaApiUrl } from '$lib/api/config';
	import { authStore } from '$lib/stores/auth.svelte';

	let { navigate }: ViewProps = $props();

	const songsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalSong>('songs').toArray();
		const visible = all.filter((s) => !s.deletedAt);
		return decryptRecords('songs', visible);
	}, [] as LocalSong[]);

	const playlistsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPlaylist>('playlists').toArray();
		return all.filter((p) => !p.deletedAt);
	}, [] as LocalPlaylist[]);

	const songs = $derived(songsQuery.value);
	const playlists = $derived(playlistsQuery.value);

	const recentlyPlayed = $derived(
		[...songs]
			.filter((s) => s.lastPlayedAt)
			.sort((a, b) => (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''))
			.slice(0, 10)
	);

	const favorites = $derived(songs.filter((s) => s.favorite));

	function formatDuration(sec?: number | null): string {
		if (!sec) return '--:--';
		const m = Math.floor(sec / 60);
		const s = Math.round(sec % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	// ─── Upload State ────────────────────────────────────────
	let dragActive = $state(false);
	let fileInput: HTMLInputElement;

	interface UploadFile {
		file: File;
		status: 'pending' | 'uploading' | 'success' | 'error';
		error?: string;
	}

	let uploadFiles = $state<UploadFile[]>([]);
	let uploading = $state(false);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
		if (e.dataTransfer?.files) {
			addFiles(Array.from(e.dataTransfer.files));
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			addFiles(Array.from(input.files));
			input.value = '';
		}
	}

	function addFiles(files: File[]) {
		const audioFiles = files.filter((f) => f.type.startsWith('audio/'));
		if (audioFiles.length === 0) return;

		const newFiles: UploadFile[] = audioFiles.map((file) => ({
			file,
			status: 'pending',
		}));

		uploadFiles = [...uploadFiles, ...newFiles];
		uploadAll();
	}

	/** Extract duration in seconds from an audio file via a temporary Audio element. */
	function getAudioDuration(file: File): Promise<number | null> {
		return new Promise((resolve) => {
			const url = URL.createObjectURL(file);
			const audio = new Audio();
			audio.preload = 'metadata';
			audio.onloadedmetadata = () => {
				const dur = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
				URL.revokeObjectURL(url);
				resolve(dur);
			};
			audio.onerror = () => {
				URL.revokeObjectURL(url);
				resolve(null);
			};
			audio.src = url;
		});
	}

	async function uploadAll() {
		if (uploading) return;
		uploading = true;

		const token = await authStore.getValidToken();

		for (let i = 0; i < uploadFiles.length; i++) {
			if (uploadFiles[i]!.status !== 'pending') continue;

			uploadFiles[i]!.status = 'uploading';

			try {
				if (!token) throw new Error('Nicht eingeloggt');

				// 1. Get presigned upload URL from mana-api
				const res = await fetch(`${getManaApiUrl()}/api/v1/music/songs/upload`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ filename: uploadFiles[i]!.file.name }),
				});
				if (!res.ok) throw new Error('Upload-URL konnte nicht erstellt werden');

				const { song, uploadUrl } = (await res.json()) as {
					song: { id: string; title: string; storagePath: string };
					uploadUrl: string;
				};

				// 2. Upload file directly to S3/MinIO via presigned URL
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					body: uploadFiles[i]!.file,
					headers: { 'Content-Type': uploadFiles[i]!.file.type || 'audio/mpeg' },
				});
				if (!putRes.ok) throw new Error('Datei-Upload fehlgeschlagen');

				// 3. Extract duration from the audio file
				const duration = await getAudioDuration(uploadFiles[i]!.file);

				// 4. Create local IndexedDB record
				const now = new Date().toISOString();
				await libraryStore.insert({
					id: song.id,
					title: song.title,
					storagePath: song.storagePath,
					duration,
					favorite: false,
					playCount: 0,
					fileSize: uploadFiles[i]!.file.size,
					createdAt: now,
					updatedAt: now,
				} as LocalSong);

				uploadFiles[i]!.status = 'success';
			} catch (e) {
				uploadFiles[i]!.status = 'error';
				uploadFiles[i]!.error = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
			}
		}

		uploading = false;

		// Clear successful uploads after a delay
		setTimeout(() => {
			uploadFiles = uploadFiles.filter((f) => f.status !== 'success');
		}, 2000);
	}

	function removeUpload(index: number) {
		uploadFiles = uploadFiles.filter((_, i) => i !== index);
	}
</script>

<div
	class="music-list-view"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="application"
>
	<input
		bind:this={fileInput}
		type="file"
		accept="audio/*"
		multiple
		class="hidden"
		onchange={handleFileSelect}
	/>

	<!-- Drop Overlay -->
	{#if dragActive}
		<div class="drop-overlay">
			<UploadSimple size={32} weight="bold" />
			<span>Musik ablegen</span>
		</div>
	{/if}

	<BaseListView items={recentlyPlayed} getKey={(s) => s.id} emptyTitle="Noch nichts gehört">
		{#snippet header()}
			<span>{songs.length} Songs</span>
			<span>{playlists.length} Playlists</span>
			<span>{favorites.length} Favoriten</span>
		{/snippet}

		{#snippet toolbar()}
			<!-- Upload button + file status -->
			<div class="upload-section">
				<button class="upload-btn" onclick={() => fileInput.click()}>
					<UploadSimple size={14} />
					<span>Musik hochladen</span>
				</button>

				{#if uploadFiles.length > 0}
					<div class="upload-list">
						{#each uploadFiles as uf, i (uf.file.name + i)}
							<div
								class="upload-item"
								class:success={uf.status === 'success'}
								class:error={uf.status === 'error'}
							>
								<span class="upload-name">{uf.file.name}</span>
								{#if uf.status === 'uploading'}
									<SpinnerGap size={12} class="spinner" />
								{:else if uf.status === 'success'}
									<Check size={12} />
								{:else if uf.status === 'error'}
									<button class="upload-remove" onclick={() => removeUpload(i)} title={uf.error}>
										<X size={12} />
									</button>
								{:else}
									<button class="upload-remove" onclick={() => removeUpload(i)}>
										<X size={12} />
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet listHeader()}
			<h3 class="mb-2 text-xs font-medium text-muted-foreground">Zuletzt gehört</h3>
		{/snippet}

		{#snippet item(song)}
			<button
				onclick={() =>
					navigate('detail', {
						songId: song.id,
						_siblingIds: recentlyPlayed.map((s) => s.id),
						_siblingKey: 'songId',
					})}
				class="flex w-full min-h-[44px] items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 cursor-pointer text-left"
			>
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground"
				>
					&#9835;
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-foreground">{song.title}</p>
					<p class="truncate text-xs text-muted-foreground">{song.artist ?? 'Unbekannt'}</p>
				</div>
				<span class="text-xs text-muted-foreground/70">{formatDuration(song.duration)}</span>
			</button>
		{/snippet}
	</BaseListView>
</div>

<style>
	.music-list-view {
		position: relative;
		height: 100%;
	}

	.drop-overlay {
		position: absolute;
		inset: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: hsl(var(--color-primary) / 0.12);
		border: 2px dashed hsl(var(--color-primary));
		border-radius: 0.5rem;
		color: hsl(var(--color-primary));
		font-size: 0.8125rem;
		font-weight: 600;
		pointer-events: none;
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0 1rem;
		margin-bottom: 0.5rem;
	}

	.upload-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.upload-btn:hover {
		border-color: hsl(var(--color-border-strong));
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}

	.upload-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.upload-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted) / 0.5);
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.upload-item.success {
		color: hsl(var(--color-success));
	}
	.upload-item.error {
		color: hsl(var(--color-error));
	}

	.upload-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.upload-remove {
		display: flex;
		align-items: center;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		padding: 0;
		opacity: 0.6;
		transition: opacity 0.15s;
	}
	.upload-remove:hover {
		opacity: 1;
	}

	:global(.upload-section .spinner) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
