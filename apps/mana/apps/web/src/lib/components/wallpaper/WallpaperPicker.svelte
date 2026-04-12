<script lang="ts">
	import type { WallpaperConfig, WallpaperGradient, ThemeVariant } from '@mana/shared-theme';
	import {
		Image,
		Palette,
		UploadSimple,
		X,
		Check,
		Prohibit,
		Trash,
		SpinnerGap,
	} from '@mana/shared-icons';
	import { browser } from '$app/environment';
	import { PREDEFINED_WALLPAPERS, GRADIENT_PRESETS } from '$lib/config/wallpapers';
	import { wallpaperStore } from '$lib/stores/wallpaper.svelte';
	import { theme } from '$lib/stores/theme';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';

	// ── Media URL ───────────────────────────────────────────────

	const MEDIA_URL =
		(browser
			? (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string }).__PUBLIC_MANA_MEDIA_URL__
			: undefined) ||
		import.meta.env.PUBLIC_MANA_MEDIA_URL ||
		'http://localhost:3015';

	// ── Types ────────────────────────────────────────────────────

	interface UploadedMedia {
		id: string;
		url: string;
		thumbUrl: string;
		originalName: string;
	}

	type Tab = 'gradients' | 'images' | 'upload';

	let activeTab = $state<Tab>('gradients');
	let scope = $state<'global' | 'scene'>('global');

	// Overlay controls
	let blur = $state(wallpaperStore.persisted.overlay?.blur ?? 0);
	let overlayOpacity = $state(wallpaperStore.persisted.overlay?.opacity ?? 0);

	// Upload state
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadedWallpapers = $state<UploadedMedia[]>([]);
	let loadingGallery = $state(false);
	let isDragging = $state(false);

	// Current variant for filtering
	let currentVariant = $derived<ThemeVariant>(theme.variant);

	// Predefined wallpapers for current variant (+ all others)
	let variantWallpapers = $derived(
		PREDEFINED_WALLPAPERS.filter((w) => w.variant === currentVariant)
	);
	let otherWallpapers = $derived(PREDEFINED_WALLPAPERS.filter((w) => w.variant !== currentVariant));

	// Gradient presets for current variant
	let gradientPresets = $derived(GRADIENT_PRESETS[currentVariant] ?? []);

	// Current persisted wallpaper source (for highlighting active selection)
	let currentSource = $derived(wallpaperStore.persisted.source);

	// Has multiple scenes?
	let hasMultipleScenes = $derived(workbenchScenesStore.scenes.length > 1);

	// ── Load uploaded wallpapers on mount ────────────────────────

	async function loadUploadedWallpapers() {
		loadingGallery = true;
		try {
			const res = await fetch(`${MEDIA_URL}/api/v1/media?app=wallpapers&limit=50`);
			if (!res.ok) return;
			const data = await res.json();
			const items: UploadedMedia[] = (data.items ?? data ?? []).map(
				(m: { id: string; originalName?: string }) => ({
					id: m.id,
					url: `${MEDIA_URL}/api/v1/media/${m.id}/file/large`,
					thumbUrl: `${MEDIA_URL}/api/v1/media/${m.id}/file/thumb`,
					originalName: m.originalName ?? 'Bild',
				})
			);
			uploadedWallpapers = items;
		} catch {
			// mana-media may not be running in dev
		} finally {
			loadingGallery = false;
		}
	}

	// Load gallery when switching to upload tab
	$effect(() => {
		if (activeTab === 'upload' && uploadedWallpapers.length === 0 && !loadingGallery) {
			loadUploadedWallpapers();
		}
	});

	// ── Helpers ──────────────────────────────────────────────────

	function gradientCss(g: WallpaperGradient): string {
		const angle = g.angle ?? 180;
		return `linear-gradient(${angle}deg, ${g.colors.join(', ')})`;
	}

	function isGradientActive(g: WallpaperGradient): boolean {
		if (currentSource.type !== 'generated') return false;
		const p = currentSource.params;
		if (p.type !== 'gradient') return false;
		return p.colors.join(',') === g.colors.join(',') && (p.angle ?? 180) === (g.angle ?? 180);
	}

	function isPredefinedActive(id: string): boolean {
		return currentSource.type === 'predefined' && currentSource.id === id;
	}

	function isUploadActive(mediaId: string): boolean {
		return currentSource.type === 'upload' && currentSource.mediaId === mediaId;
	}

	// ── Actions ─────────────────────────────────────────────────

	function buildConfig(source: WallpaperConfig['source']): WallpaperConfig {
		return {
			source,
			overlay: blur > 0 || overlayOpacity > 0 ? { blur, opacity: overlayOpacity } : undefined,
		};
	}

	async function applyWallpaper(config: WallpaperConfig) {
		if (scope === 'scene') {
			await wallpaperStore.setSceneWallpaper(config);
		} else {
			await wallpaperStore.setGlobal(config);
		}
	}

	async function selectGradient(g: WallpaperGradient) {
		await applyWallpaper(buildConfig({ type: 'generated', params: g }));
	}

	async function selectPredefined(id: string) {
		await applyWallpaper(buildConfig({ type: 'predefined', id }));
	}

	async function selectUpload(media: UploadedMedia) {
		await applyWallpaper(buildConfig({ type: 'upload', mediaId: media.id, url: media.url }));
	}

	async function clearWallpaper() {
		if (scope === 'scene') {
			await wallpaperStore.clearSceneWallpaper();
		} else {
			await wallpaperStore.clearGlobal();
		}
	}

	async function updateOverlay() {
		const current = wallpaperStore.persisted;
		if (current.source.type === 'none') return;
		const updated: WallpaperConfig = {
			...current,
			overlay: blur > 0 || overlayOpacity > 0 ? { blur, opacity: overlayOpacity } : undefined,
		};
		await applyWallpaper(updated);
	}

	// ── Hover preview ───────────────────────────────────────────

	function previewGradient(g: WallpaperGradient) {
		wallpaperStore.preview(buildConfig({ type: 'generated', params: g }));
	}

	function previewPredefined(id: string) {
		wallpaperStore.preview(buildConfig({ type: 'predefined', id }));
	}

	function previewUpload(media: UploadedMedia) {
		wallpaperStore.preview(buildConfig({ type: 'upload', mediaId: media.id, url: media.url }));
	}

	function clearPreview() {
		wallpaperStore.clearPreview();
	}

	// ── File upload ─────────────────────────────────────────────

	let fileInput: HTMLInputElement | undefined = $state();

	async function uploadFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		uploading = true;
		uploadError = null;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('app', 'wallpapers');

			const res = await fetch(`${MEDIA_URL}/api/v1/media/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!res.ok) {
				throw new Error(`Upload fehlgeschlagen (${res.status})`);
			}

			const data = await res.json();
			const mediaId: string = data.id;
			const url =
				data.urls?.large ||
				data.urls?.original ||
				`${MEDIA_URL}/api/v1/media/${mediaId}/file/large`;
			const thumbUrl = data.urls?.thumbnail || `${MEDIA_URL}/api/v1/media/${mediaId}/file/thumb`;

			const newMedia: UploadedMedia = {
				id: mediaId,
				url,
				thumbUrl,
				originalName: data.originalName ?? file.name,
			};
			uploadedWallpapers = [newMedia, ...uploadedWallpapers];

			await applyWallpaper(buildConfig({ type: 'upload', mediaId, url }));
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploading = false;
		}
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await uploadFile(file);
		input.value = '';
	}

	async function deleteUpload(mediaId: string) {
		try {
			await fetch(`${MEDIA_URL}/api/v1/media/${mediaId}`, { method: 'DELETE' });
		} catch {
			// ignore
		}
		uploadedWallpapers = uploadedWallpapers.filter((w) => w.id !== mediaId);
		if (currentSource.type === 'upload' && currentSource.mediaId === mediaId) {
			await clearWallpaper();
		}
	}

	// ── Drag & drop handlers ────────────────────────────────────

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) {
			await uploadFile(file);
		}
	}

	// Tab items
	const tabs: { id: Tab; label: string; icon: typeof Image }[] = [
		{ id: 'gradients', label: 'Farben', icon: Palette },
		{ id: 'images', label: 'Bilder', icon: Image },
		{ id: 'upload', label: 'Upload', icon: UploadSimple },
	];
</script>

<div class="wallpaper-picker">
	<!-- Header row: Scope toggle + Reset -->
	<div class="flex items-center justify-between mb-3">
		{#if hasMultipleScenes}
			<div class="flex gap-1 rounded-lg bg-muted p-0.5">
				<button
					type="button"
					class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
					class:bg-surface={scope === 'global'}
					class:text-foreground={scope === 'global'}
					class:shadow-sm={scope === 'global'}
					class:text-muted-foreground={scope !== 'global'}
					onclick={() => (scope = 'global')}
				>
					Alle Szenen
				</button>
				<button
					type="button"
					class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
					class:bg-surface={scope === 'scene'}
					class:text-foreground={scope === 'scene'}
					class:shadow-sm={scope === 'scene'}
					class:text-muted-foreground={scope !== 'scene'}
					onclick={() => (scope = 'scene')}
				>
					Nur diese Szene
				</button>
			</div>
		{:else}
			<div></div>
		{/if}

		{#if currentSource.type !== 'none'}
			<button
				type="button"
				class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				onclick={clearWallpaper}
			>
				<Prohibit size={12} />
				Zurücksetzen
			</button>
		{/if}
	</div>

	<!-- Tab bar -->
	<div class="flex gap-1 rounded-lg bg-muted p-1 mb-4">
		{#each tabs as tab}
			<button
				type="button"
				class="flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
				class:bg-surface={activeTab === tab.id}
				class:text-foreground={activeTab === tab.id}
				class:shadow-sm={activeTab === tab.id}
				class:text-muted-foreground={activeTab !== tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				<tab.icon size={15} weight={activeTab === tab.id ? 'fill' : 'regular'} />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	{#if activeTab === 'gradients'}
		<!-- Current theme gradients (prominent) -->
		<p class="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
			Empfohlen
			<span class="normal-case tracking-normal font-normal">({currentVariant})</span>
		</p>
		<div class="grid grid-cols-2 gap-2.5 mb-5">
			{#each gradientPresets as gradient}
				<button
					type="button"
					class="gradient-swatch gradient-swatch-lg"
					class:ring-2={isGradientActive(gradient)}
					class:ring-primary={isGradientActive(gradient)}
					style="background: {gradientCss(gradient)}"
					onclick={() => selectGradient(gradient)}
					onmouseenter={() => previewGradient(gradient)}
					onmouseleave={clearPreview}
				>
					{#if isGradientActive(gradient)}
						<Check size={20} weight="bold" class="text-white drop-shadow" />
					{/if}
				</button>
			{/each}
		</div>

		<!-- All other theme gradients -->
		{#each Object.entries(GRADIENT_PRESETS).filter(([v]) => v !== currentVariant) as [variant, presets]}
			<p class="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
				{variant}
			</p>
			<div class="grid grid-cols-4 gap-2 mb-4">
				{#each presets as gradient}
					<button
						type="button"
						class="gradient-swatch"
						class:ring-2={isGradientActive(gradient)}
						class:ring-primary={isGradientActive(gradient)}
						style="background: {gradientCss(gradient)}"
						onclick={() => selectGradient(gradient)}
						onmouseenter={() => previewGradient(gradient)}
						onmouseleave={clearPreview}
					>
						{#if isGradientActive(gradient)}
							<Check size={16} weight="bold" class="text-white drop-shadow" />
						{/if}
					</button>
				{/each}
			</div>
		{/each}
	{:else if activeTab === 'images'}
		{#if PREDEFINED_WALLPAPERS.length === 0}
			<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
				<Image size={32} class="mb-2 opacity-40" />
				<p class="text-sm">Hintergrundbilder kommen bald</p>
			</div>
		{:else}
			{#if variantWallpapers.length > 0}
				<p class="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Empfohlen
					<span class="normal-case tracking-normal font-normal">({currentVariant})</span>
				</p>
				<div class="grid grid-cols-2 gap-2.5 mb-5">
					{#each variantWallpapers as wp}
						<button
							type="button"
							class="image-swatch"
							class:ring-2={isPredefinedActive(wp.id)}
							class:ring-primary={isPredefinedActive(wp.id)}
							onclick={() => selectPredefined(wp.id)}
							onmouseenter={() => previewPredefined(wp.id)}
							onmouseleave={clearPreview}
						>
							<img src={wp.thumbUrl} alt={wp.label} class="w-full h-full object-cover" />
							{#if isPredefinedActive(wp.id)}
								<div class="swatch-check">
									<Check size={20} weight="bold" class="text-white drop-shadow" />
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}

			{#if otherWallpapers.length > 0}
				<p class="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Weitere
				</p>
				<div class="grid grid-cols-4 gap-2 mb-4">
					{#each otherWallpapers as wp}
						<button
							type="button"
							class="image-swatch"
							class:ring-2={isPredefinedActive(wp.id)}
							class:ring-primary={isPredefinedActive(wp.id)}
							onclick={() => selectPredefined(wp.id)}
							onmouseenter={() => previewPredefined(wp.id)}
							onmouseleave={clearPreview}
						>
							<img src={wp.thumbUrl} alt={wp.label} class="w-full h-full object-cover" />
							{#if isPredefinedActive(wp.id)}
								<div class="swatch-check">
									<Check size={16} weight="bold" class="text-white drop-shadow" />
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	{:else if activeTab === 'upload'}
		<!-- Dropzone -->
		<div
			class="upload-zone"
			class:upload-zone-active={isDragging}
			class:upload-zone-uploading={uploading}
			role="button"
			tabindex="0"
			onclick={() => !uploading && fileInput?.click()}
			onkeydown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
					e.preventDefault();
					fileInput?.click();
				}
			}}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			{#if uploading}
				<SpinnerGap size={28} class="text-primary mb-1 animate-spin" />
				<p class="text-sm text-foreground">Wird hochgeladen...</p>
			{:else}
				<UploadSimple size={28} class="text-muted-foreground mb-1" />
				<p class="text-sm text-muted-foreground">
					{isDragging ? 'Hier ablegen' : 'Bild hochladen'}
				</p>
				<p class="text-xs text-muted-foreground/60">JPG, PNG, WebP — Drag & Drop oder Klick</p>
			{/if}
		</div>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			class="hidden"
			onchange={handleFileSelect}
		/>

		<!-- Upload error -->
		{#if uploadError}
			<div
				class="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
			>
				<span class="flex-1">{uploadError}</span>
				<button type="button" class="p-0.5" onclick={() => (uploadError = null)}>
					<X size={14} />
				</button>
			</div>
		{/if}

		<!-- Previously uploaded wallpapers gallery -->
		{#if loadingGallery}
			<div class="mt-4 flex items-center justify-center py-4 text-muted-foreground">
				<SpinnerGap size={20} class="animate-spin mr-2" />
				<span class="text-sm">Lade Bilder...</span>
			</div>
		{:else if uploadedWallpapers.length > 0}
			<p class="mt-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
				Eigene Bilder
			</p>
			<div class="grid grid-cols-3 gap-2">
				{#each uploadedWallpapers as media (media.id)}
					<div class="image-swatch-wrapper">
						<button
							type="button"
							class="image-swatch"
							class:ring-2={isUploadActive(media.id)}
							class:ring-primary={isUploadActive(media.id)}
							onclick={() => selectUpload(media)}
							onmouseenter={() => previewUpload(media)}
							onmouseleave={clearPreview}
						>
							<img
								src={media.thumbUrl}
								alt={media.originalName}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
							{#if isUploadActive(media.id)}
								<div class="swatch-check">
									<Check size={18} weight="bold" class="text-white drop-shadow" />
								</div>
							{/if}
						</button>
						<button
							type="button"
							class="delete-btn"
							title="Bild löschen"
							onclick={() => deleteUpload(media.id)}
						>
							<Trash size={12} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Overlay controls (always visible, disabled when no wallpaper) -->
	<div class="mt-4 border-t border-border pt-4" class:opacity-40={currentSource.type === 'none'}>
		<p class="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Overlay</p>

		<div class="mb-3">
			<div class="flex items-center justify-between mb-1">
				<label for="wp-blur" class="text-sm text-foreground">Weichzeichner</label>
				<span class="text-xs text-muted-foreground tabular-nums">{blur}px</span>
			</div>
			<input
				id="wp-blur"
				type="range"
				min="0"
				max="20"
				step="1"
				bind:value={blur}
				oninput={updateOverlay}
				disabled={currentSource.type === 'none'}
				class="slider"
			/>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<label for="wp-opacity" class="text-sm text-foreground">Abdunklung</label>
				<span class="text-xs text-muted-foreground tabular-nums"
					>{Math.round(overlayOpacity * 100)}%</span
				>
			</div>
			<input
				id="wp-opacity"
				type="range"
				min="0"
				max="0.6"
				step="0.05"
				bind:value={overlayOpacity}
				oninput={updateOverlay}
				disabled={currentSource.type === 'none'}
				class="slider"
			/>
		</div>
	</div>
</div>

<style>
	.wallpaper-picker {
		width: 100%;
	}

	.gradient-swatch {
		aspect-ratio: 16/9;
		border-radius: 0.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		border: 1px solid hsl(var(--color-border) / 0.3);
	}

	.gradient-swatch:hover {
		transform: scale(1.03);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.gradient-swatch-lg {
		aspect-ratio: 2/1;
		border-radius: 0.75rem;
	}

	.image-swatch {
		aspect-ratio: 16/9;
		border-radius: 0.5rem;
		cursor: pointer;
		overflow: hidden;
		position: relative;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		border: 1px solid hsl(var(--color-border) / 0.3);
	}

	.image-swatch:hover {
		transform: scale(1.03);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.swatch-check {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
	}

	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		border: 2px dashed hsl(var(--color-border));
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background-color 0.2s;
	}

	.upload-zone:hover {
		border-color: hsl(var(--color-primary));
	}

	.upload-zone-active {
		border-color: hsl(var(--color-primary));
		background-color: hsl(var(--color-primary) / 0.05);
	}

	.upload-zone-uploading {
		cursor: wait;
		opacity: 0.8;
	}

	.image-swatch-wrapper {
		position: relative;
	}

	.delete-btn {
		position: absolute;
		top: 4px;
		right: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		opacity: 0;
		transition: opacity 0.15s;
		cursor: pointer;
		border: none;
	}

	.image-swatch-wrapper:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background: rgba(220, 38, 38, 0.9);
	}

	/* Range slider styling */
	.slider {
		width: 100%;
		height: 6px;
		appearance: none;
		-webkit-appearance: none;
		background: hsl(var(--color-muted));
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	.slider:disabled {
		cursor: not-allowed;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
</style>
