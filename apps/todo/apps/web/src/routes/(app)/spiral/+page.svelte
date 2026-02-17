<script lang="ts">
	import { onMount } from 'svelte';
	import { spiralStore } from '$lib/stores/spiral.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import SpiralCanvas from '$lib/components/SpiralCanvas.svelte';
	import { visualizeImageEmoji, COLORS, type ColorDefinition } from '@manacore/spiral-db';

	// Get colors as array for iteration
	const colorsArray: ColorDefinition[] = Object.values(COLORS);

	// UI State
	let scale = $state(8);
	let showGrid = $state(false);
	let showEmoji = $state(false);
	let selectedPixel = $state<number | null>(null);
	let newTodoTitle = $state('');

	// Derived state
	let emojiView = $derived(spiralStore.image ? visualizeImageEmoji(spiralStore.image) : '');

	// Import todos from main store on mount
	onMount(async () => {
		// Fetch tasks if not already loaded
		if (tasksStore.tasks.length === 0) {
			await tasksStore.fetchTasks({});
		}

		// Import existing todos into spiral DB
		if (tasksStore.tasks.length > 0) {
			spiralStore.importTodos(
				tasksStore.tasks.map((t) => ({
					title: t.title,
					description: t.description,
					priority: t.priority,
					dueDate: t.dueDate,
					isCompleted: t.isCompleted,
					createdAt: t.createdAt,
				}))
			);
		}
	});

	function handleAddTodo() {
		if (!newTodoTitle.trim()) return;

		spiralStore.addTodo({
			title: newTodoTitle.trim(),
			priority: 1,
		});

		newTodoTitle = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleAddTodo();
		}
	}

	function handlePixelClick(index: number, x: number, y: number) {
		selectedPixel = index;
	}

	function handleDownload() {
		spiralStore.downloadPng();
	}

	let fileInput: HTMLInputElement;

	function handleImportClick() {
		fileInput?.click();
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const result = await spiralStore.importFromPng(file);
		if (!result.success) {
			alert(`Import fehlgeschlagen: ${result.error}`);
		}

		// Reset input
		input.value = '';
	}

	function handleClear() {
		if (confirm('Alle Spiral-Daten löschen?')) {
			spiralStore.clear();
		}
	}

	function handleReimport() {
		spiralStore.importTodos(
			tasksStore.tasks.map((t) => ({
				title: t.title,
				description: t.description,
				priority: t.priority,
				dueDate: t.dueDate,
				isCompleted: t.isCompleted,
				createdAt: t.createdAt,
			}))
		);
	}
</script>

<svelte:head>
	<title>Spiral DB - Todo</title>
</svelte:head>

