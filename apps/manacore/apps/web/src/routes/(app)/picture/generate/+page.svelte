<script lang="ts">
	import { CheckCircle, Sparkle, Lightning } from '@manacore/shared-icons';

	let prompt = $state('');
	let negativePrompt = $state('');
	let isGenerating = $state(false);
	let generationError = $state('');

	async function handleGenerate() {
		if (!prompt.trim()) return;

		isGenerating = true;
		generationError = '';

		try {
			// TODO: Connect to Picture backend API for image generation
			// For now, show a placeholder message
			await new Promise((resolve) => setTimeout(resolve, 2000));
			generationError = 'Bildgenerierung erfordert eine Verbindung zum Picture-Server (Port 3006).';
		} catch (e) {
			generationError = e instanceof Error ? e.message : 'Generierung fehlgeschlagen';
		} finally {
			isGenerating = false;
		}
	}

	const PROMPT_SUGGESTIONS = [
		'Ein traumhafter Sonnenuntergang über dem Bodensee',
		'Futuristisches Stadtbild in Neonfarben, cyberpunk',
		'Aquarell eines ruhigen japanischen Gartens',
		'Abstrakte Kunst in lebhaften Blau- und Goldtönen',
		'Photorealistisches Portrait einer Katze als Ritter',
	];
</script>

<svelte:head>
	<title>Generieren - Picture - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-4">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Bild generieren</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Erstelle beeindruckende KI-Bilder aus deinen Textbeschreibungen
		</p>
	</header>

	<!-- Generate Form -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleGenerate();
		}}
		class="space-y-4"
	>
		<!-- Prompt -->
		<div>
			<label for="prompt" class="mb-1 block text-sm font-medium text-foreground"> Prompt </label>
			<textarea
				id="prompt"
				bind:value={prompt}
				placeholder="Beschreibe das Bild, das du erstellen möchtest..."
				rows="4"
				required
				class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
			></textarea>
		</div>

		<!-- Negative Prompt -->
		<div>
			<label for="negative-prompt" class="mb-1 block text-sm font-medium text-foreground">
				Negativ-Prompt (optional)
			</label>
			<input
				id="negative-prompt"
				type="text"
				bind:value={negativePrompt}
				placeholder="Was soll nicht im Bild sein... (z.B. unscharf, verzerrt)"
				class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
			/>
		</div>

		<!-- Generate Button -->
		<button
			type="submit"
			disabled={!prompt.trim() || isGenerating}
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
		>
			{#if isGenerating}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
				></div>
				Generiere...
			{:else}
				<Sparkle size={18} />
				Bild generieren
			{/if}
		</button>

		{#if generationError}
			<div
				class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
			>
				{generationError}
			</div>
		{/if}
	</form>

	<!-- Prompt Suggestions -->
	<div class="mt-8">
		<h2 class="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
			Prompt-Vorschläge
		</h2>
		<div class="flex flex-wrap gap-2">
			{#each PROMPT_SUGGESTIONS as suggestion}
				<button
					onclick={() => (prompt = suggestion)}
					class="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
				>
					{suggestion}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tips -->
	<div class="mt-8 rounded-lg border border-border bg-card p-4">
		<h3 class="mb-3 text-sm font-semibold text-foreground">Tipps für bessere Ergebnisse</h3>
		<ul class="space-y-2 text-sm text-muted-foreground">
			<li class="flex items-start gap-2">
				<CheckCircle size={16} class="mt-0.5 flex-shrink-0 text-primary" />
				<span
					><strong class="text-foreground">Sei spezifisch:</strong> Beschreibe Stil, Stimmung, Farben
					und Komposition</span
				>
			</li>
			<li class="flex items-start gap-2">
				<CheckCircle size={16} class="mt-0.5 flex-shrink-0 text-primary" />
				<span
					><strong class="text-foreground">Beschreibende Wörter:</strong> "Lebhafter Sonnenuntergang
					über Bergen" ist besser als "Sonnenuntergang"</span
				>
			</li>
			<li class="flex items-start gap-2">
				<CheckCircle size={16} class="mt-0.5 flex-shrink-0 text-primary" />
				<span
					><strong class="text-foreground">Negativ-Prompts:</strong> Schließe unerwünschte Elemente aus
					(z.B. "unscharf, verzerrt, niedrige Qualität")</span
				>
			</li>
		</ul>
	</div>
</div>
