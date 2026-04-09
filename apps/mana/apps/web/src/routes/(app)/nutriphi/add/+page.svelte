<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { useAllFavorites } from '$lib/modules/nutriphi/queries';
	import {
		mealMutations,
		photoMutations,
		textAnalysisMutations,
	} from '$lib/modules/nutriphi/mutations';
	import { MEAL_TYPE_LABELS, suggestMealType } from '$lib/modules/nutriphi/constants';
	import type { AnalyzedFood, MealType, NutritionData } from '$lib/modules/nutriphi/types';
	import { ArrowLeft } from '@mana/shared-icons';

	const allFavorites = useAllFavorites();
	let favorites = $derived(allFavorites.current ?? []);

	type Mode = 'text' | 'photo';
	let mode = $state<Mode>('text');

	let mealType = $state<MealType>(suggestMealType());
	let description = $state('');
	let calories = $state<number | null>(null);
	let protein = $state<number | null>(null);
	let carbohydrates = $state<number | null>(null);
	let fat = $state<number | null>(null);
	let fiber = $state<number | null>(null);
	let sugar = $state<number | null>(null);

	// Photo flow state
	let fileInput: HTMLInputElement | undefined = $state();
	let photoFile = $state<File | null>(null);
	let photoPreviewUrl = $state<string | null>(null);
	let photoMediaId = $state<string | null>(null);
	let photoUploadedUrl = $state<string | null>(null);
	let photoUploadedThumbnailUrl = $state<string | null>(null);
	let aiConfidence = $state<number | null>(null);
	let aiFoods = $state<AnalyzedFood[] | null>(null);
	let analyzing = $state(false);
	let analyzed = $state(false);

	// Text-mode AI suggestion state
	let textAnalyzing = $state(false);
	let textAiConfidence = $state<number | null>(null);
	let textAnalyzed = $state(false);

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

	function resetPhotoState() {
		if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
		photoFile = null;
		photoPreviewUrl = null;
		photoMediaId = null;
		photoUploadedUrl = null;
		photoUploadedThumbnailUrl = null;
		aiConfidence = null;
		aiFoods = null;
		analyzed = false;
	}

	function switchMode(next: Mode) {
		if (mode === next) return;
		mode = next;
		if (next === 'text') {
			resetPhotoState();
		} else {
			// Leaving text mode — drop the text-AI badge state, but keep
			// the description/nutrition values so the user doesn't lose them.
			textAnalyzed = false;
			textAiConfidence = null;
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
		photoFile = file;
		photoPreviewUrl = URL.createObjectURL(file);
		photoMediaId = null;
		photoUploadedUrl = null;
		photoUploadedThumbnailUrl = null;
		aiConfidence = null;
		aiFoods = null;
		analyzed = false;
		error = '';
	}

	async function handleAnalyzePhoto() {
		if (!photoFile) return;
		analyzing = true;
		error = '';
		try {
			const { upload, analysis } = await photoMutations.uploadAndAnalyze(photoFile);
			photoMediaId = upload.mediaId;
			photoUploadedUrl = upload.publicUrl;
			photoUploadedThumbnailUrl = upload.thumbnailUrl;

			// Prefill the same fields the text mode uses, so the user can review/edit.
			if (analysis.description) description = analysis.description;
			if (analysis.totalNutrition) {
				calories = analysis.totalNutrition.calories ?? null;
				protein = analysis.totalNutrition.protein ?? null;
				carbohydrates = analysis.totalNutrition.carbohydrates ?? null;
				fat = analysis.totalNutrition.fat ?? null;
				fiber = analysis.totalNutrition.fiber ?? null;
				sugar = analysis.totalNutrition.sugar ?? null;
			}
			aiConfidence = analysis.confidence ?? null;
			aiFoods = analysis.foods?.length ? analysis.foods : null;
			analyzed = true;
		} catch (err) {
			console.error('photo analysis failed:', err);
			error = 'KI-Analyse fehlgeschlagen. Bitte erneut versuchen.';
		} finally {
			analyzing = false;
		}
	}

	async function handleSuggestFromText() {
		if (!description.trim()) {
			error = 'Bitte zuerst eine Beschreibung eingeben';
			return;
		}
		textAnalyzing = true;
		error = '';
		try {
			const analysis = await textAnalysisMutations.analyze(description.trim());
			if (analysis.totalNutrition) {
				calories = analysis.totalNutrition.calories ?? null;
				protein = analysis.totalNutrition.protein ?? null;
				carbohydrates = analysis.totalNutrition.carbohydrates ?? null;
				fat = analysis.totalNutrition.fat ?? null;
				fiber = analysis.totalNutrition.fiber ?? null;
				sugar = analysis.totalNutrition.sugar ?? null;
			}
			textAiConfidence = analysis.confidence ?? null;
			lastSuggestedFor = description.trim();
			textAnalyzed = true;
		} catch (err) {
			console.error('text analysis failed:', err);
			error = 'KI-Vorschlag fehlgeschlagen. Bitte erneut versuchen.';
		} finally {
			textAnalyzing = false;
		}
	}

	function buildNutrition(): NutritionData | null {
		if (calories === null) return null;
		return {
			calories: calories ?? 0,
			protein: protein ?? 0,
			carbohydrates: carbohydrates ?? 0,
			fat: fat ?? 0,
			fiber: fiber ?? 0,
			sugar: sugar ?? 0,
		};
	}

	async function handleSubmit() {
		if (!description.trim()) {
			error = 'Bitte beschreibe die Mahlzeit';
			return;
		}
		if (mode === 'photo' && !photoMediaId) {
			error = 'Bitte zuerst die KI-Analyse ausführen';
			return;
		}

		saving = true;
		error = '';

		try {
			const nutrition = buildNutrition();
			if (mode === 'photo' && photoMediaId && photoUploadedUrl) {
				await mealMutations.createFromPhoto({
					mealType,
					description,
					nutrition,
					photoMediaId,
					photoUrl: photoUploadedUrl,
					photoThumbnailUrl: photoUploadedThumbnailUrl,
					confidence: aiConfidence ?? 0.8,
					foods: aiFoods,
				});
			} else {
				await mealMutations.create({
					mealType,
					description,
					nutrition,
				});
			}
			goto('/nutriphi');
		} catch {
			error = 'Mahlzeit konnte nicht gespeichert werden';
			saving = false;
		}
	}

	// If the user edits the description after a text-mode KI-suggestion, the
	// shown nutrition no longer corresponds to the typed text — drop the badge
	// (but keep the values, so they can still tweak them).
	let lastSuggestedFor = $state('');
	$effect(() => {
		if (textAnalyzed && description.trim() !== lastSuggestedFor) {
			textAnalyzed = false;
			textAiConfidence = null;
		}
	});

	let confidencePct = $derived(aiConfidence !== null ? Math.round(aiConfidence * 100) : null);
	let lowConfidence = $derived(aiConfidence !== null && aiConfidence < 0.5);
	let textConfidencePct = $derived(
		textAiConfidence !== null ? Math.round(textAiConfidence * 100) : null
	);
	let textLowConfidence = $derived(textAiConfidence !== null && textAiConfidence < 0.5);
</script>

<svelte:head>
	<title>Mahlzeit hinzufuegen - NutriPhi - Mana</title>
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

	<!-- Mode Toggle -->
	<div
		class="grid grid-cols-2 gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1"
	>
		<button
			type="button"
			onclick={() => switchMode('text')}
			class="rounded-md px-4 py-2 text-sm font-medium transition-colors
				{mode === 'text'
				? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
				: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}"
		>
			Text
		</button>
		<button
			type="button"
			onclick={() => switchMode('photo')}
			class="rounded-md px-4 py-2 text-sm font-medium transition-colors
				{mode === 'photo'
				? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
				: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}"
		>
			📷 Foto
		</button>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
			{error}
		</div>
	{/if}

	<!-- Photo Capture (only in photo mode) -->
	{#if mode === 'photo'}
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				capture="environment"
				class="hidden"
				onchange={handleFileSelect}
			/>

			{#if !photoPreviewUrl}
				<button
					type="button"
					onclick={() => fileInput?.click()}
					class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-12 transition-colors hover:border-[hsl(var(--primary)/0.5)]"
				>
					<span class="text-4xl">📷</span>
					<span class="text-sm font-medium text-[hsl(var(--foreground))]">
						Foto aufnehmen oder hochladen
					</span>
					<span class="text-xs text-[hsl(var(--muted-foreground))]">
						Die KI erkennt das Gericht und schätzt die Nährwerte
					</span>
				</button>
			{:else}
				<div class="space-y-3">
					<div class="relative overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
						<img src={photoPreviewUrl} alt="Mahlzeit" class="max-h-80 w-full object-contain" />
					</div>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
						>
							Anderes Foto
						</button>
						{#if !analyzed}
							<button
								type="button"
								onclick={handleAnalyzePhoto}
								disabled={analyzing}
								class="flex-[2] rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
							>
								{analyzing ? 'Analysiere…' : '✨ Mit KI analysieren'}
							</button>
						{:else}
							<button
								type="button"
								onclick={handleAnalyzePhoto}
								disabled={analyzing}
								class="flex-[2] rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-50"
							>
								{analyzing ? 'Analysiere…' : '🔄 Erneut analysieren'}
							</button>
						{/if}
					</div>

					{#if analyzed && confidencePct !== null}
						<div
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs
								{lowConfidence
								? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
								: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'}"
						>
							<span class="font-medium">KI-Analyse</span>
							<span>·</span>
							<span>{confidencePct}% sicher</span>
							{#if lowConfidence}
								<span class="ml-auto">⚠ Bitte Werte prüfen</span>
							{/if}
						</div>
					{/if}

					{#if analyzed && aiFoods && aiFoods.length > 0}
						<div
							class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3"
						>
							<p class="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
								Erkannte Bestandteile
							</p>
							<ul class="space-y-1">
								{#each aiFoods as food}
									<li class="flex items-baseline justify-between gap-2 text-xs">
										<span class="text-[hsl(var(--foreground))]">
											{food.name}
											{#if food.quantity}
												<span class="text-[hsl(var(--muted-foreground))]"> · {food.quantity}</span>
											{/if}
										</span>
										{#if food.calories != null}
											<span class="whitespace-nowrap text-[hsl(var(--muted-foreground))]">
												{food.calories} kcal
											</span>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Favorites (only in text mode) -->
	{#if mode === 'text' && favorites.length > 0}
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
			<div class="mb-2 flex items-center justify-between">
				<label for="meal-desc" class="block text-sm font-medium text-[hsl(var(--foreground))]">
					Beschreibung
					{#if mode === 'photo' && analyzed}
						<span class="text-xs font-normal text-[hsl(var(--muted-foreground))]"
							>(KI-Vorschlag, editierbar)</span
						>
					{/if}
				</label>
				{#if mode === 'text'}
					<button
						type="button"
						onclick={handleSuggestFromText}
						disabled={textAnalyzing || !description.trim()}
						class="rounded-md border border-[hsl(var(--border))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))] disabled:opacity-50"
					>
						{textAnalyzing ? 'Analysiere…' : '✨ KI-Vorschlag'}
					</button>
				{/if}
			</div>
			<textarea
				id="meal-desc"
				bind:value={description}
				placeholder="Was hast du gegessen?"
				rows="3"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			></textarea>
			{#if mode === 'text' && textAnalyzed && textConfidencePct !== null}
				<div
					class="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs
						{textLowConfidence
						? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
						: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'}"
				>
					<span class="font-medium">KI-Schätzung</span>
					<span>·</span>
					<span>{textConfidencePct}% sicher</span>
					{#if textLowConfidence}
						<span class="ml-auto">⚠ Bitte Werte prüfen</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Nutrition -->
		<div>
			<h3 class="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">
				Naehrwerte
				{#if mode === 'photo' && analyzed}
					<span class="text-xs font-normal text-[hsl(var(--muted-foreground))]"
						>(KI-Schätzung, editierbar)</span
					>
				{:else if mode === 'text' && textAnalyzed}
					<span class="text-xs font-normal text-[hsl(var(--muted-foreground))]"
						>(KI-Schätzung, editierbar)</span
					>
				{:else}
					<span class="text-[hsl(var(--muted-foreground))]">(optional)</span>
				{/if}
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
				disabled={saving || !description.trim() || (mode === 'photo' && !photoMediaId)}
				class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
			>
				{saving ? $_('common.saving') : $_('common.save')}
			</button>
		</div>
	</div>
</div>
