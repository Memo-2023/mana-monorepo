<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import QuickLinks from '$lib/components/admin/QuickLinks.svelte';

	interface Stats {
		totalUsers: number;
		newUsers7d: number;
		newUsers30d: number;
		activeSessions: number;
		uniqueUsers24h: number;
		loginSuccess7d: number;
		loginFailed7d: number;
	}

	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const quickLinks = [
		{
			name: 'Grafana Dashboard',
			url: 'https://grafana.mana.how',
			description: 'System & Backend Metrics',
			icon: 'grafana' as const,
		},
		{
			name: 'Umami Analytics',
			url: 'https://stats.mana.how',
			description: 'Web Analytics',
			icon: 'analytics' as const,
		},
		{
			name: 'Docker Dashboard',
			url: 'https://grafana.mana.how/d/backends-docker',
			description: 'Container Metrics',
			icon: 'docker' as const,
		},
		{
			name: 'System Overview',
			url: 'https://grafana.mana.how/d/system-overview',
			description: 'CPU, Memory, Disk',
			icon: 'grafana' as const,
		},
	];

	onMount(async () => {
		try {
			// TODO: Replace with actual API call to fetch admin stats
			// const response = await fetch('/api/admin/stats');
			// stats = await response.json();

			// Mock data for now
			await new Promise((resolve) => setTimeout(resolve, 500));
			stats = {
				totalUsers: 42,
				newUsers7d: 8,
				newUsers30d: 23,
				activeSessions: 15,
				uniqueUsers24h: 12,
				loginSuccess7d: 156,
				loginFailed7d: 3,
			};
		} catch (e) {
			error = 'Failed to load stats';
		} finally {
			loading = false;
		}
	});

	let userGrowthPercent = $derived(
		stats
			? Math.round((stats.newUsers7d / Math.max(stats.totalUsers - stats.newUsers7d, 1)) * 100)
			: 0
	);
</script>

<div class="space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard title="Total Users" value={stats?.totalUsers ?? '-'} icon="users" {loading} />
		<StatCard
			title="New Users (7d)"
			value={stats?.newUsers7d ?? '-'}
			change={userGrowthPercent}
			changeLabel="vs previous"
			icon="users"
			{loading}
		/>
		<StatCard
			title="Active Sessions"
			value={stats?.activeSessions ?? '-'}
			icon="activity"
			{loading}
		/>
		<StatCard
			title="Unique Users (24h)"
			value={stats?.uniqueUsers24h ?? '-'}
			icon="clock"
			{loading}
		/>
	</div>

	<!-- Security & Quick Links -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Security Overview -->
		<div class="rounded-lg border bg-card p-6 shadow-sm">
			<h3 class="text-lg font-semibold mb-4">Security (Last 7 Days)</h3>
			{#if loading}
				<div class="space-y-4 animate-pulse">
					<div class="h-4 bg-muted rounded w-full"></div>
					<div class="h-4 bg-muted rounded w-3/4"></div>
				</div>
			{:else if stats}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-green-500"></div>
							<span class="text-sm">Successful Logins</span>
						</div>
						<span class="font-mono text-sm">{stats.loginSuccess7d}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-red-500"></div>
							<span class="text-sm">Failed Logins</span>
						</div>
						<span class="font-mono text-sm">{stats.loginFailed7d}</span>
					</div>
					<div class="pt-2 border-t">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Success Rate</span>
							<span class="font-medium text-green-600">
								{Math.round(
									(stats.loginSuccess7d / (stats.loginSuccess7d + stats.loginFailed7d)) * 100
								)}%
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Quick Links -->
		<QuickLinks links={quickLinks} />
	</div>

	{#if error}
		<div
			class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4"
		>
			<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
		</div>
	{/if}
</div>
