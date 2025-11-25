<script lang="ts">
  import type { Meal, MealType } from '$lib/types/meal';
  import { mealsStore } from '$lib/stores/meals.svelte';

  interface Props {
    meal: Meal;
    isOpen: boolean;
    onClose: () => void;
  }

  let { meal, isOpen, onClose }: Props = $props();

  // Form state - initialized from meal
  let mealType = $state<MealType>(meal.meal_type);
  let userNotes = $state(meal.user_notes || '');
  let userRating = $state(meal.user_rating || 0);
  let isSaving = $state(false);

  // Reset form when meal changes
  $effect(() => {
    mealType = meal.meal_type;
    userNotes = meal.user_notes || '';
    userRating = meal.user_rating || 0;
  });

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: 'Frühstück' },
    { value: 'lunch', label: 'Mittagessen' },
    { value: 'dinner', label: 'Abendessen' },
    { value: 'snack', label: 'Snack' }
  ];

  async function handleSave() {
    isSaving = true;
    try {
      await mealsStore.updateMeal(meal.id, {
        meal_type: mealType,
        user_notes: userNotes || undefined,
        user_rating: userRating || undefined
      });
      onClose();
    } catch (err) {
      console.error('Failed to save meal:', err);
    } finally {
      isSaving = false;
    }
  }

  function handleRatingClick(rating: number) {
    userRating = userRating === rating ? 0 : rating;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal -->
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Mahlzeit bearbeiten</h2>
        <button
          onclick={onClose}
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Schließen"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Meal Type -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Art der Mahlzeit
          </label>
          <div class="grid grid-cols-2 gap-2">
            {#each mealTypes as type}
              <button
                onclick={() => (mealType = type.value)}
                class="rounded-xl px-4 py-2 text-sm font-medium transition-colors {mealType === type.value
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
              >
                {type.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Rating -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bewertung
          </label>
          <div class="flex gap-1">
            {#each [1, 2, 3, 4, 5] as star}
              <button
                onclick={() => handleRatingClick(star)}
                class="text-2xl transition-transform hover:scale-110 {star <= userRating
                  ? 'text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'}"
                aria-label="{star} Stern{star > 1 ? 'e' : ''}"
              >
                ★
              </button>
            {/each}
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label for="notes" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notizen
          </label>
          <textarea
            id="notes"
            bind:value={userNotes}
            rows="3"
            placeholder="Notizen zu dieser Mahlzeit..."
            class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-3">
        <button
          onclick={onClose}
          class="flex-1 rounded-xl border-2 border-gray-300 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Abbrechen
        </button>
        <button
          onclick={handleSave}
          disabled={isSaving}
          class="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  </div>
{/if}
