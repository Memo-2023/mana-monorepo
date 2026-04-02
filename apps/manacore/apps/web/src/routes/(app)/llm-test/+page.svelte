<script lang="ts">
	import {
		getLocalLlmStatus,
		loadLocalLlm,
		unloadLocalLlm,
		isLocalLlmSupported,
		generate,
		generateText,
		extractJson,
		classify,
		MODELS,
		type ModelKey,
	} from '@manacore/local-llm';
	import { Robot, Trash, PaperPlaneRight } from '@manacore/shared-icons';

	// --- State ---
	let selectedModel: ModelKey = $state('qwen-2.5-1.5b');
	let activeTab: 'chat' | 'extract' | 'classify' = $state('chat');
	const supported = isLocalLlmSupported();
	const status = getLocalLlmStatus();

	// Chat tab
	let systemPrompt = $state('');
	let userInput = $state('');
	let messages: { role: 'user' | 'assistant'; content: string }[] = $state([]);
	let streamingContent = $state('');
	let isGenerating = $state(false);
	let lastLatency = $state<number | null>(null);
	let lastTokens = $state<{ prompt: number; completion: number } | null>(null);

	// Extract tab
	let extractText = $state('');
	let extractInstruction = $state(
		'Extract all names and ages as a JSON array of objects with "name" and "age" fields.'
	);
	let extractResult = $state('');
	let extractLoading = $state(false);

	// Classify tab
	let classifyText = $state('');
	let classifyCategories = $state('positive, negative, neutral');
	let classifyResult = $state('');
	let classifyLoading = $state(false);

	// --- Derived ---
	let isReady = $derived(status.current.state === 'ready');
	let isLoading = $derived(
		status.current.state === 'downloading' ||
			status.current.state === 'loading' ||
			status.current.state === 'checking'
	);
	let progress = $derived(status.current.state === 'downloading' ? status.current.progress : null);
	let statusText = $derived(() => {
		const s = status.current;
		switch (s.state) {
			case 'idle':
				return 'Nicht geladen';
			case 'checking':
				return 'Prüfe WebGPU...';
			case 'downloading':
				return `Lade Modell... ${Math.round(s.progress * 100)}%`;
			case 'loading':
				return s.text;
			case 'ready':
				return 'Bereit';
			case 'error':
				return `Fehler: ${s.error}`;
			default:
				return '';
		}
	});

	let modelInfo = $derived(MODELS[selectedModel]);

	// --- Actions ---
	async function handleLoad() {
		await loadLocalLlm(selectedModel);
	}

	async function handleUnload() {
		await unloadLocalLlm();
		messages = [];
		streamingContent = '';
		lastLatency = null;
		lastTokens = null;
	}

	async function handleSend() {
		if (!userInput.trim() || isGenerating) return;

		const userMsg = userInput.trim();
		messages = [...messages, { role: 'user', content: userMsg }];
		userInput = '';
		isGenerating = true;
		streamingContent = '';

		try {
			const msgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
			if (systemPrompt.trim()) {
				msgs.push({ role: 'system', content: systemPrompt.trim() });
			}
			// Include conversation history
			for (const m of messages) {
				msgs.push({ role: m.role, content: m.content });
			}

			const result = await generate({
				messages: msgs,
				temperature: 0.7,
				maxTokens: 1024,
				onToken: (token) => {
					streamingContent += token;
				},
			});

			messages = [...messages, { role: 'assistant', content: result.content }];
			lastLatency = result.latencyMs;
			lastTokens = {
				prompt: result.usage.prompt_tokens,
				completion: result.usage.completion_tokens,
			};
			streamingContent = '';
		} catch (err) {
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `Fehler: ${err instanceof Error ? err.message : String(err)}`,
				},
			];
		} finally {
			isGenerating = false;
		}
	}

	async function handleExtract() {
		if (!extractText.trim() || extractLoading) return;
		extractLoading = true;
		extractResult = '';
		try {
			const result = await extractJson(extractText, extractInstruction);
			extractResult = JSON.stringify(result, null, 2);
		} catch (err) {
			extractResult = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			extractLoading = false;
		}
	}

	async function handleClassify() {
		if (!classifyText.trim() || classifyLoading) return;
		classifyLoading = true;
		classifyResult = '';
		try {
			const cats = classifyCategories
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean);
			const result = await classify(classifyText, cats);
			classifyResult = result;
		} catch (err) {
			classifyResult = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			classifyLoading = false;
		}
	}

	function handleClear() {
		messages = [];
		streamingContent = '';
		lastLatency = null;
		lastTokens = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<svelte:head>
	<title>Local LLM Test - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Local LLM Test</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Browser-basierte KI-Inferenz via WebGPU + WebLLM
		</p>
	</header>

	<!-- WebGPU Support Check -->
	{#if !supported}
		<div class="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
			<p class="text-lg font-semibold text-red-400">WebGPU nicht verfügbar</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Dieses Feature benötigt einen Browser mit WebGPU-Support (Chrome 113+, Edge 113+). Safari
				und Firefox haben experimentelle Unterstützung.
			</p>
		</div>
	{:else}
		<!-- Model Controls -->
		<div class="mb-6 rounded-xl border border-border bg-card p-4">
			<div class="flex flex-wrap items-center gap-4">
				<!-- Model Select -->
				<div class="flex flex-col gap-1">
					<label for="model-select" class="text-xs font-medium text-muted-foreground">Modell</label>
					<select
						id="model-select"
						bind:value={selectedModel}
						disabled={isLoading || isGenerating}
						class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
					>
						{#each Object.entries(MODELS) as [key, model]}
							<option value={key}>{model.displayName}</option>
						{/each}
					</select>
				</div>

				<!-- Model Info -->
				<div class="flex flex-col gap-0.5 text-xs text-muted-foreground">
					<span>Download: ~{modelInfo.downloadSizeMb} MB</span>
					<span>RAM: ~{modelInfo.ramUsageMb} MB</span>
				</div>

				<!-- Load/Unload Button -->
				<div class="flex items-center gap-2">
					{#if isReady}
						<button
							onclick={handleUnload}
							class="rounded-lg border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
						>
							Entladen
						</button>
					{:else}
						<button
							onclick={handleLoad}
							disabled={isLoading}
							class="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
						>
							{isLoading ? 'Lädt...' : 'Modell laden'}
						</button>
					{/if}
				</div>

				<!-- Status -->
				<div class="ml-auto flex items-center gap-2">
					<div
						class="h-2.5 w-2.5 rounded-full {isReady
							? 'bg-green-500'
							: isLoading
								? 'bg-yellow-500 animate-pulse'
								: status.current.state === 'error'
									? 'bg-red-500'
									: 'bg-muted-foreground/30'}"
					></div>
					<span class="text-xs text-muted-foreground">{statusText()}</span>
				</div>
			</div>

			<!-- Progress Bar -->
			{#if progress !== null}
				<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-primary transition-all duration-300"
						style="width: {Math.round(progress * 100)}%"
					></div>
				</div>
			{/if}
		</div>

		<!-- Tabs -->
		<div class="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
			{#each [{ id: 'chat', label: 'Chat' }, { id: 'extract', label: 'JSON Extract' }, { id: 'classify', label: 'Classify' }] as tab}
				<button
					onclick={() => (activeTab = tab.id as typeof activeTab)}
					class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
					tab.id
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Chat Tab -->
		{#if activeTab === 'chat'}
			<div class="flex flex-col gap-4">
				<!-- System Prompt -->
				<input
					type="text"
					bind:value={systemPrompt}
					placeholder="System Prompt (optional)..."
					class="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
				/>

				<!-- Messages -->
				<div class="min-h-[300px] space-y-3 rounded-xl border border-border bg-background/50 p-4">
					{#if messages.length === 0 && !streamingContent}
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div class="mb-3 rounded-full bg-primary/10 p-3">
								<Robot size={32} class="text-primary" />
							</div>
							<p class="text-sm text-muted-foreground">
								{isReady
									? 'Modell bereit! Schreib einen Prompt.'
									: 'Lade zuerst ein Modell, dann kannst du chatten.'}
							</p>
						</div>
					{:else}
						{#each messages as msg}
							<div
								class="rounded-lg border border-border p-3 {msg.role === 'user'
									? 'ml-8 bg-primary/5'
									: 'mr-8 bg-card'}"
							>
								<div class="mb-1 text-xs font-medium text-muted-foreground">
									{msg.role === 'user' ? 'Du' : modelInfo.displayName}
								</div>
								<div class="whitespace-pre-wrap text-sm text-foreground">{msg.content}</div>
							</div>
						{/each}

						{#if streamingContent}
							<div class="mr-8 rounded-lg border border-border bg-card p-3">
								<div class="mb-1 text-xs font-medium text-muted-foreground">
									{modelInfo.displayName}
								</div>
								<div class="whitespace-pre-wrap text-sm text-foreground">
									{streamingContent}<span class="animate-pulse">|</span>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Stats -->
				{#if lastLatency !== null}
					<div class="flex gap-4 text-xs text-muted-foreground">
						<span>Latenz: {lastLatency}ms</span>
						{#if lastTokens}
							<span>Prompt: {lastTokens.prompt} tokens</span>
							<span>Completion: {lastTokens.completion} tokens</span>
							<span
								>Speed: {lastLatency > 0
									? Math.round((lastTokens.completion / lastLatency) * 1000)
									: 0} tok/s</span
							>
						{/if}
					</div>
				{/if}

				<!-- Input -->
				<div class="flex gap-3">
					<textarea
						bind:value={userInput}
						onkeydown={handleKeydown}
						placeholder={isReady ? 'Prompt eingeben... (Enter zum Senden)' : 'Erst Modell laden...'}
						disabled={!isReady || isGenerating}
						rows={2}
						class="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
					></textarea>
					<div class="flex flex-col gap-2 self-end">
						<button
							onclick={handleSend}
							disabled={!isReady || !userInput.trim() || isGenerating}
							class="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
						>
							<PaperPlaneRight size={18} />
						</button>
						<button
							onclick={handleClear}
							class="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
						>
							<Trash size={18} />
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Extract Tab -->
		{#if activeTab === 'extract'}
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-card p-4">
					<p class="mb-3 text-sm text-muted-foreground">
						Extrahiere strukturiertes JSON aus beliebigem Text. Das LLM analysiert den Text und gibt
						ein JSON-Objekt zurück.
					</p>
					<input
						type="text"
						bind:value={extractInstruction}
						placeholder="Extraction instruction..."
						class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					/>
					<textarea
						bind:value={extractText}
						placeholder="Text zum Extrahieren eingeben...&#10;&#10;z.B.: Anna ist 28 Jahre alt und arbeitet mit Max (35) zusammen."
						rows={5}
						class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					></textarea>
					<button
						onclick={handleExtract}
						disabled={!isReady || !extractText.trim() || extractLoading}
						class="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
					>
						{extractLoading ? 'Extrahiere...' : 'JSON extrahieren'}
					</button>
				</div>

				{#if extractResult}
					<div class="rounded-xl border border-border bg-card p-4">
						<div class="mb-2 text-xs font-medium text-muted-foreground">Ergebnis</div>
						<pre
							class="overflow-x-auto rounded-lg bg-background p-3 text-sm text-foreground">{extractResult}</pre>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Classify Tab -->
		{#if activeTab === 'classify'}
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-card p-4">
					<p class="mb-3 text-sm text-muted-foreground">
						Klassifiziere Text in eine von mehreren Kategorien. Das LLM wählt die passendste
						Kategorie.
					</p>
					<input
						type="text"
						bind:value={classifyCategories}
						placeholder="Kategorien (kommagetrennt)..."
						class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					/>
					<textarea
						bind:value={classifyText}
						placeholder="Text zum Klassifizieren eingeben...&#10;&#10;z.B.: Das Essen war fantastisch, ich komme definitiv wieder!"
						rows={4}
						class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					></textarea>
					<button
						onclick={handleClassify}
						disabled={!isReady || !classifyText.trim() || classifyLoading}
						class="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
					>
						{classifyLoading ? 'Klassifiziere...' : 'Klassifizieren'}
					</button>
				</div>

				{#if classifyResult}
					<div class="rounded-xl border border-border bg-card p-4">
						<div class="mb-2 text-xs font-medium text-muted-foreground">Ergebnis</div>
						<div class="rounded-lg bg-background px-4 py-3 text-lg font-semibold text-foreground">
							{classifyResult}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
