<!--
  Quiz — ListView
  Browse, create, pin and launch quizzes.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ViewProps } from '$lib/app-registry';
	import { useAllQuizzes, searchQuizzes } from './queries';
	import { quizzesStore } from './stores/quizzes.svelte';
	import { PushPin, PencilSimple, Play, Trash } from '@mana/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	const quizzes$ = useAllQuizzes();
	const quizzes = $derived(quizzes$.value);

	let searchQuery = $state('');
	let newTitle = $state('');

	const filtered = $derived(searchQuizzes(quizzes, searchQuery));

	async function handleCreate() {
		const title = newTitle.trim();
		if (!title) return;
		const quiz = await quizzesStore.createQuiz({ title });
		newTitle = '';
		goto(`/quiz/${quiz.id}/edit`);
	}

	async function togglePin(id: string) {
		await quizzesStore.togglePin(id);
	}

	async function handleDelete(id: string) {
		if (!confirm('Quiz wirklich löschen?')) return;
		await quizzesStore.deleteQuiz(id);
	}
</script>

<svelte:head>
	<title>Quiz - Mana</title>
</svelte:head>

<div class="wrap">
	<header class="header">
		<h1>Quiz</h1>
		<input class="search-input" type="search" placeholder="Suchen…" bind:value={searchQuery} />
	</header>

	<form class="create" onsubmit={(e) => (e.preventDefault(), handleCreate())}>
		<input
			class="create-input"
			type="text"
			placeholder="Neues Quiz — Titel eingeben und Enter"
			bind:value={newTitle}
		/>
		<button class="create-btn" type="submit" disabled={!newTitle.trim()}>Anlegen</button>
	</form>

	{#if filtered.length === 0}
		<p class="empty">
			{searchQuery ? 'Keine Quizze gefunden.' : 'Noch keine Quizze. Leg eins oben an.'}
		</p>
	{:else}
		<ul class="quiz-list">
			{#each filtered as quiz (quiz.id)}
				<li class="quiz-item" class:pinned={quiz.isPinned}>
					<div class="quiz-main">
						<div class="quiz-top">
							{#if quiz.isPinned}
								<span class="pin-dot" aria-label="Angeheftet"></span>
							{/if}
							<span class="quiz-title">{quiz.title}</span>
							<span class="count">{quiz.questionCount} Fragen</span>
						</div>
						{#if quiz.description}
							<p class="quiz-desc">{quiz.description}</p>
						{/if}
						{#if quiz.tags.length > 0 || quiz.category}
							<div class="meta">
								{#if quiz.category}<span class="chip">{quiz.category}</span>{/if}
								{#each quiz.tags as tag}<span class="chip chip-tag">#{tag}</span>{/each}
							</div>
						{/if}
					</div>
					<div class="actions">
						<button
							class="icon-btn"
							title="Anheften"
							aria-label="Anheften"
							onclick={() => togglePin(quiz.id)}
						>
							<PushPin size={16} weight={quiz.isPinned ? 'fill' : 'regular'} />
						</button>
						<button
							class="icon-btn"
							title="Bearbeiten"
							aria-label="Bearbeiten"
							onclick={() => goto(`/quiz/${quiz.id}/edit`)}
						>
							<PencilSimple size={16} />
						</button>
						<button
							class="icon-btn"
							title="Löschen"
							aria-label="Löschen"
							onclick={() => handleDelete(quiz.id)}
						>
							<Trash size={16} />
						</button>
						<button
							class="play-btn"
							disabled={quiz.questionCount === 0}
							onclick={() => goto(`/quiz/${quiz.id}/play`)}
						>
							<Play size={14} weight="fill" /> Spielen
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		max-width: 56rem;
		margin: 0 auto;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.search-input {
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}

	.create {
		display: flex;
		gap: 0.5rem;
	}
	.create-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.create-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.create-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.empty {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem 0;
	}

	.quiz-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.quiz-item {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
	}
	.quiz-item.pinned {
		border-color: hsl(var(--color-primary) / 0.5);
	}
	.quiz-main {
		flex: 1;
		min-width: 0;
	}
	.quiz-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.pin-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
	}
	.quiz-title {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
	}
	.count {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-left: auto;
	}
	.quiz-desc {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.375rem;
	}
	.chip {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}
	.chip-tag {
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.icon-btn {
		padding: 0.375rem;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.icon-btn:hover {
		background: hsl(var(--color-surface-hover));
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
</style>
