<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';

	// Types
	interface FeedbackItem {
		id: string;
		title: string;
		description: string;
		votes: number;
		hasVoted: boolean;
		status: 'open' | 'planned' | 'in_progress' | 'completed';
		category: 'feature' | 'bug' | 'improvement';
		createdAt: string;
	}

	// State
	let feedbackItems = $state<FeedbackItem[]>([]);
	let loading = $state(true);
	let submitting = $state(false);
	let showForm = $state(false);
	let activeFilter = $state<'all' | 'feature' | 'bug' | 'improvement'>('all');
	let sortBy = $state<'votes' | 'newest'>('votes');

	// Form state
	let newTitle = $state('');
	let newDescription = $state('');
	let newCategory = $state<'feature' | 'bug' | 'improvement'>('feature');

	// Fetch feedback (mock data - API not implemented yet)
	async function fetchFeedback() {
		loading = true;
		try {
			// TODO: Replace with actual API call when available
			// const data = await dataService.getFeedback();
			// feedbackItems = data || [];
			feedbackItems = [
				{
					id: '1',
					title: 'Mehrseitige Geschichten',
					description: 'Längere Geschichten mit mehr als 10 Seiten erstellen können',
					votes: 42,
					hasVoted: false,
					status: 'planned',
					category: 'feature',
					createdAt: '2024-01-15'
				},
				{
					id: '2',
					title: 'Audio-Vorlesefunktion',
					description: 'Geschichten von einer KI-Stimme vorlesen lassen',
					votes: 38,
					hasVoted: true,
					status: 'in_progress',
					category: 'feature',
					createdAt: '2024-01-10'
				},
				{
					id: '3',
					title: 'Charakter-Vorlagen',
					description: 'Vorgefertigte Charakter-Templates zum Anpassen',
					votes: 25,
					hasVoted: false,
					status: 'open',
					category: 'feature',
					createdAt: '2024-01-20'
				},
				{
					id: '4',
					title: 'PDF Export',
					description: 'Geschichten als PDF herunterladen und drucken',
					votes: 31,
					hasVoted: false,
					status: 'completed',
					category: 'feature',
					createdAt: '2024-01-05'
				},
				{
					id: '5',
					title: 'Bildqualität verbessern',
					description: 'Höhere Auflösung für generierte Illustrationen',
					votes: 19,
					hasVoted: false,
					status: 'open',
					category: 'improvement',
					createdAt: '2024-01-18'
				}
			];
		} finally {
			loading = false;
		}
	}

	// Remove unused import warning
	void dataService;

	onMount(() => {
		fetchFeedback();
	});

	// Vote for feedback (local state only - API not implemented yet)
	function handleVote(feedbackId: string) {
		const item = feedbackItems.find((f) => f.id === feedbackId);
		if (!item) return;

		if (item.hasVoted) {
			item.votes--;
			item.hasVoted = false;
		} else {
			item.votes++;
			item.hasVoted = true;
		}
		feedbackItems = [...feedbackItems];
	}

	// Submit new feedback (local state only - API not implemented yet)
	function handleSubmit() {
		if (!newTitle.trim() || !newDescription.trim()) {
			toastStore.warning('Bitte fülle alle Felder aus');
			return;
		}

		submitting = true;

		// Add locally (API not implemented yet)
		const newItem: FeedbackItem = {
			id: Date.now().toString(),
			title: newTitle,
			description: newDescription,
			votes: 1,
			hasVoted: true,
			status: 'open',
			category: newCategory,
			createdAt: new Date().toISOString()
		};
		feedbackItems = [newItem, ...feedbackItems];
		toastStore.success('Feedback eingereicht!');
		showForm = false;
		newTitle = '';
		newDescription = '';
		newCategory = 'feature';
		submitting = false;
	}

	// Filter and sort
	let filteredItems = $derived(
		feedbackItems
			.filter((item) => activeFilter === 'all' || item.category === activeFilter)
			.sort((a, b) => {
				if (sortBy === 'votes') return b.votes - a.votes;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			})
	);

	// Status colors
	const statusColors: Record<string, { bg: string; text: string }> = {
		open: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
		planned: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
		in_progress: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
		completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' }
	};

	const statusLabels: Record<string, string> = {
		open: 'Offen',
		planned: 'Geplant',
		in_progress: 'In Arbeit',
		completed: 'Fertig'
	};

	const categoryLabels: Record<string, string> = {
		feature: 'Feature',
		bug: 'Bug',
		improvement: 'Verbesserung'
	};
</script>

<svelte:head>
	<title>Feedback | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Feedback & Ideen</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Stimme für Features ab und teile deine Ideen
			</p>
		</div>
		<button
			onclick={() => (showForm = true)}
			class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Idee einreichen
		</button>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<!-- Category filter -->
		<div class="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
			{#each ['all', 'feature', 'bug', 'improvement'] as filter}
				<button
					onclick={() => (activeFilter = filter as typeof activeFilter)}
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {activeFilter === filter ? 'bg-white text-gray-800 shadow dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'}"
				>
					{filter === 'all' ? 'Alle' : categoryLabels[filter]}
				</button>
			{/each}
		</div>

		<!-- Sort -->
		<select
			bind:value={sortBy}
			class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
		>
			<option value="votes">Meiste Stimmen</option>
			<option value="newest">Neueste</option>
		</select>
	</div>

	<!-- Feedback List -->
	{#if loading}
		<div class="space-y-4">
			{#each Array(5) as _}
				<div class="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else if filteredItems.length === 0}
		<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
			<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
			</svg>
			<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Noch kein Feedback</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Sei der Erste, der eine Idee teilt!
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredItems as item (item.id)}
				<div class="flex gap-4 rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
					<!-- Vote button -->
					<button
						onclick={() => handleVote(item.id)}
						class="flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors {item.hasVoted ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}"
					>
						<svg class="h-5 w-5" fill={item.hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
						</svg>
						<span class="text-sm font-semibold">{item.votes}</span>
					</button>

					<!-- Content -->
					<div class="flex-1 min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200">
								{item.title}
							</h3>
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusColors[item.status].bg} {statusColors[item.status].text}">
								{statusLabels[item.status]}
							</span>
						</div>
						<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
							{item.description}
						</p>
						<div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
							<span class="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
								{categoryLabels[item.category]}
							</span>
							<span>
								{new Date(item.createdAt).toLocaleDateString('de-DE')}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Submit Form Modal -->
	{#if showForm}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onclick={() => (showForm = false)}
			onkeydown={(e) => e.key === 'Escape' && (showForm = false)}
			role="button"
			tabindex="0"
		>
			<div
				class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Neue Idee einreichen</h2>
					<button
						onclick={() => (showForm = false)}
						class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<!-- Category -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Kategorie
						</label>
						<div class="flex gap-2">
							{#each ['feature', 'bug', 'improvement'] as cat}
								<button
									type="button"
									onclick={() => (newCategory = cat as typeof newCategory)}
									class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors {newCategory === cat ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}"
								>
									{categoryLabels[cat]}
								</button>
							{/each}
						</div>
					</div>

					<!-- Title -->
					<div>
						<label for="title" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Titel
						</label>
						<input
							id="title"
							type="text"
							bind:value={newTitle}
							placeholder="Kurze Beschreibung deiner Idee"
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Beschreibung
						</label>
						<textarea
							id="description"
							bind:value={newDescription}
							rows="4"
							placeholder="Erkläre deine Idee im Detail..."
							class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
						></textarea>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						disabled={submitting}
						class="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
					>
						{submitting ? 'Wird eingereicht...' : 'Einreichen'}
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
