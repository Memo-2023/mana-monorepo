<script lang="ts">
	import { onMount } from 'svelte';

	const NEWS_SERVER = import.meta.env.PUBLIC_NEWS_SERVER_URL || 'http://localhost:3071';

	let articles = $state<Record<string, unknown>[]>([]);
	let loading = $state(true);
	let selectedType = $state<string>('');

	async function loadArticles() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (selectedType) params.set('type', selectedType);
			params.set('limit', '30');
			const res = await fetch(`${NEWS_SERVER}/api/v1/feed?${params}`);
			if (res.ok) articles = await res.json();
		} catch {
			// Server offline
		}
		loading = false;
	}

	function changeType(type: string) {
		selectedType = type;
		loadArticles();
	}

	onMount(loadArticles);
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Feed</h1>
		<div class="flex gap-1">
			{#each [{ value: '', label: 'Alle' }, { value: 'feed', label: 'News' }, { value: 'summary', label: 'Summaries' }, { value: 'in_depth', label: 'In-Depth' }] as tab}
				<button
					onclick={() => changeType(tab.value)}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {selectedType ===
					tab.value
						? 'bg-emerald-600 text-white'
						: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each Array(5) as _}
				<div class="h-24 animate-pulse rounded-xl bg-gray-800"></div>
			{/each}
		</div>
	{:else if articles.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
			<p class="text-lg font-medium text-gray-400">Noch keine Artikel im Feed</p>
			<p class="mt-1 text-sm text-gray-500">
				AI-kuratierte Nachrichten erscheinen hier automatisch.
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each articles as article}
				<a
					href="/feed/{article.id}"
					class="block rounded-xl border border-gray-800 bg-gray-900 p-5 transition-all hover:border-gray-700 hover:bg-gray-800/80"
				>
					<div class="flex gap-4">
						{#if article.imageUrl}
							<img
								src={String(article.imageUrl)}
								alt=""
								class="h-20 w-28 shrink-0 rounded-lg object-cover"
							/>
						{/if}
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								{#if article.type === 'summary'}
									<span class="rounded bg-blue-900 px-1.5 py-0.5 text-xs text-blue-300"
										>Summary</span
									>
								{:else if article.type === 'in_depth'}
									<span class="rounded bg-purple-900 px-1.5 py-0.5 text-xs text-purple-300"
										>In-Depth</span
									>
								{/if}
								{#if article.readingTimeMinutes}
									<span class="text-xs text-gray-500">{article.readingTimeMinutes} Min.</span>
								{/if}
							</div>
							<h2 class="truncate text-lg font-semibold text-gray-100">{article.title}</h2>
							{#if article.excerpt}
								<p class="mt-1 line-clamp-2 text-sm text-gray-400">{article.excerpt}</p>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
