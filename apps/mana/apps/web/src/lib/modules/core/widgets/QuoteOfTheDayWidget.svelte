<script lang="ts">
	/**
	 * QuoteOfTheDayWidget — Zufälliges Tageszitat aus Quotes-Favoriten.
	 *
	 * Liest direkt aus der unified IndexedDB (quotesFavorites table).
	 * Zeigt eine zufällige Favoriten-ID — das vollständige Zitat stammt
	 * aus dem eingebetteten Zitate-Katalog von Quotes.
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { BaseRecord } from '@mana/local-store';

	interface QuotesFavorite extends BaseRecord {
		quoteId: string;
	}

	let favorite: QuotesFavorite | null = $state(null);
	let totalFavorites = $state(0);
	let loading = $state(true);

	// Use date as seed for consistent "daily" pick
	const today = new Date().toISOString().slice(0, 10);

	function hashStr(s: string): number {
		let hash = 0;
		for (let i = 0; i < s.length; i++) {
			hash = (hash << 5) - hash + s.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash);
	}

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<QuotesFavorite>('quotesFavorites').toArray();
			return all.filter((f) => !f.deletedAt);
		}).subscribe({
			next: (val) => {
				totalFavorites = val.length;
				if (val.length > 0) {
					const idx = hashStr(today) % val.length;
					favorite = val[idx];
				} else {
					favorite = null;
				}
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
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Zitat des Tages</h3>
	</div>

	{#if loading}
		<div class="h-16 animate-pulse rounded bg-surface-hover"></div>
	{:else if !favorite}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#128161;</div>
			<p class="text-sm text-muted-foreground">Noch keine Lieblingszitate gespeichert.</p>
			<a
				href="/quotes"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Zitate entdecken
			</a>
		</div>
	{:else}
		<a href="/quotes" class="block rounded-lg p-3 transition-colors hover:bg-surface-hover">
			<p class="mb-2 text-sm italic text-foreground/80">
				Favorit #{favorite.quoteId}
			</p>
			<p class="text-xs text-muted-foreground">
				{totalFavorites} Lieblingszitate gespeichert
			</p>
		</a>
	{/if}
</div>
