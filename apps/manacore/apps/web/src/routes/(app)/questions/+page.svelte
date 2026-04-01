<script lang="ts">
	import {
		useAllQuestions,
		useAllCollections,
		filterByCollection,
		filterByStatus,
		searchQuestions,
	} from '$lib/modules/questions/queries';
	import type { QuestionStatus, ResearchDepth } from '$lib/modules/questions/types';
	import {
		MagnifyingGlass,
		Clock,
		CheckCircle,
		CircleNotch,
		Archive,
	} from '@manacore/shared-icons';

	const allQuestions = useAllQuestions();
	const allCollections = useAllCollections();

	let searchQuery = $state('');
	let statusFilter = $state<QuestionStatus | ''>('');
	let selectedCollectionId = $state<string | null>(null);

	let filteredQuestions = $derived.by(() => {
		let result = allQuestions.current ?? [];
		result = filterByCollection(result, selectedCollectionId);
		if (statusFilter) result = filterByStatus(result, statusFilter);
		if (searchQuery) result = searchQuestions(result, searchQuery);
		return result;
	});

	let collections = $derived(allCollections.current ?? []);

	let selectedCollection = $derived(
		selectedCollectionId ? collections.find((c) => c.id === selectedCollectionId) : null
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

		if (days === 0) return 'Heute';
		if (days === 1) return 'Gestern';
		if (days < 7) return `Vor ${days} Tagen`;

		return date.toLocaleDateString('de-DE', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		});
	}
</script>

<svelte:head>
	<title>Fragen - ManaCore</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">
				{selectedCollection ? selectedCollection.name : 'Alle Fragen'}
			</h1>
			<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
				{filteredQuestions.length} Frage{filteredQuestions.length !== 1 ? 'n' : ''}
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/questions/collections"
				class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
			>
				Sammlungen
			</a>
			<a
				href="/questions/new"
				class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
			>
				Neue Frage
			</a>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="flex gap-3">
		<div class="relative flex-1">
			<MagnifyingGlass
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Fragen durchsuchen..."
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<select
			bind:value={statusFilter}
			class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
		>
			<option value="">Alle Status</option>
			<option value="open">Offen</option>
			<option value="researching">Recherche</option>
			<option value="answered">Beantwortet</option>
			<option value="archived">Archiviert</option>
		</select>

		{#if collections.length > 0}
			<select
				bind:value={selectedCollectionId}
				class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			>
				<option value={null}>Alle Sammlungen</option>
				{#each collections as collection}
					<option value={collection.id}>{collection.name}</option>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Questions List -->
	{#if filteredQuestions.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-5xl">🔍</span>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">Keine Fragen</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Stelle deine erste Frage und lass die KI recherchieren.
			</p>
			<a
				href="/questions/new"
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				Neue Frage
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredQuestions as question (question.id)}
				{@const StatusIcon = statusIcons[question.status]?.icon || Clock}
				{@const statusColor = statusIcons[question.status]?.color || 'text-gray-500'}

				<a
					href="/questions/{question.id}"
					class="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start gap-4">
						<div class="mt-1">
							<StatusIcon
								class="h-5 w-5 {statusColor} {question.status === 'researching'
									? 'animate-spin'
									: ''}"
							/>
						</div>

						<div class="min-w-0 flex-1">
							<h3 class="font-medium text-[hsl(var(--foreground))] line-clamp-2">
								{question.title}
							</h3>

							{#if question.description}
								<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
									{question.description}
								</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-3">
								{#if question.tags?.length}
									<div class="flex gap-1">
										{#each question.tags.slice(0, 3) as tag}
											<span
												class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--foreground))]"
											>
												{tag}
											</span>
										{/each}
										{#if question.tags.length > 3}
											<span class="text-xs text-[hsl(var(--muted-foreground))]"
												>+{question.tags.length - 3}</span
											>
										{/if}
									</div>
								{/if}

								<span
									class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
								>
									{depthLabels[question.researchDepth]}
								</span>

								<span class="text-xs text-[hsl(var(--muted-foreground))]">
									{formatDate(question.createdAt)}
								</span>
							</div>
						</div>

						{#if question.priority !== 'normal'}
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium
								{question.priority === 'urgent'
									? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
									: question.priority === 'high'
										? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
										: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}"
							>
								{question.priority}
							</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
