<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { CaretLeft } from '@mana/shared-icons';
	import { useLinkById } from '$lib/modules/uload/queries';
	import { authStore } from '$lib/stores/auth.svelte';
	import { RoutePage } from '$lib/components/shell';

	const ULOAD_SERVER = import.meta.env.PUBLIC_ULOAD_SERVER_URL || 'http://localhost:3070';

	let linkId = $derived($page.params.id ?? '');
	const linkQuery = $derived(useLinkById(linkId));
	const link = $derived(linkQuery.value);

	let stats = $state<{ totalClicks: number; uniqueVisitors: number } | null>(null);
	let timeline = $state<{ date: string; count: number }[]>([]);
	let devices = $state<{ deviceType: string; count: number }[]>([]);
	let referrers = $state<{ referer: string; count: number }[]>([]);
	let countries = $state<{ country: string; count: number }[]>([]);
	let loading = $state(true);
	let serverAvailable = $state(false);
	let days = $state(30);

	async function fetchAnalytics() {
		if (!authStore.isAuthenticated) {
			loading = false;
			return;
		}

		try {
			const token = await authStore.getValidToken();
			const headers = { Authorization: `Bearer ${token}` };

			const [statsRes, timelineRes, devicesRes, referrersRes, countriesRes] = await Promise.all([
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/timeline?days=${days}`, {
					headers,
				}),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/devices`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/referrers`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/countries`, { headers }),
			]);

			if (statsRes.ok) {
				stats = await statsRes.json();
				serverAvailable = true;
			}
			if (timelineRes.ok) timeline = await timelineRes.json();
			if (devicesRes.ok) devices = await devicesRes.json();
			if (referrersRes.ok) referrers = await referrersRes.json();
			if (countriesRes.ok) countries = await countriesRes.json();
		} catch {
			// Server not available — show local data only
			serverAvailable = false;
		}
		loading = false;
	}

	function changeDays(d: number) {
		days = d;
		loading = true;
		fetchAnalytics();
	}

	let maxTimelineCount = $derived(Math.max(...(timeline.map((t) => t.count) || [0]), 1));
	let totalDevices = $derived(devices.reduce((sum, d) => sum + d.count, 0) || 1);
	let totalCountries = $derived(countries.reduce((sum, c) => sum + c.count, 0) || 1);

	onMount(fetchAnalytics);
</script>

<svelte:head>
	<title>Analytics - uLoad - Mana</title>
</svelte:head>

