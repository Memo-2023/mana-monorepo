<script lang="ts">
	/**
	 * BroadcastsWidget — YTD Counts + letzte versendete Kampagne +
	 * nächste geplante.
	 *
	 * Rein lokal aus Dexie; keine Server-Rundreise (Stats im liveQuery
	 * sind aus dem letzten DetailView-Poll heraus gespiegelt).
	 */

	import { liveQuery } from 'dexie';
	import { campaignTable } from '$lib/modules/broadcast/collections';
	import { decryptRecords } from '$lib/data/crypto';
	import { toCampaign, computeStats, formatRate } from '$lib/modules/broadcast/queries';
	import type { Campaign, LocalCampaign } from '$lib/modules/broadcast/types';

	let campaigns = $state<Campaign[]>([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const rows = await campaignTable.toArray();
			const visible = rows.filter((r) => !r.deletedAt);
			const decrypted = (await decryptRecords('broadcastCampaigns', visible)) as LocalCampaign[];
			return decrypted.map(toCampaign);
		}).subscribe({
			next: (result) => {
				campaigns = result;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const currentYear = new Date().getFullYear();
	const stats = $derived(computeStats(campaigns, currentYear));

	/** Latest sent campaign — top of mind for "how did my last one do?". */
	const lastSent = $derived(
		campaigns
			.filter((c) => c.status === 'sent')
			.sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0]
	);

	/** Next scheduled — "what's about to go out". */
	const nextScheduled = $derived(
		campaigns
			.filter((c) => c.status === 'scheduled' && c.scheduledAt)
			.sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))[0]
	);

	const lastOpenRate = $derived(
		lastSent?.stats && lastSent.stats.sent > 0 ? lastSent.stats.opened / lastSent.stats.sent : null
	);
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span aria-hidden="true">📣</span>
			Broadcasts
		</h3>
		<a href="/broadcasts" class="text-xs text-muted-foreground hover:text-foreground"> Alle → </a>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(2) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if campaigns.length === 0}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Noch keine Kampagnen.</p>
			<a
				href="/broadcasts/new"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Erste Kampagne
			</a>
		</div>
	{:else}
		<div class="mb-3 grid grid-cols-2 gap-2">
			<div class="rounded-lg bg-surface-hover p-2.5">
				<div class="text-xs text-muted-foreground">Versendet {currentYear}</div>
				<div class="text-lg font-semibold tabular-nums">{stats.sentThisYear}</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2.5">
				<div class="text-xs text-muted-foreground">Ø Öffnung</div>
				<div class="text-lg font-semibold tabular-nums">
					{formatRate(stats.avgOpenRate)}
				</div>
			</div>
		</div>

		{#if nextScheduled}
			<a
				href="/broadcasts/{nextScheduled.id}"
				class="mb-2 block rounded-lg p-2 transition-colors hover:bg-surface-hover"
			>
				<div class="flex items-center justify-between">
					<div class="min-w-0 flex-1">
						<div class="text-xs text-muted-foreground">Als nächstes</div>
						<div class="truncate text-sm font-medium">{nextScheduled.name}</div>
					</div>
					<div class="ml-2 text-xs text-muted-foreground">
						{new Date(nextScheduled.scheduledAt ?? '').toLocaleDateString()}
					</div>
				</div>
			</a>
		{/if}

		{#if lastSent}
			<a
				href="/broadcasts/{lastSent.id}"
				class="block rounded-lg p-2 transition-colors hover:bg-surface-hover"
			>
				<div class="flex items-center justify-between">
					<div class="min-w-0 flex-1">
						<div class="text-xs text-muted-foreground">Zuletzt versendet</div>
						<div class="truncate text-sm font-medium">{lastSent.name}</div>
					</div>
					{#if lastOpenRate !== null}
						<div class="ml-2 text-sm font-medium tabular-nums">
							{formatRate(lastOpenRate)} 👀
						</div>
					{/if}
				</div>
			</a>
		{/if}

		{#if !lastSent && !nextScheduled}
			<p class="py-4 text-center text-sm text-muted-foreground">
				{stats.totalByStatus.draft} Entwurf{stats.totalByStatus.draft === 1 ? '' : 'e'} in Arbeit.
			</p>
		{/if}
	{/if}
</div>
