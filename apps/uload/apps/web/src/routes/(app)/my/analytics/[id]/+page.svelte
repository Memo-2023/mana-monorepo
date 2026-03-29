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
	let loading = $state(true);

	async function fetchAnalytics() {
		if (!authStore.isAuthenticated) {
			loading = false;
			return;
		}

		try {
			const token = await authStore.getValidToken();
			const headers = { Authorization: `Bearer ${token}` };

			const [statsRes, timelineRes, devicesRes, referrersRes] = await Promise.all([
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/timeline?days=30`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/devices`, { headers }),
				fetch(`${ULOAD_SERVER}/api/v1/analytics/${linkId}/referrers`, { headers }),
			]);

			if (statsRes.ok) stats = await statsRes.json();
			if (timelineRes.ok) timeline = await timelineRes.json();
			if (devicesRes.ok) devices = await devicesRes.json();
			if (referrersRes.ok) referrers = await referrersRes.json();
		} catch {
			// Analytics not available (server offline or guest mode)
		}
		loading = false;
	}

	onMount(fetchAnalytics);
</script>

<div class="mx-auto max-w-4xl">
	{#if link.value}
		<div class="mb-6">
			<h1 class="text-3xl font-bold">Analytics</h1>
			<p class="mt-1 text-sm opacity-60">
				<span class="font-mono text-indigo-600">/{link.value.shortCode}</span>
				→ {link.value.originalUrl}
			</p>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
			{/each}
		</div>
	{:else if !authStore.isAuthenticated}
		<div
			class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
		>
			<p class="text-lg font-medium opacity-60">Analytics nur für angemeldete Nutzer</p>
			<p class="mt-1 text-sm opacity-40">Lokale Click-Counts: {link.value?.clickCount ?? 0}</p>
			<a
				href="/login"
				class="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>Anmelden</a
			>
		</div>
	{:else}
		<!-- Stats Overview -->
		<div class="mb-6 grid gap-4 sm:grid-cols-3">
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm opacity-60">Total Clicks</p>
				<p class="text-3xl font-bold">{stats?.totalClicks ?? link.value?.clickCount ?? 0}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm opacity-60">Unique Visitors</p>
				<p class="text-3xl font-bold">{stats?.uniqueVisitors ?? '-'}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm opacity-60">Status</p>
				<p class="text-3xl font-bold">{link.value?.isActive ? '🟢 Aktiv' : '🔴 Inaktiv'}</p>
			</div>
		</div>

		<!-- Timeline -->
		{#if timeline.length > 0}
			<div
				class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<h2 class="mb-4 text-lg font-semibold">Clicks (30 Tage)</h2>
				<div class="flex h-40 items-end gap-1">
					{#each timeline as day}
						{@const maxCount = Math.max(...timeline.map((t) => t.count), 1)}
						<div class="flex flex-1 flex-col items-center gap-1">
							<div
								class="w-full rounded-t bg-indigo-500"
								style="height: {(day.count / maxCount) * 100}%"
								title="{day.date}: {day.count} clicks"
							></div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Devices & Referrers -->
		<div class="grid gap-6 md:grid-cols-2">
			{#if devices.length > 0}
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
				>
					<h2 class="mb-4 text-lg font-semibold">Geräte</h2>
					<div class="space-y-2">
						{#each devices as d}
							<div class="flex items-center justify-between text-sm">
								<span>{d.deviceType || 'Unbekannt'}</span>
								<span class="font-medium">{d.count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if referrers.length > 0}
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
				>
					<h2 class="mb-4 text-lg font-semibold">Referrer</h2>
					<div class="space-y-2">
						{#each referrers as r}
							<div class="flex items-center justify-between text-sm">
								<span class="truncate">{r.referer || 'Direkt'}</span>
								<span class="font-medium">{r.count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
