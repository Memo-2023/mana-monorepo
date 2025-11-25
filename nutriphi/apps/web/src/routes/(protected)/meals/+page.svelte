<script lang="ts">
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import { mealsStore } from '$lib/stores/meals.svelte';
  import MealGrid from '$lib/components/meals/MealGrid.svelte';
  import type { Meal } from '$lib/types/meal';
  import { onMount } from 'svelte';

  let meals = $derived(mealsStore.sortedMeals);
  let isLoading = $derived(mealsStore.isLoading);

  onMount(() => {
    if ($user?.id) {
      mealsStore.loadMeals($user.id);
    }
  });

  function handleMealClick(meal: Meal) {
    goto(`/meals/${meal.id}`);
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <div class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mahlzeiten</h1>
        <p class="text-gray-600 dark:text-gray-400">
          {meals.length} {meals.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'} erfasst
        </p>
      </div>
      <button
        onclick={() => goto('/upload')}
        class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700"
      >
        <span class="text-lg">+</span>
        Neue Mahlzeit
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-auto p-6">
    {#if isLoading}
      <div class="flex h-64 items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
      </div>
    {:else if meals.length === 0}
      <div class="flex h-64 flex-col items-center justify-center text-center">
        <div class="mb-4 text-6xl">🥗</div>
        <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Keine Mahlzeiten</h2>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          Erfasse deine erste Mahlzeit mit einem Foto
        </p>
        <button
          onclick={() => goto('/upload')}
          class="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700"
        >
          Foto hochladen
        </button>
      </div>
    {:else}
      <MealGrid {meals} onMealClick={handleMealClick} />
    {/if}
  </div>
</div>
