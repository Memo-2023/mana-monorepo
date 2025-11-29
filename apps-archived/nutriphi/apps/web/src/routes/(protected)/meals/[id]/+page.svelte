<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { mealsStore } from '$lib/stores/meals.svelte';
	import NutritionBar from '$lib/components/meals/NutritionBar.svelte';
	import FoodItemList from '$lib/components/meals/FoodItemList.svelte';
	import MealEditModal from '$lib/components/meals/MealEditModal.svelte';
	import { onMount } from 'svelte';

	const mealId = $derived($page.params.id);
	let meal = $derived(mealsStore.selectedMeal);
	let isLoading = $derived(mealsStore.isLoading);
	let showEditModal = $state(false);
	let pollingInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (mealId) {
			mealsStore.loadMealById(mealId);
		}

		// Start polling if meal is pending analysis
		startPollingIfNeeded();

		return () => {
			mealsStore.clearSelectedMeal();
			if (pollingInterval) clearInterval(pollingInterval);
		};
	});

	// Watch for meal changes to start/stop polling
	$effect(() => {
		if (meal?.analysis_status === 'pending') {
			startPollingIfNeeded();
		} else if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	});

	function startPollingIfNeeded() {
		if (meal?.analysis_status === 'pending' && !pollingInterval) {
			pollingInterval = setInterval(() => {
				if (mealId) {
					mealsStore.loadMealById(mealId);
				}
			}, 3000); // Poll every 3 seconds
		}
	}

	function getMealTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			breakfast: 'Frühstück',
			lunch: 'Mittagessen',
			dinner: 'Abendessen',
			snack: 'Snack',
		};
		return labels[type] || type;
	}

	function getHealthColor(score?: number): string {
		if (!score) return 'bg-gray-400';
		if (score >= 8) return 'bg-green-500';
		if (score >= 6) return 'bg-yellow-500';
		if (score >= 4) return 'bg-orange-500';
		return 'bg-red-500';
	}

	async function handleDelete() {
		if (!meal || !confirm('Mahlzeit wirklich löschen?')) return;
		await mealsStore.deleteMeal(meal.id);
		goto('/meals');
	}

	function getNutritionText(): string {
		if (!meal) return '';
		const parts = [];
		if (meal.total_calories) parts.push(`${Math.round(meal.total_calories)} kcal`);
		if (meal.total_protein) parts.push(`${Math.round(meal.total_protein)}g Protein`);
		if (meal.total_carbs) parts.push(`${Math.round(meal.total_carbs)}g Kohlenhydrate`);
		if (meal.total_fat) parts.push(`${Math.round(meal.total_fat)}g Fett`);
		return parts.join(' | ');
	}

	async function handleShare() {
		if (!meal) return;
		const text = `${getMealTypeLabel(meal.meal_type)}\n${getNutritionText()}`;

		if (navigator.share) {
			try {
				await navigator.share({ title: 'Nutriphi Mahlzeit', text });
			} catch {
				// User cancelled or share failed
			}
		} else {
			// Fallback to copy
			handleCopy();
		}
	}

	async function handleCopy() {
		if (!meal) return;
		const text = `${getMealTypeLabel(meal.meal_type)}\n${getNutritionText()}`;

		try {
			await navigator.clipboard.writeText(text);
			// Could add a toast notification here
		} catch {
			// Copy failed
		}
	}
</script>

<div class="mx-auto max-w-4xl">
	<button
		onclick={() => goto('/meals')}
		class="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
	>
		<span>←</span>
		Zurück zu Mahlzeiten
	</button>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
			></div>
		</div>
	{:else if !meal}
		<div class="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
			<div class="mb-4 text-6xl">🍽️</div>
			<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
				Mahlzeit nicht gefunden
			</h2>
			<p class="mb-4 text-gray-600 dark:text-gray-400">
				Diese Mahlzeit existiert nicht oder wurde gelöscht.
			</p>
			<button
				onclick={() => goto('/meals')}
				class="rounded-xl bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600"
			>
				Zu Mahlzeiten
			</button>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Photo -->
			<div class="overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700">
				{#if meal.photo_url}
					<img src={meal.photo_url} alt="Meal" class="h-full w-full object-cover" />
				{:else}
					<div class="flex h-64 items-center justify-center text-6xl">🍽️</div>
				{/if}
			</div>

			<!-- Details -->
			<div class="space-y-6">
				<!-- Header -->
				<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
								{getMealTypeLabel(meal.meal_type)}
							</h1>
							{#if meal.analysis_status === 'pending'}
								<span
									class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
								>
									<span class="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></span>
									Analysiert...
								</span>
							{:else if meal.analysis_status === 'failed'}
								<span
									class="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
								>
									Fehler
								</span>
							{/if}
						</div>
						{#if meal.health_score}
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 rounded-full {getHealthColor(meal.health_score)}"></div>
								<span class="font-semibold text-gray-900 dark:text-white"
									>{meal.health_score}/10</span
								>
							</div>
						{/if}
					</div>
					<p class="text-gray-600 dark:text-gray-400">
						{new Date(meal.timestamp).toLocaleDateString('de-DE', {
							weekday: 'long',
							day: 'numeric',
							month: 'long',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
					</p>

					<!-- User Rating -->
					{#if meal.user_rating && meal.user_rating > 0}
						<div class="mt-3 flex items-center gap-1">
							{#each [1, 2, 3, 4, 5] as star}
								<span
									class="text-lg {star <= meal.user_rating
										? 'text-yellow-400'
										: 'text-gray-300 dark:text-gray-600'}"
								>
									★
								</span>
							{/each}
							<span class="ml-1 text-sm text-gray-500 dark:text-gray-400">Deine Bewertung</span>
						</div>
					{/if}
				</div>

				<!-- User Notes -->
				{#if meal.user_notes}
					<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
						<h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Notizen</h2>
						<p class="text-gray-600 dark:text-gray-400">{meal.user_notes}</p>
					</div>
				{/if}

				<!-- Nutrition -->
				<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Nährwerte</h2>
					<NutritionBar {meal} showDetailed={true} />
				</div>

				<!-- Food Items -->
				{#if meal.food_items && meal.food_items.length > 0}
					<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
						<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Zutaten</h2>
						<FoodItemList items={meal.food_items} />
					</div>
				{/if}

				<!-- Actions -->
				<div class="space-y-3">
					<div class="flex gap-3">
						<button
							onclick={() => (showEditModal = true)}
							class="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700"
						>
							Bearbeiten
						</button>
						<button
							onclick={handleShare}
							class="rounded-xl border-2 border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
							aria-label="Teilen"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
								/>
							</svg>
						</button>
						<button
							onclick={handleCopy}
							class="rounded-xl border-2 border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
							aria-label="Kopieren"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</button>
					</div>
					<button
						onclick={handleDelete}
						class="w-full rounded-xl border-2 border-red-500 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
					>
						Löschen
					</button>
				</div>
			</div>
		</div>

		<!-- Edit Modal -->
		<MealEditModal {meal} isOpen={showEditModal} onClose={() => (showEditModal = false)} />
	{/if}
</div>
