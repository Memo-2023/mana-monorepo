<!--
  Spiral — Workbench-embedded view of the Mana Spiral: a visual
  fingerprint of all your app activity encoded as colored pixels in
  a spiral pattern. Extracted from the former /spiral standalone route.
-->
<script lang="ts">
	import { formatTime } from '$lib/i18n/format';
	import { onMount } from 'svelte';
	import { COLORS } from '@mana/spiral-db';
	import type { ColorDefinition } from '@mana/spiral-db';
	import SpiralCanvas from './components/SpiralCanvas.svelte';
	import { manaSpiralStore } from './index';
	import { collectAppSnapshots } from './index';
	import { _ } from 'svelte-i18n';

	const colorsArray: ColorDefinition[] = Object.values(COLORS);

	let scale = $state(10);
	let showGrid = $state(false);
	let selectedPixel = $state<number | null>(null);
	let isCollecting = $state(false);
	let fileInput: HTMLInputElement;

	let recordsByApp = $derived(manaSpiralStore.getRecordsByApp());

	async function handleCollect() {
		isCollecting = true;
		try {
			const snapshots = await collectAppSnapshots();
			manaSpiralStore.collectFromApps(snapshots);
		} finally {
			isCollecting = false;
		}
	}

	function handlePixelClick(index: number) {
		selectedPixel = selectedPixel === index ? null : index;
	}

	function handleDownload() {
		manaSpiralStore.downloadPng();
	}

	function handleImportClick() {
		fileInput?.click();
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const result = await manaSpiralStore.importFromPng(file);
		if (!result.success) {
			alert($_('spiral.list_view.import_failed', { values: { error: result.error ?? '' } }));
		}
		input.value = '';
	}

	function handleClear() {
		if (confirm($_('spiral.list_view.confirm_clear'))) {
			manaSpiralStore.clear();
		}
	}

	onMount(() => {
		handleCollect();
	});
</script>

