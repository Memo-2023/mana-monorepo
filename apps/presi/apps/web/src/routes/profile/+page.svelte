<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { decksStore } from '$lib/stores/decks.svelte';
	import { User, FolderOpen, Layers, Calendar, ArrowLeft } from 'lucide-svelte';

	let totalSlides = $state(0);
	let isLoading = $state(true);

	onMount(async () => {
		await decksStore.loadDecks();

		// Calculate total slides from all decks
		let slides = 0;
		for (const deck of decksStore.decks) {
			// Load each deck to get slide count
			// Note: This is a simplified approach - in production you might want an API endpoint for stats
		}

		// For now, we show deck count - slide count would require loading all decks
		isLoading = false;
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Profile - Presi</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="flex items-center gap-4 mb-8">
		<a href="/" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		</a>
		<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
			></div>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- User Info Card -->
			<div
				class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
			>
				<div class="p-8 text-center">
					<div
						class="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4"
					>
						<User class="w-10 h-10 text-primary-600 dark:text-primary-400" />
					</div>
					<h2 class="text-xl font-semibold text-slate-900 dark:text-white">
						{auth.user?.email || 'User'}
					</h2>
					<p class="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
						ID: {auth.user?.id?.slice(0, 8)}...
					</p>
				</div>
			</div>

			<!-- Stats Card -->
			<div
				class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
			>
				<div class="p-4 border-b border-slate-200 dark:border-slate-700">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Statistics</h3>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-2 gap-6">
						<!-- Total Decks -->
						<div class="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
							<div class="flex justify-center mb-2">
								<FolderOpen class="w-8 h-8 text-primary-500" />
							</div>
							<div class="text-3xl font-bold text-slate-900 dark:text-white">
								{decksStore.decks.length}
							</div>
							<div class="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Decks</div>
						</div>

						<!-- Total Slides -->
						<div class="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
							<div class="flex justify-center mb-2">
								<Layers class="w-8 h-8 text-primary-500" />
							</div>
							<div class="text-3xl font-bold text-slate-900 dark:text-white">-</div>
							<div class="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Slides</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Recent Activity -->
			{#if decksStore.decks.length > 0}
				<div
					class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
				>
					<div class="p-4 border-b border-slate-200 dark:border-slate-700">
						<h3 class="text-lg font-semibold text-slate-900 dark:text-white">
							Recent Presentations
						</h3>
					</div>
					<div class="divide-y divide-slate-200 dark:divide-slate-700">
						{#each decksStore.decks.slice(0, 5) as deck (deck.id)}
							<a
								href="/deck/{deck.id}"
								class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center"
									>
										<FolderOpen class="w-5 h-5 text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<h4 class="font-medium text-slate-900 dark:text-white">{deck.title}</h4>
										{#if deck.description}
											<p class="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
												{deck.description}
											</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
									<Calendar class="w-4 h-4" />
									{formatDate(deck.updatedAt)}
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
