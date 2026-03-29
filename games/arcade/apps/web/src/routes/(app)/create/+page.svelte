<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { generatedGameCollection } from '$lib/data/local-store';

	const BACKEND_URL = import.meta.env.DEV
		? 'http://localhost:3011'
		: import.meta.env.PUBLIC_MANA_GAMES_BACKEND_URL || '';

	const models = [
		{ id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', speed: 'Schnell' },
		{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google', speed: 'Schnell' },
		{ id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', speed: 'Langsam' },
		{ id: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku', provider: 'Anthropic', speed: 'Schnell' },
		{ id: 'claude-3.5-sonnet', label: 'Claude Sonnet', provider: 'Anthropic', speed: 'Mittel' },
		{ id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'Azure', speed: 'Schnell' },
		{ id: 'gpt-4o', label: 'GPT-4o', provider: 'Azure', speed: 'Mittel' },
	];

	let prompt = $state('');
	let selectedModel = $state('gemini-2.0-flash');
	let isGenerating = $state(false);
	let generatedHtml = $state('');
	let error = $state('');
	let iterationCount = $state(0);
	let originalPrompt = $state('');

	async function generateGame() {
		if (!prompt.trim() || isGenerating) return;

		isGenerating = true;
		error = '';

		try {
			const body: Record<string, unknown> = {
				description: prompt,
				model: selectedModel,
				mode: iterationCount > 0 ? 'iterate' : 'create',
			};

			if (iterationCount > 0 && generatedHtml) {
				body.originalPrompt = originalPrompt;
				body.currentCode = generatedHtml;
				body.iterationCount = iterationCount;
			}

			const response = await fetch(`${BACKEND_URL}/api/games/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`Fehler: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();

			if (data.success && data.html) {
				generatedHtml = data.html;
				if (iterationCount === 0) {
					originalPrompt = prompt;
				}
				iterationCount++;
			} else {
				error = data.error || 'Unbekannter Fehler bei der Generierung.';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Verbindungsfehler zum Backend.';
		} finally {
			isGenerating = false;
		}
	}

	async function saveGame() {
		if (!generatedHtml || !prompt) return;

		await generatedGameCollection.insert({
			title: originalPrompt || prompt,
			description: prompt,
			htmlCode: generatedHtml,
			prompt: originalPrompt || prompt,
			model: selectedModel,
			iterationCount,
		});

		// Reset
		prompt = '';
		generatedHtml = '';
		iterationCount = 0;
		originalPrompt = '';
	}

	function resetGame() {
		generatedHtml = '';
		iterationCount = 0;
		originalPrompt = '';
		prompt = '';
		error = '';
	}
</script>

<svelte:head>
	<title>{$_('create.title')} - Arcade</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{$_('create.title')}</h1>
		<p class="text-muted-foreground mt-1">{$_('create.subtitle')}</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Input Panel -->
		<div class="space-y-4">
			<div>
				<label for="prompt" class="block text-sm font-medium text-foreground mb-2">
					{$_('create.prompt')}
				</label>
				<textarea
					id="prompt"
					bind:value={prompt}
					placeholder={$_('create.promptPlaceholder')}
					rows="4"
					class="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
				></textarea>
			</div>

			<div>
				<label for="model" class="block text-sm font-medium text-foreground mb-2">
					{$_('create.model')}
				</label>
				<select
					id="model"
					bind:value={selectedModel}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				>
					{#each models as model}
						<option value={model.id}>
							{model.label} ({model.provider} - {model.speed})
						</option>
					{/each}
				</select>
			</div>

			{#if error}
				<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
					{error}
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					onclick={generateGame}
					disabled={!prompt.trim() || isGenerating}
					class="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isGenerating}
						<span class="inline-flex items-center gap-2">
							<span class="animate-spin">⚡</span>
							{$_('create.generating')}
						</span>
					{:else if iterationCount > 0}
						{$_('create.iterate')}
					{:else}
						{$_('create.generate')}
					{/if}
				</button>

				{#if generatedHtml}
					<button
						onclick={saveGame}
						class="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
					>
						{$_('create.save')}
					</button>
					<button
						onclick={resetGame}
						class="px-4 py-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
					>
						Neu
					</button>
				{/if}
			</div>

			{#if iterationCount > 0}
				<p class="text-xs text-muted-foreground">
					Iteration {iterationCount} &middot; Beschreibe Änderungen im Prompt-Feld
				</p>
			{/if}
		</div>

		<!-- Preview Panel -->
		<div class="rounded-xl border border-border bg-black overflow-hidden">
			{#if generatedHtml}
				<iframe
					srcdoc={generatedHtml}
					title="Generiertes Spiel"
					class="w-full aspect-[16/10] border-0"
					sandbox="allow-scripts"
				></iframe>
			{:else}
				<div class="w-full aspect-[16/10] flex items-center justify-center">
					<div class="text-center">
						<p class="text-4xl mb-3 opacity-40">🎮</p>
						<p class="text-muted-foreground text-sm">{$_('create.preview')}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
