<script lang="ts">
  import { quotesDE, authorsDE, quotesAppConfig } from '@quote/shared';
  import { FavoritesPage } from '@quote/web-ui';

  const config = quotesAppConfig;
</script>

<FavoritesPage
  config={config}
  allContent={quotesDE}
  allAuthors={authorsDE}
  favoriteStorageKey="favorites"
  contentTypeSingular="Zitat"
  contentTypePlural="Zitate"
  browseUrl="/quotes"
/>
