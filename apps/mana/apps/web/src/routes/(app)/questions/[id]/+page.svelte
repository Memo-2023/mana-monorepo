<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { db } from '$lib/data/database';
	import {
		useAllQuestions,
		useAnswersByQuestion,
		getQuestionById,
	} from '$lib/modules/questions/queries';
	import type { Question, Answer } from '$lib/modules/questions/queries';
	import {
		ArrowLeft,
		Clock,
		CircleNotch,
		CheckCircle,
		Archive,
		PencilSimple,
		Trash,
	} from '@mana/shared-icons';

	const allQuestions = useAllQuestions();

	let questionId = $derived($page.params.id);
	let question = $derived(getQuestionById(allQuestions.current ?? [], questionId));

	// Answers live query — we call it reactively via the id
	let answersQuery = $derived(useAnswersByQuestion(questionId));
	let answers = $derived(answersQuery?.current ?? []);

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let newAnswer = $state('');
	let savingAnswer = $state(false);

	const statusLabels: Record<string, { label: string; color: string }> = {
		open: {
			label: 'Offen',
			color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
			color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
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
		await db.table('questions').update(question.id, {
			title: editTitle.trim(),
			description: editDescription.trim() || null,
			updatedAt: new Date().toISOString(),
		});
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
			await db.table('answers').add({
				id: crypto.randomUUID(),
				questionId: question.id,
				researchResultId: null,
				content: newAnswer.trim(),
				citations: [],
				rating: null,
				isAccepted: false,
				createdAt: now,
				updatedAt: now,
			});
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

{#if !question}
	<div class="py-16 text-center">
		<p class="text-[hsl(var(--muted-foreground))]">Frage nicht gefunden</p>
		<a href="/questions" class="mt-4 inline-block text-[hsl(var(--primary))]">Zurueck</a>
	</div>
{:else}
	<div class="mx-auto max-w-3xl space-y-6">
		<!-- Header -->
		<div>
			<a
				href="/questions"
				class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
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
							class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-xl font-bold text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
						/>
						<textarea
							bind:value={editDescription}
							placeholder="Beschreibung..."
							rows="2"
							class="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
						></textarea>
						<div class="mt-2 flex gap-2">
							<button
								onclick={saveEdit}
								class="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
							>
								Speichern
							</button>
							<button
								onclick={() => (editing = false)}
								class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))]"
							>
								Abbrechen
							</button>
						</div>
					{:else}
						<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{question.title}</h1>
						{#if question.description}
							<p class="mt-2 text-[hsl(var(--muted-foreground))]">{question.description}</p>
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
							class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
						>
							{depthLabels[question.researchDepth] ?? question.researchDepth}
						</span>

						<!-- Tags -->
						{#if question.tags?.length}
							{#each question.tags as tag}
								<span
									class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--foreground))]"
								>
									{tag}
								</span>
							{/each}
						{/if}

						<!-- Date -->
						<span class="text-sm text-[hsl(var(--muted-foreground))]">
							{formatDate(question.createdAt)}
						</span>
					</div>
				</div>

				<!-- Actions -->
				{#if !editing}
					<div class="flex gap-2">
						<button
							onclick={startEditing}
							class="rounded-lg border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
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
						? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
						: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}"
				>
					{statusLabels[status]?.label}
				</button>
			{/each}
		</div>

		<!-- Answers -->
		<div class="space-y-4">
			<h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">
				Antworten ({answers.length})
			</h2>

			{#if answers.length === 0}
				<div class="rounded-xl border-2 border-dashed border-[hsl(var(--border))] p-8 text-center">
					<span class="mb-2 block text-4xl">📝</span>
					<p class="text-sm text-[hsl(var(--muted-foreground))]">
						Noch keine Antworten. Fuege die erste Antwort hinzu.
					</p>
				</div>
			{:else}
				{#each answers as answer (answer.id)}
					<div
						class="rounded-xl border bg-[hsl(var(--card))] p-5
							{answer.isAccepted ? 'border-green-300 dark:border-green-800' : 'border-[hsl(var(--border))]'}"
					>
						{#if answer.isAccepted}
							<div
								class="mb-3 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400"
							>
								<CheckCircle class="h-4 w-4" />
								Akzeptierte Antwort
							</div>
						{/if}

						<div class="whitespace-pre-wrap text-[hsl(var(--foreground))]">
							{answer.content}
						</div>

						<div class="mt-4 flex items-center justify-between">
							<span class="text-xs text-[hsl(var(--muted-foreground))]">
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
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
				<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
					Antwort hinzufuegen
				</h3>
				<textarea
					bind:value={newAnswer}
					placeholder="Deine Antwort..."
					rows="4"
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
				></textarea>
				<div class="mt-3 flex justify-end">
					<button
						onclick={addAnswer}
						disabled={savingAnswer || !newAnswer.trim()}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						{savingAnswer ? 'Speichert...' : 'Antwort senden'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
