<script lang="ts">
	import {
		PLAYGROUND_MODELS,
		type PlaygroundModel,
		type PlaygroundMessage,
	} from '$lib/modules/playground';
	import { PaperPlaneRight, Trash, Robot } from '@mana/shared-icons';

	let selectedModel: PlaygroundModel = $state('claude-sonnet');
	let systemPrompt = $state('');
	let userInput = $state('');
	let messages: PlaygroundMessage[] = $state([]);
	let isLoading = $state(false);
	let temperature = $state(0.7);

	function handleSend() {
		if (!userInput.trim() || isLoading) return;

		const userMessage: PlaygroundMessage = {
			role: 'user',
			content: userInput.trim(),
			timestamp: Date.now(),
		};
		messages = [...messages, userMessage];
		userInput = '';

		// Simulate response (real API integration comes later)
		isLoading = true;
		setTimeout(() => {
			const assistantMessage: PlaygroundMessage = {
				role: 'assistant',
				content: `[${selectedModel}] Playground ist noch nicht mit dem Backend verbunden. Konfiguriere MANA_LLM_URL um Antworten zu erhalten.`,
				timestamp: Date.now(),
			};
			messages = [...messages, assistantMessage];
			isLoading = false;
		}, 800);
	}

	function handleClear() {
		messages = [];
		systemPrompt = '';
		userInput = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	const currentModelLabel = $derived(
		PLAYGROUND_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel
	);
</script>

<svelte:head>
	<title>Playground - Mana</title>
</svelte:head>

<div class="mx-auto flex h-full max-w-4xl flex-col">
	<!-- Header -->
	<header class="mb-4 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Playground</h1>
			<p class="text-muted-foreground mt-1 text-sm">LLM-Modelle testen & vergleichen</p>
		</div>
		<button
			onclick={handleClear}
			class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
		>
			<Trash size={16} />
			Leeren
		</button>
	</header>

	<!-- Config Bar -->
	<div class="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
		<div class="flex flex-col gap-1">
			<label for="model-select" class="text-xs font-medium text-muted-foreground">Modell</label>
			<select
				id="model-select"
				bind:value={selectedModel}
				class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
			>
				{#each PLAYGROUND_MODELS as model}
					<option value={model.id}>{model.label} ({model.provider})</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="temperature" class="text-xs font-medium text-muted-foreground">
				Temperatur: {temperature.toFixed(1)}
			</label>
			<input
				id="temperature"
				type="range"
				min="0"
				max="2"
				step="0.1"
				bind:value={temperature}
				class="w-32 accent-primary"
			/>
		</div>

		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<label for="system-prompt" class="text-xs font-medium text-muted-foreground">
				System Prompt
			</label>
			<input
				id="system-prompt"
				type="text"
				bind:value={systemPrompt}
				placeholder="Optional: System-Anweisung..."
				class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
			/>
		</div>
	</div>

	<!-- Messages -->
	<div class="flex-1 space-y-4 overflow-y-auto pb-4">
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 rounded-full bg-primary/10 p-4">
					<Robot size={40} class="text-primary" />
				</div>
				<h2 class="text-lg font-semibold text-foreground">Bereit zum Testen</h2>
				<p class="mt-1 max-w-md text-sm text-muted-foreground">
					Wähle ein Modell, schreibe einen Prompt und teste verschiedene LLMs. Aktuell: <span
						class="font-medium text-foreground">{currentModelLabel}</span
					>
				</p>
			</div>
		{:else}
			{#each messages as message}
				<div
					class="rounded-xl border border-border p-4 {message.role === 'user'
						? 'ml-8 bg-primary/5'
						: 'mr-8 bg-card'}"
				>
					<div class="mb-1 text-xs font-medium text-muted-foreground">
						{message.role === 'user' ? 'Du' : currentModelLabel}
					</div>
					<div class="whitespace-pre-wrap text-sm text-foreground">{message.content}</div>
				</div>
			{/each}

			{#if isLoading}
				<div class="mr-8 rounded-xl border border-border bg-card p-4">
					<div class="mb-1 text-xs font-medium text-muted-foreground">{currentModelLabel}</div>
					<div class="flex gap-1">
						<span
							class="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"
						></span>
						<span
							class="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"
						></span>
						<span
							class="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"
						></span>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Input -->
	<div class="sticky bottom-0 border-t border-border bg-background pt-4">
		<div class="flex gap-3">
			<textarea
				bind:value={userInput}
				onkeydown={handleKeydown}
				placeholder="Prompt eingeben... (Enter zum Senden, Shift+Enter für neue Zeile)"
				rows={2}
				class="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
			></textarea>
			<button
				onclick={handleSend}
				disabled={!userInput.trim() || isLoading}
				class="flex items-center gap-2 self-end rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
			>
				<PaperPlaneRight size={18} />
			</button>
		</div>
	</div>
</div>
