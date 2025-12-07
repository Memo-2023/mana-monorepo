<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { models, selectedModel, isLoadingModels } from '$lib/stores/models';
	import { isGenerating, generationProgress, generationError } from '$lib/stores/generate';
	import { isSidebarCollapsed } from '$lib/stores/sidebar';
	import { getActiveModels } from '$lib/api/models';
	import { generateImageAsync, subscribeToGenerationUpdates } from '$lib/api/generate-async';
	import { showToast } from '$lib/stores/toast';
	import { onMount } from 'svelte';
	import AdvancedSettingsModal, {
		type AdvancedSettings,
		type AspectRatio,
	} from '$lib/components/generate/AdvancedSettingsModal.svelte';
	import { Gear, Lightning, X } from '@manacore/shared-icons';

	interface Props {
		onGenerated?: () => void;
	}

	let { onGenerated }: Props = $props();

	let prompt = $state('');
	let isExpanded = $state(false);
	let selectedModelId = $state('');
	let showAdvancedSettings = $state(false);

	// Advanced settings with defaults
	let advancedSettings = $state<AdvancedSettings>({
		imageCount: 1,
		aspectRatio: { label: 'Quadratisch', value: 'square', width: 1024, height: 1024 },
		steps: 50,
		guidanceScale: 7.5,
	});

	// Update advanced settings when model changes
	$effect(() => {
		if ($selectedModel) {
			// Update defaults from model
			advancedSettings.steps = $selectedModel.defaultSteps || 50;
			advancedSettings.guidanceScale = $selectedModel.defaultGuidanceScale || 7.5;
		}
	});

	onMount(async () => {
		await loadModels();
	});

	async function loadModels() {
		isLoadingModels.set(true);
		try {
			const data = await getActiveModels();
			models.set(data);
			// Select default model
			const defaultModel = data.find((m) => m.isDefault) || data[0];
			if (defaultModel) {
				selectedModelId = defaultModel.id;
				selectedModel.set(defaultModel);
			}
		} catch (error) {
			console.error('Error loading models:', error);
			showToast('Fehler beim Laden der Modelle', 'error');
		} finally {
			isLoadingModels.set(false);
		}
	}

	function handleModelChange() {
		const model = $models.find((m) => m.id === selectedModelId);
		selectedModel.set(model || null);
	}

	async function handleQuickGenerate() {
		if (!authStore.user || !selectedModelId || !prompt.trim()) return;

		isGenerating.set(true);
		generationError.set('');
		generationProgress.set('Generiere...');

		try {
			// Generate images based on imageCount
			const totalImages = advancedSettings.imageCount;
			let completedImages = 0;

			for (let i = 0; i < totalImages; i++) {
				generationProgress.set(`Generiere Bild ${i + 1}/${totalImages}...`);

				// Start generation with new async API
				const { generationId } = await generateImageAsync({
					prompt: prompt.trim(),
					modelId: selectedModelId,
					width: advancedSettings.aspectRatio.width,
					height: advancedSettings.aspectRatio.height,
					steps: advancedSettings.steps,
					guidanceScale: advancedSettings.guidanceScale,
				});

				// Wait for completion using realtime subscription
				await new Promise<void>((resolve, reject) => {
					const unsubscribe = subscribeToGenerationUpdates(generationId, (progress) => {
						// Update progress display
						if (progress.status === 'pending' || progress.status === 'queued') {
							generationProgress.set(`Warte auf Verarbeitung... (${i + 1}/${totalImages})`);
						} else if (progress.status === 'processing') {
							generationProgress.set(`Verarbeite Bild ${i + 1}/${totalImages}...`);
						} else if (progress.status === 'completed') {
							unsubscribe();
							resolve();
						} else if (progress.status === 'failed') {
							unsubscribe();
							reject(new Error(progress.error || 'Bild-Generierung fehlgeschlagen'));
						}
					});

					// Timeout after 10 minutes
					setTimeout(() => {
						unsubscribe();
						reject(new Error('Timeout - bitte später in der Galerie prüfen'));
					}, 600000);
				});

				completedImages++;
			}

			// Success
			generationProgress.set('Fertig!');
			showToast(
				totalImages > 1
					? `${totalImages} Bilder erfolgreich generiert!`
					: 'Bild erfolgreich generiert!',
				'success'
			);
			prompt = '';
			isExpanded = false;
			onGenerated?.();
		} catch (error) {
			console.error('Generation error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Generierung fehlgeschlagen';
			generationError.set(errorMessage);
			showToast(errorMessage, 'error');
		} finally {
			setTimeout(() => {
				isGenerating.set(false);
				generationProgress.set('');
			}, 1000);
		}
	}

	function handleSettingsUpdate(settings: AdvancedSettings) {
		advancedSettings = settings;
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleQuickGenerate();
		}
	}

	const canGenerate = $derived(
		!$isGenerating && !$isLoadingModels && prompt.trim().length > 0 && selectedModelId.length > 0
	);

	// Check if advanced settings differ from defaults
	const hasCustomSettings = $derived(
		advancedSettings.imageCount !== 1 ||
			advancedSettings.aspectRatio.value !== 'square' ||
			advancedSettings.steps !== 50 ||
			advancedSettings.guidanceScale !== 7.5
	);
</script>

