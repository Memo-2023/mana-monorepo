<script lang="ts">
	import { mealsStore } from '$lib/stores/meals.svelte';
	import { useAllMeals, getTodaysMeals } from '$lib/data/queries';
	import { MEAL_TYPE_LABELS } from '@nutriphi/shared';
	import { Trash, Camera, PencilLine, CircleNotch } from '@manacore/shared-icons';

	// Reactive live query — auto-updates when IndexedDB changes
	const allMeals = useAllMeals();
	const todaysMeals = $derived(getTodaysMeals(allMeals.value));

	let deleting = $state<string | null>(null);
	let deleteError = $state<string | null>(null);

	async function deleteMeal(id: string) {
		if (confirm('Mahlzeit wirklich loschen?')) {
			deleting = id;
			deleteError = null;
			try {
				await mealsStore.deleteMeal(id);
			} catch (err) {
				deleteError = err instanceof Error ? err.message : 'Mahlzeit konnte nicht geloscht werden';
			} finally {
				deleting = null;
			}
		}
	}
</script>

<div class="space-y-3">
	{#if deleteError}
		<div
			class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm"
		>
			<span>{deleteError}</span>
		</div>
	{/if}

	{#if todaysMeals.length === 0}
		<div class="text-center py-8">
			<p class="text-[var(--color-text-secondary)] mb-2">Noch keine Mahlzeiten heute</p>
			<p class="text-sm text-[var(--color-text-muted)]">
				Tippe auf + um deine erste Mahlzeit hinzuzufugen
			</p>
		</div>
	{:else}
		{#each todaysMeals as meal (meal.id)}
			<div
				class="bg-[var(--color-background-card)] rounded-xl p-4 border border-[var(--color-border)]"
			>
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							{#if meal.inputType === 'photo'}
								<Camera class="w-4 h-4 text-[var(--color-text-muted)]" />
							{:else}
								<PencilLine class="w-4 h-4 text-[var(--color-text-muted)]" />
							{/if}
							<span class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
								{MEAL_TYPE_LABELS[meal.mealType as keyof typeof MEAL_TYPE_LABELS]?.de ??
									meal.mealType}
							</span>
						</div>
						<p class="text-[var(--color-text-primary)] font-medium">
							{meal.description}
						</p>
						{#if meal.nutrition}
							<div class="flex gap-4 mt-2 text-sm">
								<span class="text-[var(--color-calories)]">
									{Math.round(meal.nutrition.calories)} kcal
								</span>
								<span class="text-[var(--color-protein)]">
									{Math.round(meal.nutrition.protein)}g P
								</span>
								<span class="text-[var(--color-carbs)]">
									{Math.round(meal.nutrition.carbohydrates)}g K
								</span>
								<span class="text-[var(--color-fat)]">
									{Math.round(meal.nutrition.fat)}g F
								</span>
							</div>
						{/if}
					</div>
					<button
						onclick={() => deleteMeal(meal.id)}
						disabled={deleting === meal.id}
						class="p-2 rounded-lg hover:bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] hover:text-red-400 transition-colors disabled:opacity-50"
					>
						{#if deleting === meal.id}
							<CircleNotch class="w-4 h-4 animate-spin" />
						{:else}
							<Trash class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>
