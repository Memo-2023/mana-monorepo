<!--
  Playground — Workbench ListView (embedded variant).

  Compact version of the standalone /playground page, used by the module
  registry when the playground is mounted inside split-screen / app-grid
  containers. Both UIs share the same backend wrapper in `./llm.ts` so
  there's no risk of one drifting from the other.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { PLAYGROUND_MODELS, type PlaygroundMessage } from './index';
	import { listModels, streamCompletion, type ChatMessage } from './llm';

	type ModelOption = { id: string; label: string; provider: string };
	const fallbackOptions: ModelOption[] = PLAYGROUND_MODELS.map((m) => ({
		id: m.id,
		label: m.label,
		provider: m.provider,
	}));

	let modelOptions = $state<ModelOption[]>(fallbackOptions);
	let selectedModel = $state<string>(fallbackOptions[0].id);
	let prompt = $state('');
	let messages = $state<PlaygroundMessage[]>([]);
	let isLoading = $state(false);
	let abortController: AbortController | null = null;

	const modelLabel = $derived(
		modelOptions.find((m) => m.id === selectedModel)?.label ?? selectedModel
	);

	onMount(async () => {
		const remote = await listModels();
		if (remote.length === 0) return;
		modelOptions = remote.map((m) => ({ id: m.id, label: m.id, provider: m.owned_by }));
		if (!modelOptions.some((m) => m.id === selectedModel)) {
			selectedModel = modelOptions[0].id;
		}
	});

	async function send() {
		if (!prompt.trim() || isLoading) return;

		const userMsg: PlaygroundMessage = { role: 'user', content: prompt, timestamp: Date.now() };
		messages = [...messages, userMsg];
		prompt = '';

		const wire: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

		const placeholder: PlaygroundMessage = {
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
		};
		messages = [...messages, placeholder];
		const idx = messages.length - 1;

		isLoading = true;
		abortController = new AbortController();
		try {
			for await (const delta of streamCompletion({
				model: selectedModel,
				messages: wire,
				signal: abortController.signal,
			})) {
				const next = [...messages];
				next[idx] = { ...next[idx], content: next[idx].content + delta };
				messages = next;
			}
		} catch (err) {
			const next = [...messages];
			const reason = err instanceof Error ? err.message : 'Fehler';
			next[idx] = {
				...next[idx],
				content: next[idx].content || `⚠ ${reason}`,
			};
			messages = next;
		} finally {
			isLoading = false;
			abortController = null;
		}
	}

	function stop() {
		abortController?.abort();
	}
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<!-- Model selector -->
	<select
		bind:value={selectedModel}
		class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 focus:border-white/20 focus:outline-none"
	>
		{#each modelOptions as model}
			<option value={model.id} class="bg-neutral-900">{model.label} ({model.provider})</option>
		{/each}
	</select>

	<!-- Messages -->
	<div class="flex-1 overflow-auto">
		{#each messages as msg}
			<div
				class="mb-2 min-h-[44px] rounded-md px-3 py-2 {msg.role === 'user'
					? 'bg-white/5'
					: 'bg-blue-500/10'}"
			>
				<p class="text-[10px] text-white/30">{msg.role === 'user' ? 'Du' : modelLabel}</p>
				{#if msg.content}
					<p class="whitespace-pre-wrap text-sm text-white/70">{msg.content}</p>
				{:else}
					<p class="text-sm text-white/30">…</p>
				{/if}
			</div>
		{/each}

		{#if messages.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="text-sm text-white/30">Schreib einen Prompt...</p>
			</div>
		{/if}
	</div>

	<!-- Input -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			send();
		}}
		class="flex gap-2"
	>
		<input
			bind:value={prompt}
			placeholder="Prompt eingeben..."
			class="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
		/>
		{#if isLoading}
			<button
				type="button"
				onclick={stop}
				class="rounded-md bg-red-500/20 px-3 py-1.5 text-sm text-red-200 transition-colors hover:bg-red-500/30"
				>Stop</button
			>
		{:else}
			<button
				type="submit"
				disabled={!prompt.trim()}
				class="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15 disabled:opacity-50"
				>&#9654;</button
			>
		{/if}
	</form>
</div>
