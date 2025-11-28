<script lang="ts">
	import { quotesDE, authorsDE, quotesAppConfig } from '@zitare/shared';
	import { BrowsePage } from '@zitare/web-ui';

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
