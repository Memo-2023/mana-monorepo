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
	} from '@mana/local-llm';
	import { hasModelInCache } from '@mana/local-llm';
	import {
		llmOrchestrator,
		llmSettingsState,
		updateLlmSettings,
		ALL_TIERS,
		tierLabel,
		type LlmTier,
	} from '@mana/shared-llm';
	import { extractDateTask } from '$lib/llm-tasks/extract-date';
	import { summarizeTextTask } from '$lib/llm-tasks/summarize';
	import { llmTaskQueue, llmQueueDb } from '$lib/llm-queue';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { marked } from 'marked';
	import { Robot, Trash, PaperPlaneRight, ClockCounterClockwise } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const modelKeys = Object.keys(MODELS) as ModelKey[];

	// --- Markdown rendering ---
	marked.setOptions({ breaks: true, gfm: true });

	function renderMarkdown(text: string): string {
		return marked.parse(text, { async: false }) as string;
	}

	// --- Model cache status ---
	let modelCacheStatus = $state<Record<string, boolean>>({});

	async function checkModelCache() {
		if (typeof caches === 'undefined') return;
		for (const [key, config] of Object.entries(MODELS)) {
			try {
				modelCacheStatus[key] = await hasModelInCache(config.modelId);
			} catch {
				modelCacheStatus[key] = false;
			}
		}
	}

	if (typeof window !== 'undefined') {
		checkModelCache();
	}

	// --- State ---
	let selectedModel: ModelKey = $state('gemma-4-e2b');
	let activeTab: 'chat' | 'extract' | 'classify' | 'compare' | 'benchmark' | 'router' | 'queue' =
		$state('chat');

	// --- Queue tab state ---
	let queueInput = $state('Treffen mit Sara morgen 14:30');
	let queueLastEnqueuedId = $state<string | null>(null);
	const queueRows = useLiveQueryWithDefault(
		async () => llmQueueDb.tasks.orderBy('enqueuedAt').reverse().limit(20).toArray(),
		[]
	);

	async function enqueueTaskNow(task: typeof extractDateTask | typeof summarizeTextTask) {
		// The two LlmTask shapes have different output types but identical
		// {text: string} input, so we widen `task` to `any` for the
		// enqueue call — TypeScript can't unify the union arg with the
		// generic without specializing per task.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		queueLastEnqueuedId = await llmTaskQueue.enqueue(task as any, { text: queueInput });
	}

	// --- Router tab state ---
	const settings = $derived(llmSettingsState.current);
	let routerInput = $state('Treffen mit Sara morgen 14:30');
	let routerRunning = $state(false);
	let routerResult = $state<{
		value: unknown;
		source: string;
		latencyMs: number;
		attempted: string[];
	} | null>(null);
	let routerError = $state<string | null>(null);

	function toggleAllowedTier(tier: LlmTier) {
		const current = settings.allowedTiers;
		const next = current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier];
		updateLlmSettings({ allowedTiers: next });
	}

	async function runRouterTask(task: typeof extractDateTask | typeof summarizeTextTask) {
		routerRunning = true;
		routerResult = null;
		routerError = null;
		try {
			const input = task === extractDateTask ? { text: routerInput } : { text: routerInput };
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await llmOrchestrator.run(task as any, input);
			routerResult = {
				value: result.value,
				source: result.source,
				latencyMs: result.latencyMs,
				attempted: result.attempted,
			};
		} catch (err) {
			routerError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
		} finally {
			routerRunning = false;
		}
	}
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

	interface CompareHistoryEntry {
		id: string;
		timestamp: number;
		prompt: string;
		systemPrompt: string;
		temperature: number;
		maxTokens: number;
		results: CompareResult[];
	}

	let comparePrompt = $state('');
	let compareSystemPrompt = $state('');
	let compareTemperature = $state(0.7);
	let compareMaxTokens = $state(1024);
	let compareResults = $state<CompareResult[]>([]);
	let compareRunning = $state(false);
	let compareCurrentModel = $state<string | null>(null);
	let compareStreamingContent = $state('');
	let compareHistory = $state<CompareHistoryEntry[]>([]);
	let showHistory = $state(false);

	function loadCompareHistory() {
		try {
			const stored = localStorage.getItem('llm-compare-history');
			if (stored) compareHistory = JSON.parse(stored);
		} catch {
			/* ignore */
		}
	}

	function saveCompareHistory() {
		try {
			localStorage.setItem('llm-compare-history', JSON.stringify(compareHistory));
		} catch {
			/* ignore */
		}
	}

	function deleteHistoryEntry(id: string) {
		compareHistory = compareHistory.filter((e) => e.id !== id);
		saveCompareHistory();
	}

	function restoreHistoryEntry(entry: CompareHistoryEntry) {
		comparePrompt = entry.prompt;
		compareSystemPrompt = entry.systemPrompt;
		compareTemperature = entry.temperature;
		compareMaxTokens = entry.maxTokens;
		compareResults = entry.results;
		showHistory = false;
	}

	if (typeof window !== 'undefined') {
		loadCompareHistory();
	}

	// Benchmark tab
	interface BenchmarkRun {
		iteration: number;
		latencyMs: number;
		tokPerSec: number;
		completionTokens: number;
	}

	interface BenchmarkStats {
		runs: BenchmarkRun[];
		avgLatency: number;
		minLatency: number;
		maxLatency: number;
		medianLatency: number;
		avgTokPerSec: number;
		minTokPerSec: number;
		maxTokPerSec: number;
		medianTokPerSec: number;
		totalTokens: number;
	}

	let benchmarkPrompt = $state('');
	let benchmarkSystemPrompt = $state('');
	let benchmarkIterations = $state(5);
	let benchmarkTemperature = $state(0.7);
	let benchmarkMaxTokens = $state(256);
	let benchmarkRunning = $state(false);
	let benchmarkCurrentRun = $state(0);
	let benchmarkStats = $state<BenchmarkStats | null>(null);

	function median(arr: number[]): number {
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
	}

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
		checkModelCache();
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
			if (systemPrompt.trim()) msgs.push({ role: 'system', content: systemPrompt.trim() });
			for (const m of messages) msgs.push({ role: m.role, content: m.content });

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
		if (compareSystemPrompt.trim())
			msgs.push({ role: 'system', content: compareSystemPrompt.trim() });
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

		const entry: CompareHistoryEntry = {
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			prompt: comparePrompt,
			systemPrompt: compareSystemPrompt,
			temperature: compareTemperature,
			maxTokens: compareMaxTokens,
			results: compareResults,
		};
		compareHistory = [entry, ...compareHistory].slice(0, 20);
		saveCompareHistory();

		compareCurrentModel = null;
		compareStreamingContent = '';
		compareRunning = false;
		checkModelCache();
	}

	async function handleBenchmark() {
		if (!benchmarkPrompt.trim() || benchmarkRunning || !isReady) return;
		benchmarkRunning = true;
		benchmarkStats = null;
		benchmarkCurrentRun = 0;

		const msgs: { role: 'system' | 'user'; content: string }[] = [];
		if (benchmarkSystemPrompt.trim())
			msgs.push({ role: 'system', content: benchmarkSystemPrompt.trim() });
		msgs.push({ role: 'user', content: benchmarkPrompt.trim() });

		const runs: BenchmarkRun[] = [];
		for (let i = 0; i < benchmarkIterations; i++) {
			benchmarkCurrentRun = i + 1;
			try {
				const result = await generate({
					messages: msgs,
					temperature: benchmarkTemperature,
					maxTokens: benchmarkMaxTokens,
				});
				const tokPerSec =
					result.latencyMs > 0
						? Math.round((result.usage.completion_tokens / result.latencyMs) * 1000)
						: 0;
				runs.push({
					iteration: i + 1,
					latencyMs: result.latencyMs,
					tokPerSec,
					completionTokens: result.usage.completion_tokens,
				});
			} catch {
				runs.push({ iteration: i + 1, latencyMs: 0, tokPerSec: 0, completionTokens: 0 });
			}
		}

		const latencies = runs.map((r) => r.latencyMs).filter((l) => l > 0);
		const speeds = runs.map((r) => r.tokPerSec).filter((s) => s > 0);
		benchmarkStats = {
			runs,
			avgLatency: latencies.length
				? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
				: 0,
			minLatency: latencies.length ? Math.min(...latencies) : 0,
			maxLatency: latencies.length ? Math.max(...latencies) : 0,
			medianLatency: latencies.length ? median(latencies) : 0,
			avgTokPerSec: speeds.length
				? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
				: 0,
			minTokPerSec: speeds.length ? Math.min(...speeds) : 0,
			maxTokPerSec: speeds.length ? Math.max(...speeds) : 0,
			medianTokPerSec: speeds.length ? median(speeds) : 0,
			totalTokens: runs.reduce((a, r) => a + r.completionTokens, 0),
		};
		benchmarkRunning = false;
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

	function formatTime(ts: number): string {
		return new Date(ts).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<svelte:head>
	<title>Local LLM Test - Mana</title>
	{@html `<style>
		.llm-prose { line-height: 1.6; }
		.llm-prose p { margin: 0.4em 0; }
		.llm-prose pre { background: hsl(var(--color-muted)); border-radius: 0.5rem; padding: 0.75rem; overflow-x: auto; margin: 0.5em 0; }
		.llm-prose code { font-size: 0.85em; background: hsl(var(--color-muted)); padding: 0.15em 0.3em; border-radius: 0.25rem; }
		.llm-prose pre code { background: none; padding: 0; }
		.llm-prose ul, .llm-prose ol { padding-left: 1.5em; margin: 0.4em 0; }
		.llm-prose h1, .llm-prose h2, .llm-prose h3 { margin: 0.6em 0 0.3em; font-weight: 600; }
		.llm-prose blockquote { border-left: 3px solid hsl(var(--color-border)); padding-left: 0.75em; margin: 0.4em 0; opacity: 0.8; }
	</style>`}
</svelte:head>

<RoutePage appId="llm-test">
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
					Dieses Feature benötigt einen Browser mit WebGPU-Support (Chrome 113+, Edge 113+).
				</p>
			</div>
		{:else}
			<!-- Model Controls (hidden on Compare tab) -->
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
									<option value={key}
										>{model.displayName}{modelCacheStatus[key] ? ' (cached)' : ''}</option
									>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-0.5 text-xs text-muted-foreground">
							<span>Download: ~{modelInfo.downloadSizeMb} MB</span>
							<span>RAM: ~{modelInfo.ramUsageMb} MB</span>
							{#if modelCacheStatus[selectedModel] !== undefined}
								<span
									class={modelCacheStatus[selectedModel]
										? 'text-green-500'
										: 'text-muted-foreground'}
								>
									{modelCacheStatus[selectedModel] ? 'Im Cache' : 'Nicht im Cache'}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#if isReady}
								<button
									onclick={handleUnload}
									class="rounded-lg border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
									>Entladen</button
								>
							{:else}
								<button
									onclick={handleLoad}
									disabled={isLoading}
									class="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
									>{isLoading ? 'Lädt...' : 'Modell laden'}</button
								>
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
								class="h-full rounded-full bg-primary transition-[width] duration-300"
								style="width: {Math.round(progress * 100)}%"
							></div>
						</div>
					{/if}
					<!-- Cache overview -->
					{#if Object.keys(modelCacheStatus).length > 0}
						<div class="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
							{#each modelKeys as key}
								<div
									class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs"
								>
									<div
										class="h-1.5 w-1.5 rounded-full {modelCacheStatus[key]
											? 'bg-green-500'
											: 'bg-muted-foreground/30'}"
									></div>
									<span class="text-muted-foreground">{MODELS[key].displayName}</span>
									{#if modelCacheStatus[key]}
										<span class="text-green-500">~{MODELS[key].downloadSizeMb} MB</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tabs -->
			<div class="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
				{#each [{ id: 'chat', label: 'Chat' }, { id: 'extract', label: 'JSON Extract' }, { id: 'classify', label: 'Classify' }, { id: 'compare', label: 'Compare' }, { id: 'benchmark', label: 'Benchmark' }, { id: 'router', label: 'Router' }, { id: 'queue', label: 'Queue' }] as tab}
					<button
						onclick={() => (activeTab = tab.id as typeof activeTab)}
						class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
						tab.id
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'}">{tab.label}</button
					>
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
									{#if msg.role === 'assistant'}
										<div class="llm-prose text-sm text-foreground">
											{@html renderMarkdown(msg.content)}
										</div>
									{:else}
										<div class="whitespace-pre-wrap text-sm text-foreground">{msg.content}</div>
									{/if}
								</div>
							{/each}
							{#if streamingContent}
								<div class="mr-8 rounded-lg border border-border bg-card p-3">
									<div class="mb-1 text-xs font-medium text-muted-foreground">
										{modelInfo.displayName}
									</div>
									<div class="llm-prose text-sm text-foreground">
										{@html renderMarkdown(streamingContent)}<span class="animate-pulse">|</span>
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
								<span
									>Speed: {lastLatency > 0
										? Math.round((lastTokens.completion / lastLatency) * 1000)
										: 0} tok/s</span
								>
							{/if}
						</div>
					{/if}
					<div class="flex gap-3">
						<textarea
							bind:value={userInput}
							onkeydown={handleKeydown}
							placeholder={isReady
								? 'Prompt eingeben... (Enter zum Senden)'
								: 'Erst Modell laden...'}
							disabled={!isReady || isGenerating}
							rows={2}
							class="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
						></textarea>
						<div class="flex flex-col gap-2 self-end">
							<button
								onclick={handleSend}
								disabled={!isReady || !userInput.trim() || isGenerating}
								class="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
								><PaperPlaneRight size={18} /></button
							>
							<button
								onclick={handleClear}
								class="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
								><Trash size={18} /></button
							>
						</div>
					</div>
				</div>
			{/if}

			<!-- Extract Tab -->
			{#if activeTab === 'extract'}
				<div class="flex flex-col gap-4">
					<div class="rounded-xl border border-border bg-card p-4">
						<p class="mb-3 text-sm text-muted-foreground">
							Extrahiere strukturiertes JSON aus beliebigem Text.
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
							>{extractLoading ? 'Extrahiere...' : 'JSON extrahieren'}</button
						>
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
							Klassifiziere Text in eine von mehreren Kategorien.
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
							>{classifyLoading ? 'Klassifiziere...' : 'Klassifizieren'}</button
						>
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
						<div class="mb-3 flex items-center justify-between">
							<p class="text-sm text-muted-foreground">
								Denselben Prompt gegen alle {modelKeys.length} Modelle testen.
							</p>
							{#if compareHistory.length > 0}
								<button
									onclick={() => (showHistory = !showHistory)}
									class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
								>
									<ClockCounterClockwise size={14} />
									History ({compareHistory.length})
								</button>
							{/if}
						</div>

						{#if showHistory}
							<div
								class="mb-4 max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-3"
							>
								{#each compareHistory as entry}
									<div
										class="flex items-center justify-between border-b border-border py-2 last:border-0"
									>
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm text-foreground">{entry.prompt}</div>
											<div class="flex gap-3 text-xs text-muted-foreground">
												<span>{formatTime(entry.timestamp)}</span>
												<span>{entry.results.length} Modelle</span>
												<span>T={entry.temperature}</span>
											</div>
										</div>
										<div class="flex gap-1.5">
											<button
												onclick={() => restoreHistoryEntry(entry)}
												class="rounded px-2.5 py-1 text-xs text-primary hover:bg-primary/10"
												>Laden</button
											>
											<button
												onclick={() => deleteHistoryEntry(entry.id)}
												class="rounded px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
												>&times;</button
											>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<input
							type="text"
							bind:value={compareSystemPrompt}
							placeholder="System Prompt (optional)..."
							class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
						/>
						<textarea
							bind:value={comparePrompt}
							placeholder="Prompt eingeben, der gegen alle Modelle getestet wird..."
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
								>{compareRunning
									? 'Läuft...'
									: `Alle ${modelKeys.length} Modelle vergleichen`}</button
							>
						</div>
					</div>

					{#if compareRunning && compareCurrentModel}
						<div class="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
							<div class="mb-2 flex items-center gap-2">
								<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-500"></div>
								<span class="text-sm font-medium text-foreground">{compareCurrentModel}</span>
								<span class="text-xs text-muted-foreground"
									>({compareResults.length + 1}/{modelKeys.length})</span
								>
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

					{#if compareResults.length > 0}
						<div class="overflow-x-auto rounded-xl border border-border">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-border bg-card">
										<th class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
											>Metrik</th
										>
										{#each compareResults as r}<th
												class="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
												>{r.displayName}</th
											>{/each}
									</tr>
								</thead>
								<tbody>
									<tr class="border-b border-border">
										<td class="px-4 py-2 text-muted-foreground">Latenz</td>
										{#each compareResults as r}<td
												class="px-4 py-2 font-mono {r.error ? 'text-red-400' : 'text-foreground'}"
												>{r.error ? 'Fehler' : `${(r.latencyMs / 1000).toFixed(1)}s`}</td
											>{/each}
									</tr>
									<tr class="border-b border-border">
										<td class="px-4 py-2 text-muted-foreground">Speed</td>
										{#each compareResults as r}<td class="px-4 py-2 font-mono text-foreground"
												>{r.error ? '—' : `${r.tokPerSec} tok/s`}</td
											>{/each}
									</tr>
									<tr class="border-b border-border">
										<td class="px-4 py-2 text-muted-foreground">Prompt Tokens</td>
										{#each compareResults as r}<td class="px-4 py-2 font-mono text-foreground"
												>{r.error ? '—' : r.promptTokens}</td
											>{/each}
									</tr>
									<tr>
										<td class="px-4 py-2 text-muted-foreground">Completion Tokens</td>
										{#each compareResults as r}<td class="px-4 py-2 font-mono text-foreground"
												>{r.error ? '—' : r.completionTokens}</td
											>{/each}
									</tr>
								</tbody>
							</table>
						</div>

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
										<div class="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{r.error}</div>
									{:else}
										<div class="llm-prose max-h-[50vh] overflow-y-auto text-sm text-foreground">
											{@html renderMarkdown(r.content)}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Benchmark Tab -->
			{#if activeTab === 'benchmark'}
				<div class="flex flex-col gap-4">
					<div class="rounded-xl border border-border bg-card p-4">
						<p class="mb-3 text-sm text-muted-foreground">
							Denselben Prompt N-mal gegen das geladene Modell laufen lassen, um Varianz zu messen.
						</p>

						{#if !isReady}
							<div class="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
								Lade zuerst ein Modell im Model-Controls-Bereich oben.
							</div>
						{:else}
							<input
								type="text"
								bind:value={benchmarkSystemPrompt}
								placeholder="System Prompt (optional)..."
								class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
							/>
							<textarea
								bind:value={benchmarkPrompt}
								placeholder="Prompt für den Benchmark...&#10;&#10;z.B.: Zähle von 1 bis 20."
								rows={3}
								disabled={benchmarkRunning}
								class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
							></textarea>
							<div class="mt-3 flex flex-wrap items-end gap-4">
								<div class="flex flex-col gap-1">
									<label for="bench-iters" class="text-xs text-muted-foreground">Iterationen</label>
									<input
										id="bench-iters"
										type="number"
										min="1"
										max="50"
										bind:value={benchmarkIterations}
										disabled={benchmarkRunning}
										class="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
									/>
								</div>
								<div class="flex flex-col gap-1">
									<label for="bench-temp" class="text-xs text-muted-foreground">Temperature</label>
									<input
										id="bench-temp"
										type="number"
										min="0"
										max="2"
										step="0.1"
										bind:value={benchmarkTemperature}
										disabled={benchmarkRunning}
										class="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
									/>
								</div>
								<div class="flex flex-col gap-1">
									<label for="bench-tokens" class="text-xs text-muted-foreground">Max Tokens</label>
									<input
										id="bench-tokens"
										type="number"
										min="16"
										max="2048"
										step="16"
										bind:value={benchmarkMaxTokens}
										disabled={benchmarkRunning}
										class="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
									/>
								</div>
								<button
									onclick={handleBenchmark}
									disabled={!benchmarkPrompt.trim() || benchmarkRunning}
									class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
								>
									{#if benchmarkRunning}Run {benchmarkCurrentRun}/{benchmarkIterations}...{:else}Benchmark
										starten{/if}
								</button>
							</div>
						{/if}
					</div>

					{#if benchmarkRunning}
						<div class="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
							<div class="mb-2 flex items-center gap-2">
								<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-500"></div>
								<span class="text-sm font-medium text-foreground"
									>{modelInfo.displayName} — Run {benchmarkCurrentRun}/{benchmarkIterations}</span
								>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary transition-[width] duration-300"
									style="width: {Math.round((benchmarkCurrentRun / benchmarkIterations) * 100)}%"
								></div>
							</div>
						</div>
					{/if}

					{#if benchmarkStats}
						<div class="grid grid-cols-2 gap-4">
							<div class="rounded-xl border border-border bg-card p-4">
								<div class="mb-2 text-xs font-medium text-muted-foreground">Latenz (ms)</div>
								<div class="grid grid-cols-2 gap-y-2 text-sm">
									<span class="text-muted-foreground">Durchschnitt</span><span
										class="font-mono text-foreground">{benchmarkStats.avgLatency}</span
									>
									<span class="text-muted-foreground">Median</span><span
										class="font-mono text-foreground">{benchmarkStats.medianLatency}</span
									>
									<span class="text-muted-foreground">Min</span><span
										class="font-mono text-green-500">{benchmarkStats.minLatency}</span
									>
									<span class="text-muted-foreground">Max</span><span class="font-mono text-red-400"
										>{benchmarkStats.maxLatency}</span
									>
								</div>
							</div>
							<div class="rounded-xl border border-border bg-card p-4">
								<div class="mb-2 text-xs font-medium text-muted-foreground">Speed (tok/s)</div>
								<div class="grid grid-cols-2 gap-y-2 text-sm">
									<span class="text-muted-foreground">Durchschnitt</span><span
										class="font-mono text-foreground">{benchmarkStats.avgTokPerSec}</span
									>
									<span class="text-muted-foreground">Median</span><span
										class="font-mono text-foreground">{benchmarkStats.medianTokPerSec}</span
									>
									<span class="text-muted-foreground">Max</span><span
										class="font-mono text-green-500">{benchmarkStats.maxTokPerSec}</span
									>
									<span class="text-muted-foreground">Min</span><span class="font-mono text-red-400"
										>{benchmarkStats.minTokPerSec}</span
									>
								</div>
							</div>
						</div>

						<div class="overflow-x-auto rounded-xl border border-border">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-border bg-card">
										<th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
											>Run</th
										>
										<th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
											>Latenz</th
										>
										<th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
											>tok/s</th
										>
										<th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
											>Tokens</th
										>
										<th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
											>Verteilung</th
										>
									</tr>
								</thead>
								<tbody>
									{#each benchmarkStats.runs as run}
										{@const maxLat = benchmarkStats.maxLatency || 1}
										<tr class="border-b border-border last:border-0">
											<td class="px-4 py-2 font-mono text-muted-foreground">#{run.iteration}</td>
											<td class="px-4 py-2 font-mono text-foreground"
												>{(run.latencyMs / 1000).toFixed(2)}s</td
											>
											<td class="px-4 py-2 font-mono text-foreground">{run.tokPerSec}</td>
											<td class="px-4 py-2 font-mono text-foreground">{run.completionTokens}</td>
											<td class="px-4 py-2"
												><div class="h-3 w-full rounded-full bg-muted">
													<div
														class="h-full rounded-full bg-primary/60"
														style="width: {Math.round((run.latencyMs / maxLat) * 100)}%"
													></div>
												</div></td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="text-xs text-muted-foreground">
							Total: {benchmarkStats.totalTokens} tokens in {benchmarkStats.runs.length} runs ({modelInfo.displayName})
						</div>
					{/if}
				</div>
			{/if}

			<!-- Router Tab — exercises the @mana/shared-llm tiered orchestrator -->
			{#if activeTab === 'router'}
				<div class="flex flex-col gap-4">
					<div class="rounded-xl border border-border bg-card p-4">
						<p class="mb-3 text-sm text-muted-foreground">
							Smoke-Test für den tiered LLM-Router. Wähle welche Tiers der Orchestrator benutzen
							darf — der Router wählt dann pro Task die erste passende Schicht aus deiner Liste.
						</p>

						<div class="mb-4">
							<div class="mb-2 text-xs font-medium text-muted-foreground">Erlaubte Tiers</div>
							<div class="flex flex-wrap gap-2">
								{#each ALL_TIERS as tier}
									{@const enabled = settings.allowedTiers.includes(tier)}
									<button
										onclick={() => toggleAllowedTier(tier)}
										class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {enabled
											? 'border-primary bg-primary/20 text-primary'
											: 'border-border bg-background text-muted-foreground hover:text-foreground'}"
									>
										{tierLabel(tier)}
									</button>
								{/each}
							</div>
							<div class="mt-2 text-xs text-muted-foreground">
								Aktuell: {settings.allowedTiers.length === 0
									? 'keine LLM-Tiers — nur Tier 0 (Regeln)'
									: settings.allowedTiers.map(tierLabel).join(' → ')}
							</div>
						</div>

						<input
							type="text"
							bind:value={routerInput}
							placeholder="Eingabetext für den Task..."
							class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
						/>

						<div class="flex flex-wrap gap-2">
							<button
								onclick={() => runRouterTask(extractDateTask)}
								disabled={routerRunning || !routerInput.trim()}
								class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
							>
								extractDate (hat T0-Fallback)
							</button>
							<button
								onclick={() => runRouterTask(summarizeTextTask)}
								disabled={routerRunning || !routerInput.trim()}
								class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
							>
								summarize (kein T0)
							</button>
						</div>

						<div class="mt-2 text-xs text-muted-foreground">
							extractDate.canRun: {llmOrchestrator.canRun(extractDateTask)} · summarize.canRun: {llmOrchestrator.canRun(
								summarizeTextTask
							)}
						</div>
					</div>

					{#if routerError}
						<div class="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
							<div class="text-sm font-medium text-red-400">Task fehlgeschlagen</div>
							<div class="mt-1 font-mono text-xs text-red-300">{routerError}</div>
						</div>
					{/if}

					{#if routerResult}
						<div class="rounded-xl border border-border bg-card p-4">
							<div class="mb-2 flex items-center gap-2">
								<span
									class="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
								>
									{tierLabel(routerResult.source as LlmTier)}
								</span>
								<span class="text-xs text-muted-foreground">{routerResult.latencyMs} ms</span>
								{#if routerResult.attempted.length > 1}
									<span class="text-xs text-muted-foreground"
										>(versucht: {routerResult.attempted.join(' → ')})</span
									>
								{/if}
							</div>
							<pre
								class="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs text-foreground">{JSON.stringify(
									routerResult.value,
									null,
									2
								)}</pre>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Queue Tab — exercises the persistent LlmTaskQueue -->
			{#if activeTab === 'queue'}
				<div class="flex flex-col gap-4">
					<div class="rounded-xl border border-border bg-card p-4">
						<p class="mb-3 text-sm text-muted-foreground">
							Smoke-Test für die persistente Task-Queue. Tasks werden in einer eigenen Dexie-DB (<code
								class="rounded bg-muted px-1 py-0.5 text-[10px]">mana-llm-queue</code
							>) gespeichert und im Hintergrund vom Queue-Processor abgearbeitet sobald ein
							passender LLM-Tier verfügbar ist. Tasks überleben Page-Reloads — du kannst die Seite
							hart neuladen und sie laufen weiter.
						</p>

						<input
							type="text"
							bind:value={queueInput}
							placeholder="Eingabetext für den Task..."
							class="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
						/>

						<div class="flex flex-wrap gap-2">
							<button
								onclick={() => enqueueTaskNow(extractDateTask)}
								disabled={!queueInput.trim()}
								class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
							>
								Enqueue extractDate
							</button>
							<button
								onclick={() => enqueueTaskNow(summarizeTextTask)}
								disabled={!queueInput.trim()}
								class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
							>
								Enqueue summarize
							</button>
						</div>

						{#if queueLastEnqueuedId}
							<div class="mt-3 text-xs text-muted-foreground">
								Letzte Task-ID:
								<code class="rounded bg-muted px-1 py-0.5 font-mono">{queueLastEnqueuedId}</code>
							</div>
						{/if}
					</div>

					<!-- Live queue table view via Dexie liveQuery -->
					<div class="rounded-xl border border-border bg-card p-4">
						<div class="mb-3 flex items-center justify-between">
							<h3 class="text-sm font-semibold">Letzte 20 Tasks</h3>
							<button
								onclick={() => llmTaskQueue.purge(0)}
								class="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
							>
								Done/failed löschen
							</button>
						</div>

						{#if queueRows.value.length === 0}
							<div class="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
								Queue ist leer. Reihe oben einen Task ein.
							</div>
						{:else}
							<div class="space-y-2">
								{#each queueRows.value as row}
									{@const stateColor =
										row.state === 'done'
											? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
											: row.state === 'failed'
												? 'border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400'
												: row.state === 'running'
													? 'border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400'
													: 'border-muted-foreground/30 bg-muted/10 text-muted-foreground'}
									<div class="rounded-lg border p-3 text-xs {stateColor}">
										<div class="flex flex-wrap items-center gap-2">
											<span class="rounded-full border border-current px-2 py-0.5 font-medium">
												{row.state}
											</span>
											<span class="font-mono text-foreground">{row.taskName}</span>
											<span class="text-muted-foreground">
												· {new Date(row.enqueuedAt).toLocaleTimeString()}
											</span>
											{#if row.attempts > 1}
												<span class="text-muted-foreground">
													· {row.attempts}/{row.maxAttempts} attempts
												</span>
											{/if}
											{#if row.source}
												<span class="text-muted-foreground">· via {row.source}</span>
											{/if}
										</div>
										<div class="mt-1 truncate text-muted-foreground">
											input: <code class="font-mono">{JSON.stringify(row.input)}</code>
										</div>
										{#if row.result !== undefined}
											<div class="mt-1 text-foreground">
												result: <code class="font-mono">{JSON.stringify(row.result)}</code>
											</div>
										{/if}
										{#if row.error}
											<div class="mt-1 text-red-400">error: {row.error}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</RoutePage>
