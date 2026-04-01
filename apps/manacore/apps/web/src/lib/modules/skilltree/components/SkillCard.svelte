<script lang="ts">
	import type { Skill } from '../types';
	import { BRANCH_INFO, LEVEL_NAMES, xpProgress, xpForNextLevel } from '../types';
	import { Plus, Trash, PencilSimple, Star } from '@manacore/shared-icons';

	interface Props {
		skill: Skill;
		onAddXp: () => void;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { skill, onAddXp, onEdit, onDelete }: Props = $props();

	const branchInfo = $derived(BRANCH_INFO[skill.branch]);
	const levelName = $derived(LEVEL_NAMES[skill.level]);
	const progress = $derived(xpProgress(skill.totalXp, skill.level));
	const nextLevelXp = $derived(xpForNextLevel(skill.level));
	const isMaxLevel = $derived(skill.level >= LEVEL_NAMES.length - 1);

	function getLevelColor(level: number): string {
		const colors = [
			'text-gray-400',
			'text-blue-400',
			'text-purple-400',
			'text-pink-400',
			'text-orange-400',
			'text-yellow-400',
		];
		return colors[level] ?? colors[0];
	}
</script>

<div
	class="skill-card group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 p-4"
>
	<!-- Branch Indicator -->
	<div
		class="branch-indicator absolute left-0 top-0 h-full"
		style="background-color: {branchInfo.color}"
	></div>

	<!-- Header -->
	<div class="mb-3 flex items-start justify-between pl-3">
		<div>
			<h3 class="text-lg font-semibold text-white">{skill.name}</h3>
			<p class="text-sm text-gray-400">{branchInfo.name}</p>
		</div>
		<div class="flex items-center gap-1">
			{#each Array(skill.level) as _, i}
				<Star class="h-4 w-4 fill-yellow-500 text-yellow-500" />
			{/each}
			{#each Array(5 - skill.level) as _, i}
				<Star class="h-4 w-4 text-gray-600" />
			{/each}
		</div>
	</div>

	<!-- Level Badge -->
	<div class="mb-3 pl-3">
		<span
			class="inline-flex items-center gap-1 rounded-full bg-gray-700/50 px-3 py-1 text-sm {getLevelColor(
				skill.level
			)}"
		>
			Lvl {skill.level} - {levelName}
		</span>
	</div>

	<!-- XP Progress -->
	<div class="mb-4 pl-3">
		<div class="mb-1 flex justify-between text-sm">
			<span class="text-gray-400">XP</span>
			<span class="text-gray-300">
				{skill.totalXp.toLocaleString()}
				{#if !isMaxLevel}
					/ {nextLevelXp.toLocaleString()}
				{/if}
			</span>
		</div>
		<div class="xp-bar-container h-2 rounded-full">
			<div class="xp-bar h-full rounded-full" style="width: {progress}%"></div>
		</div>
	</div>

	<!-- Description -->
	{#if skill.description}
		<p class="mb-4 pl-3 text-sm text-gray-400 line-clamp-2">{skill.description}</p>
	{/if}

	<!-- Actions -->
	<div class="flex items-center gap-2 pl-3">
		<button
			onclick={onAddXp}
			class="pulse-xp flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600/20 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
		>
			<Plus class="h-4 w-4" />
			XP hinzufügen
		</button>
		<button
			onclick={onEdit}
			class="rounded-lg bg-gray-600/20 p-2 text-gray-400 opacity-0 transition-all hover:bg-gray-600/30 hover:text-white group-hover:opacity-100"
			title="Bearbeiten"
		>
			<PencilSimple class="h-4 w-4" />
		</button>
		<button
			onclick={onDelete}
			class="rounded-lg bg-red-600/20 p-2 text-red-400 opacity-0 transition-all hover:bg-red-600/30 group-hover:opacity-100"
			title="Löschen"
		>
			<Trash class="h-4 w-4" />
		</button>
	</div>
</div>
