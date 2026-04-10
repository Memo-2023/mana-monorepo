<!--
  Picture — Workbench ListView
  Recent images grid with favorites + inline upload (button + drag-and-drop).
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import { UploadSimple, Check, X } from '@mana/shared-icons';
	import { imagesStore } from './stores/images.svelte';
	import type { LocalImage } from './types';

	const MEDIA_URL = import.meta.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3015';

	const imagesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalImage>('images').toArray();
		const visible = all.filter((i) => !i.deletedAt && !i.isArchived);
		return decryptRecords('images', visible);
	}, [] as LocalImage[]);

	const images = $derived(imagesQuery.value);

	const sorted = $derived(
		[...images].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 20)
	);

	const favoriteCount = $derived(images.filter((i) => i.isFavorite).length);

	// ─── Upload State ────────────────────────────────────────
	interface UploadFile {
		file: File;
		preview: string;
		status: 'pending' | 'uploading' | 'success' | 'error';
		error?: string;
	}

	let dragActive = $state(false);
	let uploadFiles = $state<UploadFile[]>([]);
	let uploading = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		if (e.currentTarget === e.target) dragActive = false;
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

	function stripExt(name: string): string {
		const i = name.lastIndexOf('.');
		return i > 0 ? name.slice(0, i) : name;
	}

	function extOf(name: string): string | null {
		const i = name.lastIndexOf('.');
		return i > 0 ? name.slice(i + 1).toLowerCase() : null;
	}

	async function dimensionsOf(file: File): Promise<{ width: number; height: number } | null> {
		return new Promise((resolve) => {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve({ width: img.naturalWidth, height: img.naturalHeight });
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve(null);
			};
			img.src = url;
		});
	}

	async function uploadAll() {
		if (uploading) return;
		uploading = true;

		for (let i = 0; i < uploadFiles.length; i++) {
			if (uploadFiles[i].status !== 'pending') continue;

			uploadFiles[i].status = 'uploading';
			const uf = uploadFiles[i];

			try {
				const dims = await dimensionsOf(uf.file);

				const formData = new FormData();
				formData.append('file', uf.file);
				formData.append('app', 'picture');

				const response = await fetch(`${MEDIA_URL}/api/v1/media/upload`, {
					method: 'POST',
					body: formData,
				});
				if (!response.ok) throw new Error('Upload failed');
				const media = (await response.json()) as {
					id: string;
					urls: { original: string; thumbnail?: string };
				};

				const nowIso = new Date().toISOString();
				const local: LocalImage = {
					id: crypto.randomUUID(),
					prompt: stripExt(uf.file.name),
					storagePath: media.urls.original,
					publicUrl: media.urls.thumbnail ?? media.urls.original,
					filename: uf.file.name,
					format: extOf(uf.file.name),
					fileSize: uf.file.size,
					width: dims?.width ?? null,
					height: dims?.height ?? null,
					isPublic: false,
					isFavorite: false,
					downloadCount: 0,
					createdAt: nowIso,
					updatedAt: nowIso,
				};

				await imagesStore.insert(local);
				uploadFiles[i].status = 'success';
			} catch (e) {
				uploadFiles[i].status = 'error';
				uploadFiles[i].error = e instanceof Error ? e.message : 'Upload failed';
			}
		}

		uploading = false;

		setTimeout(() => {
			uploadFiles
				.filter((f) => f.status === 'success')
				.forEach((f) => URL.revokeObjectURL(f.preview));
			uploadFiles = uploadFiles.filter((f) => f.status !== 'success');
		}, 1500);
	}

	function removeUpload(index: number) {
		URL.revokeObjectURL(uploadFiles[index].preview);
		uploadFiles = uploadFiles.filter((_, i) => i !== index);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="picture-list-view"
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

	{#if dragActive}
		<div class="drop-overlay">
			<UploadSimple size={40} weight="bold" />
			<span>Bilder ablegen</span>
		</div>
	{/if}

	<button class="upload-btn" onclick={() => fileInput?.click()}>
		<UploadSimple size={16} />
		<span>Bilder hochladen</span>
	</button>

	{#if uploadFiles.length > 0}
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
						<button class="upload-indicator error" onclick={() => removeUpload(i)} title={uf.error}>
							<X size={14} weight="bold" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<BaseListView
		items={sorted}
		getKey={(i) => i.id}
		emptyTitle="Keine Bilder"
		listClass="grid grid-cols-2 sm:grid-cols-3 gap-1.5 content-start"
	>
		{#snippet header()}
			<span class="flex-1">{images.length} Bilder</span>
			<span>{favoriteCount} Favoriten</span>
		{/snippet}

		{#snippet item(image)}
			<div class="group relative aspect-square overflow-hidden rounded-md bg-white/5">
				{#if image.publicUrl}
					<img
						src={image.publicUrl}
						alt={image.prompt}
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-white/20 text-xs">
						{image.format ?? 'img'}
					</div>
				{/if}
				{#if image.isFavorite}
					<span class="absolute right-1 top-1 text-xs text-yellow-400">&#9733;</span>
				{/if}
			</div>
		{/snippet}
	</BaseListView>
</div>

<style>
	.picture-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		position: relative;
	}

	.hidden {
		display: none;
	}

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

	.upload-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem;
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
