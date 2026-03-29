<script lang="ts">
	import { onMount } from 'svelte';
	import { articlesApi } from '$lib/services/api';
	import { authStore } from '$lib/stores/auth.svelte';

	let articles = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		const { data, error: apiError } = await articlesApi.getArticles(
			{ type: 'in_depth', limit: 20 },
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
	<title>In-Depth - News Hub</title>
</svelte:head>

<div class="p-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">In-Depth Artikel</h1>
		<p class="text-text-secondary mt-1">Ausführliche Analysen zu wichtigen Themen</p>
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
			<p class="text-text-secondary">Noch keine In-Depth Artikel vorhanden</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each articles as article}
				<article
					class="p-6 bg-background-card border border-border rounded-lg hover:border-border-hover transition-colors"
				>
					<a href="/article/{article.id}" class="block">
						<h2 class="font-bold text-xl hover:text-primary transition-colors">
							{article.title}
						</h2>
						{#if article.summary}
							<p class="text-text-secondary mt-3">
								{article.summary}
							</p>
						{/if}
						<div class="flex items-center gap-4 mt-4 text-sm text-text-muted">
							<span>5-15 Min. Lesezeit</span>
						</div>
					</a>
				</article>
			{/each}
		</div>
	{/if}
</div>
