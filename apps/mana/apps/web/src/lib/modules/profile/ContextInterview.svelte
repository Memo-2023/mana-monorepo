<!--
  Context Interview — Guided question flow that populates userContext.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { useUserContext } from './queries';
	import { userContextStore } from './stores/user-context.svelte';
	import {
		CATEGORIES,
		getQuestionsByCategory,
		getProgress,
		type ContextCategory,
		type ContextQuestion,
	} from './questions';

	interface Props {
		limitCategories?: ContextCategory[];
		compact?: boolean;
	}

	let { limitCategories, compact = false }: Props = $props();

	let ctx$ = useUserContext();
	let ctx = $derived(ctx$.value);

	let activeCategory = $state<ContextCategory>('about');
	let currentQuestionIdx = $state(0);
	let inputValue = $state<unknown>('');
	let saving = $state(false);
	let tagInput = $state('');

	onMount(() => {
		void userContextStore.ensureDoc();
	});

	let categories = $derived(
		limitCategories ? CATEGORIES.filter((c) => limitCategories!.includes(c.key)) : CATEGORIES
	);
	let categoryQuestions = $derived(getQuestionsByCategory(activeCategory));
	let currentQuestion = $derived(
		categoryQuestions[currentQuestionIdx] as ContextQuestion | undefined
	);
	let progress = $derived(getProgress(ctx?.interview?.answeredIds ?? []));
	let answeredSet = $derived(new Set(ctx?.interview?.answeredIds ?? []));
	let categoryProgress = $derived.by(() => {
		const result: Record<string, { answered: number; total: number }> = {};
		for (const cat of categories) {
			const qs = getQuestionsByCategory(cat.key);
			result[cat.key] = {
				total: qs.length,
				answered: qs.filter((q) => answeredSet.has(q.id)).length,
			};
		}
		return result;
	});

	$effect(() => {
		if (!currentQuestion || !ctx) return;
		const val = getFieldValue(currentQuestion.field);
		inputValue = val ?? '';
	});

	function getFieldValue(path: string): unknown {
		if (!ctx) return undefined;
		const [section, field] = path.split('.') as [keyof typeof ctx, string];
		if (field) {
			const sectionObj = ctx[section] as Record<string, unknown> | undefined;
			return sectionObj?.[field];
		}
		return ctx[section];
	}

	function selectCategory(key: ContextCategory) {
		activeCategory = key;
		currentQuestionIdx = 0;
	}

	async function handleAnswer() {
		if (!currentQuestion) return;
		saving = true;
		try {
			await userContextStore.setField(currentQuestion.field, inputValue);
			await userContextStore.markAnswered(currentQuestion.id);
			advanceQuestion();
		} finally {
			saving = false;
		}
	}

	async function handleSkip() {
		if (!currentQuestion) return;
		await userContextStore.markSkipped(currentQuestion.id);
		advanceQuestion();
	}

	function advanceQuestion() {
		if (currentQuestionIdx < categoryQuestions.length - 1) {
			currentQuestionIdx++;
		} else {
			const currentIdx = categories.findIndex((c) => c.key === activeCategory);
			for (let i = 1; i <= categories.length; i++) {
				const next = categories[(currentIdx + i) % categories.length];
				const qs = getQuestionsByCategory(next.key);
				if (qs.some((q) => !answeredSet.has(q.id))) {
					activeCategory = next.key;
					currentQuestionIdx = 0;
					return;
				}
			}
			currentQuestionIdx = 0;
		}
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addTag();
		}
	}
	function addTag() {
		const tag = tagInput.trim().replace(/,$/, '');
		if (!tag) return;
		const current = Array.isArray(inputValue) ? (inputValue as string[]) : [];
		if (!current.includes(tag)) inputValue = [...current, tag];
		tagInput = '';
	}
	function removeTag(tag: string) {
		if (Array.isArray(inputValue))
			inputValue = (inputValue as string[]).filter((t: string) => t !== tag);
	}
	function toggleWeekday(day: number) {
		const current = Array.isArray(inputValue) ? (inputValue as number[]) : [];
		if (current.includes(day)) inputValue = current.filter((d: number) => d !== day);
		else inputValue = [...current, day].sort();
	}

	const WEEKDAYS = [
		{ value: 1, short: 'Mo' },
		{ value: 2, short: 'Di' },
		{ value: 3, short: 'Mi' },
		{ value: 4, short: 'Do' },
		{ value: 5, short: 'Fr' },
		{ value: 6, short: 'Sa' },
		{ value: 0, short: 'So' },
	];
</script>

