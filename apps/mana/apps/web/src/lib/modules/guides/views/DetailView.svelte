<!--
  Guide DetailView — Step-by-step guide viewer with run progress tracking.
  Shows guide metadata, sections as collapsible groups, and steps as a
  checklist. Starting a guide creates a Run; completing all steps marks
  the run as done.
-->
<script lang="ts">
	import type { ViewProps } from '$lib/app-registry';
	import { useGuide, useSections, useSteps, useLatestRun, getStepProgress } from '../queries';
	import { guidesStore } from '../stores/guides.svelte';
	import { GUIDE_CATEGORIES, DIFFICULTY_LABELS } from '../types';
	import type { Step, Section } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let guideId = $derived((params.guideId as string) ?? '');

	const guideQuery = useGuide(() => guideId);
	const sectionsQuery = useSections(() => guideId);
	const stepsQuery = useSteps(() => guideId);
	const runQuery = useLatestRun(() => guideId);

	const guide = $derived(guideQuery.value);
	const sections = $derived(sectionsQuery.value);
	const steps = $derived(stepsQuery.value);
	const run = $derived(runQuery.value);

	const progress = $derived(getStepProgress(run, steps.length));
	const isComplete = $derived(run?.completedAt != null);
	const isActive = $derived(run != null && !run.completedAt);

	function stepsForSection(sectionId: string): Step[] {
		return steps.filter((s) => s.sectionId === sectionId);
	}

	const orphanSteps = $derived(steps.filter((s) => !s.sectionId));

	function isStepDone(stepId: string): boolean {
		return run?.completedStepIds.includes(stepId) ?? false;
	}

	async function startGuide() {
		await guidesStore.startRun(guideId);
	}

	async function toggleStep(stepId: string) {
		if (!run) return;
		if (isStepDone(stepId)) {
			await guidesStore.uncompleteStep(run.id, stepId);
		} else {
			await guidesStore.completeStep(run.id, stepId);
			// Auto-complete run when all steps done
			const newCompleted = [...run.completedStepIds, stepId];
			if (newCompleted.length >= steps.length && steps.length > 0) {
				await guidesStore.completeRun(run.id);
			}
		}
	}

	async function resetProgress() {
		if (!run) return;
		await guidesStore.deleteRun(run.id);
	}

	// ── Editing state ───────────────────────────────────
	let editing = $state(false);
	let titleDraft = $state('');
	let descDraft = $state('');

	function startEdit() {
		if (!guide) return;
		titleDraft = guide.title;
		descDraft = guide.description;
		editing = true;
	}

	async function saveEdit() {
		if (!guide) return;
		await guidesStore.updateGuide(guide.id, {
			title: titleDraft,
			description: descDraft,
		});
		editing = false;
	}

	async function handleDelete() {
		if (!guide) return;
		if (!confirm(`Guide "${guide.title}" wirklich löschen?`)) return;
		await guidesStore.deleteGuide(guide.id);
		goBack();
	}

	// ── Add section / step inline ───────────────────────
	let addingSectionFor = $state<string | null>(null); // null = top-level
	let newSectionTitle = $state('');
	let addingStepFor = $state<string | null>(null);
	let newStepTitle = $state('');

	async function addSection() {
		if (!newSectionTitle.trim()) return;
		await guidesStore.createSection({ guideId, title: newSectionTitle.trim() });
		newSectionTitle = '';
		addingSectionFor = null;
	}

	async function addStep(sectionId: string | null) {
		if (!newStepTitle.trim()) return;
		await guidesStore.createStep({
			guideId,
			sectionId: sectionId ?? undefined,
			title: newStepTitle.trim(),
		});
		newStepTitle = '';
		addingStepFor = null;
	}
</script>

