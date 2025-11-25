<script lang="ts">
	import { 
		Tag, 
		TrendingUp, 
		TrendingDown, 
		Link, 
		MousePointer, 
		Hash,
		Layers,
		Activity,
		BarChart3,
		ExternalLink,
		ArrowUp,
		ArrowDown,
		Minus,
		Zap,
		Target,
		Award
	} from 'lucide-svelte';
	import type { Tag as TagType } from '$lib/pocketbase';

	interface EnhancedTag extends TagType {
		linkCount?: number;
		totalClicks?: number;
	}

	interface Props {
		tags: EnhancedTag[];
		totalLinks?: number;
		period?: '7d' | '30d' | '90d' | 'all';
	}

	let { 
		tags = [], 
		totalLinks = 0,
		period = '30d' 
	}: Props = $props();

	// Calculate statistics
	let stats = $derived(() => {
		const totalTags = tags.length;
		const usedTags = tags.filter(t => (t.linkCount || 0) > 0).length;
		const totalClicks = tags.reduce((sum, tag) => sum + (tag.totalClicks || 0), 0);
		const avgLinksPerTag = usedTags > 0 
			? (tags.reduce((sum, tag) => sum + (tag.linkCount || 0), 0) / usedTags).toFixed(1)
			: '0';

		// Get top performing tags by clicks
		const topByClicks = [...tags]
			.filter(t => (t.totalClicks || 0) > 0)
			.sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
			.slice(0, 5);

		// Get most used tags by link count
		const mostUsedTags = [...tags]
			.filter(t => (t.linkCount || 0) > 0)
			.sort((a, b) => (b.linkCount || 0) - (a.linkCount || 0))
			.slice(0, 5);

		// Get recently created tags
		const recentTags = [...tags]
			.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
			.slice(0, 5);

		// Calculate tag usage distribution
		const distribution = {
			highUsage: tags.filter(t => (t.linkCount || 0) > 10).length,
			mediumUsage: tags.filter(t => (t.linkCount || 0) >= 5 && (t.linkCount || 0) <= 10).length,
			lowUsage: tags.filter(t => (t.linkCount || 0) > 0 && (t.linkCount || 0) < 5).length,
			unused: tags.filter(t => (t.linkCount || 0) === 0).length
		};

		// Calculate engagement rate
		const avgEngagement = usedTags > 0 && totalClicks > 0
			? ((totalClicks / (usedTags * 100)) * 100).toFixed(1)
			: '0';

		// Tag color distribution
		const colorDistribution = tags.reduce((acc, tag) => {
			const color = tag.color || 'default';
			acc[color] = (acc[color] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return {
			totalTags,
			usedTags,
			unusedTags: totalTags - usedTags,
			totalClicks,
			avgLinksPerTag,
			avgEngagement,
			topByClicks,
			mostUsedTags,
			recentTags,
			distribution,
			colorDistribution
		};
	});

	function formatNumber(num: number): string {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	}

	function getTagColorClass(color?: string): string {
		const colorMap: Record<string, string> = {
			'red': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
			'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
			'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
			'green': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
			'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
			'purple': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
			'pink': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
			'gray': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
		};
		return colorMap[color || 'gray'] || colorMap.gray;
	}

	function getUsageLevel(linkCount: number): { label: string; color: string; icon: any } {
		if (linkCount > 10) return { label: 'High', color: 'text-green-600 dark:text-green-400', icon: TrendingUp };
		if (linkCount >= 5) return { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', icon: Activity };
		if (linkCount > 0) return { label: 'Low', color: 'text-amber-600 dark:text-amber-400', icon: TrendingDown };
		return { label: 'Unused', color: 'text-gray-600 dark:text-gray-400', icon: Minus };
	}
</script>

<div class="space-y-6">
	<!-- Key Metrics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
					<Hash class="h-5 w-5 text-purple-600 dark:text-purple-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{stats().totalTags}</p>
				<p class="text-sm text-theme-text-muted mt-1">Total Tags</p>
			</div>
		</div>

		<!-- Active Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
					<Zap class="h-5 w-5 text-green-600 dark:text-green-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{stats().usedTags}</p>
				<p class="text-sm text-theme-text-muted mt-1">Active Tags</p>
			</div>
		</div>

		<!-- Total Clicks via Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
					<MousePointer class="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{formatNumber(stats().totalClicks)}</p>
				<p class="text-sm text-theme-text-muted mt-1">Tag Clicks</p>
			</div>
		</div>

		<!-- Average Links per Tag -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
					<Layers class="h-5 w-5 text-amber-600 dark:text-amber-400" />
				</div>
			</div>
			<div class="mt-3">
				<p class="text-2xl font-bold text-theme-text">{stats().avgLinksPerTag}</p>
				<p class="text-sm text-theme-text-muted mt-1">Links per Tag</p>
			</div>
		</div>
	</div>

	<!-- Usage Distribution and Color Distribution -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Tag Usage Distribution -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<BarChart3 class="h-5 w-5 text-theme-text-muted" />
				Usage Distribution
			</h3>
			<div class="space-y-4">
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text flex items-center gap-2">
							<TrendingUp class="h-4 w-4 text-green-600 dark:text-green-400" />
							High Usage (10+ links)
						</span>
						<span class="text-theme-text-muted font-semibold">{stats().distribution.highUsage}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-green-500 h-2 rounded-full" 
							style="width: {(stats().distribution.highUsage / stats().totalTags * 100).toFixed(0)}%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text flex items-center gap-2">
							<Activity class="h-4 w-4 text-blue-600 dark:text-blue-400" />
							Medium Usage (5-10 links)
						</span>
						<span class="text-theme-text-muted font-semibold">{stats().distribution.mediumUsage}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-blue-500 h-2 rounded-full" 
							style="width: {(stats().distribution.mediumUsage / stats().totalTags * 100).toFixed(0)}%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text flex items-center gap-2">
							<TrendingDown class="h-4 w-4 text-amber-600 dark:text-amber-400" />
							Low Usage (1-4 links)
						</span>
						<span class="text-theme-text-muted font-semibold">{stats().distribution.lowUsage}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-amber-500 h-2 rounded-full" 
							style="width: {(stats().distribution.lowUsage / stats().totalTags * 100).toFixed(0)}%"></div>
					</div>
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span class="text-theme-text flex items-center gap-2">
							<Minus class="h-4 w-4 text-gray-600 dark:text-gray-400" />
							Unused
						</span>
						<span class="text-theme-text-muted font-semibold">{stats().distribution.unused}</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div class="bg-gray-500 h-2 rounded-full" 
							style="width: {(stats().distribution.unused / stats().totalTags * 100).toFixed(0)}%"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Tag Color Distribution -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Tag class="h-5 w-5 text-theme-text-muted" />
				Color Distribution
			</h3>
			<div class="grid grid-cols-4 gap-3">
				{#each Object.entries(stats().colorDistribution).slice(0, 8) as [color, count]}
					<div class="text-center">
						<div class="w-12 h-12 mx-auto mb-2 rounded-lg {getTagColorClass(color)} flex items-center justify-center">
							<span class="text-xs font-bold">{count}</span>
						</div>
						<p class="text-xs text-theme-text-muted capitalize">{color}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Top Tags Tables -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Top Performing Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Award class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
				Top by Clicks
			</h3>
			<div class="space-y-3">
				{#each stats().topByClicks as tag, i}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center gap-3">
							<span class="text-sm font-medium text-theme-text-muted w-6">#{i + 1}</span>
							<span class="px-2 py-1 rounded-full text-xs font-medium {getTagColorClass(tag.color)}">
								{tag.name}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-semibold text-theme-text">{formatNumber(tag.totalClicks || 0)}</span>
							<span class="text-xs text-theme-text-muted">clicks</span>
						</div>
					</div>
				{:else}
					<p class="text-sm text-theme-text-muted text-center py-4">No tags with clicks yet</p>
				{/each}
			</div>
		</div>

		<!-- Most Used Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Target class="h-5 w-5 text-blue-600 dark:text-blue-400" />
				Most Used
			</h3>
			<div class="space-y-3">
				{#each stats().mostUsedTags as tag}
					{@const usage = getUsageLevel(tag.linkCount || 0)}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center gap-2">
							<span class="px-2 py-1 rounded-full text-xs font-medium {getTagColorClass(tag.color)}">
								{tag.name}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<svelte:component this={usage.icon} class="h-3 w-3 {usage.color}" />
							<span class="text-sm font-semibold text-theme-text">{tag.linkCount || 0}</span>
							<span class="text-xs text-theme-text-muted">links</span>
						</div>
					</div>
				{:else}
					<p class="text-sm text-theme-text-muted text-center py-4">No tags used yet</p>
				{/each}
			</div>
		</div>

		<!-- Recently Created Tags -->
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
			<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
				<Hash class="h-5 w-5 text-purple-600 dark:text-purple-400" />
				Recently Created
			</h3>
			<div class="space-y-3">
				{#each stats().recentTags as tag}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center gap-2">
							<span class="px-2 py-1 rounded-full text-xs font-medium {getTagColorClass(tag.color)}">
								{tag.name}
							</span>
						</div>
						<p class="text-xs text-theme-text-muted">
							{new Date(tag.created).toLocaleDateString()}
						</p>
					</div>
				{:else}
					<p class="text-sm text-theme-text-muted text-center py-4">No tags created yet</p>
				{/each}
			</div>
		</div>
	</div>

	<!-- Engagement Insights -->
	<div class="bg-white dark:bg-gray-800 rounded-lg border border-theme-border p-6">
		<h3 class="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
			<Activity class="h-5 w-5 text-theme-text-muted" />
			Tag Performance Insights
		</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="text-center">
				<p class="text-3xl font-bold text-theme-text">{((stats().usedTags / stats().totalTags) * 100).toFixed(0)}%</p>
				<p class="text-sm text-theme-text-muted mt-1">Tag Utilization Rate</p>
			</div>
			<div class="text-center">
				<p class="text-3xl font-bold text-theme-text">{stats().avgEngagement}%</p>
				<p class="text-sm text-theme-text-muted mt-1">Average Engagement</p>
			</div>
			<div class="text-center">
				<p class="text-3xl font-bold text-theme-text">
					{stats().usedTags > 0 ? Math.floor(stats().totalClicks / stats().usedTags) : 0}
				</p>
				<p class="text-sm text-theme-text-muted mt-1">Clicks per Active Tag</p>
			</div>
		</div>
	</div>
</div>