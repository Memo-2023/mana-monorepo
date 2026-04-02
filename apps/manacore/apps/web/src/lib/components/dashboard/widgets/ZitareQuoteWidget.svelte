<script lang="ts">
	/**
	 * ZitareQuoteWidget - Random favorite quote (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useRandomFavorite } from '$lib/data/cross-app-queries';

	const favorite = useRandomFavorite();
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>💡</span>
			{$_('dashboard.widgets.zitare.title')}
		</h3>
	</div>

	{#if favorite.loading}
		<div class="h-16 animate-pulse rounded bg-surface-hover"></div>
	{:else if !favorite.value}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">💡</div>
			<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.zitare.empty')}</p>
			<a
				href="/zitare"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Zitate entdecken
			</a>
		</div>
	{:else}
		<a href="/zitare" class="block rounded-lg p-3 transition-colors hover:bg-surface-hover">
			<p class="text-sm italic text-muted-foreground">
				Favorit #{favorite.value.quoteId}
			</p>
		</a>
	{/if}
</div>
