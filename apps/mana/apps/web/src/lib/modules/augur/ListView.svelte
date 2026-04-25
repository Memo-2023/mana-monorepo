<!--
  Augur — Module Root View

  Top-level switcher: Witness ↔ Oracle. URL param `?mode=oracle` deep-links
  to the empirical view; default is Witness. The toggle is the central
  interaction of the module — same data, two lenses.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import WitnessView from './views/WitnessView.svelte';
	import OracleView from './views/OracleView.svelte';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	type Mode = 'witness' | 'oracle';

	const T = {
		witness: 'Witness',
		oracle: 'Oracle',
		witnessHint: 'Zeichen sammeln',
		oracleHint: 'Muster lesen',
	} as const;

	const mode = $derived<Mode>(
		page.url.searchParams.get('mode') === 'oracle' ? 'oracle' : 'witness'
	);

	function setMode(next: Mode) {
		const url = new URL(page.url);
		if (next === 'witness') url.searchParams.delete('mode');
		else url.searchParams.set('mode', next);
		goto(url.pathname + url.search, { replaceState: false, keepFocus: true, noScroll: true });
	}
</script>

<div class="root">
	<div class="mode-switch" role="tablist">
		<button
			type="button"
			class="mode-btn"
			class:active={mode === 'witness'}
			role="tab"
			aria-selected={mode === 'witness'}
			onclick={() => setMode('witness')}
		>
			<span class="label">{T.witness}</span>
			<span class="hint">{T.witnessHint}</span>
		</button>
		<button
			type="button"
			class="mode-btn"
			class:active={mode === 'oracle'}
			role="tab"
			aria-selected={mode === 'oracle'}
			onclick={() => setMode('oracle')}
		>
			<span class="label">{T.oracle}</span>
			<span class="hint">{T.oracleHint}</span>
		</button>
	</div>

	{#if mode === 'oracle'}
		<OracleView />
	{:else}
		<WitnessView />
	{/if}
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.mode-switch {
		display: flex;
		gap: 0.4rem;
		padding: 0.5rem 1rem 0;
		max-width: 80rem;
		margin: 0 auto;
		width: 100%;
	}
	.mode-btn {
		flex: 1;
		padding: 0.65rem 0.85rem;
		border-radius: 0.6rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		cursor: pointer;
		font: inherit;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		align-items: flex-start;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.mode-btn:hover {
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.05));
	}
	.mode-btn.active {
		background: color-mix(in srgb, #7c3aed 16%, transparent);
		border-color: #7c3aed;
		color: #ddd6fe;
	}
	.label {
		font-size: 1rem;
		font-weight: 500;
	}
	.hint {
		font-size: 0.78rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.mode-btn.active .hint {
		color: color-mix(in srgb, #c4b5fd 80%, transparent);
	}
</style>
