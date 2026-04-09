<!--
  NutriPhi — Workbench ListView
  Today's nutrition progress with meal log + inline quick-add bar
  (text input + photo upload, both write straight to mealMutations).
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import { toast } from '$lib/stores/toast.svelte';
	import { mealMutations, photoMutations } from './mutations';
	import { suggestMealType } from './constants';
	import type { LocalMeal, LocalGoal } from './types';

	const mealsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalMeal>('meals').toArray();
		const visible = all.filter((m) => !m.deletedAt);
		return decryptRecords('meals', visible);
	}, [] as LocalMeal[]);

	// NOTE: the table is `goals`, not `nutriphiGoals`. The unified Mana DB
	// only prefixes table names when two modules collide; goals is unique.
	const goalsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalGoal>('goals').toArray();
		return all.filter((g) => !g.deletedAt);
	}, [] as LocalGoal[]);

	const meals = $derived(mealsQuery.value);
	const goals = $derived(goalsQuery.value);

	const todayStr = new Date().toISOString().split('T')[0];
	const todayMeals = $derived(meals.filter((m) => m.date === todayStr));
	const goal = $derived(goals[0]);

	const totalCalories = $derived(
		todayMeals.reduce((sum, m) => sum + (m.nutrition?.calories ?? 0), 0)
	);
	const totalProtein = $derived(
		todayMeals.reduce((sum, m) => sum + (m.nutrition?.protein ?? 0), 0)
	);

	const calorieProgress = $derived(
		goal?.dailyCalories ? Math.min(100, (totalCalories / goal.dailyCalories) * 100) : 0
	);

	const mealTypeLabels: Record<string, string> = {
		breakfast: 'Frühstück',
		lunch: 'Mittagessen',
		dinner: 'Abendessen',
		snack: 'Snack',
	};

	// ─── Quick-add state ──────────────────────────────────────────
	let quickText = $state('');
	let quickSaving = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();
	let photoUploading = $state(false);

	async function submitText() {
		const text = quickText.trim();
		if (!text || quickSaving) return;
		quickSaving = true;
		try {
			await mealMutations.create({
				mealType: suggestMealType(),
				description: text,
			});
			quickText = '';
		} catch (err) {
			console.error('quick add failed:', err);
			toast.error('Mahlzeit konnte nicht gespeichert werden');
		} finally {
			quickSaving = false;
		}
	}

	function onTextKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void submitText();
		}
	}

	async function onPhotoSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoUploading = true;
		try {
			const { upload, analysis } = await photoMutations.uploadAndAnalyze(file);
			const nutrition = analysis.totalNutrition
				? {
						calories: analysis.totalNutrition.calories ?? 0,
						protein: analysis.totalNutrition.protein ?? 0,
						carbohydrates: analysis.totalNutrition.carbohydrates ?? 0,
						fat: analysis.totalNutrition.fat ?? 0,
						fiber: analysis.totalNutrition.fiber ?? 0,
						sugar: analysis.totalNutrition.sugar ?? 0,
					}
				: null;
			await mealMutations.createFromPhoto({
				mealType: suggestMealType(),
				description: analysis.description ?? 'Mahlzeit aus Foto',
				nutrition,
				photoMediaId: upload.mediaId,
				photoUrl: upload.publicUrl,
				photoThumbnailUrl: upload.thumbnailUrl,
				confidence: analysis.confidence ?? 0.8,
				foods: analysis.foods?.length ? analysis.foods : null,
			});
			const pct =
				analysis.confidence != null ? ` · KI ${Math.round(analysis.confidence * 100)}%` : '';
			toast.success(`📷 Mahlzeit hinzugefügt${pct}`);
		} catch (err) {
			console.error('photo quick add failed:', err);
			toast.error('Foto-Analyse fehlgeschlagen');
		} finally {
			photoUploading = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<BaseListView items={todayMeals} getKey={(m) => m.id} emptyTitle="Noch keine Mahlzeiten heute">
	{#snippet toolbar()}
		<!-- Calorie progress -->
		<div class="text-center">
			<p class="text-2xl font-light text-white/90">{Math.round(totalCalories)}</p>
			<p class="text-xs text-white/40">
				{#if goal}
					von {goal.dailyCalories} kcal
				{:else}
					kcal heute
				{/if}
			</p>
			{#if goal}
				<div class="mx-auto mt-2 h-1.5 w-32 rounded-full bg-white/10">
					<div
						class="h-full rounded-full transition-all {calorieProgress >= 100
							? 'bg-green-400'
							: 'bg-blue-400'}"
						style="width: {calorieProgress}%"
					></div>
				</div>
			{/if}
		</div>

		<!-- Quick-add bar -->
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value={quickText}
				onkeydown={onTextKeydown}
				placeholder="Was hast du gegessen?"
				disabled={quickSaving}
				class="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none disabled:opacity-50"
			/>
			<button
				type="button"
				onclick={() => void submitText()}
				disabled={!quickText.trim() || quickSaving}
				aria-label="Mahlzeit speichern"
				title="Speichern"
				class="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
			>
				{quickSaving ? '…' : '↵'}
			</button>
			<button
				type="button"
				onclick={() => fileInput?.click()}
				disabled={photoUploading}
				aria-label="Foto aufnehmen"
				title="Foto"
				class="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
			>
				{photoUploading ? '…' : '📷'}
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				capture="environment"
				class="hidden"
				onchange={onPhotoSelected}
			/>
		</div>
	{/snippet}

	{#snippet header()}
		<span class="mx-auto">{Math.round(totalProtein)}g Protein · {todayMeals.length} Mahlzeiten</span
		>
	{/snippet}

	{#snippet item(meal)}
		<a
			href="/nutriphi/{meal.id}"
			class="mb-1 block min-h-[44px] rounded-md px-3 py-2 transition-colors hover:bg-white/5"
		>
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<span class="text-xs text-white/50"
							>{mealTypeLabels[meal.mealType] ?? meal.mealType}</span
						>
						{#if meal.inputType === 'photo'}
							<span class="text-xs text-white/40">📷</span>
						{/if}
					</div>
					<p class="truncate text-sm text-white/70">{meal.description}</p>
				</div>
				{#if meal.photoThumbnailUrl || meal.photoUrl}
					<img
						src={meal.photoThumbnailUrl ?? meal.photoUrl}
						alt={meal.description}
						class="h-10 w-10 flex-shrink-0 rounded object-cover"
						loading="lazy"
					/>
				{/if}
				{#if meal.nutrition}
					<span class="whitespace-nowrap text-xs text-white/50"
						>{Math.round(meal.nutrition.calories)} kcal</span
					>
				{/if}
			</div>
		</a>
	{/snippet}
</BaseListView>
