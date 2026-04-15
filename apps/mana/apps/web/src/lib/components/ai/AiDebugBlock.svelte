<!--
  AiDebugBlock — expandable inspector for one mission iteration's
  captured prompt/response/inputs.

  Renders zero UI when no debug entry exists for the iteration (which is
  the normal case in production — debug capture is opt-in via the
  `mana.ai.debug` localStorage flag).
-->
<script lang="ts">
	import { useAiDebugForIteration } from '$lib/data/ai/missions/debug';

	interface Props {
		iterationId: string;
	}

	let { iterationId }: Props = $props();

	const debug = $derived(useAiDebugForIteration(iterationId));
	let copied = $state(false);

	async function copyAsJson() {
		if (!debug.value) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(debug.value, null, 2));
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch (err) {
			console.warn('[AiDebugBlock] clipboard write failed:', err);
		}
	}
</script>

{#if debug.value}
	{@const d = debug.value}
	<details class="debug-block">
		<summary>
			<span class="dbg-tag">🔍 Debug</span>
			<span class="dbg-meta">
				{d.resolvedInputs.length} Input(s)
				{#if d.preStep.kontextInjected}
					· Kontext{/if}
				{#if d.preStep.webResearch?.ok}
					· Web {d.preStep.webResearch.sourceCount}q
				{:else if d.preStep.webResearch && !d.preStep.webResearch.ok}
					· Web ❌
				{/if}
				{#if d.plannerCalls && d.plannerCalls.length > 0}
					· {d.plannerCalls.length}× LLM · {Math.round(
						d.plannerCalls.reduce((a, c) => a + c.latencyMs, 0)
					)}ms
				{/if}
				{#if d.loopSteps && d.loopSteps.length > 0}
					· {d.loopSteps.length}× Auto-Tool
				{/if}
				{#if d.plannerError}· Planner ❌{/if}
			</span>
			<button
				type="button"
				class="copy-btn"
				onclick={(e) => (e.preventDefault(), copyAsJson())}
				title="Als JSON in Zwischenablage kopieren"
			>
				{copied ? '✓ Kopiert' : '📋 JSON'}
			</button>
		</summary>

		{#if d.preStep.webResearch}
			<section>
				<h5>Pre-Step: Web-Recherche</h5>
				{#if d.preStep.webResearch.ok}
					<p class="ok">{d.preStep.webResearch.sourceCount} Quellen.</p>
					<pre>{d.preStep.webResearch.summary}</pre>
				{:else}
					<p class="err">FEHLER: {d.preStep.webResearch.error}</p>
				{/if}
			</section>
		{/if}

		<section>
			<h5>Resolved Inputs ({d.resolvedInputs.length})</h5>
			{#if d.resolvedInputs.length === 0}
				<p class="muted">— keine —</p>
			{:else}
				{#each d.resolvedInputs as inp (inp.id)}
					<details class="nested">
						<summary>
							<code>{inp.module}/{inp.table}</code>
							{inp.title ?? inp.id}
						</summary>
						<pre>{inp.content}</pre>
					</details>
				{/each}
			{/if}
		</section>

		{#if d.loopSteps && d.loopSteps.length > 0}
			<section>
				<h5>Auto-Tool-Ausgaben (Reasoning-Loop)</h5>
				{#each d.loopSteps as ls, i (i)}
					<details class="nested">
						<summary>
							<code>Runde {ls.loopIndex + 1}</code>
							{ls.toolName}({JSON.stringify(ls.params)})
						</summary>
						<pre>{ls.outputPreview}</pre>
					</details>
				{/each}
			</section>
		{/if}

		{#if d.plannerCalls && d.plannerCalls.length > 0}
			{#each d.plannerCalls as call, i (i)}
				<section>
					<h5>LLM-Call {i + 1}/{d.plannerCalls.length} · {Math.round(call.latencyMs)}ms</h5>
					<details class="nested">
						<summary>System Prompt</summary>
						<pre>{call.systemPrompt}</pre>
					</details>
					<details class="nested" open>
						<summary>User Prompt</summary>
						<pre>{call.userPrompt}</pre>
					</details>
					<details class="nested" open>
						<summary>Raw LLM Response</summary>
						<pre>{call.rawResponse}</pre>
					</details>
				</section>
			{/each}
		{/if}

		{#if d.plannerError}
			<section>
				<h5>Planner Error</h5>
				<p class="err">{d.plannerError}</p>
			</section>
		{/if}
	</details>
{/if}

<style>
	.debug-block {
		margin-top: 0.5rem;
		border: 1px dashed color-mix(in oklab, hsl(var(--color-border)) 80%, transparent);
		border-radius: 0.375rem;
		font-size: 0.75rem;
	}
	.debug-block > summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		list-style: none;
	}
	.debug-block > summary::-webkit-details-marker {
		display: none;
	}
	.dbg-tag {
		font-weight: 600;
	}
	.dbg-meta {
		flex: 1;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.6875rem;
	}
	.copy-btn {
		padding: 0.125rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.copy-btn:hover {
		border-color: hsl(var(--color-primary));
	}
	section {
		padding: 0.375rem 0.625rem 0.625rem;
		border-top: 1px solid hsl(var(--color-border));
	}
	h5 {
		margin: 0 0 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	pre {
		margin: 0.25rem 0 0;
		padding: 0.5rem;
		max-height: 14rem;
		overflow: auto;
		border-radius: 0.25rem;
		background: color-mix(in oklab, hsl(var(--color-foreground)) 5%, transparent);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.6875rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.nested {
		margin: 0.25rem 0;
	}
	.nested > summary {
		cursor: pointer;
		padding: 0.125rem 0;
	}
	.nested code {
		margin-right: 0.375rem;
		padding: 0 0.25rem;
		border-radius: 0.25rem;
		background: color-mix(in oklab, hsl(var(--color-primary)) 12%, transparent);
		font-size: 0.625rem;
	}
	.ok {
		margin: 0.25rem 0;
		color: #16a34a;
	}
	.err {
		margin: 0.25rem 0;
		color: #dc2626;
		font-weight: 500;
	}
	.muted {
		margin: 0.25rem 0;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}
</style>
