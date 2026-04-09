<!--
  Photos — Workbench ListView
  Drop-to-upload zone, recent photos, albums overview.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalAlbum, LocalFavorite } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { UploadSimple, X, Check, ImageSquare } from '@mana/shared-icons';

	let { navigate }: ViewProps = $props();

	const MEDIA_URL = import.meta.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3015';

	let albums = $state<LocalAlbum[]>([]);
	let favorites = $state<LocalFavorite[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalAlbum>('albums')
				.toArray()
				.then((all) => all.filter((a) => !a.deletedAt));
		}).subscribe((val) => {
			albums = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFavorite>('photoFavorites')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt));
		}).subscribe((val) => {
			favorites = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	// ─── Upload State ────────────────────────────────────────
	let dragActive = $state(false);
	let fileInput: HTMLInputElement;

	interface UploadFile {
		file: File;
		preview: string;
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
		const imageFiles = files.filter((f) => f.type.startsWith('image/'));
		if (imageFiles.length === 0) return;

		const newFiles: UploadFile[] = imageFiles.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
			status: 'pending',
		}));

		uploadFiles = [...uploadFiles, ...newFiles];
		uploadAll();
	}

	async function uploadAll() {
		if (uploading) return;
		uploading = true;

		for (let i = 0; i < uploadFiles.length; i++) {
			if (uploadFiles[i].status !== 'pending') continue;

			uploadFiles[i].status = 'uploading';

			try {
				const formData = new FormData();
				formData.append('file', uploadFiles[i].file);
				formData.append('app', 'photos');

				const response = await fetch(`${MEDIA_URL}/api/v1/media/upload`, {
					method: 'POST',
					body: formData,
				});
				if (!response.ok) throw new Error('Upload failed');

				uploadFiles[i].status = 'success';
			} catch (e) {
				uploadFiles[i].status = 'error';
				uploadFiles[i].error = e instanceof Error ? e.message : 'Upload failed';
			}
		}

		uploading = false;

		// Clear successful uploads after a delay
		setTimeout(() => {
			uploadFiles
				.filter((f) => f.status === 'success')
				.forEach((f) => URL.revokeObjectURL(f.preview));
			uploadFiles = uploadFiles.filter((f) => f.status !== 'success');
		}, 2000);
	}

	function removeUpload(index: number) {
		URL.revokeObjectURL(uploadFiles[index].preview);
		uploadFiles = uploadFiles.filter((_, i) => i !== index);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="photos-list-view"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		class="hidden"
		onchange={handleFileSelect}
	/>

	<!-- Drop Overlay -->
	{#if dragActive}
		<div class="drop-overlay">
			<UploadSimple size={40} weight="bold" />
			<span>Fotos ablegen</span>
		</div>
	{/if}

	<!-- Stats -->
	<div class="stats-row">
		<span>{albums.length} Alben</span>
		<span>{favorites.length} Favoriten</span>
	</div>

	<!-- Upload Previews -->
	{#if uploadFiles.length > 0}
		<div class="upload-section">
			<div class="upload-grid">
				{#each uploadFiles as uf, i (uf.preview)}
					<div
						class="upload-thumb"
						class:success={uf.status === 'success'}
						class:error={uf.status === 'error'}
					>
						<img src={uf.preview} alt="" />
						{#if uf.status === 'uploading'}
							<div class="upload-indicator">
								<div class="spinner"></div>
							</div>
						{:else if uf.status === 'success'}
							<div class="upload-indicator success">
								<Check size={14} weight="bold" />
							</div>
						{:else if uf.status === 'error'}
							<button
								class="upload-indicator error"
								onclick={() => removeUpload(i)}
								title={uf.error}
							>
								<X size={14} weight="bold" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Upload Button -->
	<button class="upload-btn" onclick={() => fileInput?.click()}>
		<UploadSimple size={16} />
		<span>Fotos hochladen</span>
	</button>

	<!-- Albums -->
	<div class="albums-section">
		<h3 class="section-label">Alben</h3>
		{#each albums as album (album.id)}
			<div class="album-row">
				<div class="album-icon">
					<ImageSquare size={16} weight="regular" />
				</div>
				<div class="album-info">
					<p class="album-name">{album.name}</p>
					{#if album.description}
						<p class="album-desc">{album.description}</p>
					{/if}
				</div>
				<span class="album-badge">
					{album.isAutoGenerated ? 'Auto' : ''}
				</span>
			</div>
		{/each}

		{#if albums.length === 0}
			<p class="empty-text">Keine Alben</p>
		{/if}
	</div>
</div>

<style>
	.photos-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		height: 100%;
		position: relative;
	}

	.hidden {
		display: none;
	}

	/* ── Drop Overlay ──────────────────────────────── */
	.drop-overlay {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(99, 102, 241, 0.15);
		border: 2px dashed hsl(var(--color-primary));
		border-radius: 0.75rem;
		color: hsl(var(--color-primary));
		font-size: 0.875rem;
		font-weight: 600;
		pointer-events: none;
	}

	/* ── Stats ─────────────────────────────────────── */
	.stats-row {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Upload Button ─────────────────────────────── */
	.upload-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem;
		border-radius: 0.5rem;
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.upload-btn:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: rgba(99, 102, 241, 0.05);
	}

	/* ── Upload Previews ───────────────────────────── */
	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.upload-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: 0.25rem;
	}

	.upload-thumb {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0.375rem;
		overflow: hidden;
		background: hsl(var(--color-muted));
	}
	.upload-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.upload-thumb.success {
		outline: 2px solid #22c55e;
		outline-offset: -2px;
	}
	.upload-thumb.error {
		outline: 2px solid hsl(var(--color-error));
		outline-offset: -2px;
	}

	.upload-indicator {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.4);
		color: white;
		border: none;
		cursor: default;
	}
	.upload-indicator.success {
		background: rgba(34, 197, 94, 0.5);
	}
	.upload-indicator.error {
		background: rgba(239, 68, 68, 0.5);
		cursor: pointer;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	/* ── Albums ─────────────────────────────────────── */
	.albums-section {
		flex: 1;
		overflow-y: auto;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.5rem;
	}

	.album-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		margin-bottom: 0.25rem;
		transition: background 0.15s;
		cursor: pointer;
	}
	.album-row:hover {
		background: hsl(var(--color-muted));
	}

	.album-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.album-info {
		flex: 1;
		min-width: 0;
	}

	.album-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.album-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.album-badge {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.empty-text {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.photos-list-view {
			padding: 0.5rem;
		}
		.album-row {
			padding: 0.625rem;
			min-height: 44px;
		}
	}
</style>
