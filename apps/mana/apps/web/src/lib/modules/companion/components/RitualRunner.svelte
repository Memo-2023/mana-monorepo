<!--
  RitualRunner — Step-by-step guided routine execution.

  Walks through ritual steps: executes tools, collects user input,
  displays projection data. Tracks progress and logs completion.
-->
<script lang="ts">
	import { Check, ArrowRight, Drop, Lightning, ListChecks } from '@mana/shared-icons';
	import { executeTool } from '$lib/data/tools';
	import { useDaySnapshot } from '$lib/data/projections/day-snapshot';
	import { useStreaks } from '$lib/data/projections/streaks';
	import { ritualStore } from '$lib/companion/rituals/store';
	import type { LocalRitual, LocalRitualStep } from '$lib/companion/rituals/types';
	import { onMount } from 'svelte';

	interface Props {
		ritual: LocalRitual;
		onComplete: () => void;
		onClose: () => void;
	}

	let { ritual, onComplete, onClose }: Props = $props();

	const day = useDaySnapshot();
	const streaks = useStreaks();

	let steps = $state<LocalRitualStep[]>([]);
	let currentStepIdx = $state(0);
	let completedSteps = $state<Set<number>>(new Set());
	let stepResult = $state<string | null>(null);
	let inputValue = $state<string | number>('');
	let executing = $state(false);

	let currentStep = $derived(steps[currentStepIdx]);
	let isLastStep = $derived(currentStepIdx >= steps.length - 1);
	let progress = $derived(steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0);

	onMount(async () => {
		steps = await ritualStore.getSteps(ritual.id);
	});

	async function executeCurrentStep() {
		if (!currentStep || executing) return;
		executing = true;
		stepResult = null;

		try {
			const config = currentStep.config;

			if (config.type === 'tool_call') {
				const result = await executeTool(config.toolName, config.params);
				stepResult = result.message;
			} else if (config.type === 'number_input') {
				const val = typeof inputValue === 'number' ? inputValue : Number(inputValue);
				if (isNaN(val)) {
					executing = false;
					return;
				}
				const params = { ...config.baseParams, [config.paramName]: val };
				const result = await executeTool(config.toolName, params);
				stepResult = result.message;
			} else if (config.type === 'text_input') {
				const val = String(inputValue).trim();
				if (!val) {
					executing = false;
					return;
				}
				const params = { ...config.baseParams, [config.paramName]: val };
				const result = await executeTool(config.toolName, params);
				stepResult = result.message;
			} else if (config.type === 'info_display') {
				// Info steps are auto-completed
				stepResult = null;
			}

			completeStep();
		} catch (err) {
			stepResult = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			executing = false;
		}
	}

	function completeStep() {
		completedSteps = new Set([...completedSteps, currentStepIdx]);
		inputValue = '';
	}

	function nextStep() {
		if (isLastStep) {
			ritualStore.logCompletion(ritual.id, completedSteps.size, steps.length);
			onComplete();
			return;
		}
		stepResult = null;
		currentStepIdx++;
		// Auto-complete info_display steps
		if (currentStep?.config.type === 'info_display') {
			completeStep();
		}
	}

	function skipStep() {
		nextStep();
	}
</script>

