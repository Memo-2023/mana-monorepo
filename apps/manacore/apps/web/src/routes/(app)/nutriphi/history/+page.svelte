<script lang="ts">
	import {
		useAllMeals,
		useAllGoals,
		filterByDate,
		sumNutrition,
		getDailySummary,
		searchMeals,
	} from '$lib/modules/nutriphi/queries';
	import { MEAL_TYPE_LABELS } from '$lib/modules/nutriphi/constants';
	import { db } from '$lib/data/database';
	import type { MealWithNutrition } from '$lib/modules/nutriphi/types';
	import { ArrowLeft, MagnifyingGlass, Trash } from '@manacore/shared-icons';

	const allMeals = useAllMeals();
	const allGoals = useAllGoals();

	let meals = $derived(allMeals.current ?? []);
	let goals = $derived((allGoals.current ?? [])[0] ?? null);

	let searchQuery = $state('');
	let selectedDate = $state('');

	// Group meals by date, sorted descending
	let filteredMeals = $derived.by(() => {
		let result = meals;
		if (searchQuery) result = searchMeals(result, searchQuery);
		if (selectedDate) result = filterByDate(result, selectedDate);
		return result;
	});

	let groupedByDate = $derived.by(() => {
		const groups: Record<string, MealWithNutrition[]> = {};
		for (const meal of filteredMeals) {
			const dateKey = String(meal.date).split('T')[0];
			if (!groups[dateKey]) groups[dateKey] = [];
			groups[dateKey].push(meal);
		}
		return Object.entries(groups)
			.sort(([a], [b]) => b.localeCompare(a))
			.map(([date, meals]) => ({
				date,
				meals: meals.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				),
				totalCalories: sumNutrition(meals).calories,
			}));
	});

	function formatDateHeader(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split('T')[0];

		if (dateStr === todayStr) return 'Heute';
		if (dateStr === yesterdayStr) return 'Gestern';

		return date.toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});
	}

	function getMealTypeLabel(type: string): string {
		return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS]?.de ?? type;
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	async function deleteMeal(id: string) {
		if (!confirm('Mahlzeit loeschen?')) return;
		await db.table('meals').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	}
</script>

<svelte:head>
	<title>Verlauf - NutriPhi - ManaCore</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<a
			href="/nutriphi"
			class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<ArrowLeft class="h-4 w-4" />
			Zurueck
		</a>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Mahlzeiten-Verlauf</h1>
		<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
			{meals.length} Eintraege insgesamt
		</p>
	</div>

	<!-- Filters -->
	<div class="flex gap-3">
		<div class="relative flex-1">
			<MagnifyingGlass
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Mahlzeiten durchsuchen..."
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>
		<input
			type="date"
			bind:value={selectedDate}
			class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
		/>
		{#if selectedDate}
			<button
				onclick={() => (selectedDate = '')}
				class="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
			>
				Reset
			</button>
		{/if}
	</div>

	<!-- Grouped Meals -->
	{#if groupedByDate.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-5xl">📋</span>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">Keine Eintraege</h2>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{searchQuery || selectedDate
					? 'Keine Ergebnisse fuer diese Filter.'
					: 'Noch keine Mahlzeiten erfasst.'}
			</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each groupedByDate as group (group.date)}
				<div>
					<div class="mb-2 flex items-center justify-between">
						<h3 class="font-semibold text-[hsl(var(--foreground))]">
							{formatDateHeader(group.date)}
						</h3>
						<span class="text-sm text-[hsl(var(--muted-foreground))]">
							{Math.round(group.totalCalories)} kcal
						</span>
					</div>

					<div class="space-y-2">
						{#each group.meals as meal (meal.id)}
							<div
								class="group flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
							>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]"
										>
											{getMealTypeLabel(meal.mealType)}
										</span>
										<span class="text-xs text-[hsl(var(--muted-foreground))]">
											{formatTime(meal.createdAt)}
										</span>
									</div>
									<p class="mt-1 text-sm text-[hsl(var(--foreground))] truncate">
										{meal.description}
									</p>
								</div>

								{#if meal.nutrition}
									<span class="whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
										{meal.nutrition.calories} kcal
									</span>
								{/if}

								<button
									onclick={() => deleteMeal(meal.id)}
									class="rounded p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
									title="Loeschen"
								>
									<Trash size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
