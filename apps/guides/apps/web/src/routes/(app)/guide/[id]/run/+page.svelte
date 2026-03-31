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
		type LocalStep,
		type LocalRun,
	} from '$lib/data/local-store.js';
	import { runsStore } from '$lib/stores/runs.svelte';

	let guideId = $derived($page.params.id);
	let runId = $derived($page.url.searchParams.get('runId') ?? '');
	let mode = $derived(($page.url.searchParams.get('mode') ?? 'scroll') as 'scroll' | 'focus');

	let guide = $state<LocalGuide | null>(null);
	let steps = $state<LocalStep[]>([]);
	let run = $state<LocalRun | null>(null);
	let focusIndex = $state(0);
	let showNoteInput = $state(false);
	let noteText = $state('');

	$effect(() => {
		const id = guideId;
		const rId = runId;
		const sub = liveQuery(async () => {
			const [g, stps, r] = await Promise.all([
				guideCollection.get(id),
				stepCollection.getAll({ guideId: id }),
				runCollection.get(rId),
			]);
			return { g, stps, r };
		}).subscribe(({ g, stps, r }) => {
			guide = g ?? null;
			steps = stps.filter((s) => s.checkable).sort((a, b) => a.order - b.order);
			run = r ?? null;
		});
		return () => sub.unsubscribe();
	});

	function isStepDone(stepId: string) {
		return run?.stepStates[stepId]?.done ?? false;
	}

	let doneCount = $derived(steps.filter((s) => isStepDone(s.id)).length);
	let progress = $derived(steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0);
	let isComplete = $derived(doneCount === steps.length && steps.length > 0);

	async function toggleStep(stepId: string) {
		if (!runId) return;
		const current = isStepDone(stepId);
		await runsStore.setStepState(runId, stepId, {
			done: !current,
			doneAt: !current ? new Date().toISOString() : undefined,
		});
		if (!current && mode === 'focus' && focusIndex < steps.length - 1) {
			focusIndex++;
		}
	}

	async function saveNote() {
		if (!runId || !steps[focusIndex]) return;
		await runsStore.setStepState(runId, steps[focusIndex].id, { notes: noteText });
		showNoteInput = false;
		noteText = '';
	}

	async function finishRun() {
		if (!runId) return;
		await runsStore.completeRun(runId);
		goto(`/guide/${guideId}`);
	}

	function exitRun() {
		goto(`/guide/${guideId}`);
	}

	const stepTypeIcons: Record<string, string> = {
		instruction: '→',
		warning: '⚠',
		tip: '💡',
		checkpoint: '✓',
		code: '</>',
	};
</script>

