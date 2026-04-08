<!--
  SkillTree — Workbench ListView
  Skills overview with XP and levels.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalSkill } from './types';
	import { LEVEL_NAMES, BRANCH_INFO, xpProgress, type SkillBranch } from './types';

	let { navigate }: ViewProps = $props();

	const skillsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalSkill>('skills').toArray();
		return all.filter((s) => !s.deletedAt);
	}, [] as LocalSkill[]);

	const skills = $derived(skillsQuery.value);

	const totalXp = $derived(skills.reduce((sum, s) => sum + s.totalXp, 0));
	const highestLevel = $derived(Math.max(0, ...skills.map((s) => s.level)));
</script>

<BaseListView items={skills} getKey={(s) => s.id} emptyTitle="Keine Skills angelegt">
	{#snippet header()}
		<span>{totalXp} XP</span>
		<span>Level {highestLevel}</span>
		<span>{skills.length} Skills</span>
	{/snippet}

	{#snippet item(skill)}
		{@const branch = BRANCH_INFO[skill.branch as SkillBranch]}
		{@const progress = xpProgress(skill.currentXp, skill.level)}
		<button
			onclick={() =>
				navigate('detail', {
					skillId: skill.id,
					_siblingIds: skills.map((s) => s.id),
					_siblingKey: 'skillId',
				})}
			class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5 min-h-[44px]"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-sm">{skill.icon}</span>
					<p class="text-sm font-medium text-white/80">{skill.name}</p>
				</div>
				<span class="text-xs text-white/50">Lv. {skill.level}</span>
			</div>
			<div class="mt-1 flex items-center gap-2">
				<div class="h-1 flex-1 rounded-full bg-white/10">
					<div class="h-full rounded-full bg-white/30" style="width: {progress}%"></div>
				</div>
				<span class="text-[10px] text-white/30">{skill.currentXp} XP</span>
			</div>
			<p class="mt-0.5 text-[10px] text-white/30">
				{branch?.name ?? skill.branch} — {LEVEL_NAMES[skill.level] ?? 'Unbekannt'}
			</p>
		</button>
	{/snippet}
</BaseListView>
