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
	import { skillStore } from './stores/skills.svelte';

	let { navigate }: ViewProps = $props();

	const skillsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalSkill>('skills').toArray();
		return all.filter((s) => !s.deletedAt);
	}, [] as LocalSkill[]);

	const skills = $derived(skillsQuery.value);

	const totalXp = $derived(skills.reduce((sum, s) => sum + s.totalXp, 0));
	const highestLevel = $derived(Math.max(0, ...skills.map((s) => s.level)));

	const branches = Object.entries(BRANCH_INFO) as [
		SkillBranch,
		(typeof BRANCH_INFO)[SkillBranch],
	][];

	let creating = $state(false);
	let newName = $state('');
	let newBranch = $state<SkillBranch>('custom');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		const skill = await skillStore.addSkill({ name, branch: newBranch });
		newName = '';
		newBranch = 'custom';
		creating = false;
		navigate('detail', {
			skillId: skill.id,
			_siblingIds: [...skills.map((s) => s.id), skill.id],
			_siblingKey: 'skillId',
		});
	}
</script>

<BaseListView items={skills} getKey={(s) => s.id} emptyTitle="Keine Skills angelegt">
	{#snippet toolbar()}
		<div class="flex items-center justify-between">
			<span class="text-xs text-[hsl(var(--color-muted-foreground))]"
				>{totalXp} XP · Level {highestLevel}</span
			>
			<button
				type="button"
				class="text-xs text-[hsl(var(--color-muted-foreground))] transition-colors hover:text-[hsl(var(--color-foreground))]"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neuer Skill'}
			</button>
		</div>

		{#if creating}
			<form
				class="flex flex-col gap-2 rounded-lg bg-[hsl(var(--color-foreground)/0.05)] p-3"
				onsubmit={handleCreate}
			>
				<input
					type="text"
					bind:value={newName}
					placeholder="Skill-Name (z. B. Gitarre, Python, Kochen)"
					required
					class="rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-foreground)/0.05)] px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground)/0.5)] focus:border-[hsl(var(--color-border))] focus:outline-none"
				/>
				<select
					bind:value={newBranch}
					class="rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-foreground)/0.05)] px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))] focus:border-[hsl(var(--color-border))] focus:outline-none"
				>
					{#each branches as [key, info] (key)}
						<option value={key}>{info.name}</option>
					{/each}
				</select>
				<button
					type="submit"
					class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newName.trim()}
				>
					Skill anlegen
				</button>
			</form>
		{/if}
	{/snippet}

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
			class="mb-2 w-full rounded-md border border-[hsl(var(--color-border))] px-3 py-2.5 text-left transition-colors hover:bg-[hsl(var(--color-foreground)/0.05)] min-h-[44px]"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-sm">{skill.icon}</span>
					<p class="text-sm font-medium text-[hsl(var(--color-foreground)/0.8)]">{skill.name}</p>
				</div>
				<span class="text-xs text-[hsl(var(--color-muted-foreground))]">Lv. {skill.level}</span>
			</div>
			<div class="mt-1 flex items-center gap-2">
				<div class="h-1 flex-1 rounded-full bg-[hsl(var(--color-foreground)/0.1)]">
					<div
						class="h-full rounded-full bg-[hsl(var(--color-foreground)/0.3)]"
						style="width: {progress}%"
					></div>
				</div>
				<span class="text-[10px] text-[hsl(var(--color-muted-foreground))]"
					>{skill.currentXp} XP</span
				>
			</div>
			<p class="mt-0.5 text-[10px] text-[hsl(var(--color-muted-foreground))]">
				{branch?.name ?? skill.branch} — {LEVEL_NAMES[skill.level] ?? 'Unbekannt'}
			</p>
		</button>
	{/snippet}
</BaseListView>