{#if !guide || !run}
	<div class="flex h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
	</div>
{:else if mode === 'scroll'}
	<!-- ── Scroll mode ───────────────────────────────────────── -->
	<div class="mx-auto max-w-2xl p-4 md:p-6">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<button onclick={exitRun} class="text-sm text-muted-foreground hover:text-foreground">
				← {guide.title}
			</button>
			<span class="text-sm text-muted-foreground">{doneCount}/{steps.length} · {progress}%</span>
		</div>

		<!-- Progress bar -->
		<div class="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
			<div class="h-full rounded-full bg-primary transition-all duration-300" style="width: {progress}%"></div>
		</div>

		<!-- Steps -->
		<div class="space-y-3">
			{#each steps as step, i (step.id)}
				{@const done = isStepDone(step.id)}
				<button
					onclick={() => toggleStep(step.id)}
					class="w-full rounded-xl border p-4 text-left transition-all
					{done
						? 'border-primary/30 bg-primary/5'
						: 'border-border bg-surface hover:border-primary/30 hover:bg-accent/30'}"
				>
					<div class="flex items-start gap-3">
						<!-- Checkbox -->
						<div
							class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors
							{done ? 'border-primary bg-primary' : 'border-border'}"
						>
							{#if done}
								<span class="text-xs text-white">✓</span>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-xs text-muted-foreground">{stepTypeIcons[step.type]}</span>
								<span class="text-sm font-medium {done ? 'line-through text-muted-foreground' : 'text-foreground'}">
									{step.title}
								</span>
							</div>
							{#if step.content && !done}
								<p class="mt-1.5 text-xs text-muted-foreground whitespace-pre-wrap">{step.content}</p>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Complete button -->
		{#if isComplete}
			<div class="mt-8 text-center">
				<div class="mb-4 text-5xl">🎉</div>
				<p class="mb-2 text-lg font-semibold text-foreground">Alle Schritte erledigt!</p>
				<p class="mb-6 text-sm text-muted-foreground">Möchtest du den Durchlauf abschließen?</p>
				<button
					onclick={finishRun}
					class="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
				>
					Durchlauf abschließen
				</button>
			</div>
		{/if}
	</div>

{:else}
	<!-- ── Focus mode ────────────────────────────────────────── -->
	{#if steps.length === 0}
		<div class="flex h-screen items-center justify-center">
			<p class="text-muted-foreground">Keine Schritte vorhanden.</p>
		</div>
	{:else}
		{@const currentStep = steps[focusIndex]}
		{@const done = isStepDone(currentStep.id)}

		<div class="flex h-screen flex-col">
			<!-- Top bar -->
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<button onclick={exitRun} class="text-sm text-muted-foreground hover:text-foreground">✕</button>
				<div class="flex items-center gap-3">
					<span class="text-xs text-muted-foreground">
						{focusIndex + 1} / {steps.length}
					</span>
					<div class="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
						<div class="h-full rounded-full bg-primary transition-all" style="width: {progress}%"></div>
					</div>
				</div>
				<span class="text-xs text-muted-foreground">{progress}%</span>
			</div>

			<!-- Step content -->
			<div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
				<div class="mb-6 text-4xl">{stepTypeIcons[currentStep.type]}</div>
				<h2 class="mb-4 text-2xl font-bold text-foreground leading-snug max-w-md">
					{currentStep.title}
				</h2>
				{#if currentStep.content}
					<p class="max-w-md text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
						{currentStep.content}
					</p>
				{/if}

				{#if showNoteInput}
					<div class="mt-6 w-full max-w-md">
						<textarea
							bind:value={noteText}
							placeholder="Notiz zu diesem Schritt..."
							class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
							rows="3"
						></textarea>
						<div class="mt-2 flex gap-2">
							<button onclick={saveNote} class="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white">
								Speichern
							</button>
							<button onclick={() => (showNoteInput = false)} class="rounded-lg border border-border px-4 py-2 text-sm">
								Abbrechen
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom actions -->
			<div class="border-t border-border px-6 py-6">
				{#if !done}
					<button
						onclick={() => toggleStep(currentStep.id)}
						class="mb-3 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-white hover:bg-primary-hover active:scale-[0.98] transition-transform"
					>
						✓ Erledigt
					</button>
				{:else}
					<div class="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 py-4">
						<span class="text-primary font-medium">✓ Erledigt</span>
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<button
						onclick={() => (focusIndex = Math.max(0, focusIndex - 1))}
						disabled={focusIndex === 0}
						class="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
					>
						← Zurück
					</button>

					<button
						onclick={() => (showNoteInput = !showNoteInput)}
						class="text-xs text-muted-foreground hover:text-foreground"
					>
						📝 Notiz
					</button>

					{#if focusIndex < steps.length - 1}
						<button
							onclick={() => (focusIndex = focusIndex + 1)}
							class="rounded-lg px-4 py-2 text-sm text-foreground hover:bg-accent"
						>
							Weiter →
						</button>
					{:else if isComplete}
						<button
							onclick={finishRun}
							class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
						>
							Abschließen 🎉
						</button>
					{:else}
						<button
							onclick={finishRun}
							class="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
						>
							Beenden
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}
