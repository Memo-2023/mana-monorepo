<!--
  Quiz — PlayView
  Walk through all questions, grade, then show result.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQuiz, useQuestions, evaluateAnswer } from './queries';
	import { attemptsStore } from './stores/attempts.svelte';
	import type { AttemptAnswer } from './types';
	import { ArrowLeft, Check, X } from '@mana/shared-icons';

	interface Props {
		quizId: string;
	}
	let { quizId }: Props = $props();

	const quiz$ = useQuiz(quizId);
	const quiz = $derived(quiz$.value);
	const questions$ = useQuestions(quizId);
	const questions = $derived(questions$.value);

	let attemptId = $state<string | null>(null);
	let currentIndex = $state(0);
	let selectedIds = $state<string[]>([]);
	let textInput = $state('');
	let revealed = $state(false);
	let answers = $state<AttemptAnswer[]>([]);
	let finished = $state(false);

	// Start an attempt once the questions list resolves.
	$effect(() => {
		if (!attemptId && questions.length > 0) {
			attemptsStore.startAttempt(quizId).then((a) => (attemptId = a.id));
		}
	});

	const current = $derived(questions[currentIndex] ?? null);
	const total = $derived(questions.length);
	const correctCount = $derived(answers.filter((a) => a.correct).length);
	const scorePct = $derived(
		answers.length === 0 ? 0 : Math.round((correctCount / answers.length) * 100)
	);

	function toggleSelect(optId: string) {
		if (revealed || !current) return;
		if (current.type === 'multi') {
			selectedIds = selectedIds.includes(optId)
				? selectedIds.filter((x) => x !== optId)
				: [...selectedIds, optId];
		} else {
			selectedIds = [optId];
		}
	}

	function reveal() {
		if (!current) return;
		const correct = evaluateAnswer(
			current,
			selectedIds,
			current.type === 'text' ? textInput : null
		);
		answers = [
			...answers,
			{
				questionId: current.id,
				selectedOptionIds: selectedIds,
				textAnswer: current.type === 'text' ? textInput : null,
				correct,
			},
		];
		revealed = true;
	}

	function next() {
		if (currentIndex + 1 >= total) {
			finish();
			return;
		}
		currentIndex += 1;
		selectedIds = [];
		textInput = '';
		revealed = false;
	}

	async function finish() {
		if (attemptId) {
			await attemptsStore.finishAttempt(attemptId, answers);
		}
		finished = true;
	}

	function restart() {
		answers = [];
		currentIndex = 0;
		selectedIds = [];
		textInput = '';
		revealed = false;
		finished = false;
		attemptId = null;
	}

	const canAnswer = $derived(
		!!current && (current.type === 'text' ? textInput.trim().length > 0 : selectedIds.length > 0)
	);
</script>

