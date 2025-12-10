<script lang="ts">
	import { onMount } from 'svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { contactsStatisticsStore } from '$lib/stores/statistics.svelte';
	import { tagsApi } from '$lib/api/tags';
	import {
		StatsGrid,
		ActivityHeatmap,
		TrendLineChart,
		DonutChart,
		ProgressBars,
		StatisticsSkeleton,
		type StatItem,
	} from '@manacore/shared-ui';
	import { BarChart3, Users, Star, UserPlus, Cake, Mail, CheckCircle } from 'lucide-svelte';

	let loading = $state(true);

	// Update statistics when contacts change
	$effect(() => {
		contactsStatisticsStore.setContacts(contactsStore.contacts);
	});

	// Build stats items for StatsGrid
	let statsItems = $derived<StatItem[]>([
		{
			id: 'total',
			label: 'Gesamt',
			value: contactsStatisticsStore.totalContacts,
			icon: Users,
			variant: 'primary',
		},
		{
			id: 'favorites',
			label: 'Favoriten',
			value: contactsStatisticsStore.favoriteContacts,
			icon: Star,
			variant: 'accent',
		},
		{
			id: 'recentlyAdded',
			label: 'Neu (7 Tage)',
			value: contactsStatisticsStore.recentlyAdded,
			icon: UserPlus,
			variant: 'success',
		},
		{
			id: 'birthdays',
			label: 'Geburtstage',
			value: contactsStatisticsStore.birthdaysThisMonth,
			icon: Cake,
			variant: 'info',
		},
		{
			id: 'withEmail',
			label: 'Mit E-Mail',
			value: contactsStatisticsStore.contactsWithEmail,
			icon: Mail,
			variant: 'neutral',
		},
		{
			id: 'completeness',
			label: 'Vollständigkeit',
			value: `${contactsStatisticsStore.completenessRate}%`,
			icon: CheckCircle,
			variant: contactsStatisticsStore.completenessRate >= 70 ? 'success' : 'danger',
		},
	]);

	onMount(async () => {
		// Fetch all contacts (without filters for statistics)
		await contactsStore.loadContacts({ isArchived: false });

		// Also load archived for complete statistics
		const allContacts = [...contactsStore.contacts];

		// Fetch tags
		try {
			const tagsResult = await tagsApi.list();
			contactsStatisticsStore.setTags(tagsResult);
		} catch (e) {
			console.error('Failed to load tags:', e);
		}

		loading = false;
	});
</script>

<svelte:head>
	<title>Statistiken - Kontakte</title>
</svelte:head>

<div class="statistics-page">
	<header class="page-header">
		<div class="header-icon">
			<BarChart3 size={28} />
		</div>
		<div class="header-content">
			<h1>Statistiken</h1>
			<p class="header-subtitle">Deine Kontakte im Überblick</p>
		</div>
	</header>

	{#if loading}
		<StatisticsSkeleton statCards={6} legendItems={4} />
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
					data={contactsStatisticsStore.activityHeatmap}
					itemName="Kontakt"
					itemNamePlural="Kontakte"
				/>
			</section>

			<!-- Weekly Trend + Status Donut -->
			<div class="charts-row">
				<section class="chart-section trend-section">
					<TrendLineChart
						data={contactsStatisticsStore.weeklyTrend}
						itemName="Kontakt"
						itemNamePlural="Kontakte"
					/>
				</section>

				<section class="chart-section donut-section">
					<DonutChart
						data={contactsStatisticsStore.statusBreakdown}
						title="Status"
						centerLabel="Kontakte"
						centerValue={contactsStatisticsStore.totalContacts}
					/>
				</section>
			</div>

			<!-- Info Completeness -->
			<div class="charts-row">
				<section class="chart-section info-section">
					<DonutChart
						data={contactsStatisticsStore.infoBreakdown}
						title="Informationen"
						centerLabel="Kontakte"
						centerValue={contactsStatisticsStore.totalContacts}
					/>
				</section>

				<section class="chart-section country-section">
					<ProgressBars
						data={contactsStatisticsStore.countryBreakdown}
						title="Nach Land"
						emptyMessage="Keine Länder angegeben"
					/>
				</section>
			</div>
		</div>

		<!-- Additional Stats -->
		<div class="additional-stats">
			<div class="stat-card-small">
				<span class="stat-label">Aktive Kontakte</span>
				<span class="stat-value">{contactsStatisticsStore.activeContacts}</span>
			</div>

			<div class="stat-card-small">
				<span class="stat-label">Archivierte Kontakte</span>
				<span class="stat-value">{contactsStatisticsStore.archivedContacts}</span>
			</div>

			<div class="stat-card-small">
				<span class="stat-label">Tags</span>
				<span class="stat-value">{contactsStatisticsStore.totalTags}</span>
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
			grid-template-columns: 1fr 1fr;
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
</style>