<div class="spiral-page">
	<div class="content-grid">
		<!-- Visualization -->
		<section class="section viz-section">
			<div class="viz-header">
				<h2>{$_('spiral.list_view.section_visualization')}</h2>
				<div class="viz-controls">
					<label class="control">
						<span>{$_('spiral.list_view.label_zoom')}</span>
						<input type="range" min="4" max="20" bind:value={scale} />
						<span class="mono">{scale}x</span>
					</label>
					<label class="control">
						<input type="checkbox" bind:checked={showGrid} />
						<span>{$_('spiral.list_view.label_grid')}</span>
					</label>
				</div>
			</div>

			<div class="viz-container">
				{#if manaSpiralStore.image}
					<SpiralCanvas
						image={manaSpiralStore.image}
						{scale}
						{showGrid}
						highlightIndex={selectedPixel}
						onPixelClick={handlePixelClick}
					/>
				{:else}
					<div class="empty-state">
						<p>{$_('spiral.list_view.empty_no_data')}</p>
					</div>
				{/if}
			</div>

			{#if selectedPixel !== null}
				<div class="pixel-detail">
					Pixel <code>#{selectedPixel}</code>
				</div>
			{/if}
		</section>

		<!-- Stats -->
		{#if manaSpiralStore.stats}
			<section class="section">
				<h2 class="section-title">{$_('spiral.list_view.section_stats')}</h2>
				<div class="stats-grid">
					<div class="stat">
						<span class="stat-value">
							{manaSpiralStore.stats.imageSize}x{manaSpiralStore.stats.imageSize}
						</span>
						<span class="stat-label">{$_('spiral.list_view.stat_image_size')}</span>
					</div>
					<div class="stat">
						<span class="stat-value">{manaSpiralStore.stats.activeRecords}</span>
						<span class="stat-label">{$_('spiral.list_view.stat_events')}</span>
					</div>
					<div class="stat">
						<span class="stat-value">{manaSpiralStore.stats.usedPixels}</span>
						<span class="stat-label">{$_('spiral.list_view.stat_pixels_used')}</span>
					</div>
					<div class="stat highlight">
						<span class="stat-value">{manaSpiralStore.stats.compressionRatio}%</span>
						<span class="stat-label">{$_('spiral.list_view.stat_compression')}</span>
					</div>
					<div class="stat">
						<span class="stat-value"
							>{$_('spiral.list_view.stat_ring_value', {
								values: { n: manaSpiralStore.stats.currentRing },
							})}</span
						>
						<span class="stat-label">{$_('spiral.list_view.stat_current_ring')}</span>
					</div>
					<div class="stat">
						<span class="stat-value">{manaSpiralStore.snapshots.length}</span>
						<span class="stat-label">{$_('spiral.list_view.stat_apps_active')}</span>
					</div>
				</div>

				{#if manaSpiralStore.lastCollectedAt}
					<p class="collected-at">
						{$_('spiral.list_view.last_collected', {
							values: { when: formatTime(manaSpiralStore.lastCollectedAt) },
						})}
					</p>
				{/if}
			</section>
		{/if}

		<!-- App Breakdown -->
		<section class="section">
			<h2 class="section-title">
				{$_('spiral.list_view.section_apps')}
				{#if manaSpiralStore.snapshots.length > 0}
					<span class="badge">{manaSpiralStore.snapshots.length}</span>
				{/if}
			</h2>

			{#if manaSpiralStore.snapshots.length === 0}
				<p class="empty-hint">{$_('spiral.list_view.empty_no_app_data')}</p>
			{:else}
				<div class="app-list">
					{#each manaSpiralStore.snapshots as snap}
						{@const appRecords = recordsByApp.get(snap.app.toLowerCase()) ?? []}
						<div class="app-card">
							<div class="app-header">
								<span class="app-name">{snap.app}</span>
								<span class="app-count">{snap.totalItems}</span>
							</div>
							<div class="app-bar">
								<div
									class="app-bar-fill"
									style="width: {Math.min(
										100,
										(snap.totalItems /
											Math.max(1, ...manaSpiralStore.snapshots.map((s) => s.totalItems))) *
											100
									)}%"
								></div>
							</div>
							<div class="app-details">
								<span class="app-label">{snap.label}</span>
								<span class="app-events mono"
									>{$_('spiral.list_view.events_count', {
										values: { n: appRecords.length },
									})}</span
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Color Legend -->
		<section class="section">
			<h2 class="section-title">{$_('spiral.list_view.section_palette')}</h2>
			<div class="color-legend">
				{#each colorsArray as color}
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

		<!-- Actions -->
		<section class="section">
			<h2 class="section-title">{$_('spiral.list_view.section_actions')}</h2>
			<div class="actions">
				<button class="btn btn-primary" onclick={handleCollect} disabled={isCollecting}>
					{isCollecting
						? $_('spiral.list_view.action_collecting')
						: $_('spiral.list_view.action_collect')}
				</button>
				<button
					class="btn"
					onclick={handleDownload}
					disabled={!manaSpiralStore.stats || manaSpiralStore.stats.totalRecords === 0}
				>
					{$_('spiral.list_view.action_download_png')}
				</button>
				<button class="btn" onclick={handleImportClick}
					>{$_('spiral.list_view.action_import_png')}</button
				>
				<button
					class="btn btn-danger"
					onclick={handleClear}
					disabled={!manaSpiralStore.stats || manaSpiralStore.stats.totalRecords === 0}
				>
					{$_('spiral.list_view.action_reset')}
				</button>
			</div>

			<div class="info-box">
				<h4>{$_('spiral.list_view.info_heading')}</h4>
				<p>
					{$_('spiral.list_view.info_body')}
				</p>
			</div>
		</section>
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept=".png"
		class="hidden"
		onchange={handleFileSelect}
	/>
</div>

<style>
	.spiral-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}

	.content-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		padding: 1.25rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		background: hsl(var(--color-primary));
		color: white;
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	.viz-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.viz-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.viz-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.viz-controls {
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
		color: hsl(var(--color-muted-foreground));
	}

	.control input[type='range'] {
		width: 100px;
	}

	.mono {
		font-family: monospace;
		font-size: 0.8rem;
	}

	.viz-container {
		display: flex;
		justify-content: center;
		padding: 2rem;
		background: radial-gradient(
			ellipse at center,
			hsl(var(--color-primary) / 0.05) 0%,
			transparent 70%
		);
		border-radius: 8px;
		overflow: auto;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: hsl(var(--color-muted-foreground));
	}

	.pixel-detail {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.pixel-detail code {
		background: hsl(var(--color-background));
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		font-family: monospace;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.stat {
		text-align: center;
		padding: 0.75rem;
		background: hsl(var(--color-background));
		border-radius: 8px;
	}

	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-family: monospace;
	}

	.stat-label {
		display: block;
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.stat.highlight {
		background: linear-gradient(135deg, rgb(99 102 241 / 0.2), rgb(139 92 246 / 0.2));
	}

	.collected-at {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-align: right;
		margin: 0;
	}

	.app-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.app-card {
		padding: 0.75rem;
		background: hsl(var(--color-background));
		border-radius: 8px;
	}

	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.app-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.app-count {
		font-family: monospace;
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
	}

	.app-bar {
		height: 4px;
		background: hsl(var(--color-border));
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 0.375rem;
	}

	.app-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
		border-radius: 2px;
		transition: width 0.5s ease;
	}

	.app-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.app-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.app-events {
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
	}

	.empty-hint {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.color-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.color-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.color-swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		border: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}

	.color-bits {
		opacity: 0.6;
	}

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
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:hover:not(:disabled) {
		background: hsl(var(--color-accent));
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-danger {
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error) / 0.3);
	}

	.btn-danger:hover:not(:disabled) {
		background: hsl(var(--color-error) / 0.1);
	}

	.info-box {
		padding: 1rem;
		background: hsl(var(--color-background));
		border-radius: 8px;
		border-left: 4px solid hsl(var(--color-primary));
	}

	.info-box h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: hsl(var(--color-foreground));
	}

	.info-box p {
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		line-height: 1.5;
	}

	.hidden {
		display: none;
	}
</style>
