<!--
  Playground — Split-Screen AppView
  Minimal LLM prompt interface with model selector.
-->
<script lang="ts">
	import { PLAYGROUND_MODELS, type PlaygroundMessage } from './index';

	let selectedModel = $state(PLAYGROUND_MODELS[0].id);
	let prompt = $state('');
	let messages = $state<PlaygroundMessage[]>([]);
	let isLoading = $state(false);

	const modelLabel = $derived(
		PLAYGROUND_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel
	);

	function send() {
		if (!prompt.trim() || isLoading) return;
		messages = [...messages, { role: 'user', content: prompt, timestamp: Date.now() }];
		// Placeholder — actual API integration happens in full app
		messages = [
			...messages,
			{
				role: 'assistant',
				content: '(Playground-Antwort — verbinde mit mana-llm)',
				timestamp: Date.now(),
			},
		];
		prompt = '';
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<!-- Model selector -->
	<select
		bind:value={selectedModel}
		class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 focus:border-white/20 focus:outline-none"
	>
		{#each PLAYGROUND_MODELS as model}
			<option value={model.id} class="bg-neutral-900">{model.label} ({model.provider})</option>
		{/each}
	</select>

	<!-- Messages -->
	<div class="flex-1 overflow-auto">
		{#each messages as msg, i}
			<div
				class="mb-2 rounded-md px-3 py-2 {msg.role === 'user' ? 'bg-white/5' : 'bg-blue-500/10'}"
			>
				<p class="text-[10px] text-white/30">{msg.role === 'user' ? 'Du' : modelLabel}</p>
				<p class="text-sm text-white/70">{msg.content}</p>
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
		<button
			type="submit"
			disabled={isLoading}
			class="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15 disabled:opacity-50"
			>&#9654;</button
		>
	</form>
</div>
