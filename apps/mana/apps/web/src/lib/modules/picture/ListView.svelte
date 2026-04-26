<!--
  Picture — Unified ListView

  Single ListView that serves both the workbench card (homepage carousel,
  narrow width) AND the full /picture route (wide width). Layout adapts
  via container queries: at ≥ 600px the full toolbar (search, tag
  filters, view-mode toggles) shows; below that it collapses to a
  minimal strip so the card stays uncluttered.

  Data source: direct Dexie hooks from ./queries. Neither carousel nor
  route layout needs to inject contexts for this component.
-->
<script lang="ts">
	import {
		UploadSimple,
		Check,
		X,
		Heart,
		SquaresFour,
		Rows,
		GridFour,
		Plus,
		MagnifyingGlass,
		Archive,
	} from '@mana/shared-icons';
	import { imagesStore } from './stores/images.svelte';
	import { pictureViewStore } from './stores/view.svelte';
	import ImageLightbox from './components/ImageLightbox.svelte';
	import {
		useAllImages,
		useAllImageTags,
		useAllPictureTags,
		getFavoriteImages,
		getImagesByTags,
	} from './queries';
	import type { Image, LocalImage } from './types';

	const MEDIA_URL = import.meta.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3015';

	// ─── Data (direct Dexie queries — works in carousel + route) ────────
	const imagesQuery = useAllImages();
	const tagsQuery = useAllPictureTags();
	const imageTagsQuery = useAllImageTags();

	const allImages = $derived(imagesQuery.value);
	const allTags = $derived(tagsQuery.value);
	const allImageTags = $derived(imageTagsQuery.value);

	// ─── Filter state ─────────────────────────────────────────────────
	let searchQuery = $state('');
	let selectedTagIds = $state<string[]>([]);

	const filteredImages = $derived.by(() => {
		let result: Image[] = allImages;
		if (imagesStore.showFavoritesOnly) result = getFavoriteImages(result);
		if (selectedTagIds.length > 0) result = getImagesByTags(result, allImageTags, selectedTagIds);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter((img) => img.prompt.toLowerCase().includes(q));
		}
		return result;
	});

	const favoriteCount = $derived(allImages.filter((i) => i.isFavorite).length);

	const gridClass = $derived(
		pictureViewStore.viewMode === 'single'
			? 'grid-cols-1 max-w-2xl mx-auto'
			: pictureViewStore.viewMode === 'grid3'
				? 'grid-cols-2 @md:grid-cols-3'
				: 'grid-cols-3 @md:grid-cols-4 @lg:grid-cols-5'
	);

	function toggleTag(tagId: string) {
		selectedTagIds = selectedTagIds.includes(tagId)
			? selectedTagIds.filter((id) => id !== tagId)
			: [...selectedTagIds, tagId];
	}

	// ─── Detail modal ─────────────────────────────────────────────────
	let selectedImage = $state<Image | null>(null);

	async function handleToggleFavorite(img: Image) {
		await imagesStore.toggleFavorite(img.id);
	}
	async function handleArchive(img: Image) {
		await imagesStore.archiveImage(img.id);
		selectedImage = null;
	}

	// ─── Upload ───────────────────────────────────────────────────────
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

	// Distinguish file drags (uploads) from cross-module drags (app-page-wrapper
	// handles those). Only show our upload overlay if the drag carries real files.
	function isFileDrag(e: DragEvent): boolean {
		return Array.from(e.dataTransfer?.types ?? []).includes('Files');
	}
	function handleDragOver(e: DragEvent) {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		dragActive = true;
	}
	function handleDragLeave(e: DragEvent) {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		if (e.currentTarget === e.target) dragActive = false;
	}
	function handleDrop(e: DragEvent) {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		dragActive = false;
		if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
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
					visibility: 'private',
					isFavorite: false,
					downloadCount: 0,
					createdAt: nowIso,
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

<div
	class="picture-list @container"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="application"
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

	<!-- Primary action strip: always visible. Upload + Generate + Favorites + View-mode. -->
	<div class="action-strip">
		<button
			type="button"
			class="action-btn action-btn-upload"
			onclick={() => fileInput?.click()}
			title="Bilder hochladen"
		>
			<UploadSimple size={14} />
			<span class="action-label">Upload</span>
		</button>

		<a href="/picture/generate" class="action-btn action-btn-primary" title="Neues Bild generieren">
			<Plus size={14} />
			<span class="action-label">Generieren</span>
		</a>

		<button
			type="button"
			onclick={() => imagesStore.toggleFavoritesFilter()}
			class="action-btn"
			class:action-btn-active={imagesStore.showFavoritesOnly}
			title="Nur Favoriten anzeigen"
		>
			<Heart size={12} weight={imagesStore.showFavoritesOnly ? 'fill' : 'regular'} />
			<span class="action-label">Favoriten</span>
			{#if favoriteCount > 0}<span class="action-count">{favoriteCount}</span>{/if}
		</button>

		<div class="action-spacer"></div>

		<!-- View-mode toggle (wide-only) -->
		<div class="view-mode wide-only">
			<button
				onclick={() => pictureViewStore.setViewMode('single')}
				class="view-btn"
				class:active={pictureViewStore.viewMode === 'single'}
				title="Liste"
			>
				<Rows size={12} />
			</button>
			<button
				onclick={() => pictureViewStore.setViewMode('grid3')}
				class="view-btn"
				class:active={pictureViewStore.viewMode === 'grid3'}
				title="Mittel"
			>
				<GridFour size={12} />
			</button>
			<button
				onclick={() => pictureViewStore.setViewMode('grid5')}
				class="view-btn"
				class:active={pictureViewStore.viewMode === 'grid5'}
				title="Klein"
			>
				<SquaresFour size={12} />
			</button>
		</div>
	</div>

	<!-- Search + tag filters (wide-only — collapses on narrow card) -->
	<div class="search-bar wide-only">
		<div class="relative flex-1">
			<MagnifyingGlass
				size={14}
				class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Prompts durchsuchen…"
				class="w-full rounded-md border border-border bg-background py-1 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
			/>
		</div>
		{#each allTags as tag (tag.id)}
			<button
				onclick={() => toggleTag(tag.id)}
				class="tag-chip"
				class:tag-chip-active={selectedTagIds.includes(tag.id)}
				style={selectedTagIds.includes(tag.id) ? `background-color: ${tag.color || '#6b7280'}` : ''}
			>
				{tag.name}
			</button>
		{/each}
	</div>

	<!-- Upload progress chips -->
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
						<div class="upload-indicator"><div class="spinner"></div></div>
					{:else if uf.status === 'success'}
						<div class="upload-indicator success"><Check size={14} weight="bold" /></div>
					{:else if uf.status === 'error'}
						<button class="upload-indicator error" onclick={() => removeUpload(i)} title={uf.error}>
							<X size={14} weight="bold" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Gallery -->
	<div class="gallery">
		{#if filteredImages.length === 0}
			<div class="empty-state">
				<SquaresFour size={48} weight="thin" class="text-muted-foreground/30" />
				<h3>{allImages.length === 0 ? 'Noch keine Bilder' : 'Keine Ergebnisse'}</h3>
				<p>
					{allImages.length === 0
						? 'Generiere dein erstes Bild mit KI oder lade welche hoch'
						: 'Passe deine Filter an'}
				</p>
				{#if allImages.length === 0}
					<a href="/picture/generate" class="empty-cta">Erstes Bild generieren</a>
				{/if}
			</div>
		{:else}
			<div class="grid gap-1.5 {gridClass}">
				{#each filteredImages as img (img.id)}
					<button onclick={() => (selectedImage = img)} class="thumb" title={img.prompt}>
						{#if img.publicUrl}
							<img
								src={img.publicUrl}
								alt={img.prompt}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						{:else}
							<div class="thumb-fallback">{img.format ?? 'img'}</div>
						{/if}
						{#if img.isFavorite}
							<Heart size={12} weight="fill" class="thumb-fav" />
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Detail lightbox (fixed overlay — stays outside the container-query root).
     Picture-specific actions (Favorit, Archivieren) go into the `actions`
     snippet; the base lightbox handles layout, backdrop, ESC + close. -->
<ImageLightbox image={selectedImage} onClose={() => (selectedImage = null)}>
	{#snippet actions()}
		{#if selectedImage}
			<button
				type="button"
				onclick={() => selectedImage && handleToggleFavorite(selectedImage)}
				class="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
			>
				<Heart
					size={14}
					weight={selectedImage.isFavorite ? 'fill' : 'regular'}
					class={selectedImage.isFavorite ? 'text-red-500' : 'text-muted-foreground'}
				/>
				{selectedImage.isFavorite ? 'Entfernen' : 'Favorit'}
			</button>
			<button
				type="button"
				onclick={() => selectedImage && handleArchive(selectedImage)}
				class="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
			>
				<Archive size={14} class="text-muted-foreground" />
				Archivieren
			</button>
		{/if}
	{/snippet}
</ImageLightbox>

<style>
	.picture-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		position: relative;
		container-type: inline-size;
	}

	.hidden {
		display: none;
	}

	.drop-overlay {
		position: absolute;
		inset: 0.5rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: hsl(var(--color-primary) / 0.12);
		border: 2px dashed hsl(var(--color-primary));
		border-radius: 0.75rem;
		color: hsl(var(--color-primary));
		font-size: 0.875rem;
		font-weight: 600;
		pointer-events: none;
	}

	/* Action strip — always visible */
	.action-strip {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.15s;
	}
	.action-btn:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-foreground));
	}
	.action-btn-active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.action-btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.action-btn-primary:hover {
		background: hsl(var(--color-primary) / 0.9);
		color: hsl(var(--color-primary-foreground));
	}
	.action-btn-upload {
		border-style: dashed;
	}
	.action-count {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0 0.25rem;
		border-radius: 9999px;
		background: hsl(var(--color-foreground) / 0.08);
	}
	.action-spacer {
		flex: 1;
	}

	/* View-mode toggle */
	.view-mode {
		display: inline-flex;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		overflow: hidden;
	}
	.view-btn {
		padding: 0.25rem 0.375rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.view-btn:hover {
		color: hsl(var(--color-foreground));
	}
	.view-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* Search + tags */
	.search-bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.tag-chip {
		border: none;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 500;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.tag-chip:hover {
		color: hsl(var(--color-foreground));
	}
	.tag-chip-active {
		color: hsl(var(--color-primary-foreground));
	}

	/* Narrow (card) widths: hide search + view-mode.
	   The @container query triggers against .picture-list's inline-size.
	   Below ~560px we collapse to a minimal action strip. */
	@container (max-width: 560px) {
		.wide-only {
			display: none;
		}
		.action-label {
			/* On narrow widths, action buttons shrink to icon-only. */
			display: none;
		}
	}

	/* Upload progress chips */
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
		outline: 2px solid hsl(var(--color-success));
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
		background: hsl(0 0% 0% / 0.4);
		color: white;
		border: none;
		cursor: default;
	}
	.upload-indicator.success {
		background: hsl(var(--color-success) / 0.5);
	}
	.upload-indicator.error {
		background: hsl(var(--color-error) / 0.5);
		cursor: pointer;
	}
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid hsl(0 0% 100% / 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Gallery */
	.gallery {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		gap: 0.375rem;
	}
	.empty-state h3 {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.empty-state p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty-cta {
		margin-top: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
	}
	.empty-cta:hover {
		background: hsl(var(--color-primary) / 0.9);
	}

	.thumb {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		cursor: pointer;
		padding: 0;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.thumb:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.15);
	}
	.thumb-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		color: hsl(var(--color-muted-foreground) / 0.6);
		font-size: 0.75rem;
		background: hsl(var(--color-muted));
	}
	:global(.thumb-fav) {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		color: hsl(var(--color-error));
		filter: drop-shadow(0 1px 2px hsl(0 0% 0% / 0.6));
	}
</style>
