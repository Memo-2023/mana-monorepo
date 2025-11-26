<script lang="ts">
	import type { PageData } from './$types';
	import {
		generateQRCodeURL,
		downloadQRCode,
		type QRCodeColor,
		type QRCodeFormat
	} from '$lib/qrcode';
	import { trackEvent, EVENTS } from '$lib/analytics';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let showQRCode = $state(false);
	let qrColor: QRCodeColor = $state('black');
	let qrFormat: QRCodeFormat = $state('png');

	onMount(() => {
		// Track analytics page view
		trackEvent(EVENTS.ANALYTICS_VIEWED, {
			short_code: data.link.short_code,
			total_clicks: String(data.totalClicks)
		});
	});

	function formatUrl(url: string) {
		if (typeof window === 'undefined') return url;
		return `${window.location.origin}/${url}`;
	}

	function downloadQR() {
		const url = formatUrl(data.link.short_code);
		downloadQRCode(url, `qrcode-${data.link.short_code}`, 400, qrColor, qrFormat);
	}

	function getBrowserFromUserAgent(userAgent: string): string {
		if (!userAgent) return 'Unknown';
		if (userAgent.includes('Chrome')) return 'Chrome';
		if (userAgent.includes('Firefox')) return 'Firefox';
		if (userAgent.includes('Safari')) return 'Safari';
		if (userAgent.includes('Edge')) return 'Edge';
		if (userAgent.includes('Opera')) return 'Opera';
		return 'Other';
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Link Analytics</h1>
					<p class="mt-1 text-sm text-gray-600">{data.link.title || 'Untitled Link'}</p>
				</div>
				<a href="/my" class="text-sm text-blue-600 hover:text-blue-800">
					← Back to Dashboard
				</a>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Short URL</h3>
					<p class="text-lg font-medium text-blue-600">{formatUrl(data.link.short_code)}</p>
				</div>
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Original URL</h3>
					<p class="truncate text-lg text-gray-900">{data.link.original_url}</p>
				</div>
			</div>

			<div class="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
				<div>
					<h3 class="mb-1 text-sm font-medium text-gray-500">Total Clicks</h3>
					<p class="text-2xl font-bold text-gray-900">{data.totalClicks}</p>
				</div>
				<div>
					<h3 class="mb-1 text-sm font-medium text-gray-500">Status</h3>
					<p class="text-lg">
						{#if data.link.is_active}
							<span class="text-green-600">Active</span>
						{:else}
							<span class="text-red-600">Inactive</span>
						{/if}
					</p>
				</div>
				<div>
					<h3 class="mb-1 text-sm font-medium text-gray-500">Created</h3>
					<p class="text-lg">{new Date(data.link.created).toLocaleDateString()}</p>
				</div>
				<div>
					<h3 class="mb-1 text-sm font-medium text-gray-500">Features</h3>
					<div class="flex gap-2">
						{#if data.link.password}
							<span class="rounded bg-red-100 px-2 py-1 text-xs text-red-700">🔒 Protected</span>
						{/if}
						{#if data.link.expires_at}
							<span class="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">⏰ Expires</span
							>
						{/if}
						{#if data.link.max_clicks}
							<span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">🔢 Limited</span
							>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">QR Code</h2>
				<button
					onclick={() => (showQRCode = !showQRCode)}
					class="text-sm text-purple-600 hover:text-purple-800"
				>
					{showQRCode ? 'Hide' : 'Show'} QR Code
				</button>
			</div>
			{#if showQRCode}
				<div class="flex flex-col items-center gap-4">
					<img
						src={generateQRCodeURL(formatUrl(data.link.short_code), 250, qrColor, 'png')}
						alt="QR Code for {data.link.short_code}"
						class="rounded border-2 border-gray-300 p-3"
						style="background: {qrColor === 'white'
							? '#000'
							: qrColor === 'gold'
								? '#000'
								: '#fff'}"
					/>

					<div class="flex gap-6">
						<div>
							<span class="mb-2 block text-sm font-medium text-gray-700">QR Code Color</span>
							<div class="flex gap-2" role="group" aria-label="QR Code Color">
								<button
									onclick={() => (qrColor = 'black')}
									class="h-10 w-10 rounded border-2 bg-black {qrColor === 'black'
										? 'border-blue-500 ring-2 ring-blue-200'
										: 'border-gray-300'}"
									aria-label="Black color"
								></button>
								<button
									onclick={() => (qrColor = 'white')}
									class="h-10 w-10 rounded border-2 bg-white {qrColor === 'white'
										? 'border-blue-500 ring-2 ring-blue-200'
										: 'border-gray-300'}"
									aria-label="White color"
								></button>
								<button
									onclick={() => (qrColor = 'gold')}
									class="h-10 w-10 rounded border-2 {qrColor === 'gold'
										? 'border-blue-500 ring-2 ring-blue-200'
										: 'border-gray-300'}"
									style="background: #f8d62b"
									aria-label="Gold color"
								></button>
							</div>
						</div>

						<div>
							<label for="format" class="mb-2 block text-sm font-medium text-gray-700"
								>Download Format</label
							>
							<select
								id="format"
								bind:value={qrFormat}
								class="rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							>
								<option value="png">PNG (High Quality)</option>
								<option value="svg">SVG (Vector)</option>
								<option value="jpg">JPG (Compressed)</option>
							</select>
						</div>
					</div>

					<div class="flex gap-2">
						<button
							onclick={() => downloadQR()}
							class="rounded-md bg-purple-600 px-6 py-2 text-white transition duration-200 hover:bg-purple-700"
						>
							Download as {qrFormat.toUpperCase()}
						</button>
						<button
							onclick={() => navigator.clipboard.writeText(formatUrl(data.link.short_code))}
							class="rounded-md bg-gray-600 px-6 py-2 text-white transition duration-200 hover:bg-gray-700"
						>
							Copy URL
						</button>
					</div>

					<p class="mt-2 text-center text-sm text-gray-600">
						Scan this QR code to access the short link directly
					</p>
				</div>
			{/if}
		</div>

		<div class="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Browser Distribution</h2>
				{#if data.browserStats.length > 0}
					<div class="space-y-3">
						{#each data.browserStats as [browser, count]}
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700">{browser}</span>
								<div class="flex items-center gap-2">
									<div class="h-2 w-32 rounded-full bg-gray-200">
										<div
											class="h-2 rounded-full bg-blue-600"
											style="width: {(count / data.totalClicks) * 100}%"
										></div>
									</div>
									<span class="w-12 text-right text-sm text-gray-600">{count}</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No data yet</p>
				{/if}
			</div>

			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Device Types</h2>
				{#if data.deviceStats.length > 0}
					<div class="space-y-3">
						{#each data.deviceStats as [device, count]}
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700 capitalize">{device}</span>
								<div class="flex items-center gap-2">
									<div class="h-2 w-32 rounded-full bg-gray-200">
										<div
											class="h-2 rounded-full bg-green-600"
											style="width: {(count / data.totalClicks) * 100}%"
										></div>
									</div>
									<span class="w-12 text-right text-sm text-gray-600">{count}</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No data yet</p>
				{/if}
			</div>
		</div>

		<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Top Referrers</h2>
			{#if data.refererStats.length > 0}
				<div class="space-y-2">
					{#each data.refererStats as [referrer, count]}
						<div class="flex items-center justify-between border-b py-2 last:border-0">
							<span class="text-sm text-gray-700">{referrer}</span>
							<span class="text-sm text-gray-600">{count} clicks</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-500">No referrer data yet</p>
			{/if}
		</div>

		<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Clicks by Day</h2>
			{#if data.clicksByDay.length > 0}
				<div class="overflow-x-auto">
					<div class="flex min-w-max gap-2">
						{#each data.clicksByDay as [day, count]}
							<div class="flex flex-col items-center">
								<div
									class="w-8 rounded-t bg-blue-600"
									style="height: {Math.max(
										20,
										(count / Math.max(...data.clicksByDay.map((d) => d[1] as number))) * 100
									)}px"
									title="{count} clicks"
								></div>
								<span class="mt-1 origin-left rotate-45 text-xs text-gray-600">{day}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-gray-500">No daily data yet</p>
			{/if}
		</div>

		<div class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Recent Clicks</h2>
			{#if data.recentClicks.length > 0}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th
								>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
									>Browser</th
								>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
									>Device</th
								>
								<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
									>Referrer</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each data.recentClicks as click}
								<tr>
									<td class="px-4 py-2 text-sm text-gray-900">
										{new Date(click.created).toLocaleString()}
									</td>
									<td class="px-4 py-2 text-sm text-gray-900">{getBrowserFromUserAgent(click.user_agent) || 'Unknown'}</td>
									<td class="px-4 py-2 text-sm text-gray-900 capitalize"
										>{click.device || 'Unknown'}</td
									>
									<td class="px-4 py-2 text-sm text-gray-900">
										{#if click.referer}
											{@const url = new URL(click.referer)}
											{url.hostname}
										{:else}
											Direct
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-gray-500">No clicks yet</p>
			{/if}
		</div>
	</div>
</div>
