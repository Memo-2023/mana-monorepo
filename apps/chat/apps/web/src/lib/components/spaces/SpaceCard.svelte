<script lang="ts">
  import type { Space } from '@chat/types';

  interface Props {
    space: Space;
    isOwner: boolean;
    onSelect: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onLeave: (id: string) => void;
  }

  let { space, isOwner, onSelect, onEdit, onDelete, onLeave }: Props = $props();
  let showMenu = $state(false);

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function handleMenuClick(e: MouseEvent) {
    e.stopPropagation();
    showMenu = !showMenu;
  }

  function handleAction(action: () => void) {
    showMenu = false;
    action();
  }
</script>

<svelte:window onclick={() => (showMenu = false)} />

<div
  class="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
         shadow-sm hover:shadow-md transition-all cursor-pointer"
  onclick={() => onSelect(space.id)}
  onkeydown={(e) => e.key === 'Enter' && onSelect(space.id)}
  role="button"
  tabindex="0"
>
  <div class="p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
            {space.name}
          </h3>
          {#if isOwner}
            <span class="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              Besitzer
            </span>
          {/if}
        </div>

        {#if space.description}
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {space.description}
          </p>
        {/if}

        <p class="text-xs text-gray-500 dark:text-gray-500">
          Erstellt: {formatDate(space.created_at)}
        </p>
      </div>

      <!-- Options Menu -->
      <div class="relative">
        <button
          onclick={handleMenuClick}
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Optionen"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {#if showMenu}
          <div
            class="absolute right-0 top-full mt-1 py-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg
                   border border-gray-200 dark:border-gray-700 z-10"
            onclick={(e) => e.stopPropagation()}
            onkeydown={() => {}}
            role="menu"
            tabindex="-1"
          >
            {#if isOwner}
              <button
                onclick={() => handleAction(() => onEdit(space.id))}
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Einstellungen
              </button>
              <button
                onclick={() => handleAction(() => onDelete(space.id))}
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Löschen
              </button>
            {:else}
              <button
                onclick={() => handleAction(() => onLeave(space.id))}
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Verlassen
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
