<script lang="ts">
	import { calendarStatisticsStore } from '$lib/stores/statistics.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { heatmapStore } from '$lib/stores/heatmap.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { BarChart3, Calendar, Clock, TrendingUp, X, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { browser } from '$app/environment';

	// Collapsed state (persisted in localStorage)
	let collapsed = $state(false);

	// Load collapsed state from localStorage
	if (browser) {
		const saved = localStorage.getItem('calendar-stats-overlay-collapsed');
		if (saved === 'true') {
			collapsed = true;
		}
	}

	function toggleCollapsed() {
		collapsed = !collapsed;
		if (browser) {
			localStorage.setItem('calendar-stats-overlay-collapsed', String(collapsed));
		}
	}

	// Period label based on current view
	let periodLabel = $derived.by(() => {
		const range = viewStore.viewRange;
		if (!range) return 'Statistiken';

		const viewType = viewStore.viewType;

		if (viewType === 'day') {
			return format(range.start, 'd. MMMM', { locale: de });
		} else if (viewType === 'week' || viewType === '5day' || viewType === '3day') {
			return `KW ${format(range.start, 'w', { locale: de })}`;
		} else if (viewType === 'month') {
			return format(range.start, 'MMMM yyyy', { locale: de });
		} else if (viewType === 'year') {
			return format(range.start, 'yyyy', { locale: de });
		} else {
			// Multi-day views
			return `${format(range.start, 'd. MMM', { locale: de })} - ${format(range.end, 'd. MMM', { locale: de })}`;
		}
	});

	// Stats derived from store
	let stats = $derived({
		eventsToday: calendarStatisticsStore.eventsToday,
		eventsThisWeek: calendarStatisticsStore.eventsThisWeek,
		busyHours: calendarStatisticsStore.busyHoursThisWeek,
		totalEvents: calendarStatisticsStore.totalEvents,
		avgDuration: calendarStatisticsStore.averageEventDuration,
	});
</script>

<!-- Only show when heatmap is enabled -->
{#if heatmapStore.enabled}
	<div class="stats-overlay" class:collapsed>
		{#if collapsed}
			<!-- Collapsed: Just a small FAB -->
			<button class="stats-fab" onclick={toggleCollapsed} title="Statistiken anzeigen">
				<BarChart3 size={18} />
			</button>
		{:else}
			<!-- Expanded: Full panel -->
			<div class="stats-panel">
				<header class="panel-header">
					<div class="header-title">
						<BarChart3 size={16} />
						<span>{periodLabel}</span>
					</div>
					<button class="collapse-btn" onclick={toggleCollapsed} title="Minimieren">
						<ChevronUp size={16} />
					</button>
				</header>

				<div class="stats-content">
					<div class="stat-row">
						<Calendar size={14} />
						<span class="stat-label">Heute</span>
						<span class="stat-value">{stats.eventsToday}</span>
					</div>

					<div class="stat-row">
						<TrendingUp size={14} />
						<span class="stat-label">Diese Woche</span>
						<span class="stat-value">{stats.eventsThisWeek}</span>
					</div>

					<div class="stat-row">
						<Clock size={14} />
						<span class="stat-label">Stunden/Woche</span>
						<span class="stat-value">{stats.busyHours}h</span>
					</div>

					{#if stats.avgDuration > 0}
						<div class="stat-row muted">
							<span class="stat-label">Ø Dauer</span>
							<span class="stat-value">{stats.avgDuration}min</span>
						</div>
					{/if}
				</div>

				<div class="panel-footer">
					<span class="total-label">{stats.totalEvents} Events geladen</span>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.stats-overlay {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 50;
		pointer-events: auto;
	}

	/* Move down when in floating mode (DateStrip visible) */
	@media (min-width: 768px) {
		.stats-overlay {
			top: 1rem;
			right: 1rem;
		}
	}

	.stats-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		color: hsl(var(--color-foreground));
		transition: all 150ms ease;
	}

	.stats-fab:hover {
		background: hsl(var(--color-muted));
		transform: scale(1.05);
	}

	.stats-panel {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 180px;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.3);
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all 150ms ease;
	}

	.collapse-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.stats-content {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}

	.stat-row.muted {
		color: hsl(var(--color-muted-foreground));
		padding-top: 0.25rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.stat-row :global(svg) {
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.stat-label {
		flex: 1;
	}

	.stat-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.panel-footer {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.2);
	}

	.total-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Mobile: Position at bottom right, above PillNav */
	@media (max-width: 640px) {
		.stats-overlay {
			top: auto;
			bottom: calc(160px + env(safe-area-inset-bottom));
			right: 1rem;
		}

		.stats-panel {
			min-width: 160px;
		}
	}
</style>
