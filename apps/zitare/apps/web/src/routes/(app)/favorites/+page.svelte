<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { getQuoteById } from '@zitare/content';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	// Get favorite quotes
	let favoriteQuotes = $derived(
		favoritesStore.favorites
			.map((f) => getQuoteById(f.quoteId))
			.filter((q): q is NonNullable<typeof q> => q !== undefined)
	);
</script>

<svelte:head>
	<title>Zitare - {$_('favorites.title')}</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold text-foreground mb-8">{$_('favorites.title')}</h1>

	{#if !authStore.isAuthenticated}
		<!-- Not logged in -->
		<div class="text-center py-12 bg-surface-elevated rounded-2xl">
			<svg
				class="w-16 h-16 mx-auto text-foreground-muted mb-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
			<p class="text-foreground-secondary mb-4">Melde dich an, um Favoriten zu speichern</p>
			<button
				onclick={() => goto('/login')}
				class="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors"
			>
				{$_('auth.login')}
			</button>
		</div>
	{:else if favoritesStore.loading}
		<!-- Loading -->
		<div class="text-center py-12">
			<div
				class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
			></div>
		</div>
	{:else if favoriteQuotes.length === 0}
		<!-- Empty state -->
		<div class="text-center py-12 bg-surface-elevated rounded-2xl">
			<svg
				class="w-16 h-16 mx-auto text-foreground-muted mb-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
				/>
			</svg>
			<p class="text-lg font-medium text-foreground mb-2">{$_('favorites.empty')}</p>
			<p class="text-foreground-secondary">{$_('favorites.emptyDescription')}</p>
		</div>
	{:else}
		<!-- Favorites list -->
		<div class="space-y-6">
			{#each favoriteQuotes as quote (quote.id)}
				<QuoteCard {quote} showCategory showSource />
			{/each}
		</div>
	{/if}
</div>
