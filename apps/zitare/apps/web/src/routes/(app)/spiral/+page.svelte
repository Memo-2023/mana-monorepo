<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { COLORS } from '@manacore/spiral-db';
	import type { ColorIndex } from '@manacore/spiral-db';
	import { spiralStore } from '$lib/stores/spiral.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import SpiralCanvas from '$lib/components/SpiralCanvas.svelte';
	import { QUOTES, type Quote } from '@zitare/content';

	let zoom = $state(10);
	let showGrid = $state(false);
	let selectedPixel = $state<number | null>(null);
	let fileInput: HTMLInputElement;

	// Build a lookup map for quotes
	const quoteMap = new Map<string, Quote>();
	for (const q of QUOTES) {
		quoteMap.set(q.id, q);
	}

	function getQuoteData(quoteId: string) {
		const quote = quoteMap.get(quoteId);
		if (!quote) return null;
		return {
			author: quote.author,
			text: quotesStore.getText(quote),
			category: quote.category,
			language: quotesStore.language,
		};
	}

	function handleImportFavorites() {
		spiralStore.importFavorites(
			favoritesStore.favorites.map((f) => ({
				quoteId: f.quoteId,
				createdAt: f.createdAt,
			})),
			getQuoteData
		);
	}

	function handlePixelClick(index: number) {
		selectedPixel = selectedPixel === index ? null : index;
	}

	async function handleImportPng() {
		fileInput?.click();
	}

	async function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await spiralStore.importFromPng(file);
		input.value = '';
	}

	// Category display helpers
	const categoryIcons: Record<string, string> = {
		motivation: '🔥',
		weisheit: '🦉',
		liebe: '❤️',
		leben: '🌱',
		erfolg: '🏆',
		glueck: '🍀',
		freundschaft: '🤝',
		mut: '🦁',
		hoffnung: '🌅',
		natur: '🌿',
	};

	onMount(() => {
		if (favoritesStore.favorites.length > 0) {
			handleImportFavorites();
		}
	});
</script>

