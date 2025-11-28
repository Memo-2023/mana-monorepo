<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { models, selectedModel, isLoadingModels } from '$lib/stores/models';
	import { isGenerating, generationProgress, generationError } from '$lib/stores/generate';
	import { getActiveModels } from '$lib/api/models';
	import { generateImageAsync, subscribeToGenerationUpdates } from '$lib/api/generate-async';
	import Button from '../ui/Button.svelte';
	import Card from '../ui/Card.svelte';

	let prompt = $state('');
	let negativePrompt = $state('');
	let selectedModelId = $state('');

	const MAX_PROMPT_LENGTH = 500;
	const MAX_NEGATIVE_PROMPT_LENGTH = 200;

	onMount(async () => {
		await loadModels();
	});

	async function loadModels() {
		isLoadingModels.set(true);
		try {
			const data = await getActiveModels();
			models.set(data);
			// Select default model
			const defaultModel = data.find((m) => m.is_default) || data[0];
			if (defaultModel) {
				selectedModelId = defaultModel.id;
				selectedModel.set(defaultModel);
			}
		} catch (error) {
			console.error('Error loading models:', error);
			generationError.set('Failed to load models');
		} finally {
			isLoadingModels.set(false);
		}
	}

	function handleModelChange() {
		const model = $models.find((m) => m.id === selectedModelId);
		selectedModel.set(model || null);
	}

	async function handleGenerate() {
		if (!authStore.user || !selectedModelId || !prompt.trim()) return;

		isGenerating.set(true);
		generationError.set('');
		generationProgress.set('Starting generation...');

		try {
			// Start generation with new async API
			const { generationId } = await generateImageAsync({
				prompt: prompt.trim(),
				model_id: selectedModelId,
				negative_prompt: negativePrompt.trim() || undefined,
			});

			// Wait for completion using realtime subscription
			await new Promise<void>((resolve, reject) => {
				const unsubscribe = subscribeToGenerationUpdates(generationId, (progress) => {
					// Update progress display
					if (progress.status === 'pending' || progress.status === 'queued') {
						generationProgress.set('Queued for processing...');
					} else if (progress.status === 'processing') {
						generationProgress.set('Processing...');
					} else if (progress.status === 'downloading') {
						generationProgress.set('Saving image...');
					} else if (progress.status === 'completed') {
						unsubscribe();
						resolve();
					} else if (progress.status === 'failed') {
						unsubscribe();
						reject(new Error(progress.error || 'Image generation failed'));
					}
				});

				// Timeout after 10 minutes
				setTimeout(() => {
					unsubscribe();
					reject(new Error('Generation timeout - please check your gallery later'));
				}, 600000);
			});

			// Success - redirect to gallery
			generationProgress.set('Complete!');
			setTimeout(() => {
				goto('/app/gallery');
			}, 1000);
		} catch (error) {
			console.error('Generation error:', error);
			generationError.set(error instanceof Error ? error.message : 'Failed to generate image');
		} finally {
			isGenerating.set(false);
		}
	}

	const promptLength = $derived(prompt.length);
	const negativePromptLength = $derived(negativePrompt.length);
	const canGenerate = $derived(
		!$isGenerating && !$isLoadingModels && prompt.trim().length > 0 && selectedModelId.length > 0
	);
</script>

<Card>
	<div class="space-y-6 p-6">
		<h2 class="text-2xl font-bold text-gray-900">Generate Image</h2>

		{#if $generationError}
			<div class="rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-red-800">{$generationError}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if $isGenerating}
			<div class="rounded-md bg-blue-50 p-4">
				<div class="flex items-center">
					<div
						class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"
					></div>
					<p class="text-sm text-blue-800">{$generationProgress}</p>
				</div>
			</div>
		{/if}

		<!-- Model Selection -->
		<div>
			<label for="model" class="mb-2 block text-sm font-medium text-gray-700">
				Model <span class="text-red-500">*</span>
			</label>
			<select
				id="model"
				bind:value={selectedModelId}
				onchange={handleModelChange}
				disabled={$isGenerating || $isLoadingModels}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
			>
				{#if $isLoadingModels}
					<option value="">Loading models...</option>
				{:else if $models.length === 0}
					<option value="">No models available</option>
				{:else}
					{#each $models as model}
						<option value={model.id}>
							{model.name}
							{model.is_default ? '(Default)' : ''}
						</option>
					{/each}
				{/if}
			</select>
			{#if $selectedModel}
				<p class="mt-1 text-sm text-gray-500">{$selectedModel.description || ''}</p>
			{/if}
		</div>

		<!-- Prompt -->
		<div>
			<label for="prompt" class="mb-2 block text-sm font-medium text-gray-700">
				Prompt <span class="text-red-500">*</span>
			</label>
			<textarea
				id="prompt"
				bind:value={prompt}
				disabled={$isGenerating}
				maxlength={MAX_PROMPT_LENGTH}
				rows="4"
				placeholder="Describe the image you want to generate..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
			></textarea>
			<div class="mt-1 flex justify-between text-sm text-gray-500">
				<span>Be specific and descriptive for best results</span>
				<span class={promptLength > MAX_PROMPT_LENGTH - 50 ? 'text-orange-600' : ''}>
					{promptLength}/{MAX_PROMPT_LENGTH}
				</span>
			</div>
		</div>

		<!-- Negative Prompt -->
		<div>
			<label for="negative-prompt" class="mb-2 block text-sm font-medium text-gray-700">
				Negative Prompt (Optional)
			</label>
			<textarea
				id="negative-prompt"
				bind:value={negativePrompt}
				disabled={$isGenerating}
				maxlength={MAX_NEGATIVE_PROMPT_LENGTH}
				rows="2"
				placeholder="What to avoid in the image (e.g., blurry, low quality, distorted)..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
			></textarea>
			<div class="mt-1 flex justify-between text-sm text-gray-500">
				<span>Elements to exclude from the image</span>
				<span
					class={negativePromptLength > MAX_NEGATIVE_PROMPT_LENGTH - 20 ? 'text-orange-600' : ''}
				>
					{negativePromptLength}/{MAX_NEGATIVE_PROMPT_LENGTH}
				</span>
			</div>
		</div>

		<!-- Generate Button -->
		<Button
			variant="primary"
			class="w-full"
			onclick={handleGenerate}
			disabled={!canGenerate}
			loading={$isGenerating}
		>
			<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
			{$isGenerating ? 'Generating...' : 'Generate Image'}
		</Button>
	</div>
</Card>
