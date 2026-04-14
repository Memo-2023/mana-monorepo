<script lang="ts">
	import { setContext } from 'svelte';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import {
		toFavorite,
		toQuoteList,
		type Favorite,
		type QuoteList,
	} from '$lib/modules/quotes/queries';
	import type { LocalFavorite, LocalQuoteList } from '$lib/modules/quotes/types';
	import { quotesStore } from '$lib/modules/quotes/stores/quotes.svelte';
	import { quotesSettings } from '$lib/modules/quotes/stores/settings.svelte';

	let { children } = $props();

	// Initialize quotes stores
	quotesStore.initialize();
	quotesSettings.initialize();

	// Provide reactive favorites & lists contexts for child routes
	const allFavorites = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalFavorite>('quotesFavorites').toArray();
		return locals.filter((f) => !f.deletedAt).map(toFavorite);
	}, [] as Favorite[]);
	setContext('favorites', allFavorites);

	const allLists = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalQuoteList>('quotesLists').toArray();
		return locals.filter((l) => !l.deletedAt).map(toQuoteList);
	}, [] as QuoteList[]);
	setContext('lists', allLists);
</script>

{@render children()}
