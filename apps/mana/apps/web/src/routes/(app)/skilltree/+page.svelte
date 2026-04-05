<script lang="ts">
	import { skillStore } from '$lib/modules/skilltree/stores/skills.svelte';
	import {
		achievementStore,
		buildAchievementStatus,
		getAchievementStats,
	} from '$lib/modules/skilltree/stores/achievements.svelte';
	import {
		useAllSkills,
		useAllActivities,
		useAllAchievements,
		filterByBranch,
		getRecentActivities,
		getSkillById,
		computeUserStats,
	} from '$lib/modules/skilltree/queries';
	import { BRANCH_INFO } from '$lib/modules/skilltree/types';
	import type { Skill, SkillBranch, AchievementUnlockResult } from '$lib/modules/skilltree/types';
	import SkillCard from '$lib/modules/skilltree/components/SkillCard.svelte';
	import AddSkillModal from '$lib/modules/skilltree/components/AddSkillModal.svelte';
	import AddXpModal from '$lib/modules/skilltree/components/AddXpModal.svelte';
	import EditSkillModal from '$lib/modules/skilltree/components/EditSkillModal.svelte';
	import LevelUpCelebration from '$lib/modules/skilltree/components/LevelUpCelebration.svelte';
	import AchievementCelebration from '$lib/modules/skilltree/components/AchievementCelebration.svelte';
	import StatsOverview from '$lib/modules/skilltree/components/StatsOverview.svelte';
	import SkillTemplates from '$lib/modules/skilltree/components/SkillTemplates.svelte';
	import {
		Plus,
		Tree,
		Lightning,
		DownloadSimple,
		UploadSimple,
		Sparkle,
		Graph,
		Trophy,
	} from '@mana/shared-icons';

	// Reactive live queries — auto-update when IndexedDB changes
	const allSkills = useAllSkills();
	const allActivities = useAllActivities();
	const allAchievementsRaw = useAllAchievements();

	// Derived values from live queries
	const skills = $derived(allSkills.value);
	const activities = $derived(allActivities.value);
	const achievements = $derived(buildAchievementStatus(allAchievementsRaw.value));
	const achievementStats = $derived(getAchievementStats(achievements));
	const userStats = $derived(computeUserStats(skills, activities));

	// Modal states
	let showAddSkillModal = $state(false);
	let showAddXpModal = $state(false);
	let showEditSkillModal = $state(false);
	let showTemplatesModal = $state(false);
	let selectedSkill = $state<Skill | null>(null);
	let selectedBranch = $state<SkillBranch | 'all'>('all');

	// Level up celebration
	let showLevelUp = $state(false);
	let levelUpSkillName = $state('');
	let levelUpNewLevel = $state(0);

	// Achievement celebration
	let showAchievementCelebration = $state(false);
	let currentAchievementUnlock = $state<AchievementUnlockResult | null>(null);

	const filteredSkills = $derived(filterByBranch(skills, selectedBranch));

	function openAddXpModal(skill: Skill) {
		selectedSkill = skill;
		showAddXpModal = true;
	}

	function openEditModal(skill: Skill) {
		selectedSkill = skill;
		showEditSkillModal = true;
	}

	function closeModals() {
		showAddXpModal = false;
		showEditSkillModal = false;
		selectedSkill = null;
	}

	function triggerLevelUp(skillName: string, newLevel: number) {
		levelUpSkillName = skillName;
		levelUpNewLevel = newLevel;
		showLevelUp = true;
	}

	function showNextAchievement() {
		const next = achievementStore.popUnlockQueue();
		if (next) {
			currentAchievementUnlock = next;
			showAchievementCelebration = true;
		} else {
			showAchievementCelebration = false;
			currentAchievementUnlock = null;
		}
	}

	async function checkAchievementsLocal(lastActivityXp?: number) {
		await achievementStore.checkLocal({
			skills,
			activities,
			userStats,
			lastActivityXp,
		});
		showNextAchievement();
	}

	async function handleAddXp(xp: number, description: string, duration?: number) {
		if (!selectedSkill) return;

		const skillName = selectedSkill.name;
		const result = await skillStore.addXp(selectedSkill.id, xp, description, duration);

		closeModals();

		if (result.leveledUp) {
			triggerLevelUp(skillName, result.newLevel);
		}

		await checkAchievementsLocal(xp);
	}

	async function handleExport() {
		const { skillTable, activityTable, achievementTable } = await import(
			'$lib/modules/skilltree/collections'
		);
		const [allSkillsData, allActivitiesData, allAchievementsData] = await Promise.all([
			skillTable.toArray(),
			activityTable.toArray(),
			achievementTable.toArray(),
		]);
		const data = {
			skills: allSkillsData,
			activities: allActivitiesData,
			achievements: allAchievementsData,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `skilltree-backup-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const data = JSON.parse(text);
				const { skillTable, activityTable, achievementTable } = await import(
					'$lib/modules/skilltree/collections'
				);
				if (data.skills) await skillTable.bulkPut(data.skills);
				if (data.activities) await activityTable.bulkPut(data.activities);
				if (data.achievements) await achievementTable.bulkPut(data.achievements);
				window.location.reload();
			} catch (error) {
				console.error('Import failed:', error);
				alert('Import fehlgeschlagen. Bitte überprüfe die Datei.');
			}
		};
		input.click();
	}
</script>

<svelte:head>
	<title>SkillTree</title>
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Tree class="h-8 w-8 text-emerald-500" />
					<h1 class="text-2xl font-bold text-white">SkillTree</h1>
				</div>
				<div class="flex items-center gap-2">
					<!-- Achievements -->
					<a
						href="/skilltree/achievements"
						class="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-yellow-400"
						title="Achievements"
					>
						<Trophy class="h-5 w-5" />
						{#if achievementStats.unlocked > 0}
							<span
								class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-gray-900"
							>
								{achievementStats.unlocked}
							</span>
						{/if}
					</a>
					<!-- Tree View -->
					<a
						href="/skilltree/tree"
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-emerald-400"
						title="Skill-Tree Ansicht"
					>
						<Graph class="h-5 w-5" />
					</a>
					<!-- Templates -->
					<button
						onclick={() => (showTemplatesModal = true)}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-yellow-500"
						title="Skill-Vorlagen"
					>
						<Sparkle class="h-5 w-5" />
					</button>
					<!-- Export/Import -->
					<button
						onclick={handleExport}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
						title="Daten exportieren"
					>
						<DownloadSimple class="h-5 w-5" />
					</button>
					<button
						onclick={handleImport}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
						title="Daten importieren"
					>
						<UploadSimple class="h-5 w-5" />
					</button>
					<!-- Add Skill -->
					<button
						onclick={() => (showAddSkillModal = true)}
						class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
					>
						<Plus class="h-5 w-5" />
						<span class="hidden sm:inline">Skill hinzufügen</span>
					</button>
				</div>
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
					class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedBranch ===
					'all'
						? 'bg-emerald-600 text-white'
						: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
				>
					Alle ({skills.length})
				</button>
				{#each Object.entries(BRANCH_INFO) as [branch, info]}
					{@const count = skills.filter((s) => s.branch === branch).length}
					{#if count > 0 || branch !== 'custom'}
						<button
							onclick={() => (selectedBranch = branch as SkillBranch)}
							class="rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedBranch ===
							branch
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
		{#if filteredSkills.length === 0}
			<div class="mt-16 text-center">
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-800"
				>
					<Tree class="h-12 w-12 text-gray-600" />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-300">Noch keine Skills</h2>
				<p class="mb-6 text-gray-500">Füge deinen ersten Skill hinzu und beginne dein Abenteuer!</p>
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
				{#each filteredSkills as skill (skill.id)}
					<SkillCard
						{skill}
						onAddXp={() => openAddXpModal(skill)}
						onEdit={() => openEditModal(skill)}
						onDelete={() => skillStore.deleteSkill(skill.id)}
					/>
				{/each}
			</div>
		{/if}

		<!-- Recent Activity -->
		{#if getRecentActivities(activities).length > 0}
			<div class="mt-12">
				<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
					<Lightning class="h-5 w-5 text-yellow-500" />
					Letzte Aktivitäten
				</h2>
				<div class="space-y-2">
					{#each getRecentActivities(activities).slice(0, 5) as activity}
						{@const skill = getSkillById(skills, activity.skillId)}
						{#if skill}
							<div class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-sm font-medium text-emerald-400"
									>
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
			await checkAchievementsLocal();
		}}
	/>
{/if}

{#if showAddXpModal && selectedSkill}
	<AddXpModal skill={selectedSkill} onClose={closeModals} onSave={handleAddXp} />
{/if}

{#if showEditSkillModal && selectedSkill}
	<EditSkillModal
		skill={selectedSkill}
		onClose={closeModals}
		onSave={async (updates) => {
			if (selectedSkill) {
				await skillStore.updateSkill(selectedSkill.id, updates);
			}
		}}
		onDelete={() => {
			if (selectedSkill) {
				skillStore.deleteSkill(selectedSkill.id);
			}
		}}
	/>
{/if}

{#if showLevelUp}
	<LevelUpCelebration
		skillName={levelUpSkillName}
		newLevel={levelUpNewLevel}
		onClose={() => (showLevelUp = false)}
	/>
{/if}

{#if showTemplatesModal}
	<SkillTemplates
		onClose={() => (showTemplatesModal = false)}
		onAddSkill={async (skill) => {
			await skillStore.addSkill(skill);
			await checkAchievementsLocal();
		}}
	/>
{/if}

{#if showAchievementCelebration && currentAchievementUnlock}
	<AchievementCelebration result={currentAchievementUnlock} onClose={showNextAchievement} />
{/if}
