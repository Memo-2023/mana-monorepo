<script lang="ts">
	import { onMount } from 'svelte';
	import { articlesApi } from '$lib/services/api';
	import { authStore } from '$lib/stores/auth.svelte';

	let articles = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!authStore.session?.token) {
			error = 'Nicht angemeldet';
			loading = false;
			return;
		}

		const { data, error: apiError } = await articlesApi.getSavedArticles(authStore.session.token);

		if (apiError) {
			error = apiError;
		} else if (data) {
			articles = data;
		}

		loading = false;
	});
</script>

<svelte:head>
	<title>Gespeicherte Artikel - News Hub</title>
</svelte:head>

<div class="p-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">Gespeicherte Artikel</h1>
		<p class="text-text-secondary mt-1">Deine gespeicherten Artikel zum späteren Lesen</p>
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
					d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
				/>
			</svg>
			<p class="text-text-secondary">Noch keine Artikel gespeichert</p>
			<p class="text-text-muted text-sm mt-1">
				Speichere Artikel mit der Browser-Extension oder aus dem Feed
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
					</a>
				</article>
			{/each}
		</div>
	{/if}
</div>
