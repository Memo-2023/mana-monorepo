<script lang="ts">
  import type { FoodItem } from '$lib/types/meal';

  interface Props {
    items: FoodItem[];
  }

  let { items }: Props = $props();

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      protein: 'Protein',
      vegetable: 'Gemüse',
      grain: 'Getreide',
      fruit: 'Obst',
      dairy: 'Milchprodukt',
      fat: 'Fett',
      processed: 'Verarbeitet',
      beverage: 'Getränk'
    };
    return labels[category] || category;
  }

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      protein: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      vegetable: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      grain: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      fruit: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      dairy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      fat: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      processed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      beverage: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
</script>

{#if items.length === 0}
  <p class="text-center text-gray-500 dark:text-gray-400">Keine Zutaten erkannt</p>
{:else}
  <div class="space-y-2">
    {#each items as item (item.id)}
      <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50">
        <div class="flex items-center gap-3">
          <span class="rounded-lg px-2 py-1 text-xs font-medium {getCategoryColor(item.category)}">
            {getCategoryLabel(item.category)}
          </span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{item.name}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{item.portion_size}</p>
          </div>
        </div>
        <div class="text-right">
          {#if item.calories}
            <p class="font-semibold text-gray-900 dark:text-white">
              {Math.round(item.calories)} kcal
            </p>
          {/if}
          {#if item.confidence}
            <p class="text-xs text-gray-500">{Math.round(item.confidence * 100)}%</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
