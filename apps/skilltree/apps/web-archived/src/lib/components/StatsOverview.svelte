<script lang="ts">
	import {
		useAllSkills,
		useAllActivities,
		useAllAchievements,
		computeUserStats,
	} from '$lib/data/queries';
	import { buildAchievementStatus, getAchievementStats } from '$lib/stores/achievements.svelte';
	import { Trophy, Lightning, Target, Fire, Medal } from '@manacore/shared-icons';

	// Reactive live queries
	const allSkills = useAllSkills();
	const allActivities = useAllActivities();
	const allAchievementsRaw = useAllAchievements();

	const userStats = $derived(computeUserStats(allSkills.value, allActivities.value));
	const achievementStats = $derived(
		getAchievementStats(buildAchievementStatus(allAchievementsRaw.value))
	);
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
	<!-- Total XP -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
				<Lightning class="h-6 w-6 text-yellow-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Gesamt-XP</p>
				<p class="text-2xl font-bold text-white">
					{userStats.totalXp.toLocaleString()}
				</p>
			</div>
		</div>
	</div>

	<!-- Total Skills -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
				<Target class="h-6 w-6 text-emerald-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Skills</p>
				<p class="text-2xl font-bold text-white">
					{userStats.totalSkills}
				</p>
			</div>
		</div>
	</div>

	<!-- Highest Level -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
				<Trophy class="h-6 w-6 text-purple-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Hochstes Level</p>
				<p class="text-2xl font-bold text-white">
					{userStats.highestLevel}
				</p>
			</div>
		</div>
	</div>

	<!-- Streak -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
				<Fire class="h-6 w-6 text-orange-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Streak</p>
				<p class="text-2xl font-bold text-white">
					{userStats.streakDays} Tage
				</p>
			</div>
		</div>
	</div>

	<!-- Achievements -->
	<a
		href="/achievements"
		class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-colors hover:border-yellow-600/50 hover:bg-yellow-900/10"
	>
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
				<Medal class="h-6 w-6 text-yellow-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Achievements</p>
				<p class="text-2xl font-bold text-white">
					{achievementStats.unlocked}<span class="text-sm font-normal text-gray-500"
						>/{achievementStats.total}</span
					>
				</p>
			</div>
		</div>
	</a>
</div>
