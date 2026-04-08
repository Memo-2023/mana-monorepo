<script lang="ts">
	import { onMount } from 'svelte';
	import { PLAYGROUND_MODELS, type PlaygroundMessage } from '$lib/modules/playground';
	import { listModels, streamCompletion, type ChatMessage } from '$lib/modules/playground/llm';
	import { useAllSnippets } from '$lib/modules/playground/queries';
	import { playgroundSnippetsStore } from '$lib/modules/playground/stores/snippets.svelte';
	import type { PlaygroundSnippet } from '$lib/modules/playground/types';
	import { PaperPlaneRight, Trash, Robot, FloppyDisk, PushPin, X } from '@mana/shared-icons';

	const snippets$ = useAllSnippets();
	const snippets = $derived(snippets$.value);

	let snippetName = $state('');
	let saveOpen = $state(false);

	// Model list is dynamic — fetched from mana-llm/v1/models on mount.
	// We seed with the hardcoded fallback so the selector is never empty
	// during the first paint or when the service is unreachable.
	type ModelOption = { id: string; label: string; provider: string };
	const fallbackOptions: ModelOption[] = PLAYGROUND_MODELS.map((m) => ({
		id: m.id,
		label: m.label,
		provider: m.provider,
	}));

	let modelOptions = $state<ModelOption[]>(fallbackOptions);
	let selectedModel = $state<string>(fallbackOptions[0].id);
	let systemPrompt = $state('');
	let userInput = $state('');
	let messages = $state<PlaygroundMessage[]>([]);
	let isLoading = $state(false);
	let temperature = $state(0.7);
	let abortController: AbortController | null = null;

	onMount(async () => {
		const remote = await listModels();
		if (remote.length === 0) return;
		modelOptions = remote.map((m) => ({
			id: m.id,
			label: m.id,
			provider: m.owned_by,
		}));
		// Keep the previously-selected model if it still exists, otherwise
		// fall back to the first one in the live list.
		if (!modelOptions.some((m) => m.id === selectedModel)) {
			selectedModel = modelOptions[0].id;
		}
	});

	const currentModelLabel = $derived(
		modelOptions.find((m) => m.id === selectedModel)?.label ?? selectedModel
	);

	async function handleSend() {
		if (!userInput.trim() || isLoading) return;

		const userMessage: PlaygroundMessage = {
			role: 'user',
			content: userInput.trim(),
			timestamp: Date.now(),
		};
		messages = [...messages, userMessage];
		userInput = '';

		// Build the wire-format message list. System prompt is optional;
		// only include it when the user has actually typed one.
		const wire: ChatMessage[] = [];
		if (systemPrompt.trim()) {
			wire.push({ role: 'system', content: systemPrompt.trim() });
		}
		for (const m of messages) {
			wire.push({ role: m.role, content: m.content });
		}

		// Push an empty assistant placeholder that the stream fills in.
		// Keeping it in the array (instead of a separate `streaming` slot)
		// means the UI render path stays the same for in-flight and final
		// messages.
		const assistantMessage: PlaygroundMessage = {
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
		};
		messages = [...messages, assistantMessage];
		const assistantIdx = messages.length - 1;

		isLoading = true;
		abortController = new AbortController();

		try {
			for await (const delta of streamCompletion({
				model: selectedModel,
				messages: wire,
				temperature,
				signal: abortController.signal,
			})) {
				const next = [...messages];
				next[assistantIdx] = { ...next[assistantIdx], content: next[assistantIdx].content + delta };
				messages = next;
			}
		} catch (err) {
			const next = [...messages];
			const reason = err instanceof Error ? err.message : 'Unbekannter Fehler';
			const existing = next[assistantIdx].content;
			next[assistantIdx] = {
				...next[assistantIdx],
				content: existing
					? `${existing}\n\n⚠ Stream abgebrochen: ${reason}`
					: `⚠ ${reason}\n\nIst mana-llm erreichbar (PUBLIC_MANA_LLM_URL)?`,
			};
			messages = next;
		} finally {
			isLoading = false;
			abortController = null;
		}
	}

	function handleStop() {
		abortController?.abort();
	}

	// ─── Snippets ────────────────────────────────────────────

	async function saveCurrentAsSnippet() {
		const name = snippetName.trim();
		const body = systemPrompt.trim();
		if (!name || !body) return;
		await playgroundSnippetsStore.create({
			name,
			systemPrompt: body,
			model: selectedModel,
			temperature,
		});
		snippetName = '';
		saveOpen = false;
	}

	function loadSnippet(snippet: PlaygroundSnippet) {
		systemPrompt = snippet.systemPrompt;
		// Only adopt the snippet's model if we actually have it in the
		// current options list — otherwise the selector would silently
		// jump to a model that's not available on this mana-llm instance.
		if (modelOptions.some((m) => m.id === snippet.model)) {
			selectedModel = snippet.model;
		}
		temperature = snippet.temperature;
	}

	async function deleteSnippet(e: MouseEvent, id: string) {
		e.stopPropagation();
		await playgroundSnippetsStore.remove(id);
	}

	async function togglePinSnippet(e: MouseEvent, id: string) {
		e.stopPropagation();
		await playgroundSnippetsStore.togglePin(id);
	}

	function handleClear() {
		abortController?.abort();
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
				{#each modelOptions as model}
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
			<div class="flex gap-2">
				<input
					id="system-prompt"
					type="text"
					bind:value={systemPrompt}
					placeholder="Optional: System-Anweisung..."
					class="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
				/>
				<button
					type="button"
					onclick={() => (saveOpen = !saveOpen)}
					disabled={!systemPrompt.trim()}
					title="Als Snippet speichern"
					class="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
				>
					<FloppyDisk size={14} />
				</button>
			</div>
		</div>
	</div>

	<!-- Save snippet inline form (toggled by FloppyDisk button) -->
	{#if saveOpen}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveCurrentAsSnippet();
			}}
			class="mb-4 flex gap-2 rounded-xl border border-border bg-card p-3"
		>
			<input
				bind:value={snippetName}
				placeholder="Snippet-Name (z.B. 'JSON-Extraktor')"
				class="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
			/>
			<button
				type="submit"
				disabled={!snippetName.trim()}
				class="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
			>
				Speichern
			</button>
			<button
				type="button"
				onclick={() => (saveOpen = false)}
				class="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
			>
				Abbrechen
			</button>
		</form>
	{/if}

	<!-- Saved snippets row — pill list, click to load, hover for pin/delete -->
	{#if snippets.length > 0}
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<span class="text-xs font-medium text-muted-foreground">Snippets:</span>
			{#each snippets as snippet (snippet.id)}
				<button
					type="button"
					onclick={() => loadSnippet(snippet)}
					title={snippet.systemPrompt}
					class="group flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted"
				>
					{#if snippet.isPinned}
						<PushPin size={10} weight="fill" class="text-primary" />
					{/if}
					<span class="max-w-[140px] truncate">{snippet.name}</span>
					<span
						role="button"
						tabindex="0"
						onclick={(e) => togglePinSnippet(e, snippet.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter') togglePinSnippet(e as unknown as MouseEvent, snippet.id);
						}}
						title={snippet.isPinned ? 'Lösen' : 'Pinnen'}
						class="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-background group-hover:opacity-60"
					>
						<PushPin size={10} />
					</span>
					<span
						role="button"
						tabindex="0"
						onclick={(e) => deleteSnippet(e, snippet.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter') deleteSnippet(e as unknown as MouseEvent, snippet.id);
						}}
						title="Löschen"
						class="rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-60"
					>
						<X size={10} />
					</span>
				</button>
			{/each}
		</div>
	{/if}

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
					{#if message.content}
						<div class="whitespace-pre-wrap text-sm text-foreground">{message.content}</div>
					{:else}
						<!-- Empty placeholder while waiting for the first delta. The
						     bubble is already in the list, so the loading state lives
						     inline rather than as a separate row. -->
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
					{/if}
				</div>
			{/each}
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
			{#if isLoading}
				<button
					onclick={handleStop}
					class="flex items-center gap-2 self-end rounded-xl bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground transition-opacity"
				>
					Stop
				</button>
			{:else}
				<button
					onclick={handleSend}
					disabled={!userInput.trim()}
					class="flex items-center gap-2 self-end rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
				>
					<PaperPlaneRight size={18} />
				</button>
			{/if}
		</div>
	</div>
</div>
