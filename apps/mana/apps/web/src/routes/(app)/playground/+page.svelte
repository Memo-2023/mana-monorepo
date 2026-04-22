<script lang="ts">
	import { onMount } from 'svelte';
	import { PLAYGROUND_MODELS } from '$lib/modules/playground';
	import {
		listModels,
		streamCompletion,
		type ChatMessage,
		type StreamChunk,
	} from '$lib/modules/playground/llm';
	import {
		useAllSnippets,
		useAllConversations,
		useConversationMessages,
	} from '$lib/modules/playground/queries';
	import { playgroundSnippetsStore } from '$lib/modules/playground/stores/snippets.svelte';
	import { conversationsStore } from '$lib/modules/playground/stores/conversations.svelte';
	import type {
		PlaygroundSnippet,
		PlaygroundConversationMessage,
	} from '$lib/modules/playground/types';
	import {
		PaperPlaneRight,
		Trash,
		Robot,
		FloppyDisk,
		PushPin,
		X,
		Plus,
		ChatCircle,
		ArrowsOutSimple,
	} from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	// ─── Data queries ───────────────────────────────────────
	const snippets$ = useAllSnippets();
	const snippets = $derived(snippets$.value);
	const conversations$ = useAllConversations();
	const conversations = $derived(conversations$.value);

	let activeConversationId = $state<string | null>(null);
	const messages$ = useConversationMessages(() => activeConversationId);
	const persistedMessages = $derived(messages$.value);

	let snippetName = $state('');
	let saveOpen = $state(false);

	// ─── Model list ─────────────────────────────────────────
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
	let isLoading = $state(false);
	let temperature = $state(0.7);
	let abortController: AbortController | null = null;

	// Streaming in-flight content (not yet persisted)
	let streamingContent = $state('');
	let streamingModel = $state('');
	let streamingUsage = $state<{ promptTokens: number; completionTokens: number } | null>(null);

	// Comparison mode
	let comparisonMode = $state(false);
	let comparisonModels = $state<string[]>([]);
	let comparisonStreams = $state<
		Array<{
			model: string;
			content: string;
			usage: { promptTokens: number; completionTokens: number } | null;
		}>
	>([]);
	let comparisonAbortControllers: AbortController[] = [];

	onMount(async () => {
		const remote = await listModels();
		if (remote.length === 0) return;
		modelOptions = remote.map((m) => ({
			id: m.id,
			label: m.id,
			provider: m.owned_by,
		}));
		if (!modelOptions.some((m) => m.id === selectedModel)) {
			selectedModel = modelOptions[0].id;
		}
	});

	const currentModelLabel = $derived(
		modelOptions.find((m) => m.id === selectedModel)?.label ?? selectedModel
	);

	// Combined view: persisted messages + in-flight stream
	const displayMessages = $derived(persistedMessages);

	// ─── Send ───────────────────────────────────────────────
	async function handleSend() {
		if (!userInput.trim() || isLoading) return;
		const text = userInput.trim();
		userInput = '';

		// Lazily create conversation on first send
		let convId = activeConversationId;
		if (!convId) {
			const conv = await conversationsStore.create({
				model: selectedModel,
				systemPrompt: systemPrompt.trim(),
				temperature,
				comparisonModels:
					comparisonMode && comparisonModels.length >= 2 ? comparisonModels : undefined,
			});
			convId = conv.id;
			activeConversationId = convId;
		}

		// Persist user message
		const nextOrder = persistedMessages.length;
		await conversationsStore.addMessage(convId, {
			role: 'user',
			content: text,
			order: nextOrder,
		});

		// Auto-title from first user message
		const conv = conversations.find((c) => c.id === convId);
		if (conv && !conv.title) {
			await conversationsStore.updateTitle(convId, text.slice(0, 60));
		}

		// Build wire messages
		const wire: ChatMessage[] = [];
		if (systemPrompt.trim()) {
			wire.push({ role: 'system', content: systemPrompt.trim() });
		}
		for (const m of persistedMessages) {
			// In comparison mode, only include one model's responses for follow-up context
			if (m.role === 'assistant' && m.comparisonGroupId) {
				// Use the first comparison model's response as context
				const group = persistedMessages.filter(
					(pm) => pm.comparisonGroupId === m.comparisonGroupId
				);
				if (group[0]?.id !== m.id) continue;
			}
			wire.push({ role: m.role, content: m.content });
		}
		wire.push({ role: 'user', content: text });

		isLoading = true;

		if (comparisonMode && comparisonModels.length >= 2) {
			await handleComparisonStream(convId, wire, nextOrder + 1);
		} else {
			await handleSingleStream(convId, wire, nextOrder + 1);
		}

		await conversationsStore.touch(convId);
		isLoading = false;
	}

	async function handleSingleStream(convId: string, wire: ChatMessage[], order: number) {
		streamingContent = '';
		streamingModel = selectedModel;
		streamingUsage = null;
		abortController = new AbortController();

		try {
			for await (const chunk of streamCompletion({
				model: selectedModel,
				messages: wire,
				temperature,
				signal: abortController.signal,
			})) {
				if (chunk.type === 'delta') {
					streamingContent += chunk.content;
				} else if (chunk.type === 'usage') {
					streamingUsage = chunk;
				}
			}
		} catch (err) {
			const reason = err instanceof Error ? err.message : 'Unbekannter Fehler';
			streamingContent += streamingContent
				? `\n\n⚠ Stream abgebrochen: ${reason}`
				: `⚠ ${reason}\n\nIst mana-llm erreichbar (PUBLIC_MANA_LLM_URL)?`;
		}

		// Persist assistant message
		await conversationsStore.addMessage(convId, {
			role: 'assistant',
			content: streamingContent,
			model: selectedModel,
			promptTokens: streamingUsage?.promptTokens,
			completionTokens: streamingUsage?.completionTokens,
			order,
		});

		streamingContent = '';
		streamingModel = '';
		streamingUsage = null;
		abortController = null;
	}

	async function handleComparisonStream(convId: string, wire: ChatMessage[], startOrder: number) {
		const groupId = crypto.randomUUID();
		comparisonStreams = comparisonModels.map((m) => ({ model: m, content: '', usage: null }));
		comparisonAbortControllers = comparisonModels.map(() => new AbortController());

		// Stream all models in parallel
		const promises = comparisonModels.map(async (model, idx) => {
			try {
				for await (const chunk of streamCompletion({
					model,
					messages: wire,
					temperature,
					signal: comparisonAbortControllers[idx].signal,
				})) {
					if (chunk.type === 'delta') {
						comparisonStreams[idx].content += chunk.content;
						comparisonStreams = [...comparisonStreams]; // trigger reactivity
					} else if (chunk.type === 'usage') {
						comparisonStreams[idx].usage = chunk;
						comparisonStreams = [...comparisonStreams];
					}
				}
			} catch (err) {
				const reason = err instanceof Error ? err.message : 'Fehler';
				comparisonStreams[idx].content += comparisonStreams[idx].content
					? `\n\n⚠ ${reason}`
					: `⚠ ${reason}`;
				comparisonStreams = [...comparisonStreams];
			}
		});

		await Promise.allSettled(promises);

		// Persist all comparison responses
		for (let i = 0; i < comparisonStreams.length; i++) {
			const s = comparisonStreams[i];
			await conversationsStore.addMessage(convId, {
				role: 'assistant',
				content: s.content,
				model: s.model,
				promptTokens: s.usage?.promptTokens,
				completionTokens: s.usage?.completionTokens,
				comparisonGroupId: groupId,
				order: startOrder + i,
			});
		}

		comparisonStreams = [];
		comparisonAbortControllers = [];
	}

	function handleStop() {
		abortController?.abort();
		for (const ctrl of comparisonAbortControllers) ctrl.abort();
	}

	// ─── Conversation management ────────────────────────────
	function newConversation() {
		abortController?.abort();
		activeConversationId = null;
		streamingContent = '';
		comparisonStreams = [];
		userInput = '';
	}

	function loadConversation(id: string) {
		activeConversationId = id;
		const conv = conversations.find((c) => c.id === id);
		if (conv) {
			systemPrompt = conv.systemPrompt;
			if (modelOptions.some((m) => m.id === conv.model)) {
				selectedModel = conv.model;
			}
			temperature = conv.temperature;
			if (conv.comparisonModels) {
				comparisonMode = true;
				comparisonModels = conv.comparisonModels;
			} else {
				comparisonMode = false;
			}
		}
	}

	async function deleteConversation(e: MouseEvent, id: string) {
		e.stopPropagation();
		await conversationsStore.remove(id);
		if (activeConversationId === id) newConversation();
	}

	// ─── Comparison model toggle ────────────────────────────
	function toggleComparisonModel(modelId: string) {
		if (comparisonModels.includes(modelId)) {
			comparisonModels = comparisonModels.filter((m) => m !== modelId);
		} else if (comparisonModels.length < 4) {
			comparisonModels = [...comparisonModels, modelId];
		}
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function formatTokens(msg: PlaygroundConversationMessage): string | null {
		if (msg.promptTokens == null) return null;
		const total = msg.promptTokens + (msg.completionTokens ?? 0);
		return `${msg.promptTokens} prompt + ${msg.completionTokens ?? 0} completion = ${total} tokens`;
	}

	/** Group comparison messages by comparisonGroupId for side-by-side rendering. */
	function getComparisonGroups(
		msgs: PlaygroundConversationMessage[]
	): Map<string, PlaygroundConversationMessage[]> {
		const groups = new Map<string, PlaygroundConversationMessage[]>();
		for (const m of msgs) {
			if (!m.comparisonGroupId) continue;
			const g = groups.get(m.comparisonGroupId) ?? [];
			g.push(m);
			groups.set(m.comparisonGroupId, g);
		}
		return groups;
	}

	const comparisonGroups = $derived(getComparisonGroups(displayMessages));

	let showSidebar = $state(true);
</script>

<svelte:head>
	<title>Playground - Mana</title>
</svelte:head>

<RoutePage appId="playground">
	<div class="flex h-full">
		<!-- Sidebar: conversation list -->
		{#if showSidebar}
			<aside class="sidebar">
				<button class="new-chat-btn" onclick={newConversation}>
					<Plus size={14} />
					Neuer Chat
				</button>
				<div class="conv-list">
					{#each conversations as conv (conv.id)}
						<button
							class="conv-item"
							class:active={conv.id === activeConversationId}
							onclick={() => loadConversation(conv.id)}
						>
							<ChatCircle size={14} class="shrink-0 opacity-40" />
							<span class="conv-title">{conv.title || 'Unbenannt'}</span>
							<span
								role="button"
								tabindex="0"
								class="conv-delete"
								onclick={(e) => deleteConversation(e, conv.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter') deleteConversation(e as unknown as MouseEvent, conv.id);
								}}
							>
								<X size={10} />
							</span>
						</button>
					{/each}
				</div>
			</aside>
		{/if}

		<!-- Main area -->
		<div class="mx-auto flex h-full max-w-4xl flex-1 flex-col px-4">
			<!-- Header -->
			<header class="mb-4 flex items-center justify-between pt-4">
				<div class="flex items-center gap-2">
					<button
						class="sidebar-toggle"
						onclick={() => (showSidebar = !showSidebar)}
						title={showSidebar ? 'Sidebar ausblenden' : 'Sidebar einblenden'}
					>
						<ArrowsOutSimple size={16} />
					</button>
					<div>
						<h1 class="text-2xl font-bold text-foreground">Playground</h1>
						<p class="text-muted-foreground mt-1 text-sm">LLM-Modelle testen & vergleichen</p>
					</div>
				</div>
			</header>

			<!-- Config Bar -->
			<div class="config-bar">
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

				<!-- Comparison mode toggle -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground">Vergleich</span>
					<button
						onclick={() => {
							comparisonMode = !comparisonMode;
							if (comparisonMode && comparisonModels.length === 0) {
								comparisonModels = [selectedModel];
							}
						}}
						class="rounded-lg border px-3 py-1.5 text-sm transition-colors
						{comparisonMode
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border text-muted-foreground hover:bg-muted'}"
					>
						{comparisonMode ? 'An' : 'Aus'}
					</button>
				</div>
			</div>

			<!-- Comparison model selector -->
			{#if comparisonMode}
				<div class="comparison-selector">
					<span class="text-xs text-muted-foreground">Modelle vergleichen (2-4):</span>
					<div class="flex flex-wrap gap-1.5">
						{#each modelOptions as model}
							<button
								onclick={() => toggleComparisonModel(model.id)}
								class="rounded-full border px-2.5 py-0.5 text-xs transition-colors
								{comparisonModels.includes(model.id)
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:bg-muted'}"
							>
								{model.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Save snippet inline form -->
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

			<!-- Saved snippets row -->
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
				{#if displayMessages.length === 0 && !streamingContent && comparisonStreams.length === 0}
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
					{#each displayMessages as message (message.id)}
						{@const tokens = formatTokens(message)}
						{@const isComparisonMsg = !!message.comparisonGroupId}
						{@const group = isComparisonMsg
							? comparisonGroups.get(message.comparisonGroupId!)
							: null}
						{@const isFirstInGroup = isComparisonMsg && group ? group[0]?.id === message.id : false}

						{#if isComparisonMsg && !isFirstInGroup}
							<!-- Skip non-first comparison messages — rendered as group below -->
						{:else if isComparisonMsg && isFirstInGroup && group}
							<!-- Comparison group: side-by-side -->
							<div class="comparison-grid" style="--cols: {group.length}">
								{#each group as gMsg (gMsg.id)}
									{@const gTokens = formatTokens(gMsg)}
									<div class="rounded-xl border border-border p-4 bg-card">
										<div class="mb-1 text-xs font-medium text-muted-foreground">
											{gMsg.model ?? 'Assistent'}
										</div>
										<div class="whitespace-pre-wrap text-sm text-foreground">
											{gMsg.content}
										</div>
										{#if gTokens}
											<div class="mt-2 text-[10px] text-muted-foreground">{gTokens}</div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<!-- Normal message -->
							<div
								class="rounded-xl border border-border p-4 {message.role === 'user'
									? 'ml-8 bg-primary/5'
									: 'mr-8 bg-card'}"
							>
								<div class="mb-1 text-xs font-medium text-muted-foreground">
									{message.role === 'user' ? 'Du' : (message.model ?? currentModelLabel)}
								</div>
								<div class="whitespace-pre-wrap text-sm text-foreground">
									{message.content}
								</div>
								{#if tokens}
									<div class="mt-2 text-[10px] text-muted-foreground">{tokens}</div>
								{/if}
							</div>
						{/if}
					{/each}

					<!-- In-flight: single stream -->
					{#if streamingContent || (isLoading && !comparisonMode)}
						<div class="mr-8 rounded-xl border border-border bg-card p-4">
							<div class="mb-1 text-xs font-medium text-muted-foreground">
								{streamingModel || currentModelLabel}
							</div>
							{#if streamingContent}
								<div class="whitespace-pre-wrap text-sm text-foreground">
									{streamingContent}
								</div>
							{:else}
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
					{/if}

					<!-- In-flight: comparison streams -->
					{#if comparisonStreams.length > 0}
						<div class="comparison-grid" style="--cols: {comparisonStreams.length}">
							{#each comparisonStreams as stream}
								<div class="rounded-xl border border-border p-4 bg-card">
									<div class="mb-1 text-xs font-medium text-muted-foreground">
										{stream.model}
									</div>
									{#if stream.content}
										<div class="whitespace-pre-wrap text-sm text-foreground">
											{stream.content}
										</div>
									{:else}
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
						</div>
					{/if}
				{/if}
			</div>

			<!-- Input -->
			<div class="sticky bottom-0 border-t border-border bg-background pt-4 pb-4">
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
	</div>
</RoutePage>

<style>
	.sidebar {
		width: 220px;
		flex-shrink: 0;
		border-right: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		padding: 1rem 0.75rem;
		gap: 0.5rem;
		overflow-y: auto;
	}
	.new-chat-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.new-chat-btn:hover {
		border-color: hsl(var(--color-border) / 0.8);
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-muted));
	}
	.conv-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.conv-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}
	.conv-item:hover {
		background: hsl(var(--color-muted));
	}
	.conv-item.active {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}
	.conv-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.conv-delete {
		display: none;
		align-items: center;
		padding: 0.125rem;
		border-radius: 0.25rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.conv-item:hover .conv-delete {
		display: flex;
	}
	.conv-delete:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.1);
	}
	.sidebar-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.sidebar-toggle:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.config-bar {
		margin-bottom: 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		padding: 1rem;
	}
	.comparison-selector {
		margin-bottom: 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-primary) / 0.2);
		background: hsl(var(--color-primary) / 0.03);
		padding: 0.75rem 1rem;
	}
	.comparison-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols, 2), 1fr);
		gap: 0.75rem;
		align-items: start;
	}
</style>
