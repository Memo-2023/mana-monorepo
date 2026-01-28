<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { mealsStore } from '$lib/stores/meals.svelte';
	import { apiClient } from '$lib/api/client';
	import { suggestMealType, MEAL_TYPE_LABELS } from '@nutriphi/shared';
	import type { AIAnalysisResult } from '@nutriphi/shared';
	import { Camera, ArrowLeft, Loader2, Check, AlertCircle, X } from 'lucide-svelte';

	let inputType = $derived($page.url.searchParams.get('type') || 'photo');
	let mealType = $state(suggestMealType());
	let textInput = $state('');
	let imagePreview = $state<string | null>(null);
	let imageBase64 = $state<string | null>(null);
	let analyzing = $state(false);
	let analysisResult = $state<AIAnalysisResult | null>(null);
	let error = $state('');
	let saving = $state(false);

	// Redirect if not authenticated
	$effect(() => {
		if (!authStore.loading && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			imagePreview = result;
			// Extract base64 without data URL prefix
			imageBase64 = result.split(',')[1];
		};
		reader.readAsDataURL(file);
	}

	async function analyze() {
		error = '';
		analyzing = true;

		try {
			if (inputType === 'photo' && imageBase64) {
				analysisResult = await apiClient.post<AIAnalysisResult>('/analysis/photo', {
					imageBase64,
					mimeType: 'image/jpeg',
				});
			} else if (inputType === 'text' && textInput.trim()) {
				analysisResult = await apiClient.post<AIAnalysisResult>('/analysis/text', {
					description: textInput,
				});
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Analyse fehlgeschlagen';
		} finally {
			analyzing = false;
		}
	}

	async function saveMeal() {
		if (!analysisResult) return;

		saving = true;
		try {
			await mealsStore.addMeal({
				date: new Date().toISOString(),
				mealType,
				inputType: inputType as 'photo' | 'text',
				description: analysisResult.description,
				confidence: analysisResult.confidence,
				calories: analysisResult.totalNutrition.calories,
				protein: analysisResult.totalNutrition.protein,
				carbohydrates: analysisResult.totalNutrition.carbohydrates,
				fat: analysisResult.totalNutrition.fat,
				fiber: analysisResult.totalNutrition.fiber,
				sugar: analysisResult.totalNutrition.sugar,
			});
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		} finally {
			saving = false;
		}
	}
</script>

<div class="min-h-screen bg-[var(--color-background-page)]">
	<!-- Header -->
	<header
		class="sticky top-0 z-40 bg-[var(--color-background-page)]/95 backdrop-blur border-b border-[var(--color-border)]"
	>
		<div class="container mx-auto px-4 max-w-lg">
			<div class="flex items-center h-14">
				<button
					onclick={() => goto('/')}
					class="p-2 -ml-2 rounded-lg hover:bg-[var(--color-background-card)]"
				>
					<ArrowLeft class="w-5 h-5 text-[var(--color-text-secondary)]" />
				</button>
				<h1 class="ml-2 font-semibold text-[var(--color-text-primary)]">
					{inputType === 'photo' ? 'Foto analysieren' : 'Mahlzeit eingeben'}
				</h1>
			</div>
		</div>
	</header>

	<main class="container mx-auto px-4 py-6 max-w-lg">
		<!-- Meal Type Selector -->
		<div class="mb-6">
			<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
				Mahlzeit
			</label>
			<div class="grid grid-cols-4 gap-2">
				{#each ['breakfast', 'lunch', 'dinner', 'snack'] as type}
					<button
						type="button"
						onclick={() => (mealType = type as any)}
						class="py-2 px-3 rounded-lg text-sm font-medium transition-colors"
						class:bg-[var(--color-primary)]={mealType === type}
						class:text-white={mealType === type}
						class:bg-[var(--color-background-card)]={mealType !== type}
						class:text-[var(--color-text-secondary)]={mealType !== type}
					>
						{MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS]?.de}
					</button>
				{/each}
			</div>
		</div>

		{#if inputType === 'photo'}
			<!-- Photo Input -->
			<div class="mb-6">
				{#if imagePreview}
					<img
						src={imagePreview}
						alt="Vorschau"
						class="w-full aspect-square object-cover rounded-xl mb-4"
					/>
				{:else}
					<label
						class="block w-full aspect-square bg-[var(--color-background-card)] border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)] transition-colors"
					>
						<input
							type="file"
							accept="image/*"
							capture="environment"
							onchange={handleFileSelect}
							class="hidden"
						/>
						<div
							class="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]"
						>
							<Camera class="w-12 h-12 mb-2" />
							<span>Foto aufnehmen oder auswählen</span>
						</div>
					</label>
				{/if}
			</div>
		{:else}
			<!-- Text Input -->
			<div class="mb-6">
				<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
					Was hast du gegessen?
				</label>
				<textarea
					bind:value={textInput}
					rows="4"
					placeholder="z.B. Spaghetti Bolognese mit Parmesan und Salat"
					class="w-full px-4 py-3 bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
				></textarea>
			</div>
		{/if}

		{#if error}
			<div
				class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-400"
			>
				<AlertCircle class="w-4 h-4 flex-shrink-0" />
				<span class="flex-1 text-sm">{error}</span>
				<button
					onclick={() => (error = '')}
					class="p-1 hover:bg-red-500/20 rounded transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		{/if}

		{#if !analysisResult}
			<!-- Analyze Button -->
			<button
				onclick={analyze}
				disabled={analyzing ||
					(inputType === 'photo' && !imageBase64) ||
					(inputType === 'text' && !textInput.trim())}
				class="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
			>
				{#if analyzing}
					<Loader2 class="w-5 h-5 animate-spin" />
					Analysiere...
				{:else}
					Analysieren
				{/if}
			</button>
		{:else}
			<!-- Analysis Result -->
			<div
				class="bg-[var(--color-background-card)] rounded-xl p-4 border border-[var(--color-border)] mb-4"
			>
				<h3 class="font-semibold text-[var(--color-text-primary)] mb-2">
					{analysisResult.description}
				</h3>

				<!-- Detected Foods -->
				{#if analysisResult.foods.length > 0}
					<div class="mb-4">
						<p class="text-sm text-[var(--color-text-muted)] mb-2">Erkannte Lebensmittel:</p>
						<div class="flex flex-wrap gap-2">
							{#each analysisResult.foods as food}
								<span
									class="px-2 py-1 bg-[var(--color-background-elevated)] rounded-lg text-sm text-[var(--color-text-secondary)]"
								>
									{food.name} ({food.quantity})
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Nutrition -->
				<div class="grid grid-cols-2 gap-3">
					<div class="text-center p-3 bg-[var(--color-background-elevated)] rounded-lg">
						<div class="text-xl font-bold text-[var(--color-calories)]">
							{Math.round(analysisResult.totalNutrition.calories)}
						</div>
						<div class="text-xs text-[var(--color-text-muted)]">Kalorien</div>
					</div>
					<div class="text-center p-3 bg-[var(--color-background-elevated)] rounded-lg">
						<div class="text-xl font-bold text-[var(--color-protein)]">
							{Math.round(analysisResult.totalNutrition.protein)}g
						</div>
						<div class="text-xs text-[var(--color-text-muted)]">Protein</div>
					</div>
					<div class="text-center p-3 bg-[var(--color-background-elevated)] rounded-lg">
						<div class="text-xl font-bold text-[var(--color-carbs)]">
							{Math.round(analysisResult.totalNutrition.carbohydrates)}g
						</div>
						<div class="text-xs text-[var(--color-text-muted)]">Carbs</div>
					</div>
					<div class="text-center p-3 bg-[var(--color-background-elevated)] rounded-lg">
						<div class="text-xl font-bold text-[var(--color-fat)]">
							{Math.round(analysisResult.totalNutrition.fat)}g
						</div>
						<div class="text-xs text-[var(--color-text-muted)]">Fett</div>
					</div>
				</div>

				<!-- Confidence -->
				<p class="text-xs text-[var(--color-text-muted)] mt-3 text-center">
					Konfidenz: {Math.round(analysisResult.confidence * 100)}%
				</p>
			</div>

			<!-- Save Button -->
			<button
				onclick={saveMeal}
				disabled={saving}
				class="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
			>
				{#if saving}
					<Loader2 class="w-5 h-5 animate-spin" />
					Speichern...
				{:else}
					<Check class="w-5 h-5" />
					Speichern
				{/if}
			</button>

			<!-- Reset Button -->
			<button
				onclick={() => {
					analysisResult = null;
					imagePreview = null;
					imageBase64 = null;
					textInput = '';
				}}
				class="w-full mt-2 py-3 bg-[var(--color-background-card)] text-[var(--color-text-secondary)] font-medium rounded-xl hover:bg-[var(--color-background-elevated)] transition-colors"
			>
				Neu analysieren
			</button>
		{/if}
	</main>
</div>
