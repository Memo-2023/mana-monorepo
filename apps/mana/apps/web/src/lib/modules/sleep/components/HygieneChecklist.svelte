<!--
  HygieneChecklist — Evening sleep hygiene check-off.
-->
<script lang="ts">
	import type { SleepHygieneCheck } from '../types';
	import { HYGIENE_CATEGORY_LABELS } from '../types';
	import { sleepStore } from '../stores/sleep.svelte';
	import { todayDateStr } from '../queries';

	interface Props {
		checks: SleepHygieneCheck[];
		onComplete: () => void;
		onCancel: () => void;
	}

	let { checks, onComplete, onCancel }: Props = $props();

	let completedIds = $state<Set<string>>(new Set());
	let showAddCheck = $state(false);
	let newCheckName = $state('');

	let activeChecks = $derived(checks.filter((c) => c.isActive));
	let score = $derived(
		activeChecks.length > 0 ? Math.round((completedIds.size / activeChecks.length) * 100) : 0
	);

	function toggleCheck(id: string) {
		const next = new Set(completedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		completedIds = next;
	}

	async function handleSave() {
		await sleepStore.logHygiene({
			date: todayDateStr(),
			completedCheckIds: [...completedIds],
			totalActiveChecks: activeChecks.length,
		});
		onComplete();
	}

	async function handleAddCheck() {
		if (!newCheckName.trim()) return;
		await sleepStore.createCheck({ name: newCheckName.trim() });
		newCheckName = '';
		showAddCheck = false;
	}
</script>

<div class="hygiene-overlay">
	<div class="hygiene-header">
		<button class="close-btn" onclick={onCancel}>×</button>
		<span class="header-title">Schlafhygiene-Check</span>
		<span class="score-badge" class:good={score >= 70}>{score}%</span>
	</div>

	<div class="hygiene-body">
		{#each activeChecks as check (check.id)}
			<button class="check-item" onclick={() => toggleCheck(check.id)}>
				<span class="check-box" class:checked={completedIds.has(check.id)}>
					{completedIds.has(check.id) ? '✓' : ''}
				</span>
				<div class="check-text">
					<span class="check-name">{check.name}</span>
					<span class="check-cat"
						>{HYGIENE_CATEGORY_LABELS[check.category]?.de ?? check.category}</span
					>
				</div>
			</button>
		{/each}

		{#if showAddCheck}
			<div class="add-form" role="group">
				<!-- svelte-ignore a11y_autofocus -->
				<input
					onkeydown={(e) => {
						if (e.key === 'Enter') handleAddCheck();
						if (e.key === 'Escape') {
							showAddCheck = false;
						}
					}}
					class="add-input"
					type="text"
					placeholder="Neuer Check..."
					bind:value={newCheckName}
					autofocus
				/>
				<button class="add-save" onclick={handleAddCheck}>+</button>
			</div>
		{:else}
			<button class="add-btn" onclick={() => (showAddCheck = true)}
				>+ Eigenen Check hinzufügen</button
			>
		{/if}

		<button class="save-btn" onclick={handleSave}>
			Speichern ({completedIds.size}/{activeChecks.length})
		</button>
	</div>
</div>

<style>
	.hygiene-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.hygiene-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.close-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: none;
		font-size: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.score-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.6875rem;
		font-weight: 700;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	.score-badge.good {
		background: hsl(160 60% 92%);
		color: #059669;
	}

	:global(.dark) .score-badge.good {
		background: hsl(160 30% 15%);
	}

	.hygiene-body {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		text-align: left;
		color: hsl(var(--color-foreground));
		transition: transform 0.1s;
	}

	.check-item:active {
		transform: scale(0.98);
	}

	.check-box {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		border: 2px solid hsl(var(--color-border));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
		flex-shrink: 0;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.check-box.checked {
		background: #6366f1;
		border-color: #6366f1;
		color: white;
	}

	.check-text {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	.check-name {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.check-cat {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.add-form {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.add-input {
		flex: 1;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.add-input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.add-save {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: #6366f1;
		color: white;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn {
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}

	.add-btn:hover {
		border-color: #6366f1;
		color: #6366f1;
	}

	.save-btn {
		margin-top: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: #6366f1;
		color: white;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:hover {
		filter: brightness(1.1);
	}
</style>
