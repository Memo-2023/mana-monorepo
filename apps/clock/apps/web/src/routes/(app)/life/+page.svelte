<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		lifeClockStore,
		type LifeStats,
		type MilestoneInfo,
	} from '$lib/stores/life-clock.svelte';
	import { DotGrid, CircularProgress, YearRings } from '$lib/components/life-clock';

	// Visualization types
	type VisualizationType = 'circular' | 'dotgrid' | 'rings';

	const visualizations: { id: VisualizationType; label: string; icon: string }[] = [
		{ id: 'circular', label: 'Kreis', icon: '◐' },
		{ id: 'dotgrid', label: 'Raster', icon: '▦' },
		{ id: 'rings', label: 'Ringe', icon: '◎' },
	];

	// Current time for live updates
	let now = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;

	// UI state
	let birthdateInput = $state('');
	let isEditing = $state(false);
	let selectedViz = $state<VisualizationType>('circular');

	// Derived values
	let hasBirthdate = $derived(lifeClockStore.hasBirthdate);
	let stats = $derived(lifeClockStore.getStats(now));
	let nextMilestone = $derived(lifeClockStore.getNextMilestone(now));
	let milestones = $derived(lifeClockStore.getMilestones(now));

	// Format large numbers with dots
	function formatNumber(num: number): string {
		return num.toLocaleString('de-DE');
	}

	// Format date for display
	function formatDate(date: Date): string {
		return date.toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	function handleSetBirthdate() {
		if (birthdateInput) {
			lifeClockStore.setBirthdate(birthdateInput);
			isEditing = false;
		}
	}

	function handleEdit() {
		birthdateInput = lifeClockStore.birthdate || '';
		isEditing = true;
	}

	function handleCancel() {
		isEditing = false;
		birthdateInput = '';
	}

	function selectVisualization(viz: VisualizationType) {
		selectedViz = viz;
		if (browser) {
			localStorage.setItem('life-clock-viz', viz);
		}
	}

	onMount(() => {
		lifeClockStore.initialize();
		if (lifeClockStore.birthdate) {
			birthdateInput = lifeClockStore.birthdate;
		}

		// Load saved visualization preference
		const savedViz = localStorage.getItem('life-clock-viz') as VisualizationType | null;
		if (savedViz && visualizations.some((v) => v.id === savedViz)) {
			selectedViz = savedViz;
		}

		// Update every second for live counter
		interval = setInterval(() => {
			now = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<div class="life-page">
	{#if !hasBirthdate || isEditing}
		<!-- Birthdate Input -->
		<div class="setup-container">
			<div class="setup-card">
				<h2 class="setup-title">Lebensuhr</h2>
				<p class="setup-description">
					Gib dein Geburtsdatum ein, um zu sehen, wie viele Tage du bereits gelebt hast.
				</p>

				<div class="input-group">
					<input
						type="date"
						bind:value={birthdateInput}
						class="date-input"
						max={new Date().toISOString().split('T')[0]}
					/>
					<div class="button-row">
						<button class="btn-primary" onclick={handleSetBirthdate} disabled={!birthdateInput}>
							Speichern
						</button>
						{#if isEditing}
							<button class="btn-secondary" onclick={handleCancel}> Abbrechen </button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else if stats}
		<!-- Hero Visualization Section -->
		<div class="hero-section">
			<!-- Visualization Switcher (top right) -->
			<div class="viz-switcher">
				{#each visualizations as viz}
					<button
						class="viz-btn"
						class:active={selectedViz === viz.id}
						onclick={() => selectVisualization(viz.id)}
						title={viz.label}
					>
						<span class="viz-icon">{viz.icon}</span>
					</button>
				{/each}
			</div>

			<!-- Large Visualization -->
			<div class="visualization-hero">
				{#if selectedViz === 'circular'}
					<CircularProgress daysLived={stats.daysLived} size={450} />
				{:else if selectedViz === 'dotgrid'}
					<DotGrid weeksLived={stats.weeksLived} />
				{:else if selectedViz === 'rings'}
					<YearRings yearsLived={stats.yearsLived} exactAge={stats.exactAge} size={450} />
				{/if}
			</div>

			<!-- Days Counter Overlay -->
			<div class="days-overlay">
				<span class="days-number">{formatNumber(stats.daysLived)}</span>
				<span class="days-label">Tage gelebt</span>
				<p class="exact-age">
					{stats.exactAge.years} Jahre, {stats.exactAge.months} Monate, {stats.exactAge.days} Tage
				</p>
				<button class="birthdate-display" onclick={handleEdit}>
					seit {formatDate(new Date(lifeClockStore.birthdate!))}
				</button>
			</div>
		</div>

		<!-- Content Section -->
		<div class="content-section">
			<!-- Next Milestone -->
			{#if nextMilestone}
				<div class="next-milestone">
					<span class="milestone-label">Nächster Meilenstein</span>
					<span class="milestone-value">{formatNumber(nextMilestone.days)} Tage</span>
					<span class="milestone-countdown">in {formatNumber(nextMilestone.daysUntil)} Tagen</span>
				</div>
			{/if}

			<!-- Stats Grid -->
			<div class="stats-grid">
				<div class="stat-item">
					<span class="stat-value">{formatNumber(stats.hoursLived)}</span>
					<span class="stat-label">Stunden</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{formatNumber(stats.minutesLived)}</span>
					<span class="stat-label">Minuten</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{formatNumber(stats.weeksLived)}</span>
					<span class="stat-label">Wochen</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{formatNumber(stats.monthsLived)}</span>
					<span class="stat-label">Monate</span>
				</div>
			</div>

			<!-- Two Column Layout -->
			<div class="two-columns">
				<!-- Fun Facts -->
				<div class="fun-facts">
					<h3 class="section-title">Ungefähre Schätzungen</h3>
					<div class="facts-list">
						<div class="fact-item">
							<span class="fact-icon">❤️</span>
							<div class="fact-content">
								<span class="fact-value">~{formatNumber(stats.heartbeats)}</span>
								<span class="fact-label">Herzschläge</span>
							</div>
						</div>
						<div class="fact-item">
							<span class="fact-icon">🌬️</span>
							<div class="fact-content">
								<span class="fact-value">~{formatNumber(stats.breaths)}</span>
								<span class="fact-label">Atemzüge</span>
							</div>
						</div>
						<div class="fact-item">
							<span class="fact-icon">🌅</span>
							<div class="fact-content">
								<span class="fact-value">{formatNumber(stats.sunrises)}</span>
								<span class="fact-label">Sonnenaufgänge</span>
							</div>
						</div>
						<div class="fact-item">
							<span class="fact-icon">😴</span>
							<div class="fact-content">
								<span class="fact-value">~{formatNumber(stats.sleepHours)}</span>
								<span class="fact-label">Stunden geschlafen</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Milestones -->
				<div class="milestones-section">
					<h3 class="section-title">Meilensteine</h3>
					<div class="milestones-list">
						{#each milestones as milestone}
							<div class="milestone-item" class:reached={milestone.reached}>
								<span class="milestone-check">{milestone.reached ? '✓' : '○'}</span>
								<span class="milestone-days">{formatNumber(milestone.days)} Tage</span>
								{#if !milestone.reached}
									<span class="milestone-until">in {formatNumber(milestone.daysUntil)} Tagen</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.life-page {
		width: 100%;
		margin: -1rem;
		margin-bottom: 0;
	}

	@media (min-width: 640px) {
		.life-page {
			margin: -1.5rem;
			margin-bottom: 0;
		}
	}

	@media (min-width: 1024px) {
		.life-page {
			margin: -2rem;
			margin-bottom: 0;
		}
	}

	/* Setup */
	.setup-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 200px);
	}

	.setup-card {
		text-align: center;
		max-width: 400px;
		padding: 2rem;
	}

	.setup-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.5rem;
	}

	.setup-description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.date-input {
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		text-align: center;
	}

	.date-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.button-row {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.btn-secondary:hover {
		opacity: 0.8;
	}

	/* Hero Section */
	.hero-section {
		position: relative;
		width: 100vw;
		min-height: 70vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			180deg,
			hsl(var(--color-muted) / 0.08) 0%,
			hsl(var(--color-muted) / 0.03) 50%,
			transparent 100%
		);
		border-bottom: 1px solid hsl(var(--color-border));
		padding: 3rem 2rem 5rem;
	}

	/* Viz Switcher */
	.viz-switcher {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.25rem;
		background: hsl(var(--color-background) / 0.8);
		backdrop-filter: blur(8px);
		padding: 0.25rem;
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border));
	}

	.viz-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.viz-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.viz-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.viz-icon {
		font-size: 1.25rem;
	}

	/* Visualization Hero */
	.visualization-hero {
		width: 100%;
		max-width: 900px;
		display: flex;
		justify-content: center;
		padding: 0 1rem;
	}

	/* Days Overlay - positioned below viz for circular/rings, hidden for dotgrid */
	.days-overlay {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		background: hsl(var(--color-background) / 0.95);
		backdrop-filter: blur(12px);
		padding: 1.25rem 2.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 4px 20px hsl(var(--color-foreground) / 0.05);
	}

	.days-number {
		display: block;
		font-size: 3rem;
		font-weight: 200;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}

	.days-label {
		display: block;
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.375rem;
	}

	.exact-age {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.5rem;
	}

	.birthdate-display {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		margin-top: 0.25rem;
		border-radius: var(--radius-sm);
		transition: color 0.15s ease;
	}

	.birthdate-display:hover {
		color: hsl(var(--color-foreground));
	}

	/* Content Section */
	.content-section {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
	}

	/* Next Milestone */
	.next-milestone {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.25rem;
		background: hsl(var(--color-primary) / 0.1);
		border: 1px solid hsl(var(--color-primary) / 0.2);
		border-radius: var(--radius-lg);
	}

	.next-milestone .milestone-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.next-milestone .milestone-value {
		font-size: 1.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		margin-top: 0.25rem;
	}

	.next-milestone .milestone-countdown {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	/* Two Columns */
	.two-columns {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	/* Fun Facts */
	.facts-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.fact-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
	}

	.fact-icon {
		font-size: 1.5rem;
	}

	.fact-content {
		display: flex;
		flex-direction: column;
	}

	.fact-value {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.fact-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Milestones */
	.milestones-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.milestone-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.milestone-item.reached {
		opacity: 0.5;
	}

	.milestone-check {
		color: hsl(var(--color-primary));
		font-weight: 600;
	}

	.milestone-days {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.milestone-until {
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Responsive */
	@media (min-width: 640px) {
		.hero-section {
			min-height: 75vh;
			padding: 4rem 3rem 6rem;
		}

		.days-number {
			font-size: 3.5rem;
		}

		.days-overlay {
			padding: 1.5rem 3rem;
		}

		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.two-columns {
			grid-template-columns: 1fr 1fr;
		}

		.content-section {
			padding: 3rem 2rem 4rem;
		}
	}

	@media (min-width: 1024px) {
		.hero-section {
			min-height: 80vh;
			padding: 5rem 4rem 7rem;
		}

		.days-number {
			font-size: 4rem;
		}

		.visualization-hero {
			max-width: 1000px;
		}
	}

	@media (min-width: 1280px) {
		.hero-section {
			min-height: 85vh;
		}

		.visualization-hero {
			max-width: 1100px;
		}
	}
</style>
