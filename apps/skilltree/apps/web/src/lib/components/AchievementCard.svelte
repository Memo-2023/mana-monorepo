<script lang="ts">
	import type { AchievementWithStatus } from '$lib/types';
	import { RARITY_INFO } from '$lib/types';
	import { Trophy, Lock, Star } from '@manacore/shared-icons';

	interface Props {
		achievement: AchievementWithStatus;
	}

	let { achievement }: Props = $props();

	const rarity = $derived(RARITY_INFO[achievement.rarity]);
	const progressPercent = $derived(
		achievement.unlocked
			? 100
			: Math.round((achievement.progress / achievement.condition.threshold) * 100)
	);
</script>

<div
	class="relative rounded-xl border p-4 transition-all duration-200 {achievement.unlocked
		? `${rarity.bgColor} ${rarity.borderColor}`
		: 'border-gray-700/50 bg-gray-800/30'} {achievement.unlocked
		? 'hover:-translate-y-0.5 hover:shadow-lg'
		: 'opacity-70'}"
>
	<!-- Rarity indicator -->
	<div class="absolute right-3 top-3">
		<span class="rounded-full px-2 py-0.5 text-xs font-medium {rarity.color} {rarity.bgColor}">
			{rarity.name}
		</span>
	</div>

	<div class="flex items-start gap-3">
		<!-- Icon -->
		<div
			class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full {achievement.unlocked
				? 'bg-yellow-500/20'
				: 'bg-gray-700/50'}"
		>
			{#if achievement.unlocked}
				<Trophy class="h-6 w-6 text-yellow-400" />
			{:else}
				<Lock class="h-6 w-6 text-gray-500" />
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<!-- Name -->
			<h3 class="font-semibold {achievement.unlocked ? 'text-white' : 'text-gray-400'}">
				{achievement.name}
			</h3>

			<!-- Description -->
			<p class="mt-0.5 text-sm {achievement.unlocked ? 'text-gray-300' : 'text-gray-500'}">
				{achievement.description}
			</p>

			<!-- Progress bar (if not unlocked) -->
			{#if !achievement.unlocked}
				<div class="mt-2">
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>{achievement.progress} / {achievement.condition.threshold}</span>
						<span>{progressPercent}%</span>
					</div>
					<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-700">
						<div
							class="h-full rounded-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-300"
							style="width: {progressPercent}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- XP reward + unlock date -->
			<div class="mt-2 flex items-center gap-3 text-xs">
				<span
					class="flex items-center gap-1 {achievement.unlocked
						? 'text-yellow-400'
						: 'text-gray-500'}"
				>
					<Star class="h-3 w-3" />
					+{achievement.xpReward} XP
				</span>
				{#if achievement.unlocked && achievement.unlockedAt}
					<span class="text-gray-500">
						{new Date(achievement.unlockedAt).toLocaleDateString('de-DE')}
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>
