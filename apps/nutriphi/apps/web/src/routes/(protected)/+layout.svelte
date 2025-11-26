<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth, isAuthenticated } from '$lib/stores/auth';
  import { isSidebarMode as sidebarModeStore, isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';
  import { PillNavigation } from '@manacore/shared-ui';
  import type { PillNavItem } from '@manacore/shared-ui';

  // Navigation shortcuts (Ctrl+1-7)
  const navRoutes = [
    '/meals',       // Ctrl+1
    '/upload',      // Ctrl+2
    '/stats',       // Ctrl+3
    '/goals',       // Ctrl+4
    '/export',      // Ctrl+5
    '/subscription', // Ctrl+6
    '/settings',    // Ctrl+7
  ];

  // Navigation items for Nutriphi
  const navItems: PillNavItem[] = [
    { href: '/meals', label: 'Mahlzeiten', icon: 'archive' },
    { href: '/upload', label: 'Upload', icon: 'upload' },
    { href: '/stats', label: 'Statistik', icon: 'chart' },
    { href: '/goals', label: 'Ziele', icon: 'target' },
    { href: '/export', label: 'Export', icon: 'download' },
    { href: '/subscription', label: 'Mana', icon: 'mana' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      const num = parseInt(event.key);
      if (num >= 1 && num <= 7) {
        event.preventDefault();
        const route = navRoutes[num - 1];
        if (route) {
          goto(route);
        }
      }
    }
  }

  let { children } = $props();
  let loading = $state(true);
  let isSidebarMode = $state(false);
  let isCollapsed = $state(false);

  let effectiveMode = $derived(theme.effectiveMode);

  const isFullHeightPage = $derived(
    $page.url.pathname === '/meals' || $page.url.pathname === '/upload'
  );

  function handleModeChange(isSidebar: boolean) {
    isSidebarMode = isSidebar;
    sidebarModeStore.set(isSidebar);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nutriphi-nav-sidebar', String(isSidebar));
    }
  }

  function handleCollapsedChange(collapsed: boolean) {
    isCollapsed = collapsed;
    collapsedStore.set(collapsed);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nutriphi-nav-collapsed', String(collapsed));
    }
  }

  function handleToggleTheme() {
    theme.toggleMode();
  }

  onMount(() => {
    if (!$isAuthenticated) {
      goto(`/login?redirectTo=${$page.url.pathname}`);
    } else {
      const savedSidebar = localStorage.getItem('nutriphi-nav-sidebar');
      if (savedSidebar === 'true') {
        isSidebarMode = true;
        sidebarModeStore.set(true);
      }

      const savedCollapsed = localStorage.getItem('nutriphi-nav-collapsed');
      if (savedCollapsed === 'true') {
        isCollapsed = true;
        collapsedStore.set(true);
      }
      loading = false;
    }
  });

  async function handleLogout() {
    await auth.signOut();
    goto('/login');
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="spinner-border mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent border-green-500"></div>
      <p class="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
{:else}
  <div class="flex min-h-screen flex-col">
    <PillNavigation
      items={navItems}
      currentPath={$page.url.pathname}
      appName="Nutriphi"
      homeRoute="/meals"
      onLogout={handleLogout}
      onToggleTheme={handleToggleTheme}
      isDark={effectiveMode === 'dark'}
      isSidebarMode={isSidebarMode}
      onModeChange={handleModeChange}
      isCollapsed={isCollapsed}
      onCollapsedChange={handleCollapsedChange}
      showThemeToggle={true}
      primaryColor="#22c55e"
    >
      {#snippet logo()}
        <span class="text-xl">🥗</span>
        <span class="pill-label font-bold">Nutriphi</span>
      {/snippet}
    </PillNavigation>

    <main
      class="main-content flex-1 transition-all duration-300 {isCollapsed ? '' : isSidebarMode ? 'pl-[180px]' : 'pt-20'} {isFullHeightPage ? 'overflow-hidden' : 'overflow-auto'}"
    >
      {#if isFullHeightPage}
        {@render children?.()}
      {:else}
        <div class="container mx-auto px-4 py-8">
          {@render children?.()}
        </div>
      {/if}
    </main>
  </div>
{/if}