<div class="interview" class:compact>
	{#if !compact}
		<div class="progress-bar">
			<div class="progress-fill" style:width="{progress.percent}%"></div>
		</div>
		<p class="progress-text">{progress.answered} von {progress.total} Fragen beantwortet</p>
	{/if}

	<div class="categories">
		{#each categories as cat (cat.key)}
			{@const cp = categoryProgress[cat.key]}
			<button
				class="cat-btn"
				class:active={activeCategory === cat.key}
				onclick={() => selectCategory(cat.key)}
			>
				<span class="cat-label">{cat.label}</span>
				{#if cp && cp.answered > 0}<span class="cat-badge">{cp.answered}/{cp.total}</span>{/if}
			</button>
		{/each}
	</div>

	{#if currentQuestion}
		<div class="question-card">
			<h3 class="question-text">{currentQuestion.question}</h3>
			{#if currentQuestion.hint}<p class="question-hint">{currentQuestion.hint}</p>{/if}

			<div class="input-area">
				{#if currentQuestion.inputType === 'text'}
					<input
						type="text"
						class="text-input"
						bind:value={inputValue}
						placeholder={currentQuestion.hint ?? ''}
						disabled={saving}
						onkeydown={(e) => e.key === 'Enter' && handleAnswer()}
					/>
				{:else if currentQuestion.inputType === 'textarea'}
					<textarea
						class="textarea-input"
						bind:value={inputValue}
						placeholder={currentQuestion.hint ?? ''}
						disabled={saving}
						rows="3"
					></textarea>
				{:else if currentQuestion.inputType === 'time'}
					<input type="time" class="time-input" bind:value={inputValue} disabled={saving} />
				{:else if currentQuestion.inputType === 'choice'}
					<div class="choices">
						{#each currentQuestion.choices ?? [] as choice (choice)}
							<button
								class="choice-btn"
								class:selected={inputValue === choice}
								onclick={() => (inputValue = choice)}
								disabled={saving}>{choice}</button
							>
						{/each}
					</div>
				{:else if currentQuestion.inputType === 'tags'}
					<div class="tags-input">
						{#if Array.isArray(inputValue)}
							<div class="tags-list">
								{#each inputValue as tag (tag)}<span class="tag"
										>{tag}<button class="tag-remove" onclick={() => removeTag(tag as string)}
											>&times;</button
										></span
									>{/each}
							</div>
						{/if}
						<input
							type="text"
							class="text-input"
							bind:value={tagInput}
							placeholder={currentQuestion.hint ?? 'Eingabe + Enter'}
							disabled={saving}
							onkeydown={handleTagKeydown}
							onblur={addTag}
						/>
					</div>
				{:else if currentQuestion.inputType === 'weekdays'}
					<div class="weekdays">
						{#each WEEKDAYS as day (day.value)}
							<button
								class="weekday-btn"
								class:selected={Array.isArray(inputValue) && inputValue.includes(day.value)}
								onclick={() => toggleWeekday(day.value)}
								disabled={saving}>{day.short}</button
							>
						{/each}
					</div>
				{/if}
			</div>

			{#if answeredSet.has(currentQuestion.id)}<p class="already-answered">
					Bereits beantwortet — du kannst die Antwort aktualisieren
				</p>{/if}

			<div class="actions">
				<button class="action-btn secondary" onclick={handleSkip} disabled={saving}
					>Überspringen</button
				>
				<button class="action-btn primary" onclick={handleAnswer} disabled={saving}>
					{saving
						? 'Speichert...'
						: answeredSet.has(currentQuestion.id)
							? 'Aktualisieren'
							: 'Speichern'}
				</button>
			</div>

			<div class="pagination">
				{#each categoryQuestions as _, i (i)}
					<button
						class="page-dot"
						class:active={i === currentQuestionIdx}
						class:answered={answeredSet.has(categoryQuestions[i].id)}
						onclick={() => (currentQuestionIdx = i)}
					></button>
				{/each}
			</div>
		</div>
	{:else}
		<div class="all-done"><p>Alle Fragen in dieser Kategorie sind beantwortet!</p></div>
	{/if}
</div>

<style>
	.interview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}
	.progress-bar {
		height: 4px;
		background: hsl(var(--color-border));
		border-radius: 2px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
		transition: width 0.3s ease;
	}
	.progress-text {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}
	.categories {
		display: flex;
		gap: 0.375rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		scrollbar-width: none;
	}
	.categories::-webkit-scrollbar {
		display: none;
	}
	.cat-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.cat-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.cat-btn.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.cat-badge {
		font-size: 0.625rem;
		padding: 0 0.375rem;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		border-radius: 999px;
	}
	.question-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.question-text {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.4;
	}
	.question-hint {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.input-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.text-input,
	.time-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.text-input:focus,
	.time-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.time-input {
		width: auto;
	}
	.textarea-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
	}
	.textarea-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.choice-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.choice-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.choice-btn.selected {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.tags-input {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		border-radius: 999px;
		font-size: 0.75rem;
	}
	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		border: none;
		background: transparent;
		color: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		opacity: 0.7;
	}
	.tag-remove:hover {
		opacity: 1;
	}
	.weekdays {
		display: flex;
		gap: 0.375rem;
	}
	.weekday-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.weekday-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.weekday-btn.selected {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.already-answered {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}
	.action-btn {
		flex: 1;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.action-btn.primary {
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.action-btn.primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.action-btn.primary:disabled {
		opacity: 0.6;
	}
	.action-btn.secondary {
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.action-btn.secondary:hover {
		background: hsl(var(--color-surface-hover));
	}
	.pagination {
		display: flex;
		justify-content: center;
		gap: 0.375rem;
		padding-top: 0.25rem;
	}
	.page-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		padding: 0;
		cursor: pointer;
		transition: background 0.15s;
	}
	.page-dot.active {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.page-dot.answered {
		background: hsl(var(--color-primary) / 0.4);
		border-color: hsl(var(--color-primary) / 0.4);
	}
	.all-done {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}
	.compact .question-card {
		border: none;
		padding: 0;
	}
</style>