<div class="spiral-page">
	<h1 class="title">SpiralDB</h1>
	<p class="subtitle">Deine Zitate als Pixel-Spirale</p>

	<div class="layout">
		<!-- Visualization -->
		<section class="section viz-section">
			{#if spiralStore.image}
				<div class="canvas-wrapper">
					<SpiralCanvas
						image={spiralStore.image}
						scale={zoom}
						{showGrid}
						highlightIndex={selectedPixel}
						onPixelClick={handlePixelClick}
					/>
				</div>

				<div class="controls">
					<label class="control">
						<span>Zoom</span>
						<input type="range" min="4" max="20" bind:value={zoom} />
						<span class="mono">{zoom}x</span>
					</label>
					<label class="control">
						<input type="checkbox" bind:checked={showGrid} />
						<span>Grid</span>
					</label>
				</div>
			{:else}
				<div class="empty-state">
					<p>Keine Daten. Importiere deine Favoriten oder lade eine PNG-Datei.</p>
				</div>
			{/if}
		</section>

		<!-- Stats -->
		{#if spiralStore.stats}
			<section class="section">
				<h2 class="section-title">Statistiken</h2>
				<div class="stats-grid">
					<div class="stat">
						<span class="stat-value"
							>{spiralStore.stats.imageSize}x{spiralStore.stats.imageSize}</span
						>
						<span class="stat-label">Bildgr&ouml;&szlig;e</span>
					</div>
					<div class="stat">
						<span class="stat-value">{spiralStore.stats.activeRecords}</span>
						<span class="stat-label">Zitate</span>
					</div>
					<div class="stat">
						<span class="stat-value">{spiralStore.stats.usedPixels}</span>
						<span class="stat-label">Pixel belegt</span>
					</div>
					<div class="stat highlight">
						<span class="stat-value">{spiralStore.stats.compressionRatio}%</span>
						<span class="stat-label">Kompression vs JSON</span>
					</div>
				</div>

				<!-- Color Legend -->
				<div class="color-legend">
					{#each Object.entries(COLORS) as [idx, color]}
						<div class="color-item">
							<span
								class="color-swatch"
								style="background: rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})"
							></span>
							<span class="color-name">{color.name}</span>
							<span class="color-bits mono">{color.bits.join('')}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Records -->
		<section class="section">
			<h2 class="section-title">
				Gespeicherte Zitate
				{#if spiralStore.records.length > 0}
					<span class="badge">{spiralStore.records.length}</span>
				{/if}
			</h2>

			{#if spiralStore.records.length === 0}
				<p class="empty-hint">Noch keine Zitate in der Spirale.</p>
			{:else}
				<div class="records-list">
					{#each spiralStore.records as record}
						{@const cat = spiralStore.getCategoryName(record.data.category)}
						<div class="record" class:completed={record.meta.status === 'completed'}>
							<div class="record-header">
								<span class="record-icon">{categoryIcons[cat] ?? '💬'}</span>
								<span class="record-author">{record.data.author}</span>
								<span class="record-id mono">#{record.meta.id}</span>
							</div>
							<p class="record-text">{record.data.text}</p>
							<div class="record-footer">
								<span class="record-category">{cat}</span>
								<button
									class="btn-small btn-danger"
									onclick={() => spiralStore.removeQuote(record.meta.id)}
								>
									&times;
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Actions -->
		<section class="section">
			<h2 class="section-title">Aktionen</h2>
			<div class="actions">
				<button
					class="btn btn-primary"
					onclick={() => spiralStore.downloadPng()}
					disabled={!spiralStore.stats || spiralStore.stats.totalRecords === 0}
				>
					PNG herunterladen
				</button>
				<button class="btn" onclick={handleImportPng}> PNG importieren </button>
				<button
					class="btn"
					onclick={handleImportFavorites}
					disabled={favoritesStore.favorites.length === 0}
				>
					Favoriten neu importieren ({favoritesStore.favorites.length})
				</button>
				<button
					class="btn btn-danger"
					onclick={() => spiralStore.clear()}
					disabled={!spiralStore.stats || spiralStore.stats.totalRecords === 0}
				>
					Alles l&ouml;schen
				</button>
			</div>

			<div class="info-box">
				<p>
					<strong>SpiralDB</strong> kodiert deine Zitate als farbige Pixel in einem Spiralmuster. Jedes
					Pixel speichert 3 Bit (8 Farben). Das Bild w&auml;chst von der Mitte nach au&szlig;en, je mehr
					Zitate du sammelst.
				</p>
			</div>
		</section>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept=".png"
		class="hidden"
		onchange={handleFileSelected}
	/>
</div>

<style>
	.spiral-page {
		padding: 1rem 0;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		background: var(--color-card, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		padding: 1.25rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		background: var(--color-primary, #8b5cf6);
		color: white;
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	.viz-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.canvas-wrapper {
		overflow: auto;
		max-width: 100%;
		max-height: 500px;
		border-radius: 8px;
	}

	.controls {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.control input[type='range'] {
		width: 100px;
	}

	.mono {
		font-family: monospace;
		font-size: 0.8rem;
	}

	/* Stats */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.stat {
		text-align: center;
		padding: 0.75rem;
		background: var(--color-background, rgba(0, 0, 0, 0.2));
		border-radius: 8px;
	}

	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
		font-family: monospace;
	}

	.stat-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-muted-foreground);
		margin-top: 0.25rem;
	}

	.stat.highlight {
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
	}

	/* Color Legend */
	.color-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.color-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.color-swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
	}

	.color-bits {
		opacity: 0.6;
	}

	/* Records */
	.records-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.record {
		padding: 0.75rem;
		background: var(--color-background, rgba(0, 0, 0, 0.2));
		border-radius: 8px;
		border-left: 3px solid var(--color-primary, #8b5cf6);
	}

	.record.completed {
		border-left-color: #22c55e;
	}

	.record-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.record-icon {
		font-size: 1rem;
	}

	.record-author {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-foreground);
		flex: 1;
	}

	.record-id {
		font-size: 0.7rem;
		color: var(--color-muted-foreground);
	}

	.record-text {
		font-size: 0.8rem;
		color: var(--color-muted-foreground);
		line-height: 1.4;
		margin-bottom: 0.375rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.record-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.record-category {
		font-size: 0.7rem;
		color: var(--color-muted-foreground);
		text-transform: capitalize;
	}

	.empty-hint {
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted-foreground);
	}

	/* Actions */
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--color-background, rgba(0, 0, 0, 0.2));
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:hover:not(:disabled) {
		background: var(--color-accent, rgba(255, 255, 255, 0.1));
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--color-primary, #8b5cf6);
		border-color: var(--color-primary, #8b5cf6);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-danger {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}

	.btn-danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-small {
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		border-radius: 4px;
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		color: var(--color-muted-foreground);
	}

	.btn-small:hover {
		color: #ef4444;
	}

	.info-box {
		padding: 0.75rem;
		background: var(--color-background, rgba(0, 0, 0, 0.2));
		border-radius: 8px;
		font-size: 0.8rem;
		color: var(--color-muted-foreground);
		line-height: 1.5;
	}

	.hidden {
		display: none;
	}
</style>
