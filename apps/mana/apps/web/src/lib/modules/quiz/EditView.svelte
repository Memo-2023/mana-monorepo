<!--
  Quiz — EditView
  Edit quiz meta + add / edit / reorder questions inline.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQuiz, useQuestions, blankOption } from './queries';
	import { quizzesStore } from './stores/quizzes.svelte';
	import { QUESTION_TYPE_LABELS } from './types';
	import type { QuestionType, QuestionOption, QuizQuestion } from './types';
	import { ArrowLeft, Plus, Trash, Check, Play } from '@mana/shared-icons';

	interface Props {
		quizId: string;
	}
	let { quizId }: Props = $props();

	const quiz$ = useQuiz(quizId);
	const quiz = $derived(quiz$.value);
	const questions$ = useQuestions(quizId);
	const questions = $derived(questions$.value);

	// ── Inline meta editing (debounced on blur) ─────────
	let metaTitle = $state('');
	let metaDescription = $state('');
	let metaCategory = $state('');
	let metaTags = $state('');
	let metaLoaded = $state(false);

	$effect(() => {
		if (!quiz || metaLoaded) return;
		metaTitle = quiz.title;
		metaDescription = quiz.description ?? '';
		metaCategory = quiz.category ?? '';
		metaTags = (quiz.tags ?? []).join(', ');
		metaLoaded = true;
	});

	async function saveMeta() {
		if (!quiz) return;
		await quizzesStore.updateQuiz(quiz.id, {
			title: metaTitle.trim() || 'Unbenannt',
			description: metaDescription.trim() || null,
			category: metaCategory.trim() || null,
			tags: metaTags
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
		});
	}

	// ── New question form ───────────────────────────────
	let newType = $state<QuestionType>('single');
	let newText = $state('');
	let newExplanation = $state('');
	let newOptions = $state<QuestionOption[]>([
		{ id: crypto.randomUUID(), text: '', isCorrect: true },
		{ id: crypto.randomUUID(), text: '', isCorrect: false },
	]);
	let newTextAnswer = $state('');

	function resetNewForm() {
		newText = '';
		newExplanation = '';
		newTextAnswer = '';
		if (newType === 'truefalse') {
			newOptions = [
				{ id: 't', text: 'Wahr', isCorrect: true },
				{ id: 'f', text: 'Falsch', isCorrect: false },
			];
		} else if (newType === 'text') {
			newOptions = [];
		} else {
			newOptions = [
				{ id: crypto.randomUUID(), text: '', isCorrect: newType === 'single' },
				{ id: crypto.randomUUID(), text: '', isCorrect: false },
			];
		}
	}

	$effect(() => {
		// Rebuild option slots when question type changes.
		newType;
		resetNewForm();
	});

	function toggleNewCorrect(id: string) {
		if (newType === 'single' || newType === 'truefalse') {
			newOptions = newOptions.map((o) => ({ ...o, isCorrect: o.id === id }));
		} else {
			newOptions = newOptions.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o));
		}
	}

	function addNewOption() {
		newOptions = [...newOptions, blankOption()];
	}

	function removeNewOption(id: string) {
		newOptions = newOptions.filter((o) => o.id !== id);
	}

	async function submitNewQuestion() {
		const text = newText.trim();
		if (!text) return;

		let options: QuestionOption[];
		if (newType === 'text') {
			const answer = newTextAnswer.trim();
			if (!answer) return;
			options = [{ id: 'answer', text: answer, isCorrect: true }];
		} else {
			const valid = newOptions.filter((o) => o.text.trim());
			if (valid.length < 2) return;
			if (!valid.some((o) => o.isCorrect)) return;
			options = valid.map((o) => ({ ...o, text: o.text.trim() }));
		}

		await quizzesStore.addQuestion(quizId, {
			type: newType,
			questionText: text,
			options,
			explanation: newExplanation.trim() || null,
		});
		resetNewForm();
	}

	async function deleteQuestion(id: string) {
		if (!confirm('Frage löschen?')) return;
		await quizzesStore.deleteQuestion(id);
	}

	function correctLabel(q: QuizQuestion): string {
		if (q.type === 'text') return q.options[0]?.text ?? '';
		return q.options
			.filter((o) => o.isCorrect)
			.map((o) => o.text)
			.join(', ');
	}
</script>

