<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { questionsApi } from '$lib/api/questions';
	import { researchApi } from '$lib/api/research';
	import { sourcesApi } from '$lib/api/sources';
	import { QuestionDetailSkeleton, ErrorAlert } from '$lib/components';
	import {
		ArrowLeft,
		Clock,
		Loader2,
		CheckCircle,
		Archive,
		Play,
		ExternalLink,
		ChevronDown,
		ChevronUp,
	} from 'lucide-svelte';
	import type { Question, ResearchResult, Source } from '$lib/types';

	let question = $state<Question | null>(null);
	let researchResults = $state<ResearchResult[]>([]);
	let sources = $state<Source[]>([]);
	let loading = $state(true);
	let researchLoading = $state(false);
	let error = $state<string | null>(null);
	let expandedSources = $state<Set<string>>(new Set());

	const statusLabels = {
		open: { label: 'Open', color: 'bg-gray-100 text-gray-700' },
		researching: { label: 'Researching', color: 'bg-blue-100 text-blue-700' },
		answered: { label: 'Answered', color: 'bg-green-100 text-green-700' },
		archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
	};

	onMount(async () => {
		await loadQuestion();
	});

	async function loadQuestion() {
		loading = true;
		error = null;

		try {
			const id = page.params.id;
			question = await questionsApi.getById(id);
			researchResults = await researchApi.getByQuestion(id);
			sources = await sourcesApi.getByQuestion(id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load question';
		} finally {
			loading = false;
		}
	}

	async function startResearch() {
		if (!question) return;

		researchLoading = true;
		error = null;

		try {
			const result = await researchApi.start({
				questionId: question.id,
				depth: question.researchDepth,
			});
			researchResults = [result, ...researchResults];
			sources = await sourcesApi.getByQuestion(question.id);
			// Reload question to get updated status
			question = await questionsApi.getById(question.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start research';
		} finally {
			researchLoading = false;
		}
	}

	function toggleSource(id: string) {
		if (expandedSources.has(id)) {
			expandedSources.delete(id);
			expandedSources = new Set(expandedSources);
		} else {
			expandedSources.add(id);
			expandedSources = new Set(expandedSources);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

{#if loading}
	<QuestionDetailSkeleton />
{:else if error}
	<div class="p-6">
		<ErrorAlert message={error} onRetry={loadQuestion} />
	</div>
{:else if question}
<div class="p-6">
		<!-- Header -->
		<div class="mb-6">
			<a
				href="/"
				class="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to questions
			</a>

			<div class="flex items-start justify-between gap-4">
				<div class="flex-1">
					<h1 class="text-2xl font-bold text-foreground">{question.title}</h1>
					{#if question.description}
						<p class="mt-2 text-muted-foreground">{question.description}</p>
					{/if}

					<div class="mt-4 flex flex-wrap items-center gap-3">
						<!-- Status Badge -->
						<span
							class="rounded-full px-3 py-1 text-sm font-medium {statusLabels[question.status]
								.color}"
						>
							{statusLabels[question.status].label}
						</span>

						<!-- Depth -->
						<span class="depth-indicator depth-{question.researchDepth}">
							{question.researchDepth}
						</span>

						<!-- Tags -->
						{#if question.tags?.length}
							{#each question.tags as tag}
								<span class="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">
									{tag}
								</span>
							{/each}
						{/if}

						<!-- Date -->
						<span class="text-sm text-muted-foreground">
							{formatDate(question.createdAt)}
						</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					{#if question.status === 'open'}
						<button
							onclick={startResearch}
							disabled={researchLoading}
							class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
						>
							{#if researchLoading}
								<Loader2 class="h-5 w-5 animate-spin" />
								Researching...
							{:else}
								<Play class="h-5 w-5" />
								Start Research
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Research Results -->
		{#if researchResults.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 text-lg font-semibold text-foreground">Research Results</h2>

				{#each researchResults as result}
					<div class="mb-6 rounded-xl border border-border bg-card p-6">
						<!-- Summary -->
						<div class="mb-4">
							<h3 class="mb-2 font-medium text-foreground">Summary</h3>
							<div class="markdown-content text-foreground whitespace-pre-wrap">
								{result.summary}
							</div>
						</div>

						<!-- Key Points -->
						{#if result.keyPoints?.length}
							<div class="mb-4">
								<h3 class="mb-2 font-medium text-foreground">Key Points</h3>
								<ul class="list-disc space-y-1 pl-5 text-foreground">
									{#each result.keyPoints as point}
										<li>{point}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Follow-up Questions -->
						{#if result.followUpQuestions?.length}
							<div class="mb-4">
								<h3 class="mb-2 font-medium text-foreground">Follow-up Questions</h3>
								<ul class="space-y-2">
									{#each result.followUpQuestions as followUp}
										<li class="text-muted-foreground">{followUp}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Meta -->
						<div class="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
							<span>Depth: {result.researchDepth}</span>
							{#if result.durationMs}
								<span>Duration: {(result.durationMs / 1000).toFixed(1)}s</span>
							{/if}
							<span>{formatDate(result.createdAt)}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else if question.status === 'open'}
			<div class="mb-8 rounded-xl border border-dashed border-border p-8 text-center">
				<div class="mb-4 text-4xl">🔍</div>
				<h2 class="mb-2 text-lg font-semibold text-foreground">No research yet</h2>
				<p class="mb-4 text-muted-foreground">
					Click "Start Research" to begin gathering information about this question.
				</p>
			</div>
		{/if}

		<!-- Sources -->
		{#if sources.length > 0}
			<div>
				<h2 class="mb-4 text-lg font-semibold text-foreground">Sources ({sources.length})</h2>

				<div class="space-y-3">
					{#each sources as source}
						<div class="source-card rounded-lg border border-border bg-card p-4">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-xs text-muted-foreground">#{source.position}</span>
										<a
											href={source.url}
											target="_blank"
											rel="noopener noreferrer"
											class="font-medium text-foreground hover:text-primary"
										>
											{source.title}
										</a>
										<ExternalLink class="h-4 w-4 text-muted-foreground" />
									</div>

									<p class="mt-1 text-sm text-muted-foreground">{source.domain}</p>

									{#if source.snippet}
										<p class="mt-2 text-sm text-foreground line-clamp-2">
											{source.snippet}
										</p>
									{/if}

									{#if source.extractedContent && expandedSources.has(source.id)}
										<div class="mt-4 rounded-lg bg-secondary/50 p-4">
											<div class="markdown-content text-sm text-foreground whitespace-pre-wrap">
												{source.extractedContent.substring(0, 2000)}
												{#if source.extractedContent.length > 2000}
													<span class="text-muted-foreground">... (truncated)</span>
												{/if}
											</div>
										</div>
									{/if}

									<div class="mt-3 flex items-center gap-4">
										{#if source.relevanceScore}
											<span class="text-xs text-muted-foreground">
												Score: {(source.relevanceScore * 100).toFixed(0)}%
											</span>
										{/if}
										{#if source.wordCount}
											<span class="text-xs text-muted-foreground">
												{source.wordCount} words
											</span>
										{/if}
										{#if source.engine}
											<span class="text-xs text-muted-foreground">
												via {source.engine}
											</span>
										{/if}
									</div>
								</div>

								{#if source.extractedContent}
									<button
										onclick={() => toggleSource(source.id)}
										class="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
									>
										{#if expandedSources.has(source.id)}
											<ChevronUp class="h-5 w-5" />
										{:else}
											<ChevronDown class="h-5 w-5" />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
</div>
{/if}
