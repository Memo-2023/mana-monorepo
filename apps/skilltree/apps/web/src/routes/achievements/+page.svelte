<script lang="ts">
	import { useAllAchievements } from '$lib/data/queries';
	import {
		buildAchievementStatus,
		getAchievementStats,
		getCompletionPercentage,
	} from '$lib/stores/achievements.svelte';
	import { ACHIEVEMENT_CATEGORY_INFO, RARITY_INFO } from '$lib/types';
	import type { AchievementCategory } from '$lib/types';
	import AchievementCard from '$lib/components/AchievementCard.svelte';
	import { ArrowLeft, Trophy, Star } from '@manacore/shared-icons';

	// Reactive live query
	const allAchievementsRaw = useAllAchievements();
	const achievements = $derived(buildAchievementStatus(allAchievementsRaw.value));
	const stats = $derived(getAchievementStats(achievements));
	const completion = $derived(getCompletionPercentage(achievements));

	let selectedCategory = $state<AchievementCategory | 'all'>('all');
	let showOnlyUnlocked = $state(false);

	const filteredAchievements = $derived(() => {
		let list = achievements;
		if (selectedCategory !== 'all') {
			list = list.filter((a) => a.category === selectedCategory);
		}
		if (showOnlyUnlocked) {
			list = list.filter((a) => a.unlocked);
		}
		return list.sort((a, b) => a.sortOrder - b.sortOrder);
	});

	const categoryEntries = Object.entries(ACHIEVEMENT_CATEGORY_INFO) as [
		AchievementCategory,
		{ name: string; icon: string },
	][];
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href="/"
						class="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
					>
						<ArrowLeft class="h-5 w-5" />
					</a>
					<Trophy class="h-7 w-7 text-yellow-400" />
					<h1 class="text-2xl font-bold text-white">Achievements</h1>
				</div>

				<!-- Stats badge -->
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2">
						<Trophy class="h-4 w-4 text-yellow-400" />
						<span class="font-semibold text-yellow-400">
							{stats.unlocked} / {stats.total}
						</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8">
		<!-- Progress overview -->
		<div class="mb-8 rounded-xl border border-gray-700 bg-gray-800/50 p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-lg font-semibold text-white">Fortschritt</h2>
				<span class="text-2xl font-bold text-yellow-400">{completion}%</span>
			</div>
			<div class="h-3 overflow-hidden rounded-full bg-gray-700">
				<div
					class="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
					style="width: {completion}%"
				></div>
			</div>
			<div class="mt-3 flex flex-wrap gap-4 text-sm">
				{#each Object.entries(RARITY_INFO) as [rarity, info]}
					{@const count = achievements.filter((a) => a.rarity === rarity && a.unlocked).length}
					{@const total = achievements.filter((a) => a.rarity === rarity).length}
					<span class="flex items-center gap-1.5 {info.color}">
						<Star class="h-3 w-3" />
						{info.name}: {count}/{total}
					</span>
				{/each}
			</div>
		</div>

		<!-- Filters -->
		<div class="mb-6 flex flex-wrap items-center gap-2">
			<button
				onclick={() => (selectedCategory = 'all')}
				class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedCategory ===
				'all'
					? 'bg-yellow-500 text-gray-900'
					: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
			>
				Alle ({achievements.length})
			</button>
			{#each categoryEntries as [category, info]}
				{@const count = achievements.filter((a) => a.category === category).length}
				<button
					onclick={() => (selectedCategory = category)}
					class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedCategory ===
					category
						? 'bg-yellow-500 text-gray-900'
						: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
				>
					{info.name} ({count})
				</button>
			{/each}

			<div class="ml-auto">
				<button
					onclick={() => (showOnlyUnlocked = !showOnlyUnlocked)}
					class="rounded-full px-4 py-2 text-sm font-medium transition-colors {showOnlyUnlocked
						? 'bg-yellow-500/20 text-yellow-400'
						: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
				>
					{showOnlyUnlocked ? 'Nur freigeschaltete' : 'Alle zeigen'}
				</button>
			</div>
		</div>

		<!-- Achievement grid -->
		{#if filteredAchievements().length === 0}
			<div class="mt-16 text-center">
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-800"
				>
					<Trophy class="h-12 w-12 text-gray-600" />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-300">Keine Achievements gefunden</h2>
				<p class="text-gray-500">
					{showOnlyUnlocked
						? 'Du hast in dieser Kategorie noch keine Achievements freigeschaltet.'
						: 'Keine Achievements in dieser Kategorie.'}
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredAchievements() as achievement (achievement.id)}
					<AchievementCard {achievement} />
				{/each}
			</div>
		{/if}
	</main>
</div>
