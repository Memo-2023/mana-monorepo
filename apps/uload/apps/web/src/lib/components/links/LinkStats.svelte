<script lang="ts">
	import { 
		TrendingUp, 
		TrendingDown, 
		Users, 
		MousePointer, 
		Globe, 
		Clock,
		BarChart3,
		Activity,
		Link,
		ExternalLink,
		ArrowUp,
		ArrowDown,
		Minus
	} from 'lucide-svelte';
	import type { Link as LinkType } from '$lib/types/links';

	interface Props {
		links: LinkType[];
		totalClicks?: number;
		period?: '7d' | '30d' | '90d' | 'all';
	}

	let { 
		links = [], 
		totalClicks = 0,
		period = '30d' 
	}: Props = $props();

	// Calculate statistics
	let stats = $derived(() => {
		const now = new Date();
		const activeLinkCount = links.filter(l => !l.archived).length;
		const allClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
		
		// Calculate average CTR (simplified)
		const avgCtr = activeLinkCount > 0 
			? ((allClicks / (activeLinkCount * 100)) * 100).toFixed(1)
			: '0';

		// Get top performing links
		const topLinks = [...links]
			.filter(l => !l.archived)
			.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
			.slice(0, 5);

		// Get recent links
		const recentLinks = [...links]
			.filter(l => !l.archived)
			.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
			.slice(0, 5);

		// Calculate trend (mock data for now)
		const previousPeriodClicks = Math.floor(allClicks * 0.8);
		const clickTrend = previousPeriodClicks > 0 
			? ((allClicks - previousPeriodClicks) / previousPeriodClicks * 100).toFixed(0)
			: '0';

		// Device breakdown (mock data)
		const deviceBreakdown = {
			desktop: Math.floor(allClicks * 0.55),
			mobile: Math.floor(allClicks * 0.40),
			tablet: Math.floor(allClicks * 0.05)
		};

		// Time distribution (mock data for visualization)
		const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
			hour: i,
			clicks: Math.floor(Math.random() * 100)
		}));

		return {
			totalLinks: links.length,
			activeLinks: activeLinkCount,
			totalClicks: allClicks,
			avgCtr,
			clickTrend,
			topLinks,
			recentLinks,
			deviceBreakdown,
			hourlyDistribution
		};
	});

	function formatNumber(num: number): string {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	}

	function getChangeIcon(trend: string) {
		const value = parseFloat(trend);
		if (value > 0) return ArrowUp;
		if (value < 0) return ArrowDown;
		return Minus;
	}

	function getChangeColor(trend: string) {
		const value = parseFloat(trend);
		if (value > 0) return 'text-green-600 dark:text-green-400';
		if (value < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}
</script>

<div class="space-y-6">
	<!-- Key Metrics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Clicks -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
					<MousePointer class="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div class="flex items-center gap-1 text-sm {getChangeColor(stats().clickTrend)}">
					<svelte:component this={getChangeIcon(stats().clickTrend)} class="h-3 w-3" />
					<span>{Math.abs(parseFloat(stats().clickTrend))}%</span>
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{formatNumber(stats().totalClicks)}</p>
				<p class="text-sm text-theme-text-muted mt-1">Total Clicks</p>
			</div>
		</div>

		<!-- Active Links -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
					<Link class="h-5 w-5 text-green-600 dark:text-green-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{stats().activeLinks}</p>
				<p class="text-sm text-theme-text-muted mt-1">Active Links</p>
			</div>
		</div>

		<!-- Average CTR -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
					<Activity class="h-5 w-5 text-purple-600 dark:text-purple-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{stats().avgCtr}%</p>
				<p class="text-sm text-theme-text-muted mt-1">Avg. Engagement</p>
			</div>
		</div>

		<!-- Link Efficiency -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
					<BarChart3 class="h-5 w-5 text-amber-600 dark:text-amber-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">
					{stats().activeLinks > 0 ? Math.floor(stats().totalClicks / stats().activeLinks) : 0}
				</p>
				<p class="text-sm text-theme-text-muted mt-1">Clicks per Link</p>
			</div>
		</div>
	</div>

	<!-- Charts Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Hourly Activity Chart -->
		<div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Clock class="h-5 w-5 text-theme-text-muted" />
				Click Activity (24h)
			</h3>
			<div class="h-48 flex items-end gap-1">
				{#each stats().hourlyDistribution as hour}
					<div class="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t opacity-80 hover:opacity-100 transition-opacity relative group"
						style="height: {hour.clicks}%"
						title="{hour.hour}:00 - {hour.clicks} clicks">
						<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
							{hour.hour}:00
						</div>
					</div>
				{/each}
			</div>
			<div class="flex justify-between mt-2 text-xs text-theme-text-muted">
				<span>00:00</span>
				<span>06:00</span>
				<span>12:00</span>
				<span>18:00</span>
				<span>23:00</span>
			</div>
		</div>

		<!-- Device Breakdown -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Users class="h-5 w-5 text-theme-text-muted" />
				Device Types
			</h3>
			<div class="space-y-4">
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text">Desktop</span>
						<span class="text-theme-text-muted">{stats().deviceBreakdown.desktop}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-blue-500 h-2 rounded-full" style="width: 55%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text">Mobile</span>
						<span class="text-theme-text-muted">{stats().deviceBreakdown.mobile}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-green-500 h-2 rounded-full" style="width: 40%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text">Tablet</span>
						<span class="text-theme-text-muted">{stats().deviceBreakdown.tablet}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-purple-500 h-2 rounded-full" style="width: 5%"></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Top Links Table -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Top Performing Links -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<TrendingUp class="h-5 w-5 text-green-600 dark:text-green-400" />
				Top Performing Links
			</h3>
			<div class="space-y-3">
				{#each stats().topLinks as link, i}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center gap-3">
							<span class="text-sm font-medium text-theme-text-muted w-6">#{i + 1}</span>
							<div class="min-w-0">
								<p class="text-sm font-medium text-theme-text truncate">
									{link.title || link.short_url}
								</p>
								<p class="text-xs text-theme-text-muted truncate">
									{link.short_url}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-semibold text-theme-text">{link.clicks || 0}</span>
							<span class="text-xs text-theme-text-muted">clicks</span>
							<a 
								href={`/${link.short_url}`} 
								target="_blank"
								class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
							>
								<ExternalLink class="h-3 w-3 text-theme-text-muted" />
							</a>
						</div>
					</div>
				{:else}
					<p class="text-sm text-theme-text-muted text-center py-4">No links with clicks yet</p>
				{/each}
			</div>
		</div>

		<!-- Recent Links -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Clock class="h-5 w-5 text-blue-600 dark:text-blue-400" />
				Recently Created
			</h3>
			<div class="space-y-3">
				{#each stats().recentLinks as link}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="min-w-0">
							<p class="text-sm font-medium text-theme-text truncate">
								{link.title || link.short_url}
							</p>
							<p class="text-xs text-theme-text-muted">
								{new Date(link.created).toLocaleDateString()}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm text-theme-text">{link.clicks || 0}</span>
							<span class="text-xs text-theme-text-muted">clicks</span>
							<a 
								href={`/${link.short_url}`} 
								target="_blank"
								class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
							>
								<ExternalLink class="h-3 w-3 text-theme-text-muted" />
							</a>
						</div>
					</div>
				{:else}
					<p class="text-sm text-theme-text-muted text-center py-4">No links created yet</p>
				{/each}
			</div>
		</div>
	</div>
</div>