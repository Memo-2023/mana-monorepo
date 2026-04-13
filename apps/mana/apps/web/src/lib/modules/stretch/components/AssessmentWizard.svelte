<!--
  AssessmentWizard — Step-by-step mobility self-assessment.
  6 tests with score selection, pain region marking, and result summary.
-->
<script lang="ts">
	import {
		ASSESSMENT_TESTS,
		BODY_REGION_LABELS,
		BODY_REGIONS,
		type BodyRegion,
		type AssessmentTest,
		type PainRegion,
	} from '../types';
	import { stretchStore } from '../stores/stretch.svelte';

	interface Props {
		onComplete: () => void;
		onCancel: () => void;
	}

	let { onComplete, onCancel }: Props = $props();

	let currentStep = $state(0);
	let scores = $state<Record<string, number>>({});
	let painRegions = $state<PainRegion[]>([]);
	let showResults = $state(false);

	const tests = ASSESSMENT_TESTS;
	const totalSteps = tests.length;
	let currentTest = $derived(tests[currentStep]);
	let progress = $derived((currentStep + 1) / totalSteps);

	// Pain check step state
	let painRegion = $state<BodyRegion>('neck');
	let painIntensity = $state(5);

	function selectScore(score: number) {
		if (currentTest) {
			scores[currentTest.id] = score;
		}

		if (currentStep < totalSteps - 1) {
			currentStep++;
		} else {
			showResults = true;
		}
	}

	function goBack() {
		if (showResults) {
			showResults = false;
			return;
		}
		if (currentStep > 0) currentStep--;
	}

	function addPainRegion() {
		if (painRegions.some((p) => p.region === painRegion)) return;
		painRegions = [
			...painRegions,
			{ region: painRegion, intensity: painIntensity, description: '' },
		];
	}

	function removePainRegion(region: BodyRegion) {
		painRegions = painRegions.filter((p) => p.region !== region);
	}

	let overallScore = $derived(() => {
		const values = Object.values(scores);
		if (values.length === 0) return 0;
		const total = values.reduce((sum, v) => sum + v, 0);
		return Math.round((total / (values.length * 5)) * 100);
	});

	let weakAreas = $derived(() => {
		return Object.entries(scores)
			.filter(([_, score]) => score <= 2)
			.map(([testId]) => {
				const test = tests.find((t) => t.id === testId);
				return test?.bodyRegion;
			})
			.filter(Boolean) as BodyRegion[];
	});

	async function saveAndFinish() {
		const testResults: AssessmentTest[] = tests.map((test) => ({
			testId: test.id,
			bodyRegion: test.bodyRegion,
			score: scores[test.id] ?? 3,
			notes: '',
		}));

		await stretchStore.saveAssessment({
			tests: testResults,
			painRegions,
		});

		onComplete();
	}
</script>

