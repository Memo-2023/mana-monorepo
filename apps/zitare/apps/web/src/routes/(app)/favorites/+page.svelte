<script lang="ts">
	import { quotesDE, authorsDE, quotesAppConfig } from '@zitare/shared';
	import { FavoritesPage } from '@zitare/web-ui';

	const config = quotesAppConfig;
</script>

<FavoritesPage
	{config}
	allContent={quotesDE}
	allAuthors={authorsDE}
	favoriteStorageKey="favorites"
	contentTypeSingular="Zitat"
	contentTypePlural="Zitate"
	browseUrl="/quotes"
/>
