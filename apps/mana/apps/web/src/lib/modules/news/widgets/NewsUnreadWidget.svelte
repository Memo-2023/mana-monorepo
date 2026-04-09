<script lang="ts">
	/**
	 * NewsUnreadWidget — three top-ranked unread articles from the user's
	 * curated feed, surfaced on the dashboard.
	 *
	 * Reads:
	 *   - newsCachedFeed (the local pool mirror — plaintext, no decrypt)
	 *   - newsPreferences singleton (decrypts to apply topic/lang filters)
	 *   - newsReactions (decrypts to skip already-rated articles)
	 *
	 * The widget intentionally does NOT trigger a feed refresh — that's
	 * the news layout's job. If the user has never opened /news, the
	 * pool is empty and the widget shows the empty state with a CTA.
	 */

	import { liveQuery } from 'dexie';
	import {
		cachedFeedTable,
		preferencesTable,
		reactionTable,
		DEFAULT_PREFERENCES,
	} from '$lib/modules/news/collections';
	import { decryptRecords } from '$lib/data/crypto';
	import { rankFeed, buildReactionSets } from '$lib/modules/news/feed-engine';
	import { toPreferences, toReaction, formatRelativeTime } from '$lib/modules/news/queries';
	import { PREFERENCES_ID, type LocalCachedArticle } from '$lib/modules/news/types';

	let topThree = $state<LocalCachedArticle[]>([]);
	let loading = $state(true);
	let onboardingDone = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const [pool, prefsRow, reactionsRows] = await Promise.all([
				cachedFeedTable.toArray(),
				preferencesTable.get(PREFERENCES_ID),
				reactionTable.toArray(),
			]);

			// Decrypt prefs + reactions (cache stays plaintext).
			const prefs = prefsRow
				? toPreferences(
						(await decryptRecords('newsPreferences', [prefsRow]))[0] ?? DEFAULT_PREFERENCES
					)
				: toPreferences(DEFAULT_PREFERENCES);

			const visibleReactions = reactionsRows.filter((r) => !r.deletedAt);
			const reactions = (await decryptRecords('newsReactions', visibleReactions)).map(toReaction);

			return {
				prefs,
				ranked: rankFeed(pool, { prefs, ...buildReactionSets(reactions) }),
			};
		}).subscribe({
			next: ({ prefs, ranked }) => {
				onboardingDone = prefs.onboardingCompleted;
				topThree = ranked.slice(0, 3).map((s) => s.article);
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span aria-hidden="true">📰</span>
			News
		</h3>
		<a href="/news" class="text-xs text-muted-foreground hover:text-foreground">Alle →</a>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-12 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if !onboardingDone}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Richte deinen Newsfeed ein.</p>
			<a
				href="/news"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Jetzt starten
			</a>
		</div>
	{:else if topThree.length === 0}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Keine neuen Artikel.</p>
			<a href="/news" class="mt-3 inline-block text-xs text-primary hover:underline">
				Feed öffnen
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each topThree as article (article.id)}
				<a
					href="/news/{article.id}"
					class="block rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div class="flex items-start gap-3">
						{#if article.imageUrl}
							<img
								src={article.imageUrl}
								alt=""
								class="h-12 w-16 flex-shrink-0 rounded object-cover"
								loading="lazy"
							/>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="line-clamp-2 text-sm font-medium leading-snug">{article.title}</p>
							<div class="mt-0.5 flex gap-1 text-xs text-muted-foreground">
								<span class="font-medium">{article.siteName}</span>
								<span>·</span>
								<span>{formatRelativeTime(article.publishedAt)}</span>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
