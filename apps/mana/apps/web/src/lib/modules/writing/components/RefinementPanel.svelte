<!--
  RefinementPanel — preview a selection-refinement result and let the
  user accept / retry / discard. Renders the original and the refined
  version side-by-side so the diff is obvious at a glance. While the
  generation is still in flight we show a pulsing state; on failure the
  error message + a "Noch mal" button.
-->
<script lang="ts">
	import type { SelectionToolKind } from './SelectionToolbar.svelte';

	export interface RefinementState {
		kind: SelectionToolKind;
		toolLabel: string;
		originalText: string;
		status: 'running' | 'succeeded' | 'failed';
		refined?: string;
		error?: string;
	}

	let {
		state,
		onaccept,
		onretry,
		oncancel,
	}: {
		state: RefinementState;
		onaccept: () => void;
		onretry: () => void;
		oncancel: () => void;
	} = $props();
</script>

<section
	class="panel"
	class:running={state.status === 'running'}
	class:error={state.status === 'failed'}
>
	<header>
		<div class="label">
			<span class="dot" aria-hidden="true"></span>
			<strong>{state.toolLabel}</strong>
			{#if state.status === 'running'}
				<span class="muted">Läuft…</span>
			{:else if state.status === 'failed'}
				<span class="err-label">Fehlgeschlagen</span>
			{:else}
				<span class="muted">Vorschlag bereit</span>
			{/if}
		</div>
		<button type="button" class="close" onclick={oncancel} aria-label="Schließen">×</button>
	</header>

	<div class="cols">
		<div class="col">
			<h4>Original</h4>
			<p class="text">{state.originalText}</p>
		</div>
		<div class="col">
			<h4>Vorschlag</h4>
			{#if state.status === 'running'}
				<p class="text muted italic">Generiert…</p>
			{:else if state.status === 'failed'}
				<p class="text err-text">{state.error ?? 'Unbekannter Fehler.'}</p>
			{:else if state.refined}
				<p class="text refined">{state.refined}</p>
			{:else}
				<p class="text muted italic">Kein Ergebnis.</p>
			{/if}
		</div>
	</div>

	<footer>
		{#if state.status === 'succeeded'}
			<button type="button" class="primary" onclick={onaccept}>Übernehmen</button>
			<button type="button" class="secondary" onclick={onretry}>Noch mal</button>
			<button type="button" class="secondary" onclick={oncancel}>Verwerfen</button>
		{:else if state.status === 'failed'}
			<button type="button" class="primary" onclick={onretry}>Noch mal</button>
			<button type="button" class="secondary" onclick={oncancel}>Abbrechen</button>
		{/if}
	</footer>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.75rem 1rem;
		border-radius: 0.65rem;
		border: 1px solid color-mix(in srgb, #0ea5e9 40%, transparent);
		background: color-mix(in srgb, #0ea5e9 5%, transparent);
	}
	.panel.error {
		border-color: color-mix(in srgb, #ef4444 50%, transparent);
		background: color-mix(in srgb, #ef4444 5%, transparent);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
	}
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: #0ea5e9;
	}
	.panel.running .dot {
		animation: pulse 1.1s ease-in-out infinite;
	}
	.panel.error .dot {
		background: #ef4444;
	}
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.7);
			opacity: 0.5;
		}
	}
	.muted {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.err-label {
		color: #ef4444;
	}
	.close {
		background: transparent;
		border: none;
		color: inherit;
		font-size: 1.2rem;
		line-height: 1;
		padding: 0 0.3rem;
		cursor: pointer;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.col h4 {
		margin: 0 0 0.3rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		font-weight: 500;
	}
	.text {
		margin: 0;
		padding: 0.5rem 0.7rem;
		border-radius: 0.45rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(255, 255, 255, 0.9));
		font-size: 0.85rem;
		line-height: 1.5;
		white-space: pre-wrap;
		max-height: 260px;
		overflow-y: auto;
	}
	.text.refined {
		border-color: color-mix(in srgb, #0ea5e9 50%, transparent);
		background: color-mix(in srgb, #0ea5e9 3%, var(--color-surface, white));
	}
	.text.italic {
		font-style: italic;
	}
	.text.err-text {
		color: #ef4444;
		border-color: color-mix(in srgb, #ef4444 40%, transparent);
	}
	footer {
		display: inline-flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	footer button {
		padding: 0.4rem 0.9rem;
		border-radius: 0.45rem;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.85rem;
	}
	footer .primary {
		background: #0ea5e9;
		color: white;
		border: 1px solid #0ea5e9;
	}
	footer .primary:hover {
		background: #0284c7;
		border-color: #0284c7;
	}
	footer .secondary {
		background: transparent;
		color: inherit;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
	}
	footer .secondary:hover {
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
	}

	@media (max-width: 700px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
