<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { linkCollection } from '$lib/data/local-store';
	import { authStore } from '$lib/stores/auth.svelte';

	const ULOAD_SERVER = import.meta.env.PUBLIC_ULOAD_SERVER_URL || 'http://localhost:3070';

	let linkId = $derived($page.params.id ?? '');
	let link = useLiveQuery(() => (linkId ? linkCollection.get(linkId) : undefined));

	let stats = $state<{ totalClicks: number; uniqueVisitors: number } | null>(null);
	let timeline = $state<{ date: string; count: number }[]>([]);
	let devices = $state<{ deviceType: string; count: number }[]>([]);
	let referrers = $state<{ referer: string; count: number }[]>([]);
	let countries = $state<{ country: string; count: number }[]>([]);
	let loading = $state(true);
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
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/timeline?days=${days}`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/devices`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/referrers`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/countries`, { headers }),
			]);

			if (statsRes.ok) stats = await statsRes.json();
			if (timelineRes.ok) timeline = await timelineRes.json();
			if (devicesRes.ok) devices = await devicesRes.json();
			if (referrersRes.ok) referrers = await referrersRes.json();
			if (countriesRes.ok) countries = await countriesRes.json();
		} catch {
			// Analytics not available
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

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-4">
		<a
			href="/my/links"
			class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
			title="Zurück"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<div>
			<h1 class="text-3xl font-bold">Analytics</h1>
			{#if link.value}
				<p class="mt-1 text-sm opacity-60">
					<span class="font-mono text-indigo-600">/{link.value.shortCode}</span>
					→ <span class="truncate">{link.value.originalUrl}</span>
				</p>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each Array(4) as _}
				<div class="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
			{/each}
		</div>
	{:else if !authStore.isAuthenticated}
		<div
			class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
		>
			<p class="text-lg font-medium opacity-60">Analytics nur für angemeldete Nutzer</p>
			<p class="mt-2 text-sm opacity-40">Lokale Click-Counts: {link.value?.clickCount ?? 0}</p>
			<a
				href="/login"
				class="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>Anmelden</a
			>
		</div>
	{:else}
		<!-- Stats Overview -->
		<div class="mb-6 grid gap-4 sm:grid-cols-4">
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Clicks</p>
				<p class="mt-1 text-3xl font-bold">{stats?.totalClicks ?? link.value?.clickCount ?? 0}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Unique</p>
				<p class="mt-1 text-3xl font-bold">{stats?.uniqueVisitors ?? '-'}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Status</p>
				<p class="mt-1 text-3xl font-bold">{link.value?.isActive ? '🟢' : '🔴'}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Erstellt</p>
				<p class="mt-1 text-lg font-bold">
					{link.value?.createdAt ? new Date(link.value.createdAt).toLocaleDateString('de') : '-'}
				</p>
			</div>
		</div>

		<!-- Timeline -->
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Clicks über Zeit</h2>
				<div class="flex gap-1">
					{#each [7, 30, 90] as d}
						<button
							onclick={() => changeDays(d)}
							class="rounded-md px-3 py-1 text-xs font-medium transition-colors {days === d
								? 'bg-indigo-600 text-white'
								: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}"
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
								class="pointer-events-none absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block"
							>
								{day.count}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-xs opacity-40">
					<span>{timeline[0]?.date}</span>
					<span>{timeline[timeline.length - 1]?.date}</span>
				</div>
			{:else}
				<p class="py-8 text-center text-sm opacity-40">Noch keine Daten für diesen Zeitraum</p>
			{/if}
		</div>

		<!-- Breakdown Grid -->
		<div class="grid gap-6 md:grid-cols-3">
			<!-- Devices -->
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<h2 class="mb-4 text-lg font-semibold">Geräte</h2>
				{#if devices.length > 0}
					<div class="space-y-3">
						{#each devices as d}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span>{d.deviceType || 'Unbekannt'}</span>
									<span class="font-medium">{Math.round((d.count / totalDevices) * 100)}%</span>
								</div>
								<div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
									<div
										class="h-2 rounded-full bg-indigo-500"
										style="width: {(d.count / totalDevices) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm opacity-40">Keine Daten</p>
				{/if}
			</div>

			<!-- Referrers -->
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<h2 class="mb-4 text-lg font-semibold">Referrer</h2>
				{#if referrers.length > 0}
					<div class="space-y-2">
						{#each referrers.slice(0, 8) as r}
							<div class="flex items-center justify-between text-sm">
								<span class="max-w-[140px] truncate">{r.referer || 'Direkt'}</span>
								<span class="font-medium tabular-nums">{r.count}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm opacity-40">Keine Daten</p>
				{/if}
			</div>

			<!-- Countries -->
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<h2 class="mb-4 text-lg font-semibold">Länder</h2>
				{#if countries.length > 0}
					<div class="space-y-3">
						{#each countries.slice(0, 8) as c}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span>{c.country || 'Unbekannt'}</span>
									<span class="font-medium">{Math.round((c.count / totalCountries) * 100)}%</span>
								</div>
								<div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
									<div
										class="h-2 rounded-full bg-emerald-500"
										style="width: {(c.count / totalCountries) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm opacity-40">Keine Daten</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
