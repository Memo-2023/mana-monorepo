<script lang="ts">
	import UnifiedBar from '$lib/components/calendar/UnifiedBar.svelte';
	import UnifiedBarControls from '$lib/components/calendar/UnifiedBarControls.svelte';
	import { unifiedBarStore } from '$lib/stores/unified-bar.svelte';
	import { onMount } from 'svelte';

	// Demo handlers
	function handleSearch(query: string) {
		console.log('Search:', query);
	}

	function handleSelect(result: any) {
		console.log('Select:', result);
	}

	function handleSearchChange(query: string) {
		console.log('Search change:', query);
	}

	function handleCreate(data: any) {
		console.log('Create:', data);
	}

	function handleDateSelect(date: Date) {
		console.log('Date select:', date);
	}

	function handleOverlayToggle(event: CustomEvent) {
		console.log('Overlay toggle:', event.detail);
	}

	function handleOverlayAction(event: CustomEvent) {
		console.log('Overlay action:', event.detail);
	}

	function handleModeChange(mode: string) {
		console.log('Mode change:', mode);
	}

	function handleLayerChange(layer: string) {
		console.log('Layer change:', layer);
	}

	function handleQuickAction(event: CustomEvent) {
		console.log('Quick action:', event.detail);
	}

	function handleToolbarCollapsedChange(collapsed: boolean) {
		console.log('Toolbar collapsed:', collapsed);
	}

	// Initialize store on mount
	onMount(() => {
		unifiedBarStore.enableCloudSync();
	});
</script>

<svelte:head>
	<title>UnifiedBar Demo - Calendar</title>
</svelte:head>

<main class="demo-container">
	<header class="demo-header">
		<h1>UnifiedBar Demo</h1>
		<p>Demonstration der neuen unified bottom bar Architektur</p>
	</header>

	<!-- Controls for testing -->
	<section class="controls-section">
		<h2>UnifiedBar Controls</h2>
		<UnifiedBarControls onModeChange={handleModeChange} onLayerChange={handleLayerChange} />
	</section>

	<!-- Main content area -->
	<section class="content-section">
		<div class="content-placeholder">
			<h2>Kalender Inhalt</h2>
			<p>Dies ist der Hauptinhaltbereich, in dem die Kalender-Ansichten angezeigt werden.</p>

			<div class="info-cards">
				<div class="info-card">
					<h3>Aktueller Modus</h3>
					<p><strong>{unifiedBarStore.mode}</strong></p>
				</div>

				<div class="info-card">
					<h3>Aktiver Layer</h3>
					<p><strong>{unifiedBarStore.activeLayer}</strong></p>
				</div>

				<div class="info-card">
					<h3>Sichtbare Layers</h3>
					<ul>
						{#if unifiedBarStore.showQuickInput}<li>✓ QuickInput</li>{/if}
						{#if unifiedBarStore.showDateStrip}<li>✓ DateStrip</li>{/if}
						{#if unifiedBarStore.showTagStrip}<li>✓ TagStrip</li>{/if}
						{#if unifiedBarStore.showCalendarToolbar}<li>✓ CalendarToolbar</li>{/if}
					</ul>
				</div>

				<div class="info-card">
					<h3>Overlay Status</h3>
					<p><strong>{unifiedBarStore.isOverlayOpen ? 'Offen' : 'Geschlossen'}</strong></p>
				</div>
			</div>

			<div class="demo-actions">
				<button onmousedown={() => unifiedBarStore.setMode('collapsed')}> Zusammengklappt </button>
				<button onmousedown={() => unifiedBarStore.setMode('expanded')}> Erweitert </button>
				<button onmousedown={() => unifiedBarStore.toggleOverlay()}> Overlay Toggle </button>
				<button onmousedown={() => unifiedBarStore.expandToLayer('date')}> zum Datum-Layer </button>
				<button onmousedown={() => unifiedBarStore.collapseAll()}> Alle einklappen </button>
			</div>
		</div>
	</section>

	<!-- UnifiedBar at the bottom -->
	<UnifiedBar
		onSearch={handleSearch}
		onSelect={handleSelect}
		onSearchChange={handleSearchChange}
		onCreate={handleCreate}
		onDateSelect={handleDateSelect}
		onToolbarCollapsedChange={handleToolbarCollapsedChange}
		placeholder="Neuer Termin oder suchen..."
		emptyText="Keine Termine gefunden"
		searchingText="Suche..."
		createText="Erstellen"
		appIcon="calendar"
		isMobile={false}
		showCalendarToolbar={true}
	/>

	<!-- Footer with info -->
	<footer class="demo-footer">
		<p>UnifiedBar Demo - Calendar App</p>
		<p>Scrollen Sie, um zu sehen wie die Bars fixiert bleiben</p>
	</footer>
</main>

<style>
	.demo-container {
		min-height: 100vh;
		padding-bottom: 400px; /* Space for UnifiedBar */
		background: var(--color-background);
		color: var(--color-foreground);
	}

	.demo-header {
		padding: var(--spacing-xl) var(--spacing-lg);
		text-align: center;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.demo-header h1 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.demo-header p {
		margin: 0;
		color: var(--color-muted-foreground);
		font-size: 1rem;
	}

	.controls-section {
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 50%, transparent);
	}

	.controls-section h2 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.content-section {
		padding: var(--spacing-lg);
	}

	.content-placeholder {
		max-width: 1200px;
		margin: 0 auto;
	}

	.content-placeholder h2 {
		margin: 0 0 var(--spacing-lg) 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.content-placeholder p {
		margin: 0 0 var(--spacing-xl) 0;
		color: var(--color-muted-foreground);
		line-height: 1.6;
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}

	.info-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		transition: all var(--transition-base);
	}

	.info-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.info-card h3 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-card p {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.info-card ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.info-card li {
		padding: var(--spacing-xs) 0;
		color: var(--color-success);
		font-weight: 500;
	}

	.demo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		margin-top: var(--spacing-xl);
	}

	.demo-actions button {
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.demo-actions button:hover {
		filter: brightness(0.9);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.demo-footer {
		position: fixed;
		bottom: 350px;
		left: 0;
		right: 0;
		text-align: center;
		padding: var(--spacing-md);
		background: color-mix(in srgb, var(--color-surface) 80%, transparent);
		border-top: 1px solid var(--color-border);
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
	}

	.demo-footer p {
		margin: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.demo-container {
			padding-bottom: 500px;
		}

		.demo-header {
			padding: var(--spacing-lg) var(--spacing-md);
		}

		.demo-header h1 {
			font-size: 1.5rem;
		}

		.controls-section,
		.content-section {
			padding: var(--spacing-md);
		}

		.info-cards {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}

		.demo-actions {
			flex-direction: column;
		}

		.demo-footer {
			bottom: 450px;
		}
	}
</style>
