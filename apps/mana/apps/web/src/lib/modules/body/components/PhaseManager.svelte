<!--
  PhaseManager — start/end the active Cut/Bulk/Maintenance/Recomp phase.

  Replaces the previously read-only header pill with a clickable
  control. Three states:
    - No active phase: kind picker + "Start"
    - Active phase:    summary + "Beenden"
    - Editing target:  inline weight inputs

  Phase auto-close on switch is handled by bodyStore.startPhase, so
  this UI doesn't need to track the previous one explicitly.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyPhase, PhaseKind } from '../types';
	import { bodyStore } from '../stores/body.svelte';

	interface Props {
		activePhase: BodyPhase | null;
	}
	const { activePhase }: Props = $props();

	const KINDS: PhaseKind[] = ['cut', 'bulk', 'maintenance', 'recomp'];

	let opening = $state(false);
	let chosenKind = $state<PhaseKind>('cut');
	let startWeight = $state<number | null>(null);
	let targetWeight = $state<number | null>(null);

	async function start() {
		await bodyStore.startPhase({
			kind: chosenKind,
			startWeight,
			targetWeight,
		});
		opening = false;
		startWeight = null;
		targetWeight = null;
	}

	async function end() {
		if (activePhase) {
			await bodyStore.endPhase(activePhase.id);
		}
	}
</script>

<div class="phase">
	{#if activePhase}
		<div class="active" data-kind={activePhase.kind}>
			<div class="active-main">
				<div class="kind">
					{$_(`body.phase.${activePhase.kind}`, { default: activePhase.kind })}
				</div>
				<div class="meta">
					seit {activePhase.startDate}
					{#if activePhase.targetWeight}
						· Ziel: {activePhase.targetWeight}kg
					{/if}
				</div>
			</div>
			<button type="button" class="end" onclick={end}>
				{$_('body.phase.end', { default: 'Beenden' })}
			</button>
		</div>
	{:else if opening}
		<form class="form" onsubmit={(e) => (e.preventDefault(), start())}>
			<div class="kind-picker">
				{#each KINDS as k (k)}
					<button
						type="button"
						class="kind-btn"
						class:active={chosenKind === k}
						data-kind={k}
						onclick={() => (chosenKind = k)}
					>
						{$_(`body.phase.${k}`, { default: k })}
					</button>
				{/each}
			</div>
			<div class="weights">
				<label>
					<span>Start (kg)</span>
					<input type="number" step="0.1" bind:value={startWeight} placeholder="—" />
				</label>
				<label>
					<span>Ziel (kg)</span>
					<input type="number" step="0.1" bind:value={targetWeight} placeholder="—" />
				</label>
			</div>
			<div class="actions">
				<button type="submit" class="primary">
					{$_('body.phase.start', { default: 'Phase starten' })}
				</button>
				<button type="button" onclick={() => (opening = false)}>Abbrechen</button>
			</div>
		</form>
	{:else}
		<button type="button" class="open-btn" onclick={() => (opening = true)}>
			+ {$_('body.phase.startNew', { default: 'Phase starten' })}
		</button>
	{/if}
</div>

<style>
	.phase {
		display: flex;
		flex-direction: column;
	}
	.active {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.4);
		border: 1px solid hsl(var(--color-border));
	}
	.active[data-kind='cut'] {
		background: hsl(0 84% 60% / 0.1);
		border-color: hsl(0 84% 60% / 0.4);
	}
	.active[data-kind='bulk'] {
		background: hsl(142 71% 45% / 0.1);
		border-color: hsl(142 71% 45% / 0.4);
	}
	.active[data-kind='maintenance'] {
		background: hsl(217 91% 60% / 0.1);
		border-color: hsl(217 91% 60% / 0.4);
	}
	.kind {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}
	.end,
	.open-btn,
	.actions button {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}
	.open-btn {
		width: 100%;
		padding: 0.625rem;
		border-style: dashed;
		color: hsl(var(--color-muted-foreground));
	}
	.open-btn:hover {
		color: hsl(var(--color-foreground));
		border-color: hsl(var(--color-foreground));
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.4);
	}
	.kind-picker {
		display: flex;
		gap: 0.25rem;
	}
	.kind-btn {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		cursor: pointer;
	}
	.kind-btn.active[data-kind='cut'] {
		background: hsl(0 84% 60% / 0.15);
		color: hsl(0 84% 50%);
		border-color: hsl(0 84% 60% / 0.5);
	}
	.kind-btn.active[data-kind='bulk'] {
		background: hsl(142 71% 45% / 0.15);
		color: hsl(142 71% 38%);
		border-color: hsl(142 71% 45% / 0.5);
	}
	.kind-btn.active[data-kind='maintenance'] {
		background: hsl(217 91% 60% / 0.15);
		color: hsl(217 91% 50%);
		border-color: hsl(217 91% 60% / 0.5);
	}
	.kind-btn.active[data-kind='recomp'] {
		background: hsl(280 60% 60% / 0.15);
		color: hsl(280 60% 50%);
		border-color: hsl(280 60% 60% / 0.5);
	}
	.weights {
		display: flex;
		gap: 0.5rem;
	}
	.weights label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.weights span {
		font-size: 0.625rem;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
		letter-spacing: 0.05em;
	}
	.weights input {
		padding: 0.4375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.actions .primary {
		flex: 1;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
</style>
