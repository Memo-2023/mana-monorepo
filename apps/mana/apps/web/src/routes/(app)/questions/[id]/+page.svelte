<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { db } from '$lib/data/database';
	import { encryptRecord } from '$lib/data/crypto';
	import {
		useAllQuestions,
		useAnswersByQuestion,
		getQuestionById,
	} from '$lib/modules/questions/queries';
	import type { Question, Answer } from '$lib/modules/questions/queries';
	import { answersStore } from '$lib/modules/questions/stores/answers.svelte';
	import AnswerCitations from '$lib/modules/questions/components/AnswerCitations.svelte';
	import type { LocalQuestion } from '$lib/modules/questions/types';
	import type { ResearchEvent } from '$lib/api/research';
	import { toastStore } from '@mana/shared-ui/toast';
	import { RoutePage } from '$lib/components/shell';
	import {
		ArrowLeft,
		Clock,
		CircleNotch,
		CheckCircle,
		Archive,
		PencilSimple,
		Trash,
		MagnifyingGlass,
		ArrowCounterClockwise,
	} from '@mana/shared-icons';

	const allQuestions = useAllQuestions();

	let questionId = $derived($page.params.id ?? '');
	let question = $derived(getQuestionById(allQuestions.value, questionId));

	// Answers live query — we call it reactively via the id
	let answersQuery = $derived(useAnswersByQuestion(questionId));
	let answers = $derived(answersQuery.value);

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let newAnswer = $state('');
	let savingAnswer = $state(false);

	// ─── Deep-research state ─────────────────────────────────
	let researchHandle = $state<{ cancel: () => void } | null>(null);
	let researchPhase = $state<string | null>(null);
	let researchSourceCount = $state<number | null>(null);

	const phaseLabels: Record<string, string> = {
		planning: 'Plane Recherche…',
		searching: 'Suche im Web…',
		extracting: 'Lese Quellen…',
		synthesizing: 'Schreibe Antwort…',
	};

	function resetResearchState() {
		researchPhase = null;
		researchSourceCount = null;
		researchHandle = null;
	}

	function handleResearchEvent(event: ResearchEvent) {
		switch (event.type) {
			case 'snapshot':
				if (event.snapshot.status !== 'done' && event.snapshot.status !== 'error') {
					researchPhase = event.snapshot.status;
				}
				break;
			case 'status':
				researchPhase = event.status;
				break;
			case 'sources':
				researchSourceCount = event.count;
				break;
			case 'done':
				resetResearchState();
				toastStore.success('Recherche abgeschlossen');
				break;
			case 'error':
				resetResearchState();
				toastStore.error(`Recherche fehlgeschlagen: ${event.message}`);
				break;
		}
	}

	async function startResearchRun() {
		if (!question || researchHandle) return;
		const confirmed = confirm(
			'Diese Frage wird an Web-Suchmaschinen und LLM-Anbieter übermittelt. Lokale Verschlüsselung gilt nur für die Speicherung auf diesem Gerät. Recherche starten?'
		);
		if (!confirmed) return;

		try {
			researchHandle = await answersStore.startResearch({
				question: question as unknown as LocalQuestion,
				onEvent: handleResearchEvent,
			});
		} catch (err) {
			researchHandle = null;
			toastStore.error(`Recherche konnte nicht gestartet werden: ${(err as Error).message}`);
		}
	}

	/**
	 * Re-run research for a question that already has an answer. Soft-deletes
	 * any prior research-driven answers (manual ones are kept) and kicks off
	 * a fresh pipeline. Old sources stay on the server but are no longer
	 * referenced from the local store.
	 */
	async function rerunResearch() {
		if (!question || researchHandle) return;
		const confirmed = confirm(
			'Vorherige Recherche-Antworten werden in den Papierkorb verschoben. Erneut recherchieren?'
		);
		if (!confirmed) return;

		const previous = (answers as Answer[]).filter((a) => a.researchResultId);
		for (const a of previous) {
			await answersStore.softDelete(a.id);
		}
		await startResearchRun();
	}

	function cancelResearch() {
		researchHandle?.cancel();
		resetResearchState();
		toastStore.info('Recherche-Stream beendet');
	}

	const statusLabels: Record<string, { label: string; color: string }> = {
		open: {
			label: 'Offen',
			color: 'bg-muted text-muted-foreground dark:bg-card dark:text-foreground/90',
		},
		researching: {
			label: 'Recherche',
			color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		},
		answered: {
			label: 'Beantwortet',
			color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
		},
		archived: {
			label: 'Archiviert',
			color: 'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground',
		},
	};

	const depthLabels: Record<string, string> = {
		quick: 'Schnell',
		standard: 'Standard',
		deep: 'Tiefgehend',
	};

	function startEditing() {
		if (!question) return;
		editTitle = question.title;
		editDescription = question.description || '';
		editing = true;
	}

	async function saveEdit() {
		if (!question || !editTitle.trim()) return;
		const diff: Record<string, unknown> = {
			title: editTitle.trim(),
			description: editDescription.trim() || null,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('questions', diff);
		await db.table('questions').update(question.id, diff);
		editing = false;
	}

	async function updateStatus(status: string) {
		if (!question) return;
		await db.table('questions').update(question.id, {
			status,
			updatedAt: new Date().toISOString(),
		});
	}

	async function deleteQuestion() {
		if (!question || !confirm('Frage wirklich loeschen?')) return;
		await db.table('questions').update(question.id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		window.location.href = '/questions';
	}

	async function addAnswer() {
		if (!question || !newAnswer.trim()) return;
		savingAnswer = true;

		try {
			const now = new Date().toISOString();
			const row: Record<string, unknown> = {
				id: crypto.randomUUID(),
				questionId: question.id,
				researchResultId: null,
				content: newAnswer.trim(),
				citations: [],
				rating: null,
				isAccepted: false,
				createdAt: now,
				updatedAt: now,
			};
			await encryptRecord('answers', row);
			await db.table('answers').add(row);
			newAnswer = '';

			// Mark question as answered if it was open
			if (question.status === 'open') {
				await updateStatus('answered');
			}
		} finally {
			savingAnswer = false;
		}
	}

	async function acceptAnswer(answerId: string) {
		// Unaccept all others first
		for (const a of answers) {
			if (a.isAccepted) {
				await db.table('answers').update(a.id, {
					isAccepted: false,
					updatedAt: new Date().toISOString(),
				});
			}
		}
		await db.table('answers').update(answerId, {
			isAccepted: true,
			updatedAt: new Date().toISOString(),
		});
	}

	async function deleteAnswer(answerId: string) {
		await db.table('answers').update(answerId, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<svelte:head>
	<title>{question?.title || 'Frage'} - Mana</title>
</svelte:head>

<RoutePage appId="questions" backHref="/questions" title="Frage">
	{#if !question}
		<div class="py-16 text-center">
			<p class="text-[hsl(var(--color-muted-foreground))]">Frage nicht gefunden</p>
			<a href="/questions" class="mt-4 inline-block text-[hsl(var(--color-primary))]">Zurueck</a>
		</div>
	{:else}
		<div class="mx-auto max-w-3xl space-y-6">
			<!-- Header -->
			<div>
				<a
					href="/questions"
					class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
				>
					<ArrowLeft class="h-4 w-4" />
					Zurueck zu Fragen
				</a>

				<div class="flex items-start justify-between gap-4">
					<div class="flex-1">
						{#if editing}
							<input
								type="text"
								bind:value={editTitle}
								class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-2 text-xl font-bold text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
							/>
							<textarea
								bind:value={editDescription}
								placeholder="Beschreibung..."
								rows="2"
								class="mt-2 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
							></textarea>
							<div class="mt-2 flex gap-2">
								<button
									onclick={saveEdit}
									class="rounded-lg bg-[hsl(var(--color-primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
								>
									Speichern
								</button>
								<button
									onclick={() => (editing = false)}
									class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))]"
								>
									Abbrechen
								</button>
							</div>
						{:else}
							<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">
								{question.title}
							</h1>
							{#if question.description}
								<p class="mt-2 text-[hsl(var(--color-muted-foreground))]">{question.description}</p>
							{/if}
						{/if}

						<div class="mt-4 flex flex-wrap items-center gap-3">
							<!-- Status Badge -->
							<span
								class="rounded-full px-3 py-1 text-sm font-medium {statusLabels[question.status]
									?.color}"
							>
								{statusLabels[question.status]?.label}
							</span>

							<!-- Depth -->
							<span
								class="rounded-full bg-[hsl(var(--color-muted))] px-2 py-0.5 text-xs text-[hsl(var(--color-muted-foreground))]"
							>
								{depthLabels[question.researchDepth] ?? question.researchDepth}
							</span>

							<!-- Tags -->
							{#if question.tags?.length}
								{#each question.tags as tag}
									<span
										class="rounded-full bg-[hsl(var(--color-muted))] px-2 py-0.5 text-xs text-[hsl(var(--color-foreground))]"
									>
										{tag}
									</span>
								{/each}
							{/if}

							<!-- Date -->
							<span class="text-sm text-[hsl(var(--color-muted-foreground))]">
								{formatDate(question.createdAt)}
							</span>
						</div>
					</div>

					<!-- Actions -->
					{#if !editing}
						<div class="flex gap-2">
							<button
								onclick={startEditing}
								class="rounded-lg border border-[hsl(var(--color-border))] p-2 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
								title={$_('common.edit')}
							>
								<PencilSimple class="h-4 w-4" />
							</button>
							<button
								onclick={deleteQuestion}
								class="rounded-lg border border-red-300 p-2 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
								title="Loeschen"
							>
								<Trash class="h-4 w-4" />
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Status Actions -->
			<div class="flex gap-2">
				{#each ['open', 'researching', 'answered', 'archived'] as status}
					<button
						onclick={() => updateStatus(status)}
						disabled={question.status === status}
						class="rounded-lg border px-3 py-1.5 text-sm transition-colors
						{question.status === status
							? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
							: 'border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]'}"
					>
						{statusLabels[status]?.label}
					</button>
				{/each}
			</div>

			<!-- Deep Research -->
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-5"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-[hsl(var(--color-foreground))]">Recherche</h3>
						<p class="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">
							{#if question.researchDepth === 'quick'}
								Schnell · 5 Quellen · keine Volltext-Extraktion
							{:else if question.researchDepth === 'standard'}
								Standard · bis zu 15 Quellen · mit Volltext-Extraktion
							{:else}
								Tiefgehend · bis zu 30 Quellen · alle Kategorien
							{/if}
						</p>
					</div>
					{#if researchHandle}
						<button
							onclick={cancelResearch}
							class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
						>
							Stream beenden
						</button>
					{:else if (answers as Answer[]).some((a) => a.researchResultId)}
						<button
							onclick={rerunResearch}
							class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]"
						>
							<ArrowCounterClockwise class="h-4 w-4" />
							Erneut recherchieren
						</button>
					{:else}
						<button
							onclick={startResearchRun}
							class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90"
						>
							<MagnifyingGlass class="h-4 w-4" />
							Recherche starten
						</button>
					{/if}
				</div>

				{#if researchPhase}
					<div
						class="mt-3 flex items-center gap-2 text-sm text-[hsl(var(--color-muted-foreground))]"
					>
						<CircleNotch class="h-4 w-4 animate-spin" />
						<span>{phaseLabels[researchPhase] ?? researchPhase}</span>
						{#if researchSourceCount !== null}
							<span class="text-xs">· {researchSourceCount} Quellen</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Answers -->
			<div class="space-y-4">
				<h2 class="text-lg font-semibold text-[hsl(var(--color-foreground))]">
					Antworten ({answers.length})
				</h2>

				{#if answers.length === 0}
					<div
						class="rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] p-8 text-center"
					>
						<span class="mb-2 block text-4xl">📝</span>
						<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
							Noch keine Antworten. Fuege die erste Antwort hinzu.
						</p>
					</div>
				{:else}
					{#each answers as answer (answer.id)}
						<div
							class="rounded-xl border bg-[hsl(var(--color-card))] p-5
							{answer.isAccepted
								? 'border-green-300 dark:border-green-800'
								: 'border-[hsl(var(--color-border))]'}"
						>
							{#if answer.isAccepted}
								<div
									class="mb-3 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400"
								>
									<CheckCircle class="h-4 w-4" />
									Akzeptierte Antwort
								</div>
							{/if}

							<AnswerCitations
								content={answer.content}
								researchResultId={answer.researchResultId ?? null}
							/>

							<div class="mt-4 flex items-center justify-between">
								<span class="text-xs text-[hsl(var(--color-muted-foreground))]">
									{formatDate(answer.createdAt)}
								</span>
								<div class="flex gap-2">
									{#if !answer.isAccepted}
										<button
											onclick={() => acceptAnswer(answer.id)}
											class="rounded-lg border border-green-300 px-3 py-1 text-xs text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
										>
											Akzeptieren
										</button>
									{/if}
									<button
										onclick={() => deleteAnswer(answer.id)}
										class="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
									>
										Loeschen
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}

				<!-- Add Answer -->
				<div
					class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-5"
				>
					<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--color-foreground))]">
						Antwort hinzufuegen
					</h3>
					<textarea
						bind:value={newAnswer}
						placeholder="Deine Antwort..."
						rows="4"
						class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-3 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
					></textarea>
					<div class="mt-3 flex justify-end">
						<button
							onclick={addAnswer}
							disabled={savingAnswer || !newAnswer.trim()}
							class="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90 disabled:opacity-50"
						>
							{savingAnswer ? 'Speichert...' : 'Antwort senden'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</RoutePage>
