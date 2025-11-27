// Components
export { default as ContentCard } from './components/ContentCard.svelte';
export { default as AppSidebar } from './components/AppSidebar.svelte';
export { default as BrowsePage } from './components/BrowsePage.svelte';
export { default as FavoritesPage } from './components/FavoritesPage.svelte';
export { default as DiscoverAppsPage } from './components/DiscoverAppsPage.svelte';
export { default as PageHeader } from './components/PageHeader.svelte';
export { default as SearchBox } from './components/SearchBox.svelte';
export { default as CategoryFilters } from './components/CategoryFilters.svelte';
export { default as ToastContainer } from './components/ToastContainer.svelte';

// Stores
export { isSidebarCollapsed } from './stores/sidebar';
export { theme } from './stores/theme';
export { toast, type Toast, type ToastType } from './stores/toast';

// Note: ToastContainer and ErrorBoundary are available
// but should be imported directly when needed to avoid unnecessary dependencies
