<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { Presentation, LogOut, Settings, User, Sun, Moon } from 'lucide-svelte';
  import '../app.css';

  let isDark = $state(false);

  onMount(() => {
    auth.init();
    isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  });

  function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }

  function handleLogout() {
    auth.logout();
    goto('/login');
  }

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  $effect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !publicRoutes.includes($page.url.pathname)) {
      goto('/login');
    }
  });
</script>

<svelte:head>
  <title>Presi - Presentation Creator</title>
</svelte:head>

{#if auth.isLoading}
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
  </div>
{:else if auth.isAuthenticated || publicRoutes.includes($page.url.pathname)}
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    {#if auth.isAuthenticated && !$page.url.pathname.startsWith('/present/')}
      <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <a href="/" class="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <Presentation class="w-6 h-6 text-primary-500" />
              Presi
            </a>

            <div class="flex items-center gap-2">
              <button
                onclick={toggleTheme}
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {#if isDark}
                  <Sun class="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {:else}
                  <Moon class="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {/if}
              </button>

              <a
                href="/settings"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Settings class="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </a>

              <a
                href="/profile"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <User class="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span class="text-sm text-slate-700 dark:text-slate-200">{auth.user?.email}</span>
              </a>

              <button
                onclick={handleLogout}
                class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                aria-label="Logout"
              >
                <LogOut class="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>
    {/if}

    <main>
      <slot />
    </main>
  </div>
{/if}