<!-- Quick Generate Bar - Floating -->
<div
	class="fixed z-40 transition-all duration-300 {isExpanded
		? 'bottom-0 left-0 right-0 lg:bottom-8 lg:right-auto lg:-translate-x-1/2 ' +
			($isSidebarCollapsed ? 'lg:left-1/2' : 'lg:left-[calc(50%+8.5rem)]')
		: 'bottom-8 right-8'}"
>
	{#if isExpanded}
		<div class="animate-in fade-in slide-in-from-bottom-4 duration-200 lg:w-[900px]">
			<!-- Main Bar (expanded) -->
			<div
				class="rounded-t-3xl border-t border-gray-200/50 bg-white/80 shadow-2xl backdrop-blur-xl lg:rounded-3xl lg:border dark:border-gray-700/50 dark:bg-gray-900/80"
			>
				<div class="p-4">
					<!-- Error Display -->
					{#if $generationError}
						<div class="mb-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
							<p class="text-sm text-red-800 dark:text-red-300">{$generationError}</p>
						</div>
					{/if}

					<!-- Progress Display -->
					{#if $isGenerating}
						<div class="mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
							<div class="flex items-center">
								<div
									class="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent dark:border-blue-400"
								></div>
								<p class="text-sm text-blue-800 dark:text-blue-300">{$generationProgress}</p>
							</div>
						</div>
					{/if}

					<!-- Single Row Layout -->
					<div class="flex items-center gap-3">
						<!-- Model Selection -->
						<select
							id="quick-model"
							bind:value={selectedModelId}
							onchange={handleModelChange}
							disabled={$isGenerating || $isLoadingModels}
							class="w-48 flex-shrink-0 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
						>
							{#if $isLoadingModels}
								<option value="">Lade Modelle...</option>
							{:else if $models.length === 0}
								<option value="">Keine Modelle verfügbar</option>
							{:else}
								{#each $models as model}
									<option value={model.id}>
										{model.name}
										{model.isDefault ? '(Standard)' : ''}
									</option>
								{/each}
							{/if}
						</select>

						<!-- Input -->
						<div class="relative h-12 flex-1">
							<textarea
								bind:value={prompt}
								onkeydown={handleKeyPress}
								disabled={$isGenerating}
								placeholder="Beschreibe dein Bild..."
								rows="1"
								class="h-full w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-400 dark:disabled:bg-gray-700"
								style="max-height: 120px;"
							></textarea>

							<!-- Character count hint -->
							{#if prompt.length > 400}
								<span
									class="absolute bottom-2 right-3 text-xs text-orange-600 dark:text-orange-400"
								>
									{prompt.length}/500
								</span>
							{/if}
						</div>

						<!-- Settings Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								showAdvancedSettings = true;
							}}
							disabled={$isGenerating}
							class="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100/80 text-gray-600 backdrop-blur-xl transition-all hover:bg-gray-200/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80"
							aria-label="Einstellungen"
						>
							<Gear size={20} />
							{#if hasCustomSettings}
								<span class="absolute right-0 top-0 flex h-3 w-3">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
									></span>
									<span
										class="relative inline-flex h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-500"
									></span>
								</span>
							{/if}
						</button>

						<!-- Generate Button -->
						<button
							onclick={handleQuickGenerate}
							disabled={!canGenerate}
							class="flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-2xl px-6 backdrop-blur-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 {canGenerate
								? 'bg-blue-600/90 hover:bg-blue-700/90 dark:bg-blue-500/90 dark:hover:bg-blue-600/90'
								: 'bg-gray-300/80 dark:bg-gray-700/80'}"
							aria-label="Generieren"
						>
							{#if $isGenerating}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
								></div>
							{:else}
								<Lightning size={20} weight="fill" class="text-white" />
								<span class="text-sm font-medium text-white">Generieren</span>
							{/if}
						</button>

						<!-- Close Button -->
						<button
							onclick={() => (isExpanded = false)}
							disabled={$isGenerating}
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100/80 text-gray-600 backdrop-blur-xl transition-all hover:bg-gray-200/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80"
							aria-label="Schließen"
						>
							<X size={20} weight="bold" />
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Collapsed Button (bottom right) -->
		<div class="animate-in fade-in slide-in-from-bottom-4 hidden duration-200 lg:block">
			<button
				onclick={() => (isExpanded = true)}
				disabled={$isGenerating}
				class="flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600/90 px-6 text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:bg-blue-700/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500/90 dark:hover:bg-blue-600/90"
				aria-label="Generieren"
			>
				<Lightning size={24} weight="fill" />
				<span class="text-sm font-medium">Bild generieren</span>
			</button>
		</div>

		<!-- Mobile: Always show bar at bottom -->
		<div class="lg:hidden">
			<div
				class="rounded-t-3xl border-t border-gray-200/50 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80"
			>
				<div class="flex items-center gap-3 p-4">
					<button
						onclick={() => (isExpanded = true)}
						disabled={$isGenerating}
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/90 text-white backdrop-blur-xl transition-all hover:bg-blue-700/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500/90 dark:hover:bg-blue-600/90"
						aria-label="Erweitern"
					>
						<Lightning size={24} weight="fill" />
					</button>
					<div class="flex-1 text-sm text-gray-600 dark:text-gray-400">Bild generieren...</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Advanced Settings Modal -->
<AdvancedSettingsModal
	isOpen={showAdvancedSettings}
	onClose={() => (showAdvancedSettings = false)}
	settings={advancedSettings}
	onUpdate={handleSettingsUpdate}
/>