<div class="wizard-overlay">
	<div class="wizard-header">
		<button class="back-btn" onclick={currentStep === 0 && !showResults ? onCancel : goBack}>
			{currentStep === 0 && !showResults ? '×' : '←'}
		</button>
		<span class="step-label">
			{showResults ? 'Ergebnis' : `Schritt ${currentStep + 1} von ${totalSteps}`}
		</span>
	</div>

	<!-- Progress Bar -->
	<div class="progress-bar">
		<div class="progress-fill" style:width="{(showResults ? 1 : progress) * 100}%"></div>
	</div>

	{#if showResults}
		<!-- Results -->
		<div class="results-screen">
			<div class="score-circle">
				<span class="score-value">{overallScore()}%</span>
				<span class="score-label">Beweglichkeit</span>
			</div>

			<div class="results-grid">
				{#each tests as test}
					{@const score = scores[test.id] ?? 0}
					<div class="result-row">
						<span class="result-name">{test.name.de}</span>
						<div class="result-dots">
							{#each [1, 2, 3, 4, 5] as val}
								<span
									class="result-dot"
									class:filled={val <= score}
									class:low={score <= 2 && val <= score}
								></span>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			{#if weakAreas().length > 0}
				<div class="weak-notice">
					<span class="weak-title">Verbesserungsbedarf:</span>
					<span class="weak-areas">
						{weakAreas()
							.map((r) => BODY_REGION_LABELS[r]?.de ?? r)
							.join(', ')}
					</span>
				</div>
			{/if}

			<!-- Pain Regions (optional) -->
			<div class="pain-section">
				<span class="pain-title">Schmerzbereiche (optional)</span>
				<div class="pain-add-row">
					<select class="pain-select" bind:value={painRegion}>
						{#each BODY_REGIONS.filter((r) => r !== 'full_body') as region}
							<option value={region}>{BODY_REGION_LABELS[region]?.de ?? region}</option>
						{/each}
					</select>
					<input class="pain-slider" type="range" min="1" max="10" bind:value={painIntensity} />
					<span class="pain-val">{painIntensity}</span>
					<button class="pain-add-btn" onclick={addPainRegion}>+</button>
				</div>
				{#each painRegions as pr}
					<div class="pain-tag">
						{BODY_REGION_LABELS[pr.region]?.de ?? pr.region} ({pr.intensity}/10)
						<button class="pain-remove" onclick={() => removePainRegion(pr.region)}>×</button>
					</div>
				{/each}
			</div>

			<button class="save-btn" onclick={saveAndFinish}>Speichern</button>
		</div>
	{:else if currentTest}
		<!-- Test Step -->
		<div class="test-screen">
			<h2 class="test-name">{currentTest.name.de}</h2>
			<p class="test-instruction">{currentTest.instruction.de}</p>

			<div class="options">
				{#each currentTest.options as option}
					<button
						class="option-btn"
						class:selected={scores[currentTest.id] === option.score}
						onclick={() => selectScore(option.score)}
					>
						<span class="option-score">{option.score}</span>
						<span class="option-text">{option.de}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.wizard-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.wizard-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
	}

	.back-btn {
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

	.step-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
	}

	.progress-bar {
		height: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		transition: width 0.3s ease;
	}

	/* ── Test Screen ──────────────────────────────── */
	.test-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		gap: 1rem;
	}

	.test-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0;
		text-align: center;
	}

	.test-instruction {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		max-width: 360px;
		line-height: 1.5;
		margin: 0;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
		max-width: 400px;
		margin-top: 0.5rem;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 2px solid transparent;
		cursor: pointer;
		text-align: left;
		color: hsl(var(--color-foreground));
		transition:
			border-color 0.15s,
			transform 0.15s;
	}

	.option-btn:hover {
		border-color: hsl(var(--color-border));
		transform: translateX(2px);
	}

	.option-btn.selected {
		border-color: #10b981;
		background: hsl(160 60% 96%);
	}

	:global(.dark) .option-btn.selected {
		background: hsl(160 30% 12%);
	}

	.option-score {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: hsl(var(--color-border));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.option-btn.selected .option-score {
		background: #10b981;
		color: white;
	}

	.option-text {
		font-size: 0.8125rem;
	}

	/* ── Results ──────────────────────────────────── */
	.results-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		gap: 1rem;
	}

	.score-circle {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: 3px solid #10b981;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.score-value {
		font-size: 1.5rem;
		font-weight: 800;
		color: #10b981;
	}

	.score-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.results-grid {
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.result-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.result-name {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.result-dots {
		display: flex;
		gap: 0.25rem;
	}

	.result-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: hsl(var(--color-border));
	}

	.result-dot.filled {
		background: #10b981;
	}

	.result-dot.low {
		background: #ef4444;
	}

	.weak-notice {
		width: 100%;
		max-width: 360px;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(0 60% 96%);
		border: 1px solid hsl(0 40% 88%);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.dark) .weak-notice {
		background: hsl(0 30% 12%);
		border-color: hsl(0 30% 20%);
	}

	.weak-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #ef4444;
	}

	.weak-areas {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Pain Section ─────────────────────────────── */
	.pain-section {
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.pain-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.pain-add-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.pain-select {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
	}

	.pain-slider {
		width: 80px;
		accent-color: #ef4444;
	}

	.pain-val {
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		width: 1.5rem;
		text-align: center;
	}

	.pain-add-btn {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		font-size: 1rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pain-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		background: hsl(0 60% 96%);
		border: 1px solid hsl(0 40% 88%);
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .pain-tag {
		background: hsl(0 30% 12%);
		border-color: hsl(0 30% 20%);
	}

	.pain-remove {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1;
		padding: 0;
	}

	.save-btn {
		margin-top: 0.5rem;
		padding: 0.625rem 2rem;
		border-radius: 2rem;
		background: #10b981;
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
