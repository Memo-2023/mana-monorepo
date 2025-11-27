<script lang="ts" generics="T extends ContentItem">
  import type { ContentItem, AppConfig } from '@quote/shared';
  import ContentCard from './ContentCard.svelte';
  import { toast } from '../stores/toast';

  interface Props {
    config: AppConfig;
    content: T[];
    allAuthors?: any[];
    favoriteStorageKey: string;
    showAuthor?: boolean;
    pageTitle: string;
  }

  let {
    config,
    content,
    allAuthors = [],
    favoriteStorageKey,
    showAuthor = true,
    pageTitle
  }: Props = $props();

  let searchTerm = $state('');
  let selectedCategory = $state('all');
  let favorites = $state<Set<string>>(new Set());
  let isSearchOpen = $state(false);

  // Pagination state
  const ITEMS_PER_PAGE = 20;
  let currentPage = $state(1);
  let isLoadingMore = $state(false);

  // Load favorites from localStorage
  if (typeof window !== 'undefined') {
    const savedFavorites = localStorage.getItem(favoriteStorageKey);
    if (savedFavorites) {
      favorites = new Set(JSON.parse(savedFavorites));
    }
  }

  // Get content with author info
  const contentWithAuthors = content.map(item => ({
    ...item,
    author: allAuthors.find(a => a.id === item.authorId)
  }));

  // Get unique categories
  const categories = ['all', ...new Set(content.flatMap(item => item.categories || []).filter(Boolean))];

  // Filter content (all matching items)
  let allFilteredContent = $derived(
    contentWithAuthors
      .map(item => ({
        ...item,
        isFavorite: favorites.has(item.id)
      }))
      .filter(item => {
        const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
                                item.categories?.includes(selectedCategory);
        return matchesSearch && matchesCategory;
      })
  );

  // Paginated content (only show what should be visible)
  let filteredContent = $derived(
    allFilteredContent.slice(0, currentPage * ITEMS_PER_PAGE)
  );

  // Check if there are more items to load
  let hasMore = $derived(filteredContent.length < allFilteredContent.length);

  function toggleSearch() {
    isSearchOpen = !isSearchOpen;
    if (!isSearchOpen) {
      searchTerm = '';
      selectedCategory = 'all';
      currentPage = 1;
    }
  }

  function loadMore() {
    isLoadingMore = true;
    setTimeout(() => {
      currentPage++;
      isLoadingMore = false;
    }, 300);
  }

  // Reset page when search/filter changes
  $effect(() => {
    searchTerm;
    selectedCategory;
    currentPage = 1;
  });

  function handleToggleFavorite(event: CustomEvent) {
    const { contentId } = event.detail;
    const wasAdded = !favorites.has(contentId);

    if (favorites.has(contentId)) {
      favorites.delete(contentId);
    } else {
      favorites.add(contentId);
    }
    favorites = new Set(favorites);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
    }

    // Show toast
    if (wasAdded) {
      toast.success('Zu Favoriten hinzugefügt');
    } else {
      toast.info('Von Favoriten entfernt');
    }
  }

  function handleAuthorClick(event: CustomEvent) {
    const { authorId } = event.detail;
    if (authorId) {
      window.location.href = `/authors/${authorId}`;
    }
  }
</script>

<svelte:head>
  <title>{pageTitle} - {config.metadata.displayName}</title>
</svelte:head>

