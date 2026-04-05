<script lang="ts">
	/**
	 * PresiDecksWidget - Recent presentations (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useRecentDecks } from '$lib/data/cross-app-queries';

	const decks = useRecentDecks(5);

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📊</span>
			{$_('dashboard.widgets.presi.title')}
		</h3>
	</div>

	{#if decks.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (decks.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📊</div>
			<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.presi.empty')}</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each decks.value ?? [] as deck (deck.id)}
				<a
					href="/presi/deck/{deck.id}"
					class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{deck.title}</p>
					</div>
					<span class="flex-shrink-0 text-xs text-muted-foreground">
						{formatDate(deck.updatedAt)}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
