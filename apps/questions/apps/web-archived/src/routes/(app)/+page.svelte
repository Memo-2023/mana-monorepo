<script lang="ts">
	import { collectionsStore } from '$lib/stores';
	import { ErrorAlert } from '$lib/components';
	import {
		MagnifyingGlass,
		Funnel,
		Clock,
		CheckCircle,
		CircleNotch,
		Archive,
	} from '@manacore/shared-icons';
	import type { QuestionStatus, ResearchDepth } from '$lib/types';
	import {
		useAllQuestions,
		useAllCollections,
		filterByCollection,
		filterByStatus,
		searchQuestions,
	} from '$lib/data/queries';

	// Live queries — auto-update on IndexedDB changes
	const allQuestions = useAllQuestions();
	const allCollections = useAllCollections();

	let searchQuery = $state('');
	let statusFilter = $state<QuestionStatus | ''>('');

	// Derived filtered list — pure functions over liveQuery data
	let filteredQuestions = $derived.by(() => {
		let result = allQuestions.value;
		result = filterByCollection(result, collectionsStore.selectedId);
		if (statusFilter) result = filterByStatus(result, statusFilter);
		if (searchQuery) result = searchQuestions(result, searchQuery);
		return result;
	});

	let selectedCollection = $derived(
		collectionsStore.selectedId
			? allCollections.value.find((c) => c.id === collectionsStore.selectedId)
			: null
	);

	const statusIcons = {
		open: { icon: Clock, color: 'text-gray-500' },
		researching: { icon: CircleNotch, color: 'text-blue-500' },
		answered: { icon: CheckCircle, color: 'text-green-500' },
		archived: { icon: Archive, color: 'text-gray-400' },
	};

	const depthLabels: Record<ResearchDepth, string> = {
		quick: 'Quick',
		standard: 'Standard',
		deep: 'Deep',
	};

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		});
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">
			{selectedCollection ? selectedCollection.name : 'All Questions'}
		</h1>
		<p class="mt-1 text-muted-foreground">
			{filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
		</p>
	</div>

	<!-- Search and Filters -->
	<div class="mb-6 flex gap-4">
		<div class="relative flex-1">
			<MagnifyingGlass
				class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search questions..."
				class="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<select
			bind:value={statusFilter}
			class="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
		>
			<option value="">All Status</option>
			<option value="open">Open</option>
			<option value="researching">Researching</option>
			<option value="answered">Answered</option>
			<option value="archived">Archived</option>
		</select>
	</div>

	<!-- Error -->
	{#if collectionsStore.error}
		<div class="mb-6">
			<ErrorAlert message={collectionsStore.error} onRetry={() => {}} onDismiss={() => {}} />
		</div>
	{/if}

	<!-- Questions List -->
	{#if filteredQuestions.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">🤔</div>
			<h2 class="mb-2 text-xl font-semibold text-foreground">No questions yet</h2>
			<p class="mb-4 text-muted-foreground">
				Start by asking a question and let AI research it for you.
			</p>
			<a
				href="/new"
				class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
			>
				Ask a Question
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredQuestions as question}
				{@const StatusIcon = statusIcons[question.status]?.icon || Clock}
				{@const statusColor = statusIcons[question.status]?.color || 'text-gray-500'}

				<a
					href="/question/{question.id}"
					class="question-card block rounded-xl border border-border bg-card p-4"
				>
					<div class="flex items-start gap-4">
						<!-- Status Icon -->
						<div class="mt-1">
							<StatusIcon
								class="h-5 w-5 {statusColor} {question.status === 'researching'
									? 'animate-spin'
									: ''}"
							/>
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<h3 class="font-medium text-foreground line-clamp-2">
								{question.title}
							</h3>

							{#if question.description}
								<p class="mt-1 text-sm text-muted-foreground line-clamp-2">
									{question.description}
								</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-3">
								<!-- Tags -->
								{#if question.tags?.length}
									<div class="flex gap-1">
										{#each question.tags.slice(0, 3) as tag}
											<span
												class="tag-badge rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground"
											>
												{tag}
											</span>
										{/each}
										{#if question.tags.length > 3}
											<span class="text-xs text-muted-foreground">+{question.tags.length - 3}</span>
										{/if}
									</div>
								{/if}

								<!-- Depth -->
								<span class="depth-indicator depth-{question.researchDepth}">
									{depthLabels[question.researchDepth]}
								</span>

								<!-- Date -->
								<span class="text-xs text-muted-foreground">
									{formatDate(question.createdAt)}
								</span>
							</div>
						</div>

						<!-- Priority Indicator -->
						{#if question.priority !== 'normal'}
							<div
								class="priority-indicator h-full min-h-[60px] priority-{question.priority}"
							></div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
