<script lang="ts">
	import { page } from '$app/stores';
	import { CaretLeft } from '@manacore/shared-icons';
	import { useLinkById } from '$lib/modules/uload/queries';

	let linkId = $derived($page.params.id ?? '');
	const linkQuery = $derived(useLinkById(linkId));
	const link = $derived(linkQuery.value);

	// Analytics are server-side only; in the unified app we show local data
	// and a placeholder for server analytics when available.
	let days = $state(30);

	function changeDays(d: number) {
		days = d;
	}
</script>

<svelte:head>
	<title>Analytics - uLoad - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-4">
		<a
			href="/uload"
			class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
			title="Zurueck"
		>
			<CaretLeft size={20} />
		</a>
		<div>
			<h1 class="text-3xl font-bold">Analytics</h1>
			{#if link}
				<p class="mt-1 text-sm opacity-60">
					<span class="font-mono text-indigo-600">/{link.shortCode}</span>
					&rarr; <span class="truncate">{link.originalUrl}</span>
				</p>
			{/if}
		</div>
	</div>

	{#if !link}
		<div class="space-y-4">
			{#each Array(4) as _}
				<div class="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
			{/each}
		</div>
	{:else}
		<!-- Stats Overview -->
		<div class="mb-6 grid gap-4 sm:grid-cols-4">
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Clicks</p>
				<p class="mt-1 text-3xl font-bold">{link.clickCount}</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Status</p>
				<p class="mt-1 text-3xl font-bold">
					{#if link.isActive}
						<span class="text-green-500">Aktiv</span>
					{:else}
						<span class="text-gray-400">Inaktiv</span>
					{/if}
				</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Erstellt</p>
				<p class="mt-1 text-lg font-bold">
					{new Date(link.createdAt).toLocaleDateString('de')}
				</p>
			</div>
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-xs font-medium uppercase tracking-wider opacity-50">Short URL</p>
				<p class="mt-1 truncate font-mono text-sm text-indigo-600">
					ulo.ad/{link.shortCode}
				</p>
			</div>
		</div>

		<!-- Link Details -->
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-lg font-semibold">Link Details</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between text-sm">
					<span class="opacity-60">Ziel-URL</span>
					<a
						href={link.originalUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="max-w-md truncate text-indigo-600 hover:underline"
					>
						{link.originalUrl}
					</a>
				</div>
				{#if link.title}
					<div class="flex items-center justify-between text-sm">
						<span class="opacity-60">Titel</span>
						<span>{link.title}</span>
					</div>
				{/if}
				{#if link.utmSource || link.utmMedium || link.utmCampaign}
					<div class="border-t border-gray-100 pt-3 dark:border-gray-700">
						<p class="mb-2 text-xs font-medium uppercase tracking-wider opacity-50">
							UTM-Parameter
						</p>
						<div class="grid gap-2 sm:grid-cols-3">
							{#if link.utmSource}
								<div class="text-sm">
									<span class="opacity-50">Source:</span>
									{link.utmSource}
								</div>
							{/if}
							{#if link.utmMedium}
								<div class="text-sm">
									<span class="opacity-50">Medium:</span>
									{link.utmMedium}
								</div>
							{/if}
							{#if link.utmCampaign}
								<div class="text-sm">
									<span class="opacity-50">Campaign:</span>
									{link.utmCampaign}
								</div>
							{/if}
						</div>
					</div>
				{/if}
				{#if link.expiresAt}
					<div class="flex items-center justify-between text-sm">
						<span class="opacity-60">Laeuft ab</span>
						<span>{new Date(link.expiresAt).toLocaleDateString('de')}</span>
					</div>
				{/if}
				{#if link.maxClicks}
					<div class="flex items-center justify-between text-sm">
						<span class="opacity-60">Max Klicks</span>
						<span>{link.clickCount} / {link.maxClicks}</span>
					</div>
				{/if}
				{#if link.password}
					<div class="flex items-center justify-between text-sm">
						<span class="opacity-60">Passwortgeschuetzt</span>
						<span>Ja</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Timeline Placeholder -->
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Clicks ueber Zeit</h2>
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
			<div class="py-8 text-center">
				<p class="text-sm opacity-40">
					Detaillierte Analytics sind verfuegbar, wenn der uLoad-Server verbunden ist.
				</p>
				<p class="mt-1 text-xs opacity-30">
					Lokaler Click-Count: {link.clickCount}
				</p>
			</div>
		</div>
	{/if}
</div>