{#if steps.length === 0}
	<div class="loading">Lade Ritual...</div>
{:else}
	<div class="ritual-runner">
		<!-- Header -->
		<div class="ritual-header">
			<h3>{ritual.title}</h3>
			<div class="progress-bar">
				<div class="progress-fill" style:width="{progress}%"></div>
			</div>
			<span class="step-counter">{completedSteps.size} / {steps.length}</span>
		</div>

		<!-- Current Step -->
		{#if currentStep}
			<div class="step-card">
				<div class="step-label">{currentStep.label}</div>

				{#if currentStep.config.type === 'tool_call'}
					{#if completedSteps.has(currentStepIdx)}
						<div class="step-done"><Check size={20} weight="bold" /> {stepResult}</div>
					{:else}
						<button class="step-action" onclick={executeCurrentStep} disabled={executing}>
							<Lightning size={16} weight="bold" /> Ausfuehren
						</button>
					{/if}
				{:else if currentStep.config.type === 'number_input'}
					{#if completedSteps.has(currentStepIdx)}
						<div class="step-done"><Check size={20} weight="bold" /> {stepResult}</div>
					{:else}
						<div class="input-row">
							<input
								type="number"
								class="step-input"
								bind:value={inputValue}
								min={currentStep.config.min}
								max={currentStep.config.max}
								placeholder={String(currentStep.config.defaultValue ?? '')}
							/>
							{#if currentStep.config.unit}
								<span class="input-unit">{currentStep.config.unit}</span>
							{/if}
							<button class="step-action" onclick={executeCurrentStep} disabled={executing}>
								Loggen
							</button>
						</div>
					{/if}
				{:else if currentStep.config.type === 'text_input'}
					{#if completedSteps.has(currentStepIdx)}
						<div class="step-done"><Check size={20} weight="bold" /> {stepResult}</div>
					{:else}
						<div class="input-row">
							<input
								type="text"
								class="step-input text"
								bind:value={inputValue}
								placeholder={currentStep.config.placeholder ?? ''}
							/>
							<button class="step-action" onclick={executeCurrentStep} disabled={executing}>
								Speichern
							</button>
						</div>
					{/if}
				{:else if currentStep.config.type === 'info_display'}
					<div class="info-card">
						{#if currentStep.config.source === 'tasks_today'}
							{#if day.value.tasks.dueToday.length > 0}
								{#each day.value.tasks.dueToday as t}
									<div class="info-item">• {t.title}</div>
								{/each}
							{:else}
								<div class="info-empty">Keine Tasks faellig heute</div>
							{/if}
						{:else if currentStep.config.source === 'events_today'}
							{#if day.value.events.upcoming.length > 0}
								{#each day.value.events.upcoming as e}
									<div class="info-item">• {e.title}</div>
								{/each}
							{:else}
								<div class="info-empty">Keine Termine heute</div>
							{/if}
						{:else if currentStep.config.source === 'drink_progress'}
							<div class="info-item">
								Wasser: {day.value.drinks.water.ml}ml / {day.value.drinks.water.goal}ml ({day.value
									.drinks.water.percent}%)
							</div>
							<div class="info-item">Gesamt: {day.value.drinks.total.count} Getraenke</div>
						{:else if currentStep.config.source === 'nutrition_progress'}
							<div class="info-item">
								Kalorien: {day.value.nutrition.calories.actual} / {day.value.nutrition.calories
									.goal} kcal
							</div>
							<div class="info-item">Mahlzeiten: {day.value.nutrition.meals}</div>
						{:else if currentStep.config.source === 'streaks'}
							{#each streaks.value as s}
								<div class="info-item">
									{s.label}: {s.currentStreak} Tage
									{#if s.status === 'at_risk'}(gefaehrdet){/if}
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<!-- Navigation -->
			<div class="step-nav">
				<button class="nav-skip" onclick={skipStep}>
					{completedSteps.has(currentStepIdx) || currentStep.config.type === 'info_display'
						? ''
						: 'Ueberspringen'}
				</button>
				<button class="nav-next" onclick={nextStep}>
					{isLastStep ? 'Fertig' : 'Weiter'}
					<ArrowRight size={16} weight="bold" />
				</button>
			</div>
		{/if}

		<!-- Close -->
		<button class="close-btn" onclick={onClose}>Abbrechen</button>
	</div>
{/if}

<style>
	.ritual-runner {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--color-muted-foreground));
	}

	.ritual-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.75rem;
	}

	.progress-bar {
		height: 4px;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.step-counter {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.step-card {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.step-label {
		font-size: 1rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.step-action {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.step-action:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.step-action:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.step-done {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--color-success, 142 71% 45%));
		font-size: 0.875rem;
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.step-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1.5px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
		max-width: 120px;
	}

	.step-input.text {
		max-width: none;
	}

	.step-input:focus {
		border-color: hsl(var(--color-primary));
	}

	.input-unit {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.info-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.info-item {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.info-empty {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.step-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.nav-skip {
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
	}

	.nav-skip:hover {
		color: hsl(var(--color-foreground));
	}

	.nav-next {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.nav-next:hover {
		background: hsl(var(--color-primary) / 0.2);
	}

	.close-btn {
		align-self: center;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
	}

	.close-btn:hover {
		color: hsl(var(--color-foreground));
	}
</style>
