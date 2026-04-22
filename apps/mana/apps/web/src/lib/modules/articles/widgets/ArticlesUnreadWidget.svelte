<script lang="ts">
	/**
	 * ArticlesUnreadWidget — dashboard tile for the articles module.
	 *
	 * Shows up to three unread articles + a one-line stats strip (saved
	 * this week / total unread). Mirrors the NewsUnreadWidget pattern:
	 * self-contained liveQuery, no props, renders its own tile chrome.
	 */

	import { useAllArticles, useStats } from '../queries';

	const articles$ = useAllArticles();
	const stats$ = useStats();
	const articles = $derived(articles$.value);
	const stats = $derived(stats$.value);

	const topUnread = $derived(
		articles.filter((a) => a.status === 'unread' || a.status === 'reading').slice(0, 3)
	);
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span aria-hidden="true">📚</span>
			Artikel
		</h3>
		<a href="/articles" class="text-xs text-muted-foreground hover:text-foreground">Alle →</a>
	</div>

	{#if articles$.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if articles.length === 0}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Noch keine Artikel gespeichert.</p>
			<a
				href="/articles/add"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Erste URL speichern
			</a>
		</div>
	{:else if topUnread.length === 0}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Alles gelesen — stark.</p>
			<a href="/articles" class="mt-3 inline-block text-xs text-primary hover:underline">
				Leseliste öffnen
			</a>
		</div>
	{:else}
		<div class="space-y-1.5">
			{#each topUnread as article (article.id)}
				<a
					href="/articles/{article.id}"
					class="block rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<p class="line-clamp-2 text-sm font-medium leading-snug">{article.title}</p>
					<div class="mt-0.5 flex gap-1.5 text-xs text-muted-foreground">
						{#if article.siteName}
							<span class="font-medium">{article.siteName}</span>
						{/if}
						{#if article.readingTimeMinutes}
							<span>·</span>
							<span>{article.readingTimeMinutes} min</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
		<div class="mt-3 border-t border-border/50 pt-2 text-xs text-muted-foreground">
			{stats.unread} ungelesen · {stats.savedThisWeek} diese Woche gespeichert
		</div>
	{/if}
</div>
