<script lang="ts">
	import { quotesDE, authorsDE, quotesAppConfig } from '@quote/shared';
	import { BrowsePage } from '@quote/web-ui';

	const config = quotesAppConfig;
</script>

<BrowsePage
	{config}
	content={quotesDE}
	allAuthors={authorsDE}
	favoriteStorageKey="favorites"
	showAuthor={true}
	pageTitle="Zitate"
/>
