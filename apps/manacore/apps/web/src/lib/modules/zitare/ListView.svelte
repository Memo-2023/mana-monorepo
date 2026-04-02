<!--
  Zitare — Workbench ListView
  Quote of the day with favorites count.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalFavorite } from './types';

	let favorites = $state<LocalFavorite[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFavorite>('zitareFavorites')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt));
		}).subscribe((val) => {
			favorites = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	// Simple daily quote selection based on day of year
	const quotes = [
		{ text: 'Der Weg ist das Ziel.', author: 'Konfuzius' },
		{ text: 'Wer nicht wagt, der nicht gewinnt.', author: 'Sprichwort' },
		{
			text: 'In der Mitte von Schwierigkeiten liegen die Möglichkeiten.',
			author: 'Albert Einstein',
		},
		{ text: 'Es ist nicht genug zu wissen, man muss auch anwenden.', author: 'Goethe' },
		{ text: 'Handle, ehe du denkst. Nein — denke, ehe du handelst.', author: 'Mark Twain' },
		{
			text: 'Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.',
			author: 'Eleanor Roosevelt',
		},
		{ text: 'Was immer du tun kannst oder träumst es zu können, fang damit an.', author: 'Goethe' },
	];

	const dayOfYear = Math.floor(
		(Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
	);
	const todayQuote = quotes[dayOfYear % quotes.length];
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 p-6">
	<div class="text-center">
		<blockquote class="text-lg font-light italic leading-relaxed text-white/80">
			&laquo;{todayQuote.text}&raquo;
		</blockquote>
		<p class="mt-3 text-sm text-white/40">— {todayQuote.author}</p>
	</div>

	<div class="text-xs text-white/30">
		{favorites.length} gespeicherte Zitate
	</div>
</div>
