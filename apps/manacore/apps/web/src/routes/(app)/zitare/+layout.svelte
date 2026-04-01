<script lang="ts">
	import { setContext } from 'svelte';
	import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
	import { db } from '$lib/data/database';
	import {
		toFavorite,
		toQuoteList,
		type Favorite,
		type QuoteList,
	} from '$lib/modules/zitare/queries';
	import type { LocalFavorite, LocalQuoteList } from '$lib/modules/zitare/types';
	import { quotesStore } from '$lib/modules/zitare/stores/quotes.svelte';
	import { zitareSettings } from '$lib/modules/zitare/stores/settings.svelte';

	let { children } = $props();

	// Initialize zitare stores
	quotesStore.initialize();
	zitareSettings.initialize();

	// Provide reactive favorites & lists contexts for child routes
	const allFavorites = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalFavorite>('zitareFavorites').toArray();
		return locals.filter((f) => !f.deletedAt).map(toFavorite);
	}, [] as Favorite[]);
	setContext('favorites', allFavorites);

	const allLists = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalQuoteList>('zitareLists').toArray();
		return locals.filter((l) => !l.deletedAt).map(toQuoteList);
	}, [] as QuoteList[]);
	setContext('lists', allLists);
</script>

{@render children()}
