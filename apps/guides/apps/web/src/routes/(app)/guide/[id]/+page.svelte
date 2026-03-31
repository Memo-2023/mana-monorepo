<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { liveQuery } from 'dexie';
	import {
		guideCollection,
		sectionCollection,
		stepCollection,
		runCollection,
		type LocalGuide,
		type LocalSection,
		type LocalStep,
		type LocalRun,
	} from '$lib/data/local-store.js';
	import { runsStore } from '$lib/stores/runs.svelte';
	import { guidesStore } from '$lib/stores/guides.svelte';
	import GuideEditModal from '$lib/components/GuideEditModal.svelte';
	import StepEditorModal from '$lib/components/StepEditorModal.svelte';
	import type { BaseRecord } from '@manacore/local-store';

	let guideId = $derived($page.params.id);

	// ── Data ────────────────────────────────────────────────

	let guide = $state<LocalGuide | null>(null);
	let sections = $state<LocalSection[]>([]);
	let steps = $state<LocalStep[]>([]);
	let runs = $state<LocalRun[]>([]);

	$effect(() => {
		const id = guideId;
		const sub = liveQuery(async () => {
			const [g, sects, stps, rs] = await Promise.all([
				guideCollection.get(id),
				sectionCollection.getAll({ guideId: id }),
				stepCollection.getAll({ guideId: id }),
				runCollection.getAll({ guideId: id }),
			]);
			return { g, sects, stps, rs };
		}).subscribe(({ g, sects, stps, rs }) => {
			guide = g ?? null;
			sections = sects.sort((a, b) => a.order - b.order);
			steps = stps.sort((a, b) => a.order - b.order);
			runs = rs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
		});
		return () => sub.unsubscribe();
	});

	// ── Derived ─────────────────────────────────────────────

	let completedRuns = $derived(runs.filter((r) => r.completedAt));
	let activeRun = $derived(runs.find((r) => !r.completedAt));
	let checkableSteps = $derived(steps.filter((s) => s.checkable));

	function getStepsForSection(sectionId: string) {
		return steps.filter((s) => s.sectionId === sectionId).sort((a, b) => a.order - b.order);
	}
	function getUnsectionedSteps() {
		return steps.filter((s) => !s.sectionId).sort((a, b) => a.order - b.order);
	}
	function getActiveRunProgress() {
		if (!activeRun || !checkableSteps.length) return 0;
		const done = Object.values(activeRun.stepStates).filter((s) => s.done).length;
		return Math.round((done / checkableSteps.length) * 100);
	}

	// ── UI state ────────────────────────────────────────────

	let editMode = $state(false);
	let showGuideEditModal = $state(false);
	let showDeleteConfirm = $state(false);
	let showAddSection = $state(false);
	let newSectionTitle = $state('');

	// StepEditorModal state
	let stepModalOpen = $state(false);
	let editingStep = $state<LocalStep | undefined>(undefined);
	let stepModalSectionId = $state<string | undefined>(undefined);

	// Quick-add state (inline, no modal)
	let quickAddSectionId = $state<string | 'root' | null>(null);
	let quickAddTitle = $state('');

	async function quickAddStep(sectionId?: string) {
		if (!quickAddTitle.trim()) { quickAddSectionId = null; return; }
		const targetSteps = sectionId ? getStepsForSection(sectionId) : getUnsectionedSteps();
		await guidesStore.createStep({
			guideId,
			sectionId,
			order: targetSteps.length,
			title: quickAddTitle.trim(),
			type: 'instruction',
			checkable: true,
		});
		quickAddTitle = '';
		// keep open for next step
	}

	function openAddStep(sectionId?: string) {
		editingStep = undefined;
		stepModalSectionId = sectionId;
		stepModalOpen = true;
	}
	function openEditStep(step: LocalStep) {
		editingStep = step;
		stepModalSectionId = step.sectionId;
		stepModalOpen = true;
	}

	// ── Actions ─────────────────────────────────────────────

	async function handleSaveStep(data: Omit<LocalStep, keyof BaseRecord>) {
		if (editingStep) {
			await guidesStore.updateStep(editingStep.id, data);
		} else {
			const targetSteps = data.sectionId
				? getStepsForSection(data.sectionId)
				: getUnsectionedSteps();
			await guidesStore.createStep({ ...data, order: targetSteps.length });
		}
		stepModalOpen = false;
	}

	async function deleteStep(stepId: string) {
		await guidesStore.deleteStep(stepId);
	}

	async function moveStep(step: LocalStep, direction: 'up' | 'down') {
		const siblings = step.sectionId
			? getStepsForSection(step.sectionId)
			: getUnsectionedSteps();
		const idx = siblings.findIndex((s) => s.id === step.id);
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= siblings.length) return;
		const other = siblings[swapIdx];
		await Promise.all([
			guidesStore.updateStep(step.id, { order: other.order }),
			guidesStore.updateStep(other.id, { order: step.order }),
		]);
	}

	async function addSection() {
		if (!newSectionTitle.trim()) return;
		await guidesStore.createSection({ guideId, title: newSectionTitle.trim(), order: sections.length });
		newSectionTitle = '';
		showAddSection = false;
	}

	async function deleteSection(sectionId: string) {
		await guidesStore.deleteSection(sectionId);
	}

	async function handleDeleteGuide() {
		await guidesStore.deleteGuide(guideId);
		goto('/');
	}

	async function startRun(mode: 'scroll' | 'focus') {
		const run = await runsStore.startRun(guideId, mode);
		if (run) goto(`/guide/${guideId}/run?runId=${run.id}&mode=${mode}`);
	}

	async function continueRun() {
		if (activeRun) goto(`/guide/${guideId}/run?runId=${activeRun.id}&mode=${activeRun.mode}`);
	}

	// ── Display config ───────────────────────────────────────

	const difficultyConfig = {
		easy: { label: 'Einfach', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
		medium: { label: 'Mittel', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
		hard: { label: 'Schwer', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
	};

	const stepTypeConfig: Record<string, { icon: string; border: string; bg: string }> = {
		instruction: { icon: '→', border: 'border-l-primary', bg: '' },
		warning:     { icon: '⚠', border: 'border-l-orange-400', bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
		tip:         { icon: '💡', border: 'border-l-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-950/20' },
		checkpoint:  { icon: '✓', border: 'border-l-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
		code:        { icon: '</>', border: 'border-l-slate-400', bg: 'bg-slate-50/50 dark:bg-slate-950/20' },
	};
</script>

{#if !guide}
	<div class="flex h-full items-center justify-center p-8">
		<p class="text-muted-foreground">Anleitung nicht gefunden.</p>
	</div>
{:else}
	<div class="mx-auto max-w-3xl p-4 md:p-8">

		<!-- Back + Edit toggle -->
		<div class="mb-5 flex items-center justify-between">
			<a href="/" class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
				← Bibliothek
			</a>
			<div class="flex items-center gap-2">
				<button
					onclick={() => (editMode = !editMode)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
					{editMode ? 'bg-primary text-white' : 'border border-border text-muted-foreground hover:bg-accent'}"
				>
					{editMode ? '✓ Fertig' : '✏ Bearbeiten'}
				</button>
			</div>
		</div>

		<!-- Cover header -->
		<div
			class="mb-6 rounded-2xl p-5"
			style="background-color: {guide.coverColor ?? '#0d9488'}18"
		>
			<div class="flex items-start gap-4">
				<span class="flex-shrink-0 text-5xl">{guide.coverEmoji ?? '📖'}</span>
				<div class="flex-1 min-w-0">
					<h1 class="text-xl font-bold text-foreground leading-tight">{guide.title}</h1>
					{#if guide.description}
						<p class="mt-1 text-sm text-muted-foreground">{guide.description}</p>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {difficultyConfig[guide.difficulty].color}">
							{difficultyConfig[guide.difficulty].label}
						</span>
						{#if guide.estimatedMinutes}
							<span class="text-xs text-muted-foreground">⏱ {guide.estimatedMinutes}min</span>
						{/if}
						<span class="text-xs text-muted-foreground">{steps.length} Schritte</span>
						{#if completedRuns.length > 0}
							<span class="text-xs text-muted-foreground">✓ {completedRuns.length}× abgeschlossen</span>
						{/if}
					</div>
				</div>
				{#if editMode}
					<div class="flex flex-shrink-0 gap-1">
						<button
							onclick={() => (showGuideEditModal = true)}
							class="rounded-lg p-2 text-sm text-muted-foreground hover:bg-surface"
							title="Guide-Einstellungen"
						>✏️</button>
						<button
							onclick={() => (showDeleteConfirm = true)}
							class="rounded-lg p-2 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600"
							title="Anleitung löschen"
						>🗑</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Active run banner -->
		{#if activeRun && !editMode}
			<div class="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-primary">Aktiver Durchlauf</span>
					<span class="text-xs text-muted-foreground">{getActiveRunProgress()}%</span>
				</div>
				<div class="mb-3 h-1.5 overflow-hidden rounded-full bg-primary/20">
					<div class="h-full rounded-full bg-primary transition-all" style="width: {getActiveRunProgress()}%"></div>
				</div>
				<button onclick={continueRun} class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
					Fortsetzen →
				</button>
			</div>
		{:else if !editMode}
			<div class="mb-8 flex gap-3">
				<button
					onclick={() => startRun('scroll')}
					disabled={steps.length === 0}
					class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
				>
					▶ Durchlauf starten
				</button>
				<button
					onclick={() => startRun('focus')}
					disabled={steps.length === 0}
					class="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-40"
					title="Fokus-Modus: ein Schritt auf einmal"
				>
					🎯 Fokus
				</button>
			</div>
		{/if}

		<!-- Steps + Edit controls -->
		<div class="space-y-6">

			<!-- Sections with steps -->
			{#if sections.length > 0}
				{#each sections as section (section.id)}
					{@const sectionSteps = getStepsForSection(section.id)}
					<div>
						<div class="mb-2 flex items-center gap-2">
							<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{section.title}
							</h2>
							{#if editMode}
								<button
									onclick={() => deleteSection(section.id)}
									class="ml-auto text-xs text-red-400 hover:text-red-600"
									title="Abschnitt löschen"
								>✕</button>
							{/if}
						</div>

						<div class="space-y-2">
							{#each sectionSteps as step, i (step.id)}
								{@const cfg = stepTypeConfig[step.type]}
								<div class="group flex items-start gap-2 rounded-xl border-l-2 px-4 py-3 {cfg.border} {cfg.bg} bg-surface">
									<span class="mt-0.5 w-5 flex-shrink-0 text-center text-xs font-mono text-muted-foreground">{cfg.icon}</span>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-foreground">{step.title}</p>
										{#if step.content}
											<p class="mt-1 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">{step.content}</p>
										{/if}
									</div>
									{#if editMode}
										<div class="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<button onclick={() => moveStep(step, 'up')} disabled={i === 0} class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">↑</button>
											<button onclick={() => moveStep(step, 'down')} disabled={i === sectionSteps.length - 1} class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">↓</button>
											<button onclick={() => openEditStep(step)} class="p-1 text-muted-foreground hover:text-foreground">✏</button>
											<button onclick={() => deleteStep(step.id)} class="p-1 text-red-400 hover:text-red-600">✕</button>
										</div>
									{/if}
								</div>
							{/each}

							{#if editMode}
								{#if quickAddSectionId === section.id}
									<div class="flex gap-2">
										<input type="text" bind:value={quickAddTitle}
											placeholder="Schritt-Titel (Enter = hinzufügen)" autofocus
											onkeydown={async (e) => {
												if (e.key === 'Enter') await quickAddStep(section.id);
												if (e.key === 'Escape') { quickAddSectionId = null; quickAddTitle = ''; }
											}}
											class="flex-1 rounded-xl border border-primary/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
										/>
										<button onclick={() => quickAddStep(section.id)} class="rounded-xl bg-primary px-3 py-2 text-sm text-white">+</button>
										<button onclick={() => { quickAddSectionId = null; quickAddTitle = ''; }} class="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">✕</button>
										<button onclick={() => openAddStep(section.id)} class="rounded-xl border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-accent" title="Erweitert">⋯</button>
									</div>
								{:else}
									<button onclick={() => { quickAddSectionId = section.id; quickAddTitle = ''; }}
										class="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary">
										<span class="text-lg leading-none">+</span> Schritt hinzufügen
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			{/if}

			<!-- Unsectioned steps -->
			{#if getUnsectionedSteps().length > 0 || (sections.length === 0)}
				{@const unsectioned = getUnsectionedSteps()}
				<div class="space-y-2">
					{#each unsectioned as step, i (step.id)}
						{@const cfg = stepTypeConfig[step.type]}
						<div class="group flex items-start gap-2 rounded-xl border-l-2 px-4 py-3 {cfg.border} {cfg.bg} bg-surface">
							<span class="mt-0.5 w-5 flex-shrink-0 text-center text-xs font-mono text-muted-foreground">{cfg.icon}</span>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground">{step.title}</p>
								{#if step.content}
									<p class="mt-1 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">{step.content}</p>
								{/if}
							</div>
							{#if editMode}
								<div class="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<button onclick={() => moveStep(step, 'up')} disabled={i === 0} class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">↑</button>
									<button onclick={() => moveStep(step, 'down')} disabled={i === unsectioned.length - 1} class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">↓</button>
									<button onclick={() => openEditStep(step)} class="p-1 text-muted-foreground hover:text-foreground">✏</button>
									<button onclick={() => deleteStep(step.id)} class="p-1 text-red-400 hover:text-red-600">✕</button>
								</div>
							{/if}
						</div>
					{/each}

					{#if editMode}
						{#if quickAddSectionId === 'root'}
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={quickAddTitle}
									placeholder="Schritt-Titel (Enter = hinzufügen)"
									autofocus
									onkeydown={async (e) => {
										if (e.key === 'Enter') await quickAddStep(undefined);
										if (e.key === 'Escape') { quickAddSectionId = null; quickAddTitle = ''; }
									}}
									class="flex-1 rounded-xl border border-primary/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
								/>
								<button onclick={() => quickAddStep(undefined)} class="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary-hover">+</button>
								<button onclick={() => { quickAddSectionId = null; quickAddTitle = ''; }} class="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">✕</button>
								<button onclick={() => openAddStep(undefined)} class="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent" title="Erweitert bearbeiten">⋯</button>
							</div>
						{:else}
							<button
								onclick={() => { quickAddSectionId = 'root'; quickAddTitle = ''; }}
								class="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
							>
								<span class="text-lg leading-none">+</span>
								Schritt hinzufügen
							</button>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- Empty state -->
			{#if steps.length === 0 && !editMode}
				<div class="rounded-xl border border-dashed border-border py-12 text-center">
					<p class="mb-3 text-sm text-muted-foreground">Noch keine Schritte</p>
					<button
						onclick={() => (editMode = true)}
						class="text-sm font-medium text-primary hover:underline"
					>
						Bearbeiten um Schritte hinzuzufügen →
					</button>
				</div>
			{/if}

			<!-- Edit mode: add section / add step (top-level) -->
			{#if editMode}
				<div class="mt-2 space-y-2 border-t border-border pt-4">
					{#if showAddSection}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={newSectionTitle}
								placeholder="Abschnitt-Titel"
								autofocus
								onkeydown={(e) => { if (e.key === 'Enter') addSection(); if (e.key === 'Escape') { showAddSection = false; newSectionTitle = ''; } }}
								class="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
							/>
							<button onclick={addSection} class="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover">OK</button>
							<button onclick={() => { showAddSection = false; newSectionTitle = ''; }} class="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">✕</button>
						</div>
					{:else}
						<button
							onclick={() => (showAddSection = true)}
							class="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
						>
							<span class="text-lg leading-none">⊞</span>
							Abschnitt hinzufügen
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Run history -->
		{#if completedRuns.length > 0 && !editMode}
			<div class="mt-10 border-t border-border pt-6">
				<h2 class="mb-3 text-sm font-semibold text-foreground">Verlauf</h2>
				<div class="space-y-2">
					{#each completedRuns.slice(0, 5) as run (run.id)}
						{@const doneCount = Object.values(run.stepStates).filter((s) => s.done).length}
						<div class="flex items-center justify-between rounded-lg bg-surface px-4 py-2.5 text-sm">
							<div class="flex items-center gap-2">
								<span class="text-green-500">✓</span>
								<span class="text-foreground">
									{new Date(run.startedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
								</span>
							</div>
							<span class="text-xs text-muted-foreground">{doneCount}/{checkableSteps.length} Schritte · {run.mode === 'focus' ? '🎯' : '📜'}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Modals -->
{#if showGuideEditModal && guide}
	<GuideEditModal
		open={true}
		{guide}
		onClose={() => (showGuideEditModal = false)}
		onSave={async (data) => {
			await guidesStore.updateGuide(guide!.id, data);
			showGuideEditModal = false;
		}}
		onDelete={async (id) => {
			showGuideEditModal = false;
			await guidesStore.deleteGuide(id);
			goto('/');
		}}
	/>
{/if}

{#if stepModalOpen}
	<StepEditorModal
		open={true}
		step={editingStep}
		{guideId}
		sectionId={stepModalSectionId}
		order={0}
		onClose={() => (stepModalOpen = false)}
		onSave={handleSaveStep}
	/>
{/if}

<!-- Delete confirm -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onmousedown={(e) => e.target === e.currentTarget && (showDeleteConfirm = false)}>
		<div class="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-semibold text-foreground">Anleitung löschen?</h3>
			<p class="mb-6 text-sm text-muted-foreground">
				<strong>„{guide?.title}"</strong> und alle Schritte werden unwiderruflich gelöscht.
			</p>
			<div class="flex gap-3">
				<button onclick={() => (showDeleteConfirm = false)} class="flex-1 rounded-xl border border-border py-2.5 text-sm text-foreground hover:bg-accent">
					Abbrechen
				</button>
				<button onclick={handleDeleteGuide} class="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600">
					Löschen
				</button>
			</div>
		</div>
	</div>
{/if}
