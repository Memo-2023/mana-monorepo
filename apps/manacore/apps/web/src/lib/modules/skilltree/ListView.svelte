<!--
  SkillTree — Workbench ListView
  Skills overview with XP and levels.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalSkill, LocalActivity } from './types';
	import { LEVEL_NAMES, BRANCH_INFO, xpProgress, type SkillBranch } from './types';

	let { navigate, goBack, params }: ViewProps = $props();

	let skills = $state<LocalSkill[]>([]);
	let activities = $state<LocalActivity[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalSkill>('skills')
				.toArray()
				.then((all) => all.filter((s) => !s.deletedAt));
		}).subscribe((val) => {
			skills = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalActivity>('activities')
				.toArray()
				.then((all) => all.filter((a) => !a.deletedAt));
		}).subscribe((val) => {
			activities = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const totalXp = $derived(skills.reduce((sum, s) => sum + s.totalXp, 0));
	const highestLevel = $derived(Math.max(0, ...skills.map((s) => s.level)));
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<!-- Stats -->
	<div class="flex gap-3 text-xs text-white/40">
		<span>{totalXp} XP</span>
		<span>Level {highestLevel}</span>
		<span>{skills.length} Skills</span>
	</div>

	<!-- Skills list -->
	<div class="flex-1 overflow-auto">
		{#each skills as skill (skill.id)}
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
		{/each}

		{#if skills.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Skills angelegt</p>
		{/if}
	</div>
</div>
