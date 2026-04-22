<!--
  Context Interview — Guided question flow that populates userContext.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useUserContext } from './queries';
	import { userContextStore } from './stores/user-context.svelte';
	import {
		CATEGORIES,
		getQuestionsByCategory,
		getProgress,
		type ContextCategory,
		type ContextQuestion,
		type QuestionInputType,
	} from './questions';
	import { useInterviewTts, VOICES } from './use-interview-tts.svelte';
	import { useLocalStt } from '$lib/components/voice/use-local-stt.svelte';

	interface Props {
		limitCategories?: ContextCategory[];
		compact?: boolean;
		/** If set, auto-start this voice level on mount. */
		initialVoiceLevel?: 'voice' | 'conversation';
	}

	let { limitCategories, compact = false, initialVoiceLevel }: Props = $props();

	let ctx$ = useUserContext();
	let ctx = $derived(ctx$.value);

	let activeCategory = $state<ContextCategory>('about');
	let currentQuestionIdx = $state(0);
	let inputValue = $state<unknown>('');
	let saving = $state(false);
	let tagInput = $state('');

	// ── Voice mode ──────────────────────────────────────
	// 'off' = text only, 'voice' = TTS+STT per question, 'conversation' = auto-save + auto-advance
	type VoiceLevel = 'off' | 'voice' | 'conversation';
	const tts = useInterviewTts();
	const stt = useLocalStt({ language: 'de' });
	let voiceLevel = $state<VoiceLevel>('off');
	let voiceMode = $derived(voiceLevel !== 'off');
	let conversationMode = $derived(voiceLevel === 'conversation');
	let voiceFlowActive = $state(false);
	const VOICE_INPUT_TYPES: QuestionInputType[] = ['text', 'textarea', 'tags'];

	onMount(() => {
		void userContextStore.ensureDoc();
		if (initialVoiceLevel) {
			voiceLevel = initialVoiceLevel;
		}
	});

	onDestroy(() => {
		tts.stop();
		if (stt.state === 'recording') stt.cancel();
	});

	let categories = $derived(
		limitCategories ? CATEGORIES.filter((c) => limitCategories!.includes(c.key)) : CATEGORIES
	);
	let categoryQuestions = $derived(getQuestionsByCategory(activeCategory));
	let currentQuestion = $derived(
		categoryQuestions[currentQuestionIdx] as ContextQuestion | undefined
	);
	let currentSupportsVoice = $derived(
		currentQuestion ? VOICE_INPUT_TYPES.includes(currentQuestion.inputType) : false
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
		cancelVoiceFlow();
		activeCategory = key;
		currentQuestionIdx = 0;
	}

	// ── Voice flow: TTS → STT → fill input ──────────────
	async function runVoiceFlow() {
		if (!currentQuestion || !currentSupportsVoice) return;
		voiceFlowActive = true;

		// Step 1: Play pre-rendered question audio (falls back to Web Speech API)
		await tts.speak(currentQuestion.id, currentQuestion.question);

		// Step 2: Start mic recording (STT)
		if (!voiceFlowActive) return; // cancelled during TTS
		stt.toggle(); // starts recording
	}

	// Watch STT text — when transcription completes, fill the input.
	// In conversation mode: auto-save + auto-advance to next question.
	$effect(() => {
		if (stt.state === 'idle' && stt.text && voiceFlowActive) {
			applyVoiceTranscript(stt.text);
			voiceFlowActive = false;
			if (conversationMode) {
				// Auto-save and advance after a brief pause so the user sees the transcript
				setTimeout(() => handleAnswer(), 600);
			}
		}
	});

	// Auto-start voice flow when question changes in voice mode.
	// Track only the question id to avoid re-triggering when ctx data updates.
	let prevVoiceQuestionId = $state('');
	$effect(() => {
		const qid = currentQuestion?.id ?? '';
		const shouldRun = voiceMode && currentSupportsVoice && qid && qid !== prevVoiceQuestionId;
		if (shouldRun) {
			prevVoiceQuestionId = qid;
			const timeout = setTimeout(() => runVoiceFlow(), 300);
			return () => clearTimeout(timeout);
		}
	});

	function applyVoiceTranscript(transcript: string) {
		if (!currentQuestion) return;
		if (currentQuestion.inputType === 'tags') {
			// Split transcript into tags by comma, "und", or line breaks
			const parts = transcript
				.split(/[,\n]|\bund\b/i)
				.map((s) => s.trim())
				.filter(Boolean);
			const current = Array.isArray(inputValue) ? (inputValue as string[]) : [];
			const merged = [...current];
			for (const part of parts) {
				if (!merged.includes(part)) merged.push(part);
			}
			inputValue = merged;
		} else {
			// text / textarea — replace content
			inputValue = transcript;
		}
	}

	function toggleMicForCurrentQuestion() {
		if (stt.state === 'recording') {
			stt.toggle(); // stop → transcribe
		} else if (stt.state === 'idle') {
			voiceFlowActive = true;
			stt.toggle(); // start recording
		}
	}

	function cancelVoiceFlow() {
		voiceFlowActive = false;
		tts.stop();
		if (stt.state === 'recording') stt.cancel();
	}

	async function handleAnswer() {
		if (!currentQuestion) return;
		saving = true;
		try {
			await userContextStore.setField(currentQuestion.field, inputValue, currentQuestion.merge);
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
		cancelVoiceFlow();
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
		<div class="progress-row">
			<p class="progress-text">{progress.answered} von {progress.total} Fragen beantwortet</p>
			{#if tts.isSupported}
				<div class="voice-controls">
					<div class="voice-toggles">
						<button
							class="voice-toggle"
							class:active={voiceLevel === 'voice'}
							onclick={() => {
								voiceLevel = voiceLevel === 'voice' ? 'off' : 'voice';
								if (voiceLevel === 'off') cancelVoiceFlow();
							}}
							title="Voice-Modus: Fragen werden vorgelesen, Antworten per Sprache"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
								<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
							</svg>
							<span>Voice</span>
						</button>
						<button
							class="voice-toggle"
							class:active={voiceLevel === 'conversation'}
							onclick={() => {
								voiceLevel = voiceLevel === 'conversation' ? 'off' : 'conversation';
								if (voiceLevel === 'off') cancelVoiceFlow();
							}}
							title="Gesprächs-Modus: Fließendes Interview — Antworten werden automatisch gespeichert"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
							</svg>
							<span>Gespräch</span>
						</button>
					</div>
					{#if voiceMode}
						<select
							class="voice-picker"
							value={tts.voice}
							onchange={(e) => tts.setVoice(e.currentTarget.value as any)}
						>
							{#each VOICES as v (v.key)}
								<option value={v.key}>{v.label}</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}
		</div>
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

	{#if conversationMode}
		<div class="conversation-banner">
			<span>Gesprächs-Modus aktiv — Antworten werden automatisch gespeichert</span>
			<button
				class="banner-stop"
				onclick={() => {
					voiceLevel = 'off';
					cancelVoiceFlow();
				}}>Beenden</button
			>
		</div>
	{/if}

	{#if currentQuestion}
		<div class="question-card">
			<div class="question-header">
				<h3 class="question-text">{currentQuestion.question}</h3>
				{#if tts.speaking}
					<span class="voice-indicator speaking" title="Liest vor...">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
						</svg>
					</span>
				{/if}
			</div>
			{#if currentQuestion.hint}<p class="question-hint">{currentQuestion.hint}</p>{/if}

			{#if stt.state === 'recording'}
				<div class="voice-status recording">
					<span class="rec-dot"></span>
					Aufnahme läuft... ({Math.floor(stt.elapsedMs / 1000)}s)
					<button class="voice-stop-btn" onclick={() => stt.toggle()}>Stopp</button>
				</div>
			{:else if stt.state === 'transcribing'}
				<div class="voice-status transcribing">
					<span class="spinner-small"></span>
					Transkribiere...
				</div>
			{:else if stt.state === 'loading'}
				<div class="voice-status loading">
					<span class="spinner-small"></span>
					Lade Sprachmodell...
				</div>
			{/if}

			<div class="input-area">
				{#if currentQuestion.inputType === 'text'}
					<div class="input-with-mic">
						<input
							type="text"
							class="text-input"
							bind:value={inputValue}
							placeholder={currentQuestion.hint ?? ''}
							disabled={saving}
							onkeydown={(e) => e.key === 'Enter' && handleAnswer()}
						/>
						{#if stt.isSupported}
							<button
								class="mic-btn"
								class:recording={stt.state === 'recording'}
								onclick={toggleMicForCurrentQuestion}
								disabled={saving || stt.state === 'transcribing' || stt.state === 'loading'}
								title={stt.state === 'recording' ? 'Aufnahme stoppen' : 'Per Sprache antworten'}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
									<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
									<line x1="12" y1="19" x2="12" y2="23"></line>
									<line x1="8" y1="23" x2="16" y2="23"></line>
								</svg>
							</button>
						{/if}
					</div>
				{:else if currentQuestion.inputType === 'textarea'}
					<div class="textarea-with-mic">
						<textarea
							class="textarea-input"
							bind:value={inputValue}
							placeholder={currentQuestion.hint ?? ''}
							disabled={saving}
							rows="3"
						></textarea>
						{#if stt.isSupported}
							<button
								class="mic-btn textarea-mic"
								class:recording={stt.state === 'recording'}
								onclick={toggleMicForCurrentQuestion}
								disabled={saving || stt.state === 'transcribing' || stt.state === 'loading'}
								title={stt.state === 'recording' ? 'Aufnahme stoppen' : 'Per Sprache antworten'}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
									<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
									<line x1="12" y1="19" x2="12" y2="23"></line>
									<line x1="8" y1="23" x2="16" y2="23"></line>
								</svg>
							</button>
						{/if}
					</div>
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
						<div class="input-with-mic">
							<input
								type="text"
								class="text-input"
								bind:value={tagInput}
								placeholder={currentQuestion.hint ?? 'Eingabe + Enter'}
								disabled={saving}
								onkeydown={handleTagKeydown}
								onblur={addTag}
							/>
							{#if stt.isSupported}
								<button
									class="mic-btn"
									class:recording={stt.state === 'recording'}
									onclick={toggleMicForCurrentQuestion}
									disabled={saving || stt.state === 'transcribing' || stt.state === 'loading'}
									title={stt.state === 'recording' ? 'Aufnahme stoppen' : 'Per Sprache antworten'}
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
										<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
										<line x1="12" y1="19" x2="12" y2="23"></line>
										<line x1="8" y1="23" x2="16" y2="23"></line>
									</svg>
								</button>
							{/if}
						</div>
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
						aria-label="Frage {i + 1}"
						aria-current={i === currentQuestionIdx ? 'step' : undefined}
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

	/* ── Voice mode ────────────────────────────── */
	.progress-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.voice-controls {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.voice-toggles {
		display: flex;
		gap: 0.25rem;
	}
	.voice-picker {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.6875rem;
		outline: none;
		cursor: pointer;
	}
	.voice-picker:focus {
		border-color: hsl(var(--color-primary));
	}
	.voice-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
		white-space: nowrap;
	}
	.voice-toggle:hover {
		background: hsl(var(--color-surface-hover));
	}
	.voice-toggle.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.question-header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.question-header .question-text {
		flex: 1;
	}
	.voice-indicator {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: hsl(var(--color-primary));
	}
	.voice-indicator.speaking {
		animation: pulse-voice 1s ease-in-out infinite;
	}
	@keyframes pulse-voice {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
	.voice-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
	}
	.voice-status.recording {
		background: hsl(0 70% 50% / 0.08);
		color: hsl(0 70% 45%);
	}
	.voice-status.transcribing,
	.voice-status.loading {
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
	}
	.rec-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: hsl(0 70% 50%);
		animation: pulse-rec 1s ease-in-out infinite;
	}
	@keyframes pulse-rec {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(1.3);
		}
	}
	.voice-stop-btn {
		margin-left: auto;
		padding: 0.25rem 0.625rem;
		border: 1px solid currentColor;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.spinner-small {
		width: 0.875rem;
		height: 0.875rem;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.input-with-mic {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}
	.input-with-mic .text-input {
		flex: 1;
	}
	.textarea-with-mic {
		position: relative;
	}
	.textarea-with-mic .textarea-input {
		width: 100%;
	}
	.mic-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.mic-btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.mic-btn.recording {
		background: hsl(0 70% 50% / 0.1);
		border-color: hsl(0 70% 50%);
		color: hsl(0 70% 45%);
		animation: pulse-rec 1s ease-in-out infinite;
	}
	.mic-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.textarea-mic {
		position: absolute;
		right: 0.375rem;
		bottom: 0.375rem;
	}
	.conversation-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
	}
	.banner-stop {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.banner-stop:hover {
		background: hsl(var(--color-primary) / 0.1);
	}
</style>
