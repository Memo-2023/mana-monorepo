<!--
  Goals — Goal cards with progress bars and template picker.
-->
<script lang="ts">
	import { Target, Plus, Play, Pause, Trash, PencilSimple } from '@mana/shared-icons';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import { goalStore, useAllGoals, GOAL_TEMPLATES } from '$lib/companion/goals';
	import type { LocalGoal } from '$lib/companion/goals/types';
	import GoalEditor from './GoalEditor.svelte';

	const goals = useAllGoals();
	let showTemplates = $state(false);
	let showEditor = $state(false);

	function progressPercent(goal: LocalGoal): number {
		if (goal.target.value === 0) return 0;
		return Math.min(Math.round((goal.currentValue / goal.target.value) * 100), 100);
	}

	function periodLabel(period: string): string {
		return period === 'day' ? 'Heute' : period === 'week' ? 'Diese Woche' : 'Diesen Monat';
	}

	async function createFromTemplate(templateId: string) {
		const tpl = GOAL_TEMPLATES.find((t) => t.id === templateId);
		if (tpl) await goalStore.createFromTemplate(tpl);
		showTemplates = false;
	}

	async function handleVisibilityChange(goalId: string, next: VisibilityLevel) {
		await goalStore.setVisibility(goalId, next);
	}
</script>

<div class="goals-page">
	<div class="header">
		<button class="add-btn" onclick={() => (showEditor = true)}>
			<PencilSimple size={14} weight="bold" /> Eigenes
		</button>
		<button class="add-btn" onclick={() => (showTemplates = !showTemplates)}>
			<Plus size={14} weight="bold" /> Vorlage
		</button>
	</div>

	{#if showTemplates}
		<div class="templates">
			{#each GOAL_TEMPLATES as tpl}
				<button class="tpl-card" onclick={() => createFromTemplate(tpl.id)}>
					<span class="tpl-title">{tpl.title}</span>
					<span class="tpl-desc">{tpl.description}</span>
				</button>
			{/each}
		</div>
	{/if}

	<div class="goal-list">
		{#each goals.value.filter((g) => g.status === 'active') as goal (goal.id)}
			{@const pct = progressPercent(goal)}
			<div class="goal-card">
				<div class="goal-header">
					<Target size={16} weight="bold" />
					<span class="goal-title">{goal.title}</span>
					<VisibilityPicker
						level={goal.visibility ?? 'private'}
						onChange={(next) => handleVisibilityChange(goal.id, next)}
						compact
					/>
					<button class="goal-action" onclick={() => goalStore.pause(goal.id)} title="Pausieren">
						<Pause size={12} />
					</button>
				</div>
				<div class="goal-progress">
					<div class="progress-bar">
						<div class="progress-fill" class:complete={pct >= 100} style:width="{pct}%"></div>
					</div>
					<span class="progress-text">
						{goal.currentValue} / {goal.target.value}
						<span class="period">({periodLabel(goal.target.period)})</span>
					</span>
				</div>
			</div>
		{/each}

		{#each goals.value.filter((g) => g.status === 'paused') as goal (goal.id)}
			<div class="goal-card paused">
				<div class="goal-header">
					<span class="goal-title">{goal.title}</span>
					<button class="goal-action" onclick={() => goalStore.resume(goal.id)} title="Fortsetzen">
						<Play size={12} weight="fill" />
					</button>
					<button
						class="goal-action danger"
						onclick={() => goalStore.delete(goal.id)}
						title="Loeschen"
					>
						<Trash size={12} />
					</button>
				</div>
				<span class="paused-label">Pausiert</span>
			</div>
		{/each}

		{#if goals.value.length === 0 && !showTemplates}
			<div class="empty">
				Keine Ziele aktiv. Waehle eine Vorlage oder erstelle ein eigenes Ziel.
			</div>
		{/if}
	</div>
</div>

<GoalEditor show={showEditor} onClose={() => (showEditor = false)} />

<style>
	.goals-page {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.header {
		display: flex;
		justify-content: flex-end;
	}

	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.add-btn:hover {
		background: hsl(var(--color-primary) / 0.2);
	}

	.templates {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.tpl-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
	}
	.tpl-card:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}
	.tpl-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.tpl-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.goal-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.goal-card {
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.goal-card.paused {
		opacity: 0.6;
	}

	.goal-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.goal-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		flex: 1;
	}
	.goal-action {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.goal-action:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.goal-action.danger:hover {
		color: hsl(var(--color-error));
	}

	.goal-progress {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.progress-bar {
		height: 6px;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 3px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 3px;
		transition: width 0.3s ease;
	}
	.progress-fill.complete {
		background: hsl(142 71% 45%);
	}
	.progress-text {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.period {
		font-weight: 400;
	}
	.paused-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 1.5rem;
	}
</style>
