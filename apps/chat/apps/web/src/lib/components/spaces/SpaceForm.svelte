<script lang="ts">
  import type { Space } from '@chat/types';

  interface Props {
    space?: Space;
    onSubmit: (data: { name: string; description?: string }) => void;
    onCancel: () => void;
  }

  let { space, onSubmit, onCancel }: Props = $props();

  let name = $state(space?.name ?? '');
  let description = $state(space?.description ?? '');
  let errors = $state<{ name?: string }>({});

  const isEditMode = !!space?.id;

  function validateForm(): boolean {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Bitte gib einen Namen ein.';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }
</script>

<div class="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-lg mx-auto">
  <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
    {isEditMode ? 'Space bearbeiten' : 'Neuen Space erstellen'}
  </h2>

  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
    <!-- Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Name *
      </label>
      <input
        type="text"
        id="name"
        bind:value={name}
        maxlength={100}
        placeholder="Name des Spaces"
        class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800
               text-gray-900 dark:text-white placeholder-gray-500
               {errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {#if errors.name}
        <p class="mt-1 text-sm text-red-500">{errors.name}</p>
      {/if}
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Beschreibung (optional)
      </label>
      <textarea
        id="description"
        bind:value={description}
        maxlength={500}
        rows={3}
        placeholder="Worum geht es in diesem Space?"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
               bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500
               focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      ></textarea>
    </div>

    <!-- Buttons -->
    <div class="flex gap-3 pt-4">
      <button
        type="button"
        onclick={onCancel}
        class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
               rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium
               hover:bg-blue-700 transition-colors"
      >
        {isEditMode ? 'Speichern' : 'Erstellen'}
      </button>
    </div>
  </form>
</div>
