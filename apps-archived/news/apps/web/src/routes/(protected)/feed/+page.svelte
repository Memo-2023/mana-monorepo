<script lang="ts">
	import { onMount } from 'svelte';
	import { articlesApi } from '$lib/services/api';
	import { authStore } from '$lib/stores/auth.svelte';

	let articles = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		const { data, error: apiError } = await articlesApi.getArticles(
			{ type: 'feed', limit: 20 },
			authStore.session?.token
		);

		if (apiError) {
			error = apiError;
		} else if (data) {
			articles = data;
		}

		loading = false;
	});
</script>

<svelte:head>
	<title>Feed - News Hub</title>
</svelte:head>

<div class="p-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">Feed</h1>
		<p class="text-text-secondary mt-1">Aktuelle Nachrichten im Überblick</p>
	</header>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
			></div>
		</div>
	{:else if error}
		<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
			{error}
		</div>
	{:else if articles.length === 0}
		<div class="text-center py-12">
			<svg
				class="w-16 h-16 text-text-muted mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
				/>
			</svg>
			<p class="text-text-secondary">Noch keine Artikel vorhanden</p>
			<p class="text-text-muted text-sm mt-1">
				Artikel werden automatisch generiert und erscheinen hier
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each articles as article}
				<article
					class="p-4 bg-background-card border border-border rounded-lg hover:border-border-hover transition-colors"
				>
					<a href="/article/{article.id}" class="block">
						<h2 class="font-semibold text-lg hover:text-primary transition-colors">
							{article.title}
						</h2>
						{#if article.summary}
							<p class="text-text-secondary mt-2 line-clamp-2">
								{article.summary}
							</p>
						{/if}
						<div class="flex items-center gap-4 mt-3 text-sm text-text-muted">
							{#if article.category}
								<span class="px-2 py-1 bg-primary/10 text-primary rounded">
									{article.category.name}
								</span>
							{/if}
							{#if article.createdAt}
								<span>{new Date(article.createdAt).toLocaleDateString('de-DE')}</span>
							{/if}
						</div>
					</a>
				</article>
			{/each}
		</div>
	{/if}
</div>
