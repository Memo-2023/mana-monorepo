<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { loadMealById } from '$lib/modules/food/queries';
	import { mealMutations, photoMutations } from '$lib/modules/food/mutations';
	import { MEAL_TYPE_LABELS, NUTRIENT_INFO } from '$lib/modules/food/constants';
	import type { MealType, MealWithNutrition, NutritionData } from '$lib/modules/food/types';
	import { ArrowLeft, Trash } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { locale } from 'svelte-i18n';

	// Inline the live query so the closure captures page.params.id directly
	// (matches the plants DetailView pattern).
	const mealQuery = useLiveQueryWithDefault(
		() => (page.params.id ? loadMealById(page.params.id) : Promise.resolve(null)),
		null as MealWithNutrition | null
	);
	let meal = $derived(mealQuery.value);

	const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

	// Edit-mode state
	let editing = $state(false);
	let editMealType = $state<MealType>('breakfast');
	let editDescription = $state('');
	let editCalories = $state<number | null>(null);
	let editProtein = $state<number | null>(null);
	let editCarbs = $state<number | null>(null);
	let editFat = $state<number | null>(null);
	let editFiber = $state<number | null>(null);
	let editSugar = $state<number | null>(null);

	let saving = $state(false);
	let reanalyzing = $state(false);
	let lightboxOpen = $state(false);
	let confirmDelete = $state(false);
	let error = $state('');

	function startEdit() {
		if (!meal) return;
		editMealType = meal.mealType;
		editDescription = meal.description;
		editCalories = meal.nutrition?.calories ?? null;
		editProtein = meal.nutrition?.protein ?? null;
		editCarbs = meal.nutrition?.carbohydrates ?? null;
		editFat = meal.nutrition?.fat ?? null;
		editFiber = meal.nutrition?.fiber ?? null;
		editSugar = meal.nutrition?.sugar ?? null;
		editing = true;
		error = '';
	}

	function cancelEdit() {
		editing = false;
		error = '';
	}

	async function saveEdit() {
		if (!meal) return;
		if (!editDescription.trim()) {
			error = $_('food.detail.error_description_required');
			return;
		}
		saving = true;
		error = '';
		try {
			const nutrition: NutritionData | null =
				editCalories !== null
					? {
							calories: editCalories ?? 0,
							protein: editProtein ?? 0,
							carbohydrates: editCarbs ?? 0,
							fat: editFat ?? 0,
							fiber: editFiber ?? 0,
							sugar: editSugar ?? 0,
						}
					: null;
			await mealMutations.update(meal.id, {
				mealType: editMealType,
				description: editDescription,
				nutrition,
			});
			editing = false;
		} catch (err) {
			console.error('meal update failed:', err);
			error = $_('food.detail.error_save_failed');
		} finally {
			saving = false;
		}
	}

	async function handleReanalyze() {
		if (!meal?.photoUrl) return;
		reanalyzing = true;
		error = '';
		try {
			const analysis = await photoMutations.analyze(meal.photoUrl);
			const nutrition: NutritionData | null = analysis.totalNutrition
				? {
						calories: analysis.totalNutrition.calories ?? 0,
						protein: analysis.totalNutrition.protein ?? 0,
						carbohydrates: analysis.totalNutrition.carbohydrates ?? 0,
						fat: analysis.totalNutrition.fat ?? 0,
						fiber: analysis.totalNutrition.fiber ?? 0,
						sugar: analysis.totalNutrition.sugar ?? 0,
					}
				: null;
			await mealMutations.update(meal.id, {
				description: analysis.description ?? meal.description,
				nutrition,
			});
		} catch (err) {
			console.error('re-analyze failed:', err);
			error = $_('food.detail.error_analyze_failed');
		} finally {
			reanalyzing = false;
		}
	}

	async function handleDelete() {
		if (!meal) return;
		try {
			await mealMutations.delete(meal.id);
			goto('/food');
		} catch (err) {
			console.error('delete failed:', err);
			error = $_('food.detail.error_delete_failed');
			confirmDelete = false;
		}
	}

	function formatDateTime(dateString: string): string {
		const lang = get(locale) ?? 'de';
		return new Date(dateString).toLocaleString(lang, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getMealTypeLabel(type: string): string {
		return MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS]?.de ?? type;
	}
</script>

<svelte:head>
	<title
		>{$_('food.detail.page_title_html', {
			values: { description: meal?.description ?? $_('food.detail.untitled_fallback') },
		})}</title
	>
</svelte:head>

<RoutePage appId="food" backHref="/food" title={$_('food.detail.untitled_fallback')}>
	<div class="mx-auto max-w-2xl space-y-6">
		<a
			href="/food"
			class="inline-flex items-center gap-2 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
		>
			<ArrowLeft class="h-4 w-4" />
			{$_('food.detail.back')}
		</a>

		{#if !meal}
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-12 text-center"
			>
				<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
					{$_('food.detail.not_found')}
				</p>
			</div>
		{:else}
			{#if error}
				<div
					class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<!-- Photo (clickable for lightbox) -->
			{#if meal.photoUrl}
				<button
					type="button"
					onclick={() => (lightboxOpen = true)}
					class="block w-full overflow-hidden rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))] transition-opacity hover:opacity-95"
					aria-label={$_('food.detail.lightbox_open_aria')}
				>
					<img src={meal.photoUrl} alt={meal.description} class="max-h-96 w-full object-contain" />
				</button>
			{/if}

			<!-- Header / Metadata -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-6"
			>
				<div class="mb-3 flex items-center gap-2">
					<span
						class="rounded-full bg-[hsl(var(--color-muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
					>
						{getMealTypeLabel(meal.mealType)}
					</span>
					<span class="text-xs text-[hsl(var(--color-muted-foreground))]">
						{formatDateTime(meal.createdAt)}
					</span>
					{#if meal.inputType === 'photo'}
						<span class="text-xs text-[hsl(var(--color-muted-foreground))]">📷</span>
					{/if}
					{#if meal.confidence > 0 && meal.confidence < 1}
						<span class="ml-auto text-xs text-[hsl(var(--color-muted-foreground))]">
							KI {Math.round(meal.confidence * 100)}%
						</span>
					{/if}
				</div>

				{#if !editing}
					<h1 class="text-xl font-semibold text-[hsl(var(--color-foreground))]">
						{meal.description}
					</h1>
					{#if meal.nutrition}
						<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div class="rounded-lg bg-[hsl(var(--color-muted)/0.4)] p-3">
								<div class="flex items-center gap-1.5">
									<div
										class="h-2 w-2 rounded-full"
										style="background-color: {NUTRIENT_INFO.calories.color}"
									></div>
									<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
										>{$_('food.nutrition.calories')}</span
									>
								</div>
								<p class="mt-1 text-lg font-bold text-[hsl(var(--color-foreground))]">
									{meal.nutrition.calories}
									<span class="text-xs font-normal text-[hsl(var(--color-muted-foreground))]"
										>kcal</span
									>
								</p>
							</div>
							<div class="rounded-lg bg-[hsl(var(--color-muted)/0.4)] p-3">
								<div class="flex items-center gap-1.5">
									<div
										class="h-2 w-2 rounded-full"
										style="background-color: {NUTRIENT_INFO.protein.color}"
									></div>
									<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
										>{$_('food.nutrition.protein')}</span
									>
								</div>
								<p class="mt-1 text-lg font-bold text-[hsl(var(--color-foreground))]">
									{meal.nutrition.protein}<span
										class="text-xs font-normal text-[hsl(var(--color-muted-foreground))]">g</span
									>
								</p>
							</div>
							<div class="rounded-lg bg-[hsl(var(--color-muted)/0.4)] p-3">
								<div class="flex items-center gap-1.5">
									<div
										class="h-2 w-2 rounded-full"
										style="background-color: {NUTRIENT_INFO.carbohydrates.color}"
									></div>
									<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
										>{$_('food.nutrition.carbs')}</span
									>
								</div>
								<p class="mt-1 text-lg font-bold text-[hsl(var(--color-foreground))]">
									{meal.nutrition.carbohydrates}<span
										class="text-xs font-normal text-[hsl(var(--color-muted-foreground))]">g</span
									>
								</p>
							</div>
							<div class="rounded-lg bg-[hsl(var(--color-muted)/0.4)] p-3">
								<div class="flex items-center gap-1.5">
									<div
										class="h-2 w-2 rounded-full"
										style="background-color: {NUTRIENT_INFO.fat.color}"
									></div>
									<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
										>{$_('food.nutrition.fat')}</span
									>
								</div>
								<p class="mt-1 text-lg font-bold text-[hsl(var(--color-foreground))]">
									{meal.nutrition.fat}<span
										class="text-xs font-normal text-[hsl(var(--color-muted-foreground))]">g</span
									>
								</p>
							</div>
						</div>
						<div
							class="mt-2 grid grid-cols-2 gap-3 text-xs text-[hsl(var(--color-muted-foreground))]"
						>
							<div>
								{$_('food.detail.fiber_with_value', {
									values: { n: meal.nutrition.fiber },
								})}
							</div>
							<div>
								{$_('food.detail.sugar_with_value', {
									values: { n: meal.nutrition.sugar },
								})}
							</div>
						</div>
					{/if}

					<div class="mt-5 flex flex-wrap gap-2">
						<button
							type="button"
							onclick={startEdit}
							class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]"
						>
							{$_('food.common.edit')}
						</button>
						{#if meal.inputType === 'photo' && meal.photoUrl}
							<button
								type="button"
								onclick={handleReanalyze}
								disabled={reanalyzing}
								class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))] disabled:opacity-50"
							>
								{reanalyzing
									? $_('food.detail.action_reanalyzing')
									: $_('food.detail.action_reanalyze')}
							</button>
						{/if}
						{#if !confirmDelete}
							<button
								type="button"
								onclick={() => (confirmDelete = true)}
								class="ml-auto inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
							>
								<Trash size={14} />
								{$_('food.common.delete')}
							</button>
						{:else}
							<div class="ml-auto flex items-center gap-2">
								<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
									>{$_('food.detail.confirm_sure')}</span
								>
								<button
									type="button"
									onclick={() => (confirmDelete = false)}
									class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-xs text-[hsl(var(--color-foreground))]"
								>
									{$_('food.common.cancel')}
								</button>
								<button
									type="button"
									onclick={handleDelete}
									class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
								>
									{$_('food.common.delete')}
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Edit form -->
					<div class="space-y-5">
						<div>
							<span class="mb-2 block text-sm font-medium text-[hsl(var(--color-foreground))]">
								{$_('food.detail.label_meal_type')}
							</span>
							<div class="grid grid-cols-4 gap-2">
								{#each mealTypes as type}
									<button
										type="button"
										onclick={() => (editMealType = type)}
										class="rounded-lg border-2 px-3 py-2 text-sm transition-colors {editMealType ===
										type
											? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.05)] font-medium'
											: 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-primary)/0.3)]'}"
									>
										{MEAL_TYPE_LABELS[type].de}
									</button>
								{/each}
							</div>
						</div>

						<div>
							<label
								for="edit-desc"
								class="mb-2 block text-sm font-medium text-[hsl(var(--color-foreground))]"
							>
								{$_('food.detail.label_description')}
							</label>
							<textarea
								id="edit-desc"
								bind:value={editDescription}
								rows="3"
								class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-3 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
							></textarea>
						</div>

						<div>
							<h3 class="mb-3 text-sm font-medium text-[hsl(var(--color-foreground))]">
								{$_('food.detail.section_nutrients')}
							</h3>
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
								<div>
									<label
										for="edit-cal"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_calories_kcal')}
									</label>
									<input
										id="edit-cal"
										type="number"
										bind:value={editCalories}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
								<div>
									<label
										for="edit-prot"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_protein_g')}
									</label>
									<input
										id="edit-prot"
										type="number"
										bind:value={editProtein}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
								<div>
									<label
										for="edit-carbs"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_carbs_g')}
									</label>
									<input
										id="edit-carbs"
										type="number"
										bind:value={editCarbs}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
								<div>
									<label
										for="edit-fat"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_fat_g')}
									</label>
									<input
										id="edit-fat"
										type="number"
										bind:value={editFat}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
								<div>
									<label
										for="edit-fiber"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_fiber_g')}
									</label>
									<input
										id="edit-fiber"
										type="number"
										bind:value={editFiber}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
								<div>
									<label
										for="edit-sugar"
										class="mb-1 block text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{$_('food.detail.label_sugar_g')}
									</label>
									<input
										id="edit-sugar"
										type="number"
										bind:value={editSugar}
										min="0"
										class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
									/>
								</div>
							</div>
						</div>

						<div class="flex gap-3">
							<button
								type="button"
								onclick={cancelEdit}
								class="flex-1 rounded-lg border border-[hsl(var(--color-border))] px-4 py-3 text-sm font-medium text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]"
							>
								{$_('food.common.cancel')}
							</button>
							<button
								type="button"
								onclick={saveEdit}
								disabled={saving || !editDescription.trim()}
								class="flex-1 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90 disabled:opacity-50"
							>
								{saving ? $_('food.detail.action_saving') : $_('food.common.save')}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Foods Breakdown -->
			{#if !editing && meal.foods && meal.foods.length > 0}
				<div
					class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-6"
				>
					<h2 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">
						{$_('food.detail.section_foods')}
					</h2>
					<ul class="space-y-2">
						{#each meal.foods as food}
							<li
								class="flex items-baseline justify-between gap-2 border-b border-[hsl(var(--color-border))] pb-2 last:border-b-0 last:pb-0"
							>
								<div class="text-sm text-[hsl(var(--color-foreground))]">
									{food.name}
									{#if food.quantity}
										<span class="text-xs text-[hsl(var(--color-muted-foreground))]">
											· {food.quantity}</span
										>
									{/if}
								</div>
								{#if food.calories != null}
									<span class="whitespace-nowrap text-sm text-[hsl(var(--color-muted-foreground))]">
										{food.calories} kcal
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Lightbox modal -->
	{#if lightboxOpen && meal?.photoUrl}
		<button
			type="button"
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
			onclick={() => (lightboxOpen = false)}
			aria-label={$_('food.detail.lightbox_close_aria')}
		>
			<img
				src={meal.photoUrl}
				alt={meal.description}
				class="max-h-full max-w-full object-contain"
			/>
			<span class="absolute right-4 top-4 text-3xl text-foreground">×</span>
		</button>
	{/if}
</RoutePage>
