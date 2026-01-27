<script lang="ts">
	import { onMount } from 'svelte';
	import { chatService } from '$lib/services/chat';
	import { compareStore } from '$lib/stores/compare.svelte';
	import type { AIModel } from '@chat/types';
	import CompareInput from '$lib/components/compare/CompareInput.svelte';
	import CompareProgress from '$lib/components/compare/CompareProgress.svelte';
	import ModelResponseGrid from '$lib/components/compare/ModelResponseGrid.svelte';

	let models = $state<AIModel[]>([]);
	let ollamaModels = $state<AIModel[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			models = await chatService.getModels();
			// Filter for local ollama models only
			ollamaModels = models.filter((m) => m.provider === 'ollama');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Modelle';
		} finally {
			isLoading = false;
		}
	});

	function handleCompare() {
		if (ollamaModels.length === 0) return;
		compareStore.startComparison(ollamaModels);
	}
</script>

<svelte:head>
	<title>Modell-Vergleich | ManaChat</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Modell-Vergleich</h1>
			<p class="text-muted-foreground mt-1">
				Vergleiche Antworten verschiedener lokaler Ollama-Modelle nebeneinander.
			</p>
		</div>

		{#if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div
						class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
					></div>
					<p class="text-muted-foreground mt-4">Lade Modelle...</p>
				</div>
			</div>
		{:else if error}
			<!-- Error State -->
			<div
				class="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6 text-center"
			>
				<p class="text-red-600 dark:text-red-400">{error}</p>
				<button
					onclick={() => location.reload()}
					class="mt-4 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
						   hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
				>
					Erneut versuchen
				</button>
			</div>
		{:else if ollamaModels.length === 0}
			<!-- No Models State -->
			<div class="rounded-xl border border-border bg-card p-8 text-center">
				<div class="text-4xl mb-4">🤖</div>
				<h2 class="text-lg font-medium text-foreground mb-2">Keine Ollama-Modelle gefunden</h2>
				<p class="text-muted-foreground max-w-md mx-auto">
					Es sind keine lokalen Ollama-Modelle verfügbar. Stelle sicher, dass Ollama läuft und
					Modelle installiert sind.
				</p>
				<div class="mt-6 p-4 rounded-lg bg-muted/50 text-left max-w-md mx-auto">
					<p class="text-sm text-muted-foreground mb-2">Verfügbare Modelle ({models.length}):</p>
					<ul class="text-sm text-foreground">
						{#each models as model}
							<li class="flex items-center gap-2">
								<span class="text-muted-foreground">{model.provider}:</span>
								<span>{model.name}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{:else}
			<!-- Main Content -->
			<div class="space-y-6">
				<!-- Input Section -->
				<CompareInput
					prompt={compareStore.prompt}
					temperature={compareStore.temperature}
					maxTokens={compareStore.maxTokens}
					isRunning={compareStore.isRunning}
					onPromptChange={(v) => compareStore.setPrompt(v)}
					onTemperatureChange={(v) => compareStore.setTemperature(v)}
					onMaxTokensChange={(v) => compareStore.setMaxTokens(v)}
					onCompare={handleCompare}
				/>

				<!-- Model Count Info -->
				<p class="text-sm text-muted-foreground">
					{ollamaModels.length} Ollama-Modelle verfügbar:
					{ollamaModels.map((m) => m.name).join(', ')}
				</p>

				<!-- Progress Section (only when running) -->
				{#if compareStore.isRunning}
					<CompareProgress
						currentIndex={compareStore.currentIndex}
						totalModels={compareStore.totalModels}
						currentModelName={compareStore.currentModelName}
						progress={compareStore.progress}
						onCancel={() => compareStore.cancelComparison()}
					/>
				{/if}

				<!-- Results Grid -->
				<ModelResponseGrid
					results={compareStore.results}
					currentIndex={compareStore.currentIndex}
				/>

				<!-- Clear Results Button (when there are results and not running) -->
				{#if compareStore.results.length > 0 && !compareStore.isRunning}
					<div class="flex justify-center">
						<button
							onclick={() => compareStore.clearResults()}
							class="px-4 py-2 text-sm rounded-lg border border-border
								   text-muted-foreground hover:text-foreground hover:bg-muted
								   transition-colors"
						>
							Ergebnisse löschen
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
