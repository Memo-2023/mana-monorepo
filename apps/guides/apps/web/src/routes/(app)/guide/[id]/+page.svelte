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

	let guideId = $derived($page.params.id);

	let guide = $state<LocalGuide | null>(null);
	let sections = $state<LocalSection[]>([]);
	let steps = $state<LocalStep[]>([]);
	let runs = $state<LocalRun[]>([]);
	let showEditModal = $state(false);
	let showDeleteConfirm = $state(false);

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

	let completedRuns = $derived(runs.filter((r) => r.completedAt));
	let activeRun = $derived(runs.find((r) => !r.completedAt));
	let totalSteps = $derived(steps.filter((s) => s.checkable).length);

	function getStepsForSection(sectionId: string) {
		return steps.filter((s) => s.sectionId === sectionId);
	}

	function getUnsectionedSteps() {
		return steps.filter((s) => !s.sectionId);
	}

	function getActiveRunProgress() {
		if (!activeRun) return 0;
		const done = Object.values(activeRun.stepStates).filter((s) => s.done).length;
		return totalSteps > 0 ? Math.round((done / totalSteps) * 100) : 0;
	}

	async function startRun(mode: 'scroll' | 'focus') {
		const run = await runsStore.startRun(guideId, mode);
		if (run) goto(`/guide/${guideId}/run?runId=${run.id}&mode=${mode}`);
	}

	async function continueRun() {
		if (activeRun) goto(`/guide/${guideId}/run?runId=${activeRun.id}&mode=${activeRun.mode}`);
	}

	const difficultyConfig = {
		easy: { label: 'Einfach', color: 'text-green-600 bg-green-50' },
		medium: { label: 'Mittel', color: 'text-amber-600 bg-amber-50' },
		hard: { label: 'Schwer', color: 'text-red-600 bg-red-50' },
	};

	const stepTypeConfig = {
		instruction: { icon: '→', color: 'border-l-primary' },
		warning: { icon: '⚠', color: 'border-l-orange-400' },
		tip: { icon: '💡', color: 'border-l-violet-400' },
		checkpoint: { icon: '✓', color: 'border-l-blue-400' },
		code: { icon: '</>', color: 'border-l-slate-400' },
	};
</script>

{#if !guide}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Anleitung nicht gefunden.</p>
	</div>
{:else}
	<div class="mx-auto max-w-3xl p-4 md:p-8">
		<!-- Back -->
		<a href="/" class="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
			← Bibliothek
		</a>

		<!-- Cover header -->
		<div
			class="mb-6 flex items-center gap-4 rounded-2xl p-6"
			style="background-color: {guide.coverColor ?? '#0d9488'}20"
		>
			<span class="text-5xl">{guide.coverEmoji ?? '📖'}</span>
			<div class="flex-1 min-w-0">
				<h1 class="text-2xl font-bold text-foreground">{guide.title}</h1>
				{#if guide.description}
					<p class="mt-1 text-sm text-muted-foreground">{guide.description}</p>
				{/if}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class="rounded-full px-2 py-0.5 text-xs font-medium {difficultyConfig[guide.difficulty].color}">
						{difficultyConfig[guide.difficulty].label}
					</span>
					{#if guide.estimatedMinutes}
						<span class="text-xs text-muted-foreground">⏱ {guide.estimatedMinutes} min</span>
					{/if}
					<span class="text-xs text-muted-foreground">{totalSteps} Schritte</span>
					{#if completedRuns.length > 0}
						<span class="text-xs text-muted-foreground">✓ {completedRuns.length}× abgeschlossen</span>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<button
					onclick={() => (showEditModal = true)}
					class="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
					aria-label="Bearbeiten"
				>✏️</button>
			</div>
		</div>

		<!-- Active run banner -->
		{#if activeRun}
			<div class="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-primary">Aktiver Durchlauf</span>
					<span class="text-xs text-muted-foreground">{getActiveRunProgress()}% abgeschlossen</span>
				</div>
				<div class="mb-3 h-1.5 overflow-hidden rounded-full bg-primary/20">
					<div
						class="h-full rounded-full bg-primary transition-all"
						style="width: {getActiveRunProgress()}%"
					></div>
				</div>
				<button
					onclick={continueRun}
					class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
				>
					Fortsetzen →
				</button>
			</div>
		{:else}
			<!-- Start run buttons -->
			<div class="mb-8 flex gap-3">
				<button
					onclick={() => startRun('scroll')}
					class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
				>
					▶ Durchlauf starten
				</button>
				<button
					onclick={() => startRun('focus')}
					class="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
					title="Fokus-Modus: ein Schritt auf einmal"
				>
					🎯 Fokus
				</button>
			</div>
		{/if}

		<!-- Steps -->
		<div class="space-y-6">
			{#if sections.length > 0}
				{#each sections as section (section.id)}
					<div>
						<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{section.title}
						</h2>
						<div class="space-y-2">
							{#each getStepsForSection(section.id) as step (step.id)}
								{@const cfg = stepTypeConfig[step.type]}
								<div class="rounded-lg border-l-2 bg-surface px-4 py-3 {cfg.color}">
									<div class="flex items-start gap-2">
										<span class="mt-0.5 text-xs font-mono text-muted-foreground">{cfg.icon}</span>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-foreground">{step.title}</p>
											{#if step.content}
												<p class="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{step.content}</p>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				{#if getUnsectionedSteps().length > 0}
					<div class="space-y-2">
						{#each getUnsectionedSteps() as step (step.id)}
							{@const cfg = stepTypeConfig[step.type]}
							<div class="rounded-lg border-l-2 bg-surface px-4 py-3 {cfg.color}">
								<p class="text-sm font-medium text-foreground">{step.title}</p>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="space-y-2">
					{#each steps as step (step.id)}
						{@const cfg = stepTypeConfig[step.type]}
						<div class="rounded-lg border-l-2 bg-surface px-4 py-3 {cfg.color}">
							<div class="flex items-start gap-2">
								<span class="mt-0.5 text-xs font-mono text-muted-foreground">{cfg.icon}</span>
								<div class="flex-1">
									<p class="text-sm font-medium text-foreground">{step.title}</p>
									{#if step.content}
										<p class="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{step.content}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Run history -->
		{#if completedRuns.length > 0}
			<div class="mt-10">
				<h2 class="mb-3 text-sm font-semibold text-foreground">Verlauf</h2>
				<div class="space-y-2">
					{#each completedRuns.slice(0, 5) as run (run.id)}
						<div class="flex items-center justify-between rounded-lg bg-surface px-4 py-2.5 text-sm">
							<div class="flex items-center gap-2">
								<span class="text-green-500">✓</span>
								<span class="text-foreground">
									{new Date(run.startedAt).toLocaleDateString('de-DE', {
										day: '2-digit', month: '2-digit', year: 'numeric'
									})}
								</span>
							</div>
							<span class="text-xs text-muted-foreground">
								{Object.values(run.stepStates).filter((s) => s.done).length}/{totalSteps} Schritte
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