<RoutePage appId="uload" backHref="/uload" title="Link">
	<div class="mx-auto max-w-4xl p-4">
		<!-- Header -->
		<div class="mb-6 flex items-center gap-4">
			<a href="/uload" class="rounded-lg p-2 transition-colors hover:bg-muted/5" title="Zurueck">
				<CaretLeft size={20} class="text-muted-foreground" />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-white">Analytics</h1>
				{#if link}
					<p class="mt-1 text-sm text-muted-foreground">
						<span class="font-mono text-indigo-400">/{link.shortCode}</span>
						&rarr; <span class="truncate">{link.originalUrl}</span>
					</p>
				{/if}
			</div>
		</div>

		{#if loading}
			<div class="space-y-4">
				{#each Array(4) as _}
					<div class="h-32 animate-pulse rounded-xl bg-muted/5"></div>
				{/each}
			</div>
		{:else if !link}
			<div class="rounded-xl border border-border/10 p-12 text-center">
				<p class="text-muted-foreground">Link nicht gefunden</p>
			</div>
		{:else}
			<!-- Stats Overview -->
			<div class="mb-6 grid gap-4 sm:grid-cols-4">
				<div class="rounded-xl border border-border/10 bg-muted/5 p-5">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Clicks</p>
					<p class="mt-1 text-3xl font-bold text-white">
						{stats?.totalClicks ?? link.clickCount}
					</p>
				</div>
				<div class="rounded-xl border border-border/10 bg-muted/5 p-5">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Unique</p>
					<p class="mt-1 text-3xl font-bold text-white">
						{stats?.uniqueVisitors ?? '-'}
					</p>
				</div>
				<div class="rounded-xl border border-border/10 bg-muted/5 p-5">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
					<p class="mt-1 text-3xl font-bold">
						{#if link.isActive}
							<span class="text-green-400">Aktiv</span>
						{:else}
							<span class="text-muted-foreground/70">Inaktiv</span>
						{/if}
					</p>
				</div>
				<div class="rounded-xl border border-border/10 bg-muted/5 p-5">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Erstellt</p>
					<p class="mt-1 text-lg font-bold text-white">
						{formatDate(new Date(link.createdAt))}
					</p>
				</div>
			</div>

			<!-- Link Details -->
			<div class="mb-6 rounded-xl border border-border/10 bg-muted/5 p-6">
				<h2 class="mb-4 text-lg font-semibold text-white">Link Details</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Ziel-URL</span>
						<a
							href={link.originalUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="max-w-md truncate text-indigo-400 hover:underline"
						>
							{link.originalUrl}
						</a>
					</div>
					{#if link.title}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Titel</span>
							<span class="text-white">{link.title}</span>
						</div>
					{/if}
					{#if link.utmSource || link.utmMedium || link.utmCampaign}
						<div class="border-t border-border/10 pt-3">
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
								UTM-Parameter
							</p>
							<div class="grid gap-2 sm:grid-cols-3">
								{#if link.utmSource}
									<div class="text-sm text-foreground">
										<span class="text-muted-foreground">Source:</span>
										{link.utmSource}
									</div>
								{/if}
								{#if link.utmMedium}
									<div class="text-sm text-foreground">
										<span class="text-muted-foreground">Medium:</span>
										{link.utmMedium}
									</div>
								{/if}
								{#if link.utmCampaign}
									<div class="text-sm text-foreground">
										<span class="text-muted-foreground">Campaign:</span>
										{link.utmCampaign}
									</div>
								{/if}
							</div>
						</div>
					{/if}
					{#if link.expiresAt}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Laeuft ab</span>
							<span class="text-white">{formatDate(new Date(link.expiresAt))}</span>
						</div>
					{/if}
					{#if link.maxClicks}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Max Klicks</span>
							<span class="text-white">{link.clickCount} / {link.maxClicks}</span>
						</div>
					{/if}
					{#if link.password}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Passwortgeschuetzt</span>
							<span class="text-white">Ja</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Timeline -->
			<div class="mb-6 rounded-xl border border-border/10 bg-muted/5 p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-white">Clicks ueber Zeit</h2>
					<div class="flex gap-1">
						{#each [7, 30, 90] as d}
							<button
								onclick={() => changeDays(d)}
								class="rounded-md px-3 py-1 text-xs font-medium transition-colors {days === d
									? 'bg-indigo-600 text-white'
									: 'bg-muted/10 text-muted-foreground hover:bg-muted/15'}"
							>
								{d}T
							</button>
						{/each}
					</div>
				</div>
				{#if timeline.length > 0}
					<div class="flex h-48 items-end gap-px">
						{#each timeline as day}
							<div class="group relative flex flex-1 flex-col items-center">
								<div
									class="w-full rounded-t bg-indigo-500 transition-colors hover:bg-indigo-400"
									style="height: {Math.max((day.count / maxTimelineCount) * 100, 2)}%"
								></div>
								<div
									class="pointer-events-none absolute -top-8 hidden rounded bg-muted/90 px-2 py-1 text-xs text-foreground group-hover:block"
								>
									{day.count}
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-1 flex justify-between text-xs text-muted-foreground/70">
						<span>{timeline[0]?.date}</span>
						<span>{timeline[timeline.length - 1]?.date}</span>
					</div>
				{:else if !serverAvailable}
					<div class="py-8 text-center">
						<p class="text-sm text-muted-foreground">
							Detaillierte Analytics sind verfuegbar, wenn der uLoad-Server verbunden ist.
						</p>
						<p class="mt-1 text-xs text-muted-foreground/70">
							Lokaler Click-Count: {link.clickCount}
						</p>
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Noch keine Daten fuer diesen Zeitraum
					</p>
				{/if}
			</div>

			<!-- Breakdown Grid -->
			{#if serverAvailable}
				<div class="grid gap-6 md:grid-cols-3">
					<!-- Devices -->
					<div class="rounded-xl border border-border/10 bg-muted/5 p-6">
						<h2 class="mb-4 text-lg font-semibold text-white">Geraete</h2>
						{#if devices.length > 0}
							<div class="space-y-3">
								{#each devices as d}
									<div>
										<div class="mb-1 flex items-center justify-between text-sm">
											<span class="text-foreground">{d.deviceType || 'Unbekannt'}</span>
											<span class="font-medium text-white">
												{Math.round((d.count / totalDevices) * 100)}%
											</span>
										</div>
										<div class="h-2 rounded-full bg-muted/10">
											<div
												class="h-2 rounded-full bg-indigo-500"
												style="width: {(d.count / totalDevices) * 100}%"
											></div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Keine Daten</p>
						{/if}
					</div>

					<!-- Referrers -->
					<div class="rounded-xl border border-border/10 bg-muted/5 p-6">
						<h2 class="mb-4 text-lg font-semibold text-white">Referrer</h2>
						{#if referrers.length > 0}
							<div class="space-y-2">
								{#each referrers.slice(0, 8) as r}
									<div class="flex items-center justify-between text-sm">
										<span class="max-w-[140px] truncate text-foreground">
											{r.referer || 'Direkt'}
										</span>
										<span class="font-medium tabular-nums text-white">{r.count}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Keine Daten</p>
						{/if}
					</div>

					<!-- Countries -->
					<div class="rounded-xl border border-border/10 bg-muted/5 p-6">
						<h2 class="mb-4 text-lg font-semibold text-white">Laender</h2>
						{#if countries.length > 0}
							<div class="space-y-3">
								{#each countries.slice(0, 8) as c}
									<div>
										<div class="mb-1 flex items-center justify-between text-sm">
											<span class="text-foreground">{c.country || 'Unbekannt'}</span>
											<span class="font-medium text-white">
												{Math.round((c.count / totalCountries) * 100)}%
											</span>
										</div>
										<div class="h-2 rounded-full bg-muted/10">
											<div
												class="h-2 rounded-full bg-emerald-500"
												style="width: {(c.count / totalCountries) * 100}%"
											></div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Keine Daten</p>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</RoutePage>