<div class="browse-page">
  <div class="header-container">
    <div class="header-row">
      <h2>{pageTitle}</h2>

      <button
        class="search-fab"
        onclick={toggleSearch}
        aria-label="Toggle search"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {#if isSearchOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          {/if}
        </svg>
      </button>
    </div>

    {#if isSearchOpen}
      <div class="search-bar">
        <input
          type="text"
          placeholder="Durchsuchen..."
          bind:value={searchTerm}
          class="search"
        />

        <select bind:value={selectedCategory} class="category-filter">
          {#each categories as category}
            <option value={category}>
              {category === 'all' ? 'Alle Kategorien' : category}
            </option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  {#if allFilteredContent.length === 0 && (searchTerm || selectedCategory !== 'all')}
    <!-- Empty Search Results -->
    <div class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      <h3>Keine Ergebnisse gefunden</h3>
      <p>Versuche es mit anderen Suchbegriffen oder Kategorien</p>
    </div>
  {:else}
    <div class="content-grid">
      {#each filteredContent as item (item.id)}
        <ContentCard
          content={item}
          on:toggleFavorite={handleToggleFavorite}
          on:authorClick={handleAuthorClick}
        />
      {/each}
    </div>

    <!-- Load More Button -->
    {#if hasMore}
      <div class="load-more-container">
        <button
          class="load-more-btn"
          onclick={loadMore}
          disabled={isLoadingMore}
        >
          {#if isLoadingMore}
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="3" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-width="3" stroke-linecap="round"></path>
            </svg>
            Laden...
          {:else}
            Mehr laden ({allFilteredContent.length - filteredContent.length} weitere)
          {/if}
        </button>
      </div>
    {/if}
  {/if}

  {#if isSearchOpen}
    <div class="floating-results">
      {allFilteredContent.length} von {content.length} {config.contentLabel.plural}
      {#if filteredContent.length < allFilteredContent.length}
        • {filteredContent.length} angezeigt
      {/if}
    </div>
  {/if}
</div>

<style>
  .browse-page {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    padding-bottom: var(--spacing-2xl);
  }

  .header-container {
    max-width: 700px;
    margin: 0 auto var(--spacing-xl);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  h2 {
    font-size: 2rem;
    margin: 0;
    color: rgb(var(--color-text-primary));
  }

  .search-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;
    background: rgb(var(--color-primary));
    color: white;
    border: none;
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: var(--shadow-md);
  }

  .search-fab:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }

  .search-fab:active {
    transform: scale(0.95);
  }

  .search-bar {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgb(var(--color-surface));
    border-radius: var(--radius-lg);
    border: 1px solid rgb(var(--color-border));
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .search {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid rgb(var(--color-border));
    border-radius: var(--radius-md);
    font-size: 1rem;
    background: rgb(var(--color-background));
    color: rgb(var(--color-text-primary));
    transition: border-color var(--transition-fast);
  }

  .search:focus {
    outline: none;
    border-color: rgb(var(--color-primary));
  }

  .category-filter {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid rgb(var(--color-border));
    border-radius: var(--radius-md);
    font-size: 1rem;
    background: rgb(var(--color-background));
    color: rgb(var(--color-text-primary));
    transition: border-color var(--transition-fast);
    min-width: 180px;
  }

  .category-filter:focus {
    outline: none;
    border-color: rgb(var(--color-primary));
  }

  .content-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    max-width: 700px;
    margin: 0 auto;
  }

  .floating-results {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: rgba(var(--color-surface), 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-full);
    border: 1px solid rgba(var(--color-border), 0.5);
    box-shadow: var(--shadow-lg);
    color: rgb(var(--color-text-secondary));
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 20;
    animation: fadeInUp 0.3s ease;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  /* Empty State */
  .empty-state {
    max-width: 500px;
    margin: var(--spacing-2xl) auto;
    text-align: center;
    padding: var(--spacing-2xl);
  }

  .empty-icon {
    margin: 0 auto var(--spacing-lg);
    color: rgb(var(--color-text-tertiary));
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    color: rgb(var(--color-text-primary));
    margin: 0 0 var(--spacing-sm) 0;
  }

  .empty-state p {
    font-size: 1rem;
    color: rgb(var(--color-text-secondary));
    margin: 0;
  }

  /* Load More Button */
  .load-more-container {
    max-width: 700px;
    margin: var(--spacing-xl) auto 0;
    text-align: center;
  }

  .load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-2xl);
    background: rgb(var(--color-surface));
    color: rgb(var(--color-text-primary));
    border: 2px solid rgb(var(--color-border));
    border-radius: var(--radius-full);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .load-more-btn:hover:not(:disabled) {
    background: rgb(var(--color-primary));
    color: white;
    border-color: rgb(var(--color-primary));
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .browse-page {
      padding-bottom: var(--spacing-xl);
    }

    .header-container {
      max-width: 100%;
      margin-bottom: var(--spacing-lg);
    }

    .header-row {
      margin-bottom: var(--spacing-md);
    }

    h2 {
      font-size: 1.5rem;
    }

    .search-fab {
      width: 2.5rem;
      height: 2.5rem;
    }

    .search-bar {
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
    }

    .category-filter {
      min-width: auto;
      width: 100%;
    }

    .content-grid {
      gap: var(--spacing-lg);
      max-width: 100%;
    }

    .floating-results {
      bottom: 5rem;
      font-size: 0.8125rem;
      padding: var(--spacing-xs) var(--spacing-md);
    }

    .empty-state {
      padding: var(--spacing-xl);
    }

    .empty-state h3 {
      font-size: 1.25rem;
    }

    .empty-state p {
      font-size: 0.9375rem;
    }
  }
</style>
