<script lang="ts">
  import type { Template } from '@chat/types';

  interface Props {
    template: Template;
    onUse: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
  }

  let { template, onUse, onEdit, onDelete, onSetDefault }: Props = $props();

  function truncatePrompt(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
</script>

<div
  class="group relative flex rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all
         {template.is_default ? 'ring-2 ring-blue-500' : 'border border-gray-200 dark:border-gray-700'}"
>
  <!-- Color Indicator -->
  <div class="w-2 flex-shrink-0" style="background-color: {template.color}"></div>

  <!-- Content -->
  <div class="flex-1 p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
            {template.name}
          </h3>
          {#if template.is_default}
            <span class="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
              Standard
            </span>
          {/if}
        </div>

        {#if template.description}
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {template.description}
          </p>
        {/if}

        <p class="text-xs text-gray-500 dark:text-gray-500 italic line-clamp-2">
          {truncatePrompt(template.system_prompt)}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {#if !template.is_default}
          <button
            onclick={() => onSetDefault(template.id)}
            class="p-1.5 text-gray-500 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Als Standard setzen"
            aria-label="Als Standard setzen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        {/if}
        <button
          onclick={() => onEdit(template.id)}
          class="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Bearbeiten"
          aria-label="Bearbeiten"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onclick={() => onDelete(template.id)}
          class="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Löschen"
          aria-label="Löschen"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Use Button -->
    <button
      onclick={() => onUse(template.id)}
      class="mt-3 w-full py-2 px-3 text-sm font-medium text-white rounded-lg transition-colors"
      style="background-color: {template.color}"
    >
      Chat starten
    </button>
  </div>
</div>
