<script lang="ts">
	import { skillStore } from '$lib/stores/skills.svelte';
	import { Trophy, Zap, Target, Flame } from 'lucide-svelte';
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<!-- Total XP -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
				<Zap class="h-6 w-6 text-yellow-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Gesamt-XP</p>
				<p class="text-2xl font-bold text-white">
					{skillStore.userStats.totalXp.toLocaleString()}
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
					{skillStore.userStats.totalSkills}
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
				<p class="text-sm text-gray-400">Höchstes Level</p>
				<p class="text-2xl font-bold text-white">
					{skillStore.userStats.highestLevel}
				</p>
			</div>
		</div>
	</div>

	<!-- Streak -->
	<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
				<Flame class="h-6 w-6 text-orange-500" />
			</div>
			<div>
				<p class="text-sm text-gray-400">Streak</p>
				<p class="text-2xl font-bold text-white">
					{skillStore.userStats.streakDays} Tage
				</p>
			</div>
		</div>
	</div>
</div>