{#if !guide}
	<div class="loading">Lade Guide...</div>
{:else}
	<div class="detail">
		<!-- Header -->
		<header class="detail-header">
			<div class="header-actions">
				<button class="action-btn" onclick={startEdit}>Bearbeiten</button>
				<button class="action-btn danger" onclick={handleDelete}>Löschen</button>
			</div>
		</header>

		<!-- Editing form -->
		{#if editing}
			<div class="edit-form">
				<input class="title-input" bind:value={titleDraft} placeholder="Guide-Titel" />
				<textarea class="desc-input" bind:value={descDraft} rows="3" placeholder="Beschreibung"
				></textarea>
				<div class="form-actions">
					<button class="action-btn" onclick={() => (editing = false)}>Abbrechen</button>
					<button class="action-btn primary" onclick={saveEdit}>Speichern</button>
				</div>
			</div>
		{:else}
			<!-- Guide metadata -->
			<div class="meta">
				{@const catInfo = GUIDE_CATEGORIES[guide.category]}
				<div class="meta-badges">
					<span class="badge {catInfo.color}">{catInfo.label}</span>
					<span class="badge bg-white/10">{DIFFICULTY_LABELS[guide.difficulty]}</span>
					<span class="badge bg-white/10">{guide.estimatedMinutes} min</span>
				</div>
				<h1 class="title">{guide.title}</h1>
				<p class="description">{guide.description}</p>
			</div>
		{/if}

		<!-- Progress bar -->
		{#if run}
			<div class="progress-section">
				<div class="progress-header">
					<span class="progress-label">
						{#if isComplete}
							Abgeschlossen
						{:else}
							{run.completedStepIds.length} / {steps.length} Schritte
						{/if}
					</span>
					<span class="progress-pct">{progress}%</span>
				</div>
				<div class="progress-bar">
					<div
						class="progress-fill {isComplete ? 'complete' : ''}"
						style="width: {progress}%"
					></div>
				</div>
				{#if isComplete}
					<button class="action-btn small" onclick={resetProgress}>Fortschritt zurücksetzen</button>
				{/if}
			</div>
		{:else if steps.length > 0}
			<button class="action-btn primary" onclick={startGuide}>Guide starten</button>
		{/if}

		<!-- Sections + Steps -->
		<div class="sections">
			{#each sections as section (section.id)}
				{@const sectionSteps = stepsForSection(section.id)}
				<div class="section-block">
					<h2 class="section-title">{section.title}</h2>
					{#if section.content}
						<p class="section-content">{section.content}</p>
					{/if}

					{#if sectionSteps.length > 0}
						<ul class="step-list">
							{#each sectionSteps as step (step.id)}
								{@const done = isStepDone(step.id)}
								<li class="step-item">
									<button
										class="step-btn"
										class:done
										disabled={!isActive}
										onclick={() => toggleStep(step.id)}
									>
										<span class="check">{done ? '✓' : ''}</span>
										<div class="step-body">
											<span class="step-title" class:done>{step.title}</span>
											{#if step.content}
												<span class="step-content">{step.content}</span>
											{/if}
										</div>
									</button>
								</li>
							{/each}
						</ul>
					{/if}

					<!-- Add step to section -->
					{#if addingStepFor === section.id}
						<div class="inline-add">
							<input
								type="text"
								bind:value={newStepTitle}
								placeholder="Neuer Schritt..."
								class="inline-input"
								onkeydown={(e) => e.key === 'Enter' && addStep(section.id)}
							/>
							<button class="action-btn primary small" onclick={() => addStep(section.id)}>+</button
							>
							<button class="action-btn small" onclick={() => (addingStepFor = null)}>×</button>
						</div>
					{:else}
						<button
							class="add-link"
							onclick={() => {
								addingStepFor = section.id;
								newStepTitle = '';
							}}
						>
							+ Schritt
						</button>
					{/if}
				</div>
			{/each}

			<!-- Orphan steps (no section) -->
			{#if orphanSteps.length > 0}
				<ul class="step-list">
					{#each orphanSteps as step (step.id)}
						{@const done = isStepDone(step.id)}
						<li class="step-item">
							<button
								class="step-btn"
								class:done
								disabled={!isActive}
								onclick={() => toggleStep(step.id)}
							>
								<span class="check">{done ? '✓' : ''}</span>
								<div class="step-body">
									<span class="step-title" class:done>{step.title}</span>
									{#if step.content}
										<span class="step-content">{step.content}</span>
									{/if}
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Add section / step -->
		<div class="add-area">
			{#if addingSectionFor === 'new'}
				<div class="inline-add">
					<input
						type="text"
						bind:value={newSectionTitle}
						placeholder="Neuer Abschnitt..."
						class="inline-input"
						onkeydown={(e) => e.key === 'Enter' && addSection()}
					/>
					<button class="action-btn primary small" onclick={addSection}>+</button>
					<button class="action-btn small" onclick={() => (addingSectionFor = null)}>×</button>
				</div>
			{:else}
				<div class="add-buttons">
					<button
						class="add-link"
						onclick={() => {
							addingSectionFor = 'new';
							newSectionTitle = '';
						}}
					>
						+ Abschnitt
					</button>
					<button
						class="add-link"
						onclick={() => {
							addingStepFor = '_orphan';
							newStepTitle = '';
						}}
					>
						+ Schritt
					</button>
				</div>
			{/if}

			{#if addingStepFor === '_orphan'}
				<div class="inline-add">
					<input
						type="text"
						bind:value={newStepTitle}
						placeholder="Neuer Schritt..."
						class="inline-input"
						onkeydown={(e) => e.key === 'Enter' && addStep(null)}
					/>
					<button class="action-btn primary small" onclick={() => addStep(null)}>+</button>
					<button class="action-btn small" onclick={() => (addingStepFor = null)}>×</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
		max-width: 640px;
	}
	.detail-header {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.action-btn:hover {
		background: hsl(var(--color-muted));
	}
	.action-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.action-btn.danger {
		color: rgb(220, 38, 38);
	}
	.action-btn.small {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.meta-badges {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.badge {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: white;
	}
	.title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.description {
		margin: 0;
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.title-input,
	.desc-input {
		padding: 0.625rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.title-input {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.progress-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.progress-pct {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.progress-bar {
		height: 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
		transition: width 0.3s ease;
	}
	.progress-fill.complete {
		background: rgb(34, 197, 94);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.section-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.625rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
	}
	.section-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.section-content {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.step-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.step-btn {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid transparent;
		background: transparent;
		text-align: left;
		cursor: pointer;
		color: hsl(var(--color-foreground));
	}
	.step-btn:not(:disabled):hover {
		background: hsl(var(--color-muted) / 0.5);
	}
	.step-btn:disabled {
		cursor: default;
		opacity: 0.6;
	}
	.check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.25rem;
		border: 1.5px solid hsl(var(--color-border));
		font-size: 0.75rem;
		flex-shrink: 0;
		margin-top: 0.0625rem;
	}
	.step-btn.done .check {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: white;
	}
	.step-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.step-title {
		font-size: 0.875rem;
		font-weight: 500;
	}
	.step-title.done {
		text-decoration: line-through;
		opacity: 0.5;
	}
	.step-content {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.add-link {
		background: none;
		border: none;
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.add-link:hover {
		text-decoration: underline;
	}
	.inline-add {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}
	.inline-input {
		flex: 1;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.add-area {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.add-buttons {
		display: flex;
		gap: 1rem;
	}

	.loading {
		padding: 2rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}
</style>
