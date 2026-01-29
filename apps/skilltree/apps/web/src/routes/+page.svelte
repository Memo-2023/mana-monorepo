<script lang="ts">
	import { skillStore } from '$lib/stores/skills.svelte';
	import { BRANCH_INFO } from '$lib/types';
	import type { Skill, SkillBranch } from '$lib/types';
	import SkillCard from '$lib/components/SkillCard.svelte';
	import AddSkillModal from '$lib/components/AddSkillModal.svelte';
	import AddXpModal from '$lib/components/AddXpModal.svelte';
	import EditSkillModal from '$lib/components/EditSkillModal.svelte';
	import LevelUpCelebration from '$lib/components/LevelUpCelebration.svelte';
	import StatsOverview from '$lib/components/StatsOverview.svelte';
	import SkillTemplates from '$lib/components/SkillTemplates.svelte';
	import {
		Plus,
		TreeDeciduous,
		Zap,
		Download,
		Upload,
		Sparkles,
		Network,
	} from 'lucide-svelte';

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

	const filteredSkills = $derived(() => {
		if (selectedBranch === 'all') return skillStore.skills;
		return skillStore.skills.filter((s) => s.branch === selectedBranch);
	});

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

	async function handleAddXp(xp: number, description: string, duration?: number) {
		if (!selectedSkill) return;

		const skillName = selectedSkill.name;
		const result = await skillStore.addXp(selectedSkill.id, xp, description, duration);

		closeModals();

		if (result.leveledUp) {
			triggerLevelUp(skillName, result.newLevel);
		}
	}

	async function handleExport() {
		const { exportData } = await import('$lib/services/storage');
		const data = await exportData();
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
				const { importData } = await import('$lib/services/storage');
				await importData(data);
				// Reload the store
				window.location.reload();
			} catch (error) {
				console.error('Import failed:', error);
				alert('Import fehlgeschlagen. Bitte überprüfe die Datei.');
			}
		};
		input.click();
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
				<div class="flex items-center gap-2">
					<!-- Tree View -->
					<a
						href="/tree"
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-emerald-400"
						title="Skill-Tree Ansicht"
					>
						<Network class="h-5 w-5" />
					</a>
					<!-- Templates -->
					<button
						onclick={() => (showTemplatesModal = true)}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-yellow-500"
						title="Skill-Vorlagen"
					>
						<Sparkles class="h-5 w-5" />
					</button>
					<!-- Export/Import -->
					<button
						onclick={handleExport}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
						title="Daten exportieren"
					>
						<Download class="h-5 w-5" />
					</button>
					<button
						onclick={handleImport}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
						title="Daten importieren"
					>
						<Upload class="h-5 w-5" />
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
						onEdit={() => openEditModal(skill)}
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
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-sm font-medium text-emerald-400">
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

{#if showAddXpModal && selectedSkill}
	<AddXpModal
		skill={selectedSkill}
		onClose={closeModals}
		onSave={handleAddXp}
	/>
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
		}}
	/>
{/if}