<div class="wrap">
	<header class="header">
		<button class="back" onclick={() => goto('/quiz')} aria-label="Zurück">
			<ArrowLeft size={18} /> Quiz
		</button>
		{#if quiz}
			<span class="title">{quiz.title}</span>
		{/if}
		{#if !finished && total > 0}
			<span class="progress">{currentIndex + 1} / {total}</span>
		{/if}
	</header>

	{#if !quiz}
		<p class="empty">Quiz nicht gefunden.</p>
	{:else if total === 0}
		<p class="empty">Dieses Quiz hat noch keine Fragen.</p>
	{:else if finished}
		<section class="result">
			<div class="score">
				<span class="score-num">{scorePct}%</span>
				<span class="score-sub">{correctCount} von {total} richtig</span>
			</div>
			<ol class="review">
				{#each questions as q, i (q.id)}
					{@const ans = answers[i]}
					<li class="review-item" class:ok={ans?.correct} class:fail={ans && !ans.correct}>
						<div class="review-head">
							{#if ans?.correct}<Check size={14} weight="bold" />{:else}<X
									size={14}
									weight="bold"
								/>{/if}
							<span>{q.questionText}</span>
						</div>
						{#if q.type === 'text'}
							<p class="review-line">
								Deine Antwort: <strong>{ans?.textAnswer || '—'}</strong>
							</p>
							{#if !ans?.correct}
								<p class="review-line">Richtig: <strong>{q.options[0]?.text}</strong></p>
							{/if}
						{:else}
							<p class="review-line">
								Richtig:
								<strong>
									{q.options
										.filter((o) => o.isCorrect)
										.map((o) => o.text)
										.join(', ')}
								</strong>
							</p>
						{/if}
					</li>
				{/each}
			</ol>
			<div class="result-actions">
				<button class="secondary-btn" onclick={() => goto('/quiz')}>Zurück zur Liste</button>
				<button class="primary-btn" onclick={restart}>Nochmal spielen</button>
			</div>
		</section>
	{:else if current}
		<section class="play">
			<p class="q-text">{current.questionText}</p>

			{#if current.type === 'text'}
				<input
					class="text-answer"
					type="text"
					bind:value={textInput}
					disabled={revealed}
					placeholder="Deine Antwort"
				/>
				{#if revealed}
					<p class="feedback" class:ok={answers.at(-1)?.correct}>
						{#if answers.at(-1)?.correct}
							<Check size={14} weight="bold" /> Richtig!
						{:else}
							<X size={14} weight="bold" /> Richtige Antwort:
							<strong>{current.options[0]?.text}</strong>
						{/if}
					</p>
				{/if}
			{:else}
				<ul class="options">
					{#each current.options as opt (opt.id)}
						{@const isSelected = selectedIds.includes(opt.id)}
						{@const isCorrect = opt.isCorrect}
						<li>
							<button
								class="option"
								class:selected={isSelected}
								class:reveal-correct={revealed && isCorrect}
								class:reveal-wrong={revealed && isSelected && !isCorrect}
								disabled={revealed}
								onclick={() => toggleSelect(opt.id)}
							>
								<span class="option-text">{opt.text}</span>
								{#if revealed && isCorrect}
									<Check size={16} weight="bold" />
								{:else if revealed && isSelected && !isCorrect}
									<X size={16} weight="bold" />
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if revealed && current.explanation}
				<p class="explanation">{current.explanation}</p>
			{/if}

			<div class="play-actions">
				{#if !revealed}
					<button class="primary-btn" disabled={!canAnswer} onclick={reveal}>
						Antwort prüfen
					</button>
				{:else}
					<button class="primary-btn" onclick={next}>
						{currentIndex + 1 >= total ? 'Ergebnis ansehen' : 'Weiter'}
					</button>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
		max-width: 40rem;
		margin: 0 auto;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
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
	.title {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.progress {
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.empty {
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 2rem 0;
	}

	/* ── Play ── */
	.play {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.q-text {
		font-size: 1.0625rem;
		color: hsl(var(--color-foreground));
		line-height: 1.4;
		margin: 0;
	}
	.options {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1.5px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		text-align: left;
		cursor: pointer;
	}
	.option:hover:not(:disabled) {
		border-color: hsl(var(--color-primary) / 0.5);
	}
	.option.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
	.option.reveal-correct {
		border-color: hsl(var(--color-success, 142 76% 36%));
		background: hsl(var(--color-success, 142 76% 36%) / 0.12);
	}
	.option.reveal-wrong {
		border-color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.1);
	}
	.option:disabled {
		cursor: default;
	}
	.text-answer {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1.5px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		outline: none;
	}
	.text-answer:focus {
		border-color: hsl(var(--color-primary));
	}
	.feedback {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: hsl(var(--color-error));
		margin: 0;
	}
	.feedback.ok {
		color: hsl(var(--color-success, 142 76% 36%));
	}
	.explanation {
		padding: 0.625rem 0.875rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted) / 0.2);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		margin: 0;
		font-style: italic;
	}

	.play-actions {
		display: flex;
		justify-content: flex-end;
	}
	.primary-btn {
		padding: 0.5rem 1.25rem;
		border-radius: 0.375rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.primary-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.secondary-btn {
		padding: 0.5rem 1.25rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	/* ── Result ── */
	.result {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.score {
		text-align: center;
		padding: 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
	}
	.score-num {
		display: block;
		font-size: 2.5rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
	}
	.score-sub {
		display: block;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}
	.review {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.review-item {
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
	}
	.review-item.ok {
		border-color: hsl(var(--color-success, 142 76% 36%) / 0.4);
	}
	.review-item.fail {
		border-color: hsl(var(--color-error) / 0.4);
	}
	.review-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.review-item.ok .review-head {
		color: hsl(var(--color-success, 142 76% 36%));
	}
	.review-item.fail .review-head {
		color: hsl(var(--color-error));
	}
	.review-line {
		margin: 0.25rem 0 0;
		padding-left: 1.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.result-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}
</style>
