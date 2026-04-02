<script lang="ts">
	import UnifiedBar from '$lib/components/calendar/UnifiedBar.svelte';
	import { unifiedBarStore } from '$lib/stores/unified-bar.svelte';
	import { onMount } from 'svelte';
	import type { QuickInputItem } from '@manacore/shared-ui';

	// Demo handlers
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		console.log('Search:', query);
		return [{ id: '1', title: `Ergebnis für "${query}"`, subtitle: 'Demo-Termin' }];
	}

	function handleSelect(item: QuickInputItem) {
		console.log('Select:', item);
	}

	function handleSearchChange(query: string, results: QuickInputItem[]) {
		console.log('Search change:', query, results);
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
		<p>Demonstration der unified bottom bar Architektur</p>
	</header>

	<!-- Main content area -->
	<section class="content-section">
		<div class="content-placeholder">
			<h2>Kalender Inhalt</h2>
			<p>Dies ist der Hauptinhaltbereich, in dem die Kalender-Ansichten angezeigt werden.</p>

			<div class="info-cards">
				<div class="info-card">
					<h3>Sichtbare Layers</h3>
					<ul>
						{#if unifiedBarStore.showQuickInput}<li>QuickInput</li>{/if}
						{#if unifiedBarStore.showDateStrip}<li>DateStrip</li>{/if}
						{#if unifiedBarStore.showTagStrip}<li>TagStrip</li>{/if}
						{#if unifiedBarStore.showCalendarToolbar}<li>CalendarToolbar</li>{/if}
					</ul>
				</div>

				<div class="info-card">
					<h3>Overlay Status</h3>
					<p><strong>{unifiedBarStore.isOverlayOpen ? 'Offen' : 'Geschlossen'}</strong></p>
				</div>
			</div>

			<div class="demo-actions">
				<button onmousedown={() => unifiedBarStore.toggleOverlay()}> Overlay Toggle </button>
				<button onmousedown={() => unifiedBarStore.expandToLayer('date')}>
					DateStrip zeigen
				</button>
				<button onmousedown={() => unifiedBarStore.expandToLayer('tag')}> TagStrip zeigen </button>
				<button onmousedown={() => unifiedBarStore.expandToLayer('toolbar')}>
					Toolbar zeigen
				</button>
				<button onmousedown={() => unifiedBarStore.collapseAll()}> Alle einklappen </button>
			</div>
		</div>
	</section>

	<!-- UnifiedBar at the bottom -->
	<UnifiedBar
		onSearch={handleSearch}
		onSelect={handleSelect}
		onSearchChange={handleSearchChange}
		placeholder="Neuer Termin oder suchen..."
		emptyText="Keine Termine gefunden"
		searchingText="Suche..."
		createText="Erstellen"
		appIcon="calendar"
		isMobile={false}
		showCalendarLayers={true}
	/>
</main>

<style>
	.demo-container {
		min-height: 100vh;
		padding-bottom: 300px;
		background: var(--color-background);
		color: var(--color-foreground);
	}

	.demo-header {
		padding: 2rem;
		text-align: center;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		background: var(--color-surface, #fff);
	}

	.demo-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
	}

	.demo-header p {
		margin: 0;
		color: hsl(var(--color-muted-foreground));
	}

	.content-section {
		padding: 2rem;
	}

	.content-placeholder {
		max-width: 1200px;
		margin: 0 auto;
	}

	.content-placeholder h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.content-placeholder p {
		margin: 0 0 2rem 0;
		color: hsl(var(--color-muted-foreground));
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.info-card {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.info-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-card ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.info-card li {
		padding: 0.25rem 0;
		font-weight: 500;
	}

	.demo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.demo-actions button {
		padding: 0.75rem 1.25rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.demo-actions button:hover {
		filter: brightness(0.9);
		transform: translateY(-1px);
	}
</style>
