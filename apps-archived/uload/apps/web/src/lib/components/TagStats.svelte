<script lang="ts">
	import type { Tag } from '$lib/pocketbase';
	import { BarChart3, TrendingUp, Hash, MousePointer, Activity, Calendar } from 'lucide-svelte';

	interface Props {
		tags: (Tag & { linkCount?: number; totalClicks?: number; usage_count?: number })[];
	}

	let { tags }: Props = $props();

	let totalTags = $derived(tags.length);
	let totalClicks = $derived(tags.reduce((sum, tag) => sum + (tag.totalClicks || 0), 0));
	let totalLinks = $derived(tags.reduce((sum, tag) => sum + (tag.linkCount || 0), 0));
	let averageLinksPerTag = $derived(totalTags > 0 ? (totalLinks / totalTags).toFixed(1) : '0');
	let mostUsedTag = $derived(
		tags.reduce(
			(max, tag) => ((tag.usage_count || 0) > (max?.usage_count || 0) ? tag : max),
			tags[0]
		)
	);
	let mostClickedTag = $derived(
		tags.reduce(
			(max, tag) => ((tag.totalClicks || 0) > (max?.totalClicks || 0) ? tag : max),
			tags[0]
		)
	);

	let topTagsByClicks = $derived(
		[...tags].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0)).slice(0, 10)
	);

	let topTagsByLinks = $derived(
		[...tags].sort((a, b) => (b.linkCount || 0) - (a.linkCount || 0)).slice(0, 10)
	);

	let maxClicks = $derived(Math.max(...topTagsByClicks.map((t) => t.totalClicks || 0), 1));
	let maxLinks = $derived(Math.max(...topTagsByLinks.map((t) => t.linkCount || 0), 1));

	function formatNumber(num: number): string {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	}

	function calculateCTR(tag: any): string {
		if (!tag.linkCount || tag.linkCount === 0) return '0%';
		const ctr = ((tag.totalClicks || 0) / tag.linkCount) * 100;
		return `${ctr.toFixed(1)}%`;
	}
</script>

<div class="space-y-6">
	<!-- Übersichts-Karten -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-theme-text-muted">Gesamt Tags</p>
					<p class="mt-2 text-3xl font-bold text-theme-text">{totalTags}</p>
				</div>
				<div class="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
					<Hash class="h-6 w-6 text-blue-600 dark:text-blue-400" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-theme-text-muted">Gesamt Klicks</p>
					<p class="mt-2 text-3xl font-bold text-theme-text">{formatNumber(totalClicks)}</p>
				</div>
				<div class="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
					<MousePointer class="h-6 w-6 text-green-600 dark:text-green-400" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-theme-text-muted">Ø Links/Tag</p>
					<p class="mt-2 text-3xl font-bold text-theme-text">{averageLinksPerTag}</p>
				</div>
				<div class="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
					<Activity class="h-6 w-6 text-purple-600 dark:text-purple-400" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-theme-text-muted">Top Tag</p>
					{#if mostClickedTag}
						<p class="mt-2 truncate text-lg font-bold text-theme-text">{mostClickedTag.name}</p>
						<p class="text-xs text-theme-text-muted">
							{formatNumber(mostClickedTag.totalClicks || 0)} Klicks
						</p>
					{:else}
						<p class="mt-2 text-lg text-theme-text-muted">-</p>
					{/if}
				</div>
				<div class="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
					<TrendingUp class="h-6 w-6 text-orange-600 dark:text-orange-400" />
				</div>
			</div>
		</div>
	</div>

	<!-- Visualisierungen -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Top Tags nach Klicks -->
		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-theme-text">Top 10 Tags nach Klicks</h3>
				<BarChart3 class="h-5 w-5 text-theme-text-muted" />
			</div>
			<div class="space-y-3">
				{#each topTagsByClicks as tag, index}
					<div class="flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-theme-surface-hover text-sm font-medium text-theme-text"
						>
							{index + 1}
						</div>
						<div class="flex-1">
							<div class="mb-1 flex items-center justify-between">
								<span class="max-w-[200px] truncate text-sm font-medium text-theme-text">
									{tag.name}
								</span>
								<span class="text-sm text-theme-text-muted">
									{formatNumber(tag.totalClicks || 0)}
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-theme-surface-hover">
								<div
									class="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
									style="width: {((tag.totalClicks || 0) / maxClicks) * 100}%"
								></div>
							</div>
						</div>
					</div>
				{/each}
				{#if topTagsByClicks.length === 0}
					<p class="text-center text-theme-text-muted">Keine Daten verfügbar</p>
				{/if}
			</div>
		</div>

		<!-- Top Tags nach Links -->
		<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-theme-text">Top 10 Tags nach Links</h3>
				<Activity class="h-5 w-5 text-theme-text-muted" />
			</div>
			<div class="space-y-3">
				{#each topTagsByLinks as tag, index}
					<div class="flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-theme-surface-hover text-sm font-medium text-theme-text"
						>
							{index + 1}
						</div>
						<div class="flex-1">
							<div class="mb-1 flex items-center justify-between">
								<span class="max-w-[200px] truncate text-sm font-medium text-theme-text">
									{tag.name}
								</span>
								<span class="text-sm text-theme-text-muted">
									{tag.linkCount || 0} Links
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-theme-surface-hover">
								<div
									class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
									style="width: {((tag.linkCount || 0) / maxLinks) * 100}%"
								></div>
							</div>
						</div>
					</div>
				{/each}
				{#if topTagsByLinks.length === 0}
					<p class="text-center text-theme-text-muted">Keine Daten verfügbar</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Detaillierte Tabelle -->
	<div class="overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-md">
		<div class="border-b border-theme-border bg-theme-surface-hover px-6 py-4">
			<h3 class="text-lg font-semibold text-theme-text">Detaillierte Tag-Statistiken</h3>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="border-b border-theme-border bg-theme-surface-hover">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Tag
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Links
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Klicks
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							CTR
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Verwendungen
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-text"
						>
							Erstellt
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-theme-border">
					{#each tags as tag}
						<tr class="transition-colors hover:bg-theme-surface-hover">
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded-full" style="background-color: {tag.color}"></div>
									<span class="font-medium text-theme-text">{tag.name}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-theme-text">
								{tag.linkCount || 0}
							</td>
							<td class="px-6 py-4 text-theme-text">
								{formatNumber(tag.totalClicks || 0)}
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
								>
									{calculateCTR(tag)}
								</span>
							</td>
							<td class="px-6 py-4 text-theme-text">
								{tag.usage_count || 0}
							</td>
							<td class="px-6 py-4">
								{#if tag.is_public}
									<span
										class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
									>
										Öffentlich
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
									>
										Privat
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-theme-text-muted">
								{new Date(tag.created).toLocaleDateString('de-DE')}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if tags.length === 0}
				<div class="px-6 py-12 text-center">
					<p class="text-theme-text-muted">Keine Tags vorhanden</p>
				</div>
			{/if}
		</div>
	</div>
</div>
