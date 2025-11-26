<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: any; data: LayoutData } = $props();

  let isChecking = $state(true);

  // Check auth on mount and redirect if not authenticated
  onMount(async () => {
    await authStore.initialize();

    if (!authStore.isAuthenticated) {
      const redirectTo = encodeURIComponent(data.pathname || '/chat');
      goto(`/login?redirectTo=${redirectTo}`);
      return;
    }

    isChecking = false;
  });

  async function handleSignOut() {
    await authStore.signOut();
    goto('/login');
  }
</script>

{#if isChecking}
  <!-- Loading state while checking auth -->
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Top Navigation -->
    <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900 dark:text-white">
              ManaChat
            </a>
            <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
              <a
                href="/"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       {$page.url.pathname === '/' || $page.url.pathname.startsWith('/chat')
                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              >
                Chat
              </a>
              <a
                href="/templates"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       {$page.url.pathname.startsWith('/templates')
                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              >
                Templates
              </a>
              <a
                href="/spaces"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       {$page.url.pathname.startsWith('/spaces')
                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              >
                Spaces
              </a>
              <a
                href="/documents"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       {$page.url.pathname.startsWith('/documents')
                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              >
                Dokumente
              </a>
              <a
                href="/archive"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       {$page.url.pathname.startsWith('/archive')
                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              >
                Archiv
              </a>
            </div>
          </div>

          <div class="flex items-center gap-4">
            {#if authStore.user}
              <span class="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {authStore.user.email}
              </span>
            {/if}
            <a
              href="/profile"
              class="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Profil"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>
            <button
              onclick={handleSignOut}
              class="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      {@render children()}
    </main>
  </div>
{/if}
