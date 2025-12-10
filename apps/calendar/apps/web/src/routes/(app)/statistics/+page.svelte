<script lang="ts">
	import { onMount } from 'svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { calendarStatisticsStore } from '$lib/stores/statistics.svelte';
	import {
		StatsGrid,
		ActivityHeatmap,
		TrendLineChart,
		DonutChart,
		ProgressBars,
		StatisticsSkeleton,
		type StatItem,
	} from '@manacore/shared-ui';
	import {
		BarChart3,
		CalendarDays,
		Calendar,
		Clock,
		CalendarCheck,
		Hourglass,
	} from 'lucide-svelte';
	import { subDays, addDays } from 'date-fns';

	let loading = $state(true);

	// Update statistics when events change
	$effect(() => {
		calendarStatisticsStore.setEvents(eventsStore.events);
	});

	$effect(() => {
		calendarStatisticsStore.setCalendars(calendarsStore.calendars);
	});

	// Build stats items for StatsGrid
	let statsItems = $derived<StatItem[]>([
		{
			id: 'eventsToday',
			label: 'Heute',
			value: calendarStatisticsStore.eventsToday,
			icon: CalendarDays,
			variant: 'success',
		},
		{
			id: 'eventsThisWeek',
			label: 'Diese Woche',
			value: calendarStatisticsStore.eventsThisWeek,
			icon: Calendar,
			variant: 'primary',
		},
		{
			id: 'upcoming',
			label: 'Anstehend (7 Tage)',
			value: calendarStatisticsStore.upcomingEvents,
			icon: CalendarCheck,
			variant: 'info',
		},
		{
			id: 'busyHours',
			label: 'Stunden/Woche',
			value: `${calendarStatisticsStore.busyHoursThisWeek}h`,
			icon: Clock,
			variant: 'neutral',
		},
		{
			id: 'calendars',
			label: 'Kalender',
			value: calendarStatisticsStore.totalCalendars,
			icon: Calendar,
			variant: 'accent',
		},
		{
			id: 'avgDuration',
			label: 'Ø Dauer (Min)',
			value: calendarStatisticsStore.averageEventDuration,
			icon: Hourglass,
			variant: 'info',
		},
	]);

	onMount(async () => {
		// Fetch events for the last 6 months + next month for statistics
		const startDate = subDays(new Date(), 180);
		const endDate = addDays(new Date(), 30);

		await Promise.all([
			eventsStore.fetchEvents(startDate, endDate),
			calendarsStore.fetchCalendars(),
		]);

		loading = false;
	});
</script>

<svelte:head>
	<title>Statistiken - Kalender</title>
</svelte:head>

<div class="statistics-page">
	<header class="page-header">
		<div class="header-icon">
			<BarChart3 size={28} />
		</div>
		<div class="header-content">
			<h1>Statistiken</h1>
			<p class="header-subtitle">Dein Kalender im Überblick</p>
		</div>
	</header>

	{#if loading}
		<StatisticsSkeleton statCards={6} legendItems={3} />
	{:else}
		<!-- Quick Stats -->
		<section class="stats-section">
			<StatsGrid items={statsItems} columns={6} />
		</section>

		<!-- Charts Grid -->
		<div class="charts-grid">
			<!-- Activity Heatmap -->
			<section class="chart-section heatmap-section">
				<ActivityHeatmap
					data={calendarStatisticsStore.activityHeatmap}
					itemName="Event"
					itemNamePlural="Events"
				/>
			</section>

			<!-- Weekly Trend + Status Donut -->
			<div class="charts-row">
				<section class="chart-section trend-section">
					<TrendLineChart
						data={calendarStatisticsStore.weeklyTrend}
						itemName="Event"
						itemNamePlural="Events"
					/>
				</section>

				<section class="chart-section donut-section">
					<DonutChart
						data={calendarStatisticsStore.statusBreakdown}
						title="Status"
						centerLabel="Events"
						centerValue={calendarStatisticsStore.totalEvents}
					/>
				</section>
			</div>

			<!-- Calendar Activity -->
			<section class="chart-section calendars-section">
				<ProgressBars
					data={calendarStatisticsStore.calendarActivity}
					title="Kalender-Aktivität"
					emptyMessage="Keine Kalender mit Events"
				/>
			</section>
		</div>

		<!-- Additional Stats -->
		<div class="additional-stats">
			<div class="stat-card-small">
				<span class="stat-label">Ganztägige Events</span>
				<span class="stat-value">
					{calendarStatisticsStore.allDayRatio.allDay}
					<span class="stat-percentage"
						>({calendarStatisticsStore.allDayRatio.allDayPercentage}%)</span
					>
				</span>
			</div>

			<div class="stat-card-small">
				<span class="stat-label">Wiederkehrende Events</span>
				<span class="stat-value">{calendarStatisticsStore.recurringEventsCount}</span>
			</div>

			<div class="stat-card-small">
				<span class="stat-label">Events gesamt</span>
				<span class="stat-value">{calendarStatisticsStore.totalEvents}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.statistics-page {
		padding-bottom: 6rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: hsl(var(--primary) / 0.15);
		color: hsl(var(--primary));
		border-radius: 1rem;
	}

	.header-content h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.header-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0 0;
	}

	.stats-section {
		margin-bottom: 1.5rem;
	}

	.charts-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.charts-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.charts-row {
			grid-template-columns: 2fr 1fr;
		}
	}

	.chart-section {
		min-width: 0;
	}

	.additional-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.stat-card-small {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
	}

	:global(.dark) .stat-card-small {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.stat-card-small .stat-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.stat-card-small .stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.stat-percentage {
		font-size: 0.875rem;
		font-weight: 400;
		color: hsl(var(--muted-foreground));
	}
</style>
