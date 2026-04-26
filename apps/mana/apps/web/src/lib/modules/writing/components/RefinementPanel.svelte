<!--
  RefinementPanel — preview a selection-refinement result and let the
  user accept / retry / discard. Renders the original and the refined
  version side-by-side so the diff is obvious at a glance. While the
  generation is still in flight we show a pulsing state; on failure the
  error message + a "Noch mal" button.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
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
				<span class="muted">{$_('writing.refinement_panel.running')}</span>
			{:else if state.status === 'failed'}
				<span class="err-label">{$_('writing.refinement_panel.failed')}</span>
			{:else}
				<span class="muted">{$_('writing.refinement_panel.ready')}</span>
			{/if}
		</div>
		<button
			type="button"
			class="close"
			onclick={oncancel}
			aria-label={$_('writing.refinement_panel.close_aria')}>×</button
		>
	</header>

	<div class="cols">
		<div class="col">
			<h4>{$_('writing.refinement_panel.col_original')}</h4>
			<p class="text">{state.originalText}</p>
		</div>
		<div class="col">
			<h4>{$_('writing.refinement_panel.col_proposal')}</h4>
			{#if state.status === 'running'}
				<p class="text muted italic">{$_('writing.refinement_panel.generating')}</p>
			{:else if state.status === 'failed'}
				<p class="text err-text">{state.error ?? $_('writing.refinement_panel.err_unknown')}</p>
			{:else if state.refined}
				<p class="text refined">{state.refined}</p>
			{:else}
				<p class="text muted italic">{$_('writing.refinement_panel.empty_result')}</p>
			{/if}
		</div>
	</div>

	<footer>
		{#if state.status === 'succeeded'}
			<button type="button" class="primary" onclick={onaccept}
				>{$_('writing.refinement_panel.action_accept')}</button
			>
			<button type="button" class="secondary" onclick={onretry}
				>{$_('writing.refinement_panel.action_retry')}</button
			>
			<button type="button" class="secondary" onclick={oncancel}
				>{$_('writing.refinement_panel.action_discard')}</button
			>
		{:else if state.status === 'failed'}
			<button type="button" class="primary" onclick={onretry}
				>{$_('writing.refinement_panel.action_retry')}</button
			>
			<button type="button" class="secondary" onclick={oncancel}
				>{$_('writing.refinement_panel.action_cancel')}</button
			>
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
		border: 1px solid hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.05);
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
		background: hsl(var(--color-primary));
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
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}
	.text {
		margin: 0;
		padding: 0.5rem 0.7rem;
		border-radius: 0.45rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font-size: 0.85rem;
		line-height: 1.5;
		white-space: pre-wrap;
		max-height: 260px;
		overflow-y: auto;
	}
	.text.refined {
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-primary) / 0.03);
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
		background: hsl(var(--color-primary));
		color: white;
		border: 1px solid hsl(var(--color-primary));
	}
	footer .primary:hover {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	footer .secondary {
		background: transparent;
		color: inherit;
		border: 1px solid hsl(var(--color-border));
	}
	footer .secondary:hover {
		background: hsl(var(--color-surface));
	}

	@media (max-width: 700px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
