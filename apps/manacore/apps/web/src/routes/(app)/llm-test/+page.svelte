<script lang="ts">
	import {
		getLocalLlmStatus,
		loadLocalLlm,
		unloadLocalLlm,
		isLocalLlmSupported,
		generate,
		extractJson,
		classify,
		MODELS,
		type ModelKey,
	} from '@manacore/local-llm';
	import { Robot, Trash, PaperPlaneRight } from '@manacore/shared-icons';

	const modelKeys = Object.keys(MODELS) as ModelKey[];

	// --- State ---
	let selectedModel: ModelKey = $state('qwen-2.5-1.5b');
	let activeTab: 'chat' | 'extract' | 'classify' | 'compare' = $state('chat');
	const supported = isLocalLlmSupported();
	const status = getLocalLlmStatus();

	// Chat tab
	let systemPrompt = $state('');
	let userInput = $state('');
	let messages: { role: 'user' | 'assistant'; content: string }[] = $state([]);
	let streamingContent = $state('');
	let chatContainer: HTMLDivElement | undefined = $state();
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

	// Compare tab
	interface CompareResult {
		model: ModelKey;
		displayName: string;
		content: string;
		latencyMs: number;
		promptTokens: number;
		completionTokens: number;
		tokPerSec: number;
		error?: string;
	}

	let comparePrompt = $state('');
	let compareSystemPrompt = $state('');
	let compareTemperature = $state(0.7);
	let compareMaxTokens = $state(1024);
	let compareResults = $state<CompareResult[]>([]);
	let compareRunning = $state(false);
	let compareCurrentModel = $state<string | null>(null);
	let compareStreamingContent = $state('');

	// --- Derived ---
	let isReady = $derived(status.current.state === 'ready');
	let isLoading = $derived(
		status.current.state === 'downloading' ||
			status.current.state === 'loading' ||
			status.current.state === 'checking'
	);
	let progress = $derived(status.current.state === 'downloading' ? status.current.progress : null);
	let statusText = $derived.by(() => {
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

	// Auto-scroll chat to bottom on new messages/streaming
	$effect(() => {
		messages.length;
		streamingContent;
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});

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

	async function handleCompare() {
		if (!comparePrompt.trim() || compareRunning) return;
		compareRunning = true;
		compareResults = [];
		compareStreamingContent = '';

		const msgs: { role: 'system' | 'user'; content: string }[] = [];
		if (compareSystemPrompt.trim()) {
			msgs.push({ role: 'system', content: compareSystemPrompt.trim() });
		}
		msgs.push({ role: 'user', content: comparePrompt.trim() });

		for (const modelKey of modelKeys) {
			compareCurrentModel = MODELS[modelKey].displayName;
			compareStreamingContent = '';

			try {
				await loadLocalLlm(modelKey);

				const result = await generate({
					messages: msgs,
					temperature: compareTemperature,
					maxTokens: compareMaxTokens,
					onToken: (token) => {
						compareStreamingContent += token;
					},
				});

				const tokPerSec =
					result.latencyMs > 0
						? Math.round((result.usage.completion_tokens / result.latencyMs) * 1000)
						: 0;

				compareResults = [
					...compareResults,
					{
						model: modelKey,
						displayName: MODELS[modelKey].displayName,
						content: result.content,
						latencyMs: result.latencyMs,
						promptTokens: result.usage.prompt_tokens,
						completionTokens: result.usage.completion_tokens,
						tokPerSec,
					},
				];
			} catch (err) {
				compareResults = [
					...compareResults,
					{
						model: modelKey,
						displayName: MODELS[modelKey].displayName,
						content: '',
						latencyMs: 0,
						promptTokens: 0,
						completionTokens: 0,
						tokPerSec: 0,
						error: err instanceof Error ? err.message : String(err),
					},
				];
			}

			await unloadLocalLlm();
		}

		compareCurrentModel = null;
		compareStreamingContent = '';
		compareRunning = false;
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
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Local LLM Test</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Browser-basierte KI-Inferenz via WebGPU + WebLLM
		</p>
	</header>

	{#if !supported}
		<div class="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
			<p class="text-lg font-semibold text-red-400">WebGPU nicht verfügbar</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Dieses Feature benötigt einen Browser mit WebGPU-Support (Chrome 113+, Edge 113+). Safari
				und Firefox haben experimentelle Unterstützung.
			</p>
		</div>
	{:else}
		<!-- Model Controls (hidden on Compare tab — it manages models itself) -->
		{#if activeTab !== 'compare'}
			<div class="mb-6 rounded-xl border border-border bg-card p-4">
				<div class="flex flex-wrap items-center gap-4">
					<div class="flex flex-col gap-1">
						<label for="model-select" class="text-xs font-medium text-muted-foreground"
							>Modell</label
						>
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

					<div class="flex flex-col gap-0.5 text-xs text-muted-foreground">
						<span>Download: ~{modelInfo.downloadSizeMb} MB</span>
						<span>RAM: ~{modelInfo.ramUsageMb} MB</span>
					</div>

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

					<div class="ml-auto flex items-center gap-2">
						<div
							class="h-2.5 w-2.5 rounded-full {isReady
								? 'bg-green-500'
								: isLoading
									? 'animate-pulse bg-yellow-500'
									: status.current.state === 'error'
										? 'bg-red-500'
										: 'bg-muted-foreground/30'}"
						></div>
						<span class="text-xs text-muted-foreground">{statusText}</span>
					</div>
				</div>

				{#if progress !== null}
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all duration-300"
							style="width: {Math.round(progress * 100)}%"
						></div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Tabs -->
		<div class="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
			{#each [{ id: 'chat', label: 'Chat' }, { id: 'extract', label: 'JSON Extract' }, { id: 'classify', label: 'Classify' }, { id: 'compare', label: 'Compare' }] as tab}
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
				<input
					type="text"
					bind:value={systemPrompt}
					placeholder="System Prompt (optional)..."
					class="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
				/>

				<div
					bind:this={chatContainer}
					class="max-h-[60vh] min-h-[300px] space-y-3 overflow-y-auto rounded-xl border border-border bg-background/50 p-4"
				>
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

				{#if lastLatency !== null}
					<div class="flex gap-4 text-xs text-muted-foreground">
						<span>Latenz: {lastLatency}ms</span>
						{#if lastTokens}
							<span>Prompt: {lastTokens.prompt} tokens</span>
							<span>Completion: {lastTokens.completion} tokens</span>
							<span>
								Speed: {lastLatency > 0
									? Math.round((lastTokens.completion / lastLatency) * 1000)
									: 0} tok/s
							</span>
						{/if}
					</div>
				{/if}

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

		<!-- Compare Tab -->
		{#if activeTab === 'compare'}
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-card p-4">
					<p class="mb-3 text-sm text-muted-foreground">
						Denselben Prompt sequentiell gegen alle {modelKeys.length} Modelle testen. Jedes Modell wird
						geladen, inferiert und wieder entladen — die Ergebnisse erscheinen nebeneinander.
					</p>

					<input
						type="text"
						bind:value={compareSystemPrompt}
						placeholder="System Prompt (optional)..."
						class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					/>

					<textarea
						bind:value={comparePrompt}
						placeholder="Prompt eingeben, der gegen alle Modelle getestet wird...&#10;&#10;z.B.: Erkläre Quantencomputing in 3 Sätzen."
						rows={4}
						disabled={compareRunning}
						class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
					></textarea>

					<div class="mt-3 flex flex-wrap items-end gap-4">
						<div class="flex flex-col gap-1">
							<label for="compare-temp" class="text-xs text-muted-foreground">Temperature</label>
							<input
								id="compare-temp"
								type="number"
								min="0"
								max="2"
								step="0.1"
								bind:value={compareTemperature}
								disabled={compareRunning}
								class="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<label for="compare-tokens" class="text-xs text-muted-foreground">Max Tokens</label>
							<input
								id="compare-tokens"
								type="number"
								min="64"
								max="4096"
								step="64"
								bind:value={compareMaxTokens}
								disabled={compareRunning}
								class="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
							/>
						</div>
						<button
							onclick={handleCompare}
							disabled={!comparePrompt.trim() || compareRunning}
							class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
						>
							{compareRunning ? 'Läuft...' : `Alle ${modelKeys.length} Modelle vergleichen`}
						</button>
					</div>
				</div>

				<!-- Running indicator -->
				{#if compareRunning && compareCurrentModel}
					<div class="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
						<div class="mb-2 flex items-center gap-2">
							<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-500"></div>
							<span class="text-sm font-medium text-foreground">{compareCurrentModel}</span>
							<span class="text-xs text-muted-foreground">
								({compareResults.length + 1}/{modelKeys.length})
							</span>
						</div>
						{#if compareStreamingContent}
							<div
								class="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground"
							>
								{compareStreamingContent}<span class="animate-pulse">|</span>
							</div>
						{:else}
							<div class="text-xs text-muted-foreground">{statusText}</div>
						{/if}
					</div>
				{/if}

				<!-- Results -->
				{#if compareResults.length > 0}
					<!-- Stats comparison table -->
					<div class="overflow-x-auto rounded-xl border border-border">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border bg-card">
									<th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
										>Metrik</th
									>
									{#each compareResults as r}
										<th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
											{r.displayName}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								<tr class="border-b border-border">
									<td class="px-4 py-2 text-muted-foreground">Latenz</td>
									{#each compareResults as r}
										<td class="px-4 py-2 font-mono {r.error ? 'text-red-400' : 'text-foreground'}">
											{r.error ? 'Fehler' : `${(r.latencyMs / 1000).toFixed(1)}s`}
										</td>
									{/each}
								</tr>
								<tr class="border-b border-border">
									<td class="px-4 py-2 text-muted-foreground">Speed</td>
									{#each compareResults as r}
										<td class="px-4 py-2 font-mono text-foreground">
											{r.error ? '—' : `${r.tokPerSec} tok/s`}
										</td>
									{/each}
								</tr>
								<tr class="border-b border-border">
									<td class="px-4 py-2 text-muted-foreground">Prompt Tokens</td>
									{#each compareResults as r}
										<td class="px-4 py-2 font-mono text-foreground">
											{r.error ? '—' : r.promptTokens}
										</td>
									{/each}
								</tr>
								<tr>
									<td class="px-4 py-2 text-muted-foreground">Completion Tokens</td>
									{#each compareResults as r}
										<td class="px-4 py-2 font-mono text-foreground">
											{r.error ? '—' : r.completionTokens}
										</td>
									{/each}
								</tr>
							</tbody>
						</table>
					</div>

					<!-- Outputs side by side -->
					<div
						class="grid gap-4"
						style="grid-template-columns: repeat({compareResults.length}, minmax(0, 1fr));"
					>
						{#each compareResults as r}
							<div class="rounded-xl border border-border bg-card p-4">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-sm font-semibold text-foreground">{r.displayName}</span>
									<span class="text-xs text-muted-foreground"
										>{(r.latencyMs / 1000).toFixed(1)}s</span
									>
								</div>
								{#if r.error}
									<div class="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
										{r.error}
									</div>
								{:else}
									<div
										class="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground"
									>
										{r.content}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
