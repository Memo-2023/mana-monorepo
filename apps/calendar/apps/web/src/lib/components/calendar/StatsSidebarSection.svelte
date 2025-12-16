<script lang="ts">
	import { calendarStatisticsStore } from '$lib/stores/statistics.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		CalendarDays,
		Calendar,
		Clock,
		CalendarCheck,
		Hourglass,
		TrendingUp,
		BarChart3,
		Repeat,
		Sun,
	} from 'lucide-svelte';

	// Update statistics when events/calendars change
	$effect(() => {
		calendarStatisticsStore.setEvents(eventsStore.events);
	});

	$effect(() => {
		calendarStatisticsStore.setCalendars(calendarsStore.calendars);
	});

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
			return `${format(range.start, 'd. MMM', { locale: de })} - ${format(range.end, 'd. MMM', { locale: de })}`;
		}
	});

	// Stats derived from store
	let stats = $derived({
		eventsToday: calendarStatisticsStore.eventsToday,
		eventsThisWeek: calendarStatisticsStore.eventsThisWeek,
		upcomingEvents: calendarStatisticsStore.upcomingEvents,
		busyHours: calendarStatisticsStore.busyHoursThisWeek,
		totalEvents: calendarStatisticsStore.totalEvents,
		avgDuration: calendarStatisticsStore.averageEventDuration,
		totalCalendars: calendarStatisticsStore.totalCalendars,
		recurringEvents: calendarStatisticsStore.recurringEventsCount,
		allDayRatio: calendarStatisticsStore.allDayRatio,
		calendarActivity: calendarStatisticsStore.calendarActivity,
		weeklyTrend: calendarStatisticsStore.weeklyTrend,
	});

	// Get the last 7 days of trend data for mini chart
	let miniTrend = $derived(stats.weeklyTrend.slice(-7));
	let maxTrendValue = $derived(Math.max(...miniTrend.map((d) => d.count), 1));
</script>

<div class="stats-sidebar">
	<header class="sidebar-header">
		<div class="header-content">
			<BarChart3 size={18} />
			<span class="header-title">Statistiken</span>
		</div>
		<span class="period-label">{periodLabel}</span>
	</header>

	<!-- Quick Stats Grid -->
	<section class="stats-grid">
		<div class="stat-card primary">
			<div class="stat-icon">
				<CalendarDays size={16} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{stats.eventsToday}</span>
				<span class="stat-label">Heute</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<Calendar size={16} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{stats.eventsThisWeek}</span>
				<span class="stat-label">Diese Woche</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<CalendarCheck size={16} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{stats.upcomingEvents}</span>
				<span class="stat-label">Anstehend</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<Clock size={16} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{stats.busyHours}h</span>
				<span class="stat-label">Stunden/Woche</span>
			</div>
		</div>
	</section>

	<!-- Mini Weekly Trend -->
	<section class="trend-section">
		<h3 class="section-title">
			<TrendingUp size={14} />
			Letzte 7 Tage
		</h3>
		<div class="mini-trend">
			{#each miniTrend as day}
				<div class="trend-bar-container" title="{day.label}: {day.count} Events">
					<div
						class="trend-bar"
						style="height: {(day.count / maxTrendValue) * 100}%"
						class:has-events={day.count > 0}
					></div>
					<span class="trend-label">{day.label.charAt(0)}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Calendar Activity -->
	{#if stats.calendarActivity.length > 0}
		<section class="activity-section">
			<h3 class="section-title">
				<Calendar size={14} />
				Kalender-Aktivität
			</h3>
			<div class="calendar-list">
				{#each stats.calendarActivity.slice(0, 5) as cal}
					<div class="calendar-item">
						<div class="calendar-color" style="background-color: {cal.color}"></div>
						<span class="calendar-name">{cal.name}</span>
						<span class="calendar-count">{cal.total}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Additional Stats -->
	<section class="additional-stats">
		<div class="additional-stat">
			<Hourglass size={12} />
			<span>Ø {stats.avgDuration} Min</span>
		</div>
		<div class="additional-stat">
			<Repeat size={12} />
			<span>{stats.recurringEvents} wiederkehrend</span>
		</div>
		<div class="additional-stat">
			<Sun size={12} />
			<span>{stats.allDayRatio.allDay} ganztägig</span>
		</div>
	</section>

	<!-- Footer -->
	<footer class="sidebar-footer">
		<span>{stats.totalEvents} Events geladen</span>
	</footer>
</div>

<style>
	.stats-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		overflow: hidden;
	}

	.sidebar-header {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.3);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--color-foreground));
	}

	.header-title {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.period-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
		display: block;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		padding: 0.75rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border) / 0.5);
	}

	.stat-card.primary {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary) / 0.2);
	}

	.stat-card.primary .stat-icon {
		color: hsl(var(--color-primary));
	}

	.stat-card.primary .stat-value {
		color: hsl(var(--color-primary));
	}

	.stat-icon {
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	/* Sections */
	.section-title {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	/* Trend Section */
	.trend-section {
		padding: 0.75rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.mini-trend {
		display: flex;
		align-items: flex-end;
		gap: 0.375rem;
		height: 48px;
	}

	.trend-bar-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.trend-bar {
		width: 100%;
		min-height: 2px;
		background: hsl(var(--color-muted));
		border-radius: 2px 2px 0 0;
		transition: height 200ms ease;
	}

	.trend-bar.has-events {
		background: hsl(var(--color-primary));
	}

	.trend-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	/* Activity Section */
	.activity-section {
		padding: 0.75rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.calendar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0;
	}

	.calendar-color {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.calendar-name {
		flex: 1;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.calendar-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	/* Additional Stats */
	.additional-stats {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
	}

	.additional-stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Footer */
	.sidebar-footer {
		padding: 0.5rem 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.2);
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}

	/* Mobile: Horizontal layout */
	@media (max-width: 768px) {
		.stats-sidebar {
			border-radius: 0;
			border: none;
			border-top: 1px solid hsl(var(--color-border));
		}

		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.stat-card {
			flex-direction: column;
			text-align: center;
			padding: 0.5rem;
		}

		.stat-content {
			align-items: center;
		}

		.stat-value {
			font-size: 0.875rem;
		}

		.trend-section,
		.activity-section {
			display: none;
		}

		.additional-stats {
			justify-content: center;
		}
	}
</style>