<div class="spiral-page">
	<header class="page-header">
		<h1 class="page-title">Spiral Database</h1>
		<p class="page-subtitle">Deine Todos als Pixel-Bild gespeichert</p>
	</header>

	<div class="content-grid">
		<!-- Visualization Section -->
		<section class="viz-section">
			<div class="viz-header">
				<h2>Visualisierung</h2>
				<div class="viz-controls">
					<label class="control-label">
						<span>Zoom:</span>
						<input type="range" min="4" max="20" bind:value={scale} class="zoom-slider" />
						<span class="zoom-value">{scale}x</span>
					</label>

					<label class="control-checkbox">
						<input type="checkbox" bind:checked={showGrid} />
						<span>Raster</span>
					</label>

					<label class="control-checkbox">
						<input type="checkbox" bind:checked={showEmoji} />
						<span>Emoji</span>
					</label>
				</div>
			</div>

			<div class="viz-container">
				{#if spiralStore.image}
					{#if showEmoji}
						<pre class="emoji-view">{emojiView}</pre>
					{:else}
						<SpiralCanvas
							image={spiralStore.image}
							{scale}
							{showGrid}
							highlightIndex={selectedPixel}
							onPixelClick={handlePixelClick}
						/>
					{/if}
				{:else}
					<div class="empty-state">Keine Daten</div>
				{/if}
			</div>

			{#if selectedPixel !== null}
				<div class="pixel-detail">
					Ausgewählter Pixel: <code>#{selectedPixel}</code>
				</div>
			{/if}
		</section>

		<!-- Stats Section -->
		<section class="stats-section">
			<h2>Statistiken</h2>

			{#if spiralStore.stats}
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-value">
							{spiralStore.stats.imageSize}x{spiralStore.stats.imageSize}
						</div>
						<div class="stat-label">Bildgröße</div>
					</div>

					<div class="stat-card">
						<div class="stat-value">{spiralStore.stats.activeRecords}</div>
						<div class="stat-label">Aktive Todos</div>
					</div>

					<div class="stat-card">
						<div class="stat-value">{spiralStore.stats.usedPixels}</div>
						<div class="stat-label">Genutzte Pixel</div>
					</div>

					<div class="stat-card highlight">
						<div class="stat-value">{spiralStore.stats.compressionRatio}%</div>
						<div class="stat-label">Kompression vs JSON</div>
					</div>

					<div class="stat-card">
						<div class="stat-value">Ring {spiralStore.stats.currentRing}</div>
						<div class="stat-label">Aktueller Ring</div>
					</div>

					<div class="stat-card">
						<div class="stat-value">{spiralStore.stats.totalRecords}</div>
						<div class="stat-label">Gesamt Records</div>
					</div>
				</div>
			{/if}

			<!-- Color Legend -->
			<div class="legend">
				<h3>Farbpalette (3-Bit)</h3>
				<div class="legend-grid">
					{#each colorsArray as color}
						<div class="legend-item">
							<div
								class="color-swatch"
								style="background: rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})"
							></div>
							<span class="color-name">{color.name}</span>
							<span class="color-bits">{color.index.toString(2).padStart(3, '0')}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Records Section -->
		<section class="records-section">
			<h2>Gespeicherte Todos ({spiralStore.records.length})</h2>

			<!-- Quick Add -->
			<div class="quick-add">
				<input
					type="text"
					bind:value={newTodoTitle}
					placeholder="Neues Todo hinzufügen..."
					onkeydown={handleKeydown}
					class="quick-add-input"
				/>
				<button onclick={handleAddTodo} class="btn-add" disabled={!newTodoTitle.trim()}>
					Hinzufügen
				</button>
			</div>

			<!-- Records List -->
			<div class="records-list">
				{#each spiralStore.records as record}
					<div class="record-item" class:completed={record.meta.status === 'completed'}>
						<div class="record-status">
							{#if record.meta.status === 'completed'}
								<span class="status-icon completed">✓</span>
							{:else if record.meta.status === 'deleted'}
								<span class="status-icon deleted">✗</span>
							{:else}
								<span class="status-icon active">○</span>
							{/if}
						</div>
						<div class="record-content">
							<div class="record-title">{record.data.title}</div>
							<div class="record-meta">
								ID: {record.meta.id} | Priority: {record.data.priority}
								{#if record.data.dueDate}
									| Due: {new Date(record.data.dueDate).toLocaleDateString('de-DE')}
								{/if}
							</div>
						</div>
						<div class="record-actions">
							{#if record.meta.status === 'active'}
								<button
									class="btn-small"
									onclick={() => spiralStore.completeTodo(record.meta.id)}
									title="Erledigen"
								>
									✓
								</button>
							{/if}
							{#if record.meta.status !== 'deleted'}
								<button
									class="btn-small danger"
									onclick={() => spiralStore.deleteTodo(record.meta.id)}
									title="Löschen"
								>
									✗
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<div class="empty-records">Keine Todos in der Spiral-Datenbank</div>
				{/each}
			</div>
		</section>

		<!-- Hidden file input for PNG import -->
		<input
			type="file"
			accept=".png,image/png"
			bind:this={fileInput}
			onchange={handleFileSelect}
			style="display: none;"
		/>

		<!-- Actions Section -->
		<section class="actions-section">
			<h2>Aktionen</h2>
			<div class="action-buttons">
				<button onclick={handleDownload} class="btn-action" disabled={!spiralStore.image}>
					<span class="btn-icon">📥</span>
					PNG herunterladen
				</button>

				<button onclick={handleImportClick} class="btn-action" disabled={spiralStore.isLoading}>
					<span class="btn-icon">📤</span>
					PNG importieren
				</button>

				<button onclick={handleReimport} class="btn-action">
					<span class="btn-icon">🔄</span>
					Todos neu importieren
				</button>

				<button onclick={handleClear} class="btn-action danger">
					<span class="btn-icon">🗑️</span>
					Alles löschen
				</button>
			</div>

			<div class="info-box">
				<h4>Wie funktioniert SpiralDB?</h4>
				<p>
					SpiralDB speichert strukturierte Daten in Pixel-Bildern. Jeder Pixel nutzt 3 Bit (8
					Farben) und die Daten wachsen spiralförmig vom Zentrum nach außen. Das Bild kann als PNG
					exportiert und später wieder importiert werden.
				</p>
			</div>
		</section>
	</div>
</div>

<style>
	.spiral-page {
		padding: 1rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.page-subtitle {
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0;
	}

	.content-grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr 1fr;
		}

		.viz-section {
			grid-column: 1 / -1;
		}
	}

	section {
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--color-border);
	}

	section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: var(--color-text);
	}

	/* Visualization */
	.viz-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.viz-controls {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.control-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.zoom-slider {
		width: 100px;
	}

	.zoom-value {
		font-family: monospace;
		min-width: 3ch;
	}

	.control-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.viz-container {
		display: flex;
		justify-content: center;
		padding: 2rem;
		background: #1a1a2e;
		border-radius: 8px;
		overflow: auto;
	}

	.emoji-view {
		font-family: 'Apple Color Emoji', 'Segoe UI Emoji', monospace;
		font-size: 14px;
		line-height: 1.2;
		margin: 0;
		white-space: pre;
	}

	.empty-state {
		color: var(--color-text-secondary);
		padding: 3rem;
	}

	.pixel-detail {
		margin-top: 1rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.pixel-detail code {
		background: var(--color-background);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: monospace;
	}

	/* Stats */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: var(--color-background);
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
	}

	.stat-card.highlight {
		background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
		color: white;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
	}

	.stat-card.highlight .stat-label {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Legend */
	.legend h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: var(--color-text);
	}

	.legend-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.color-swatch {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.color-name {
		color: var(--color-text);
	}

	.color-bits {
		color: var(--color-text-secondary);
		font-family: monospace;
		font-size: 0.625rem;
	}

	/* Records */
	.quick-add {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.quick-add-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 1rem;
	}

	.quick-add-input:focus {
		outline: none;
		border-color: #8b5cf6;
	}

	.btn-add {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: none;
		background: #8b5cf6;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-add:hover:not(:disabled) {
		background: #7c3aed;
	}

	.btn-add:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.records-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.record-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-background);
		border-radius: 8px;
		transition: opacity 0.2s;
	}

	.record-item.completed {
		opacity: 0.6;
	}

	.record-status {
		font-size: 1.25rem;
	}

	.status-icon.completed {
		color: #22c55e;
	}
	.status-icon.deleted {
		color: #ef4444;
	}
	.status-icon.active {
		color: var(--color-text-secondary);
	}

	.record-content {
		flex: 1;
		min-width: 0;
	}

	.record-title {
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.record-item.completed .record-title {
		text-decoration: line-through;
	}

	.record-meta {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
	}

	.record-actions {
		display: flex;
		gap: 0.25rem;
	}

	.btn-small {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: none;
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.btn-small:hover {
		background: #22c55e;
		color: white;
	}

	.btn-small.danger:hover {
		background: #ef4444;
	}

	.empty-records {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 2rem;
	}

	/* Actions */
	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-action:hover:not(:disabled) {
		background: var(--color-surface);
		border-color: #8b5cf6;
	}

	.btn-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-action.danger:hover:not(:disabled) {
		background: #fef2f2;
		border-color: #ef4444;
		color: #ef4444;
	}

	:global(.dark) .btn-action.danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-icon {
		font-size: 1.125rem;
	}

	.info-box {
		background: var(--color-background);
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #8b5cf6;
	}

	.info-box h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--color-text);
	}

	.info-box p {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}
</style>