<div class="wrap">
	<header class="header">
		<button class="back" onclick={() => goto('/quiz')} aria-label="Zurück">
			<ArrowLeft size={18} /> Quiz
		</button>
		{#if quiz}
			<button
				class="play-btn"
				disabled={questions.length === 0}
				onclick={() => goto(`/quiz/${quiz.id}/play`)}
			>
				<Play size={14} weight="fill" /> Spielen
			</button>
		{/if}
	</header>

	{#if !quiz}
		<p class="empty">Quiz nicht gefunden.</p>
	{:else}
		<section class="meta-section">
			<input
				class="title-input"
				type="text"
				bind:value={metaTitle}
				onblur={saveMeta}
				placeholder="Titel"
			/>
			<textarea
				class="desc-input"
				bind:value={metaDescription}
				onblur={saveMeta}
				placeholder="Beschreibung (optional)"
				rows="2"
			></textarea>
			<div class="meta-row">
				<input
					class="small-input"
					type="text"
					bind:value={metaCategory}
					onblur={saveMeta}
					placeholder="Kategorie"
				/>
				<input
					class="small-input"
					type="text"
					bind:value={metaTags}
					onblur={saveMeta}
					placeholder="Tags (Komma-getrennt)"
				/>
			</div>
		</section>

		<section class="questions-section">
			<h2>Fragen ({questions.length})</h2>
			{#if questions.length === 0}
				<p class="empty">Noch keine Fragen — füge unten eine hinzu.</p>
			{:else}
				<ol class="question-list">
					{#each questions as q, i (q.id)}
						<li class="question-item">
							<div class="q-header">
								<span class="q-num">{i + 1}</span>
								<span class="q-type">{QUESTION_TYPE_LABELS[q.type]}</span>
								<button
									class="icon-btn"
									title="Löschen"
									aria-label="Löschen"
									onclick={() => deleteQuestion(q.id)}
								>
									<Trash size={14} />
								</button>
							</div>
							<p class="q-text">{q.questionText}</p>
							<p class="q-answer">
								<Check size={12} /> <strong>{correctLabel(q)}</strong>
							</p>
							{#if q.explanation}
								<p class="q-expl">{q.explanation}</p>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="new-section">
			<h2>Neue Frage</h2>
			<label class="field">
				<span>Typ</span>
				<select bind:value={newType}>
					<option value="single">Single Choice</option>
					<option value="multi">Multiple Choice</option>
					<option value="truefalse">Wahr / Falsch</option>
					<option value="text">Texteingabe</option>
				</select>
			</label>
			<label class="field">
				<span>Frage</span>
				<textarea bind:value={newText} rows="2" placeholder="Was möchtest du fragen?"></textarea>
			</label>

			{#if newType === 'text'}
				<label class="field">
					<span>Korrekte Antwort</span>
					<input type="text" bind:value={newTextAnswer} placeholder="Erwartete Eingabe" />
				</label>
			{:else}
				<div class="options-block">
					<span class="options-label">
						Antworten {newType === 'multi' ? '(mehrere richtig möglich)' : '(eine richtig)'}
					</span>
					{#each newOptions as opt, i (opt.id)}
						<div class="option-row">
							<button
								class="correct-toggle"
								class:on={opt.isCorrect}
								title={opt.isCorrect ? 'Richtig' : 'Als richtig markieren'}
								aria-label="Richtig"
								onclick={() => toggleNewCorrect(opt.id)}
							>
								{#if opt.isCorrect}<Check size={14} weight="bold" />{/if}
							</button>
							<input
								type="text"
								bind:value={newOptions[i].text}
								placeholder={`Antwort ${i + 1}`}
								disabled={newType === 'truefalse'}
							/>
							{#if newType !== 'truefalse' && newOptions.length > 2}
								<button
									class="icon-btn"
									aria-label="Entfernen"
									onclick={() => removeNewOption(opt.id)}
								>
									<Trash size={14} />
								</button>
							{/if}
						</div>
					{/each}
					{#if newType !== 'truefalse' && newOptions.length < 6}
						<button class="add-option" onclick={addNewOption}>
							<Plus size={12} /> Antwort hinzufügen
						</button>
					{/if}
				</div>
			{/if}

			<label class="field">
				<span>Erklärung (optional)</span>
				<textarea
					bind:value={newExplanation}
					rows="2"
					placeholder="Wird nach dem Antworten angezeigt"
				></textarea>
			</label>

			<button class="submit-btn" onclick={submitNewQuestion}>
				<Plus size={14} /> Frage hinzufügen
			</button>
		</section>
	{/if}
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
		max-width: 48rem;
		margin: 0 auto;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: transparent;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.8125rem;
	}
	.back:hover {
		color: hsl(var(--color-foreground));
	}
	.play-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}
	.play-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.5rem;
	}

	.empty {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	/* ── Meta ── */
	.meta-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
	}
	.title-input {
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		outline: none;
		padding: 0.25rem 0;
	}
	.desc-input,
	.small-input {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		resize: vertical;
		font-family: inherit;
	}
	.meta-row {
		display: flex;
		gap: 0.5rem;
	}
	.small-input {
		flex: 1;
	}
	.desc-input:focus,
	.small-input:focus,
	.title-input:focus {
		border-color: hsl(var(--color-primary));
	}

	/* ── Question list ── */
	.question-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.question-item {
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
	}
	.q-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.q-num {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
	}
	.q-type {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
	}
	.icon-btn {
		margin-left: auto;
		padding: 0.25rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: inline-flex;
		align-items: center;
	}
	.icon-btn:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-surface-hover));
	}
	.q-text {
		margin: 0.375rem 0 0.25rem;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.q-answer {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.q-expl {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	/* ── New question form ── */
	.new-section {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.field > span {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}
	.field input,
	.field textarea,
	.field select {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.field input:focus,
	.field textarea:focus,
	.field select:focus {
		border-color: hsl(var(--color-primary));
	}

	.options-block {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.options-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}
	.option-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.option-row input {
		flex: 1;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.correct-toggle {
		width: 22px;
		height: 22px;
		border-radius: 9999px;
		border: 1.5px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-primary-foreground));
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.correct-toggle.on {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.add-option {
		align-self: flex-start;
		background: transparent;
		border: 1px dashed hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.add-option:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.submit-btn {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
</style>
