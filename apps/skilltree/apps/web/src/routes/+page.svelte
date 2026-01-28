<script lang="ts">
	import { skillStore } from '$lib/stores/skills.svelte';
	import { BRANCH_INFO, LEVEL_NAMES, xpProgress, xpForNextLevel } from '$lib/types';
	import type { Skill, SkillBranch } from '$lib/types';
	import SkillCard from '$lib/components/SkillCard.svelte';
	import AddSkillModal from '$lib/components/AddSkillModal.svelte';
	import AddXpModal from '$lib/components/AddXpModal.svelte';
	import StatsOverview from '$lib/components/StatsOverview.svelte';
	import {
		Plus,
		TreeDeciduous,
		Trophy,
		Zap,
		TrendingUp,
	} from 'lucide-svelte';

	let showAddSkillModal = $state(false);
	let showAddXpModal = $state(false);
	let selectedSkillForXp = $state<Skill | null>(null);
	let selectedBranch = $state<SkillBranch | 'all'>('all');

	const filteredSkills = $derived(() => {
		if (selectedBranch === 'all') return skillStore.skills;
		return skillStore.skills.filter((s) => s.branch === selectedBranch);
	});

	function openAddXpModal(skill: Skill) {
		selectedSkillForXp = skill;
		showAddXpModal = true;
	}

	function closeAddXpModal() {
		showAddXpModal = false;
		selectedSkillForXp = null;
	}
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<TreeDeciduous class="h-8 w-8 text-emerald-500" />
					<h1 class="text-2xl font-bold text-white">SkillTree</h1>
				</div>
				<button
					onclick={() => (showAddSkillModal = true)}
					class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
				>
					<Plus class="h-5 w-5" />
					Skill hinzufügen
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8">
		<!-- Stats Overview -->
		<StatsOverview />

		<!-- Branch Filter -->
		<div class="mb-6 mt-8">
			<div class="flex flex-wrap gap-2">
				<button
					onclick={() => (selectedBranch = 'all')}
					class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedBranch === 'all'
						? 'bg-emerald-600 text-white'
						: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
				>
					Alle ({skillStore.skills.length})
				</button>
				{#each Object.entries(BRANCH_INFO) as [branch, info]}
					{@const count = skillStore.skills.filter((s) => s.branch === branch).length}
					{#if count > 0 || branch !== 'custom'}
						<button
							onclick={() => (selectedBranch = branch as SkillBranch)}
							class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedBranch === branch
								? 'bg-emerald-600 text-white'
								: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
						>
							{info.name} ({count})
						</button>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Skills Grid -->
		{#if filteredSkills().length === 0}
			<div class="mt-16 text-center">
				<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-800">
					<TreeDeciduous class="h-12 w-12 text-gray-600" />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-300">Noch keine Skills</h2>
				<p class="mb-6 text-gray-500">
					Füge deinen ersten Skill hinzu und beginne dein Abenteuer!
				</p>
				<button
					onclick={() => (showAddSkillModal = true)}
					class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500"
				>
					<Plus class="h-5 w-5" />
					Ersten Skill erstellen
				</button>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredSkills() as skill (skill.id)}
					<SkillCard
						{skill}
						onAddXp={() => openAddXpModal(skill)}
						onEdit={() => {}}
						onDelete={() => skillStore.deleteSkill(skill.id)}
					/>
				{/each}
			</div>
		{/if}

		<!-- Recent Activity -->
		{#if skillStore.recentActivities().length > 0}
			<div class="mt-12">
				<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
					<Zap class="h-5 w-5 text-yellow-500" />
					Letzte Aktivitäten
				</h2>
				<div class="space-y-2">
					{#each skillStore.recentActivities().slice(0, 5) as activity}
						{@const skill = skillStore.getSkill(activity.skillId)}
						{#if skill}
							<div class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3">
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400">
										+{activity.xpEarned}
									</div>
									<div>
										<span class="font-medium text-white">{skill.name}</span>
										<span class="text-gray-400"> - {activity.description}</span>
									</div>
								</div>
								<span class="text-sm text-gray-500">
									{new Date(activity.timestamp).toLocaleDateString('de-DE')}
								</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</main>
</div>

<!-- Modals -->
{#if showAddSkillModal}
	<AddSkillModal
		onClose={() => (showAddSkillModal = false)}
		onSave={async (skill) => {
			await skillStore.addSkill(skill);
			showAddSkillModal = false;
		}}
	/>
{/if}

{#if showAddXpModal && selectedSkillForXp}
	<AddXpModal
		skill={selectedSkillForXp}
		onClose={closeAddXpModal}
		onSave={async (xp, description, duration) => {
			if (selectedSkillForXp) {
				const result = await skillStore.addXp(selectedSkillForXp.id, xp, description, duration);
				if (result.leveledUp) {
					// Could show a level-up celebration here
				}
			}
			closeAddXpModal();
		}}
	/>
{/if}
