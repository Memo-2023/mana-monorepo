<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/data/database';
	import { useAllFavorites } from '$lib/modules/nutriphi/queries';
	import { MEAL_TYPE_LABELS, suggestMealType } from '$lib/modules/nutriphi/constants';
	import type { MealType, NutritionData } from '$lib/modules/nutriphi/types';
	import { ArrowLeft } from '@manacore/shared-icons';

	const allFavorites = useAllFavorites();
	let favorites = $derived(allFavorites.current ?? []);

	let mealType = $state<MealType>(suggestMealType());
	let description = $state('');
	let calories = $state<number | null>(null);
	let protein = $state<number | null>(null);
	let carbohydrates = $state<number | null>(null);
	let fat = $state<number | null>(null);
	let fiber = $state<number | null>(null);
	let sugar = $state<number | null>(null);

	let saving = $state(false);
	let error = $state('');

	const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

	function applyFavorite(fav: {
		description: string;
		mealType: MealType;
		nutrition: NutritionData;
	}) {
		description = fav.description;
		mealType = fav.mealType;
		calories = fav.nutrition.calories;
		protein = fav.nutrition.protein;
		carbohydrates = fav.nutrition.carbohydrates;
		fat = fav.nutrition.fat;
		fiber = fav.nutrition.fiber;
		sugar = fav.nutrition.sugar;
	}

	async function handleSubmit() {
		if (!description.trim()) {
			error = 'Bitte beschreibe die Mahlzeit';
			return;
		}

		saving = true;
		error = '';

		try {
			const now = new Date().toISOString();
			const today = new Date().toISOString().split('T')[0];

			const nutrition: NutritionData | null =
				calories !== null
					? {
							calories: calories ?? 0,
							protein: protein ?? 0,
							carbohydrates: carbohydrates ?? 0,
							fat: fat ?? 0,
							fiber: fiber ?? 0,
							sugar: sugar ?? 0,
						}
					: null;

			await db.table('meals').add({
				id: crypto.randomUUID(),
				date: today,
				mealType,
				inputType: 'text' as const,
				description: description.trim(),
				portionSize: null,
				confidence: nutrition ? 0.8 : 0,
				nutrition,
				createdAt: now,
				updatedAt: now,
			});

			goto('/nutriphi');
		} catch {
			error = 'Mahlzeit konnte nicht gespeichert werden';
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Mahlzeit hinzufuegen - NutriPhi - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<a
			href="/nutriphi"
			class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<ArrowLeft class="h-4 w-4" />
			Zurueck
		</a>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Mahlzeit hinzufuegen</h1>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
			{error}
		</div>
	{/if}

	<!-- Favorites -->
	{#if favorites.length > 0}
		<div>
			<h3 class="mb-2 text-sm font-medium text-[hsl(var(--foreground))]">Favoriten</h3>
			<div class="flex flex-wrap gap-2">
				{#each favorites as fav (fav.id)}
					<button
						onclick={() => applyFavorite(fav)}
						class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
					>
						{fav.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
		<!-- Meal Type -->
		<div>
			<label class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Mahlzeittyp
			</label>
			<div class="grid grid-cols-4 gap-2">
				{#each mealTypes as type}
					<button
						type="button"
						onclick={() => (mealType = type)}
						class="rounded-lg border-2 px-3 py-2 text-sm transition-all
							{mealType === type
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] font-medium'
							: 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]'}"
					>
						{MEAL_TYPE_LABELS[type].de}
					</button>
				{/each}
			</div>
		</div>

		<!-- Description -->
		<div>
			<label for="meal-desc" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
				Beschreibung
			</label>
			<textarea
				id="meal-desc"
				bind:value={description}
				placeholder="Was hast du gegessen?"
				rows="3"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			></textarea>
		</div>

		<!-- Nutrition -->
		<div>
			<h3 class="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">
				Naehrwerte <span class="text-[hsl(var(--muted-foreground))]">(optional)</span>
			</h3>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div>
					<label for="n-cal" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Kalorien (kcal)
					</label>
					<input
						id="n-cal"
						type="number"
						bind:value={calories}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="n-prot" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Protein (g)
					</label>
					<input
						id="n-prot"
						type="number"
						bind:value={protein}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="n-carbs" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Kohlenhydrate (g)
					</label>
					<input
						id="n-carbs"
						type="number"
						bind:value={carbohydrates}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="n-fat" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Fett (g)
					</label>
					<input
						id="n-fat"
						type="number"
						bind:value={fat}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="n-fiber" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Ballaststoffe (g)
					</label>
					<input
						id="n-fiber"
						type="number"
						bind:value={fiber}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="n-sugar" class="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">
						Zucker (g)
					</label>
					<input
						id="n-sugar"
						type="number"
						bind:value={sugar}
						min="0"
						placeholder="0"
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
			</div>
		</div>

		<!-- Submit -->
		<div class="flex gap-3 pt-2">
			<a
				href="/nutriphi"
				class="flex-1 rounded-lg border border-[hsl(var(--border))] px-4 py-3 text-center text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
			>
				Abbrechen
			</a>
			<button
				type="button"
				onclick={handleSubmit}
				disabled={saving || !description.trim()}
				class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
			>
				{saving ? 'Speichert...' : 'Speichern'}
			</button>
		</div>
	</div>
</div>
