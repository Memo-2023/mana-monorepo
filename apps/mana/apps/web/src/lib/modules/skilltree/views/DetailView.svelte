<!--
  SkillTree — DetailView (inline editable overlay)
  Skill details with XP display and quick add XP. Auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { skillStore } from '../stores/skills.svelte';
	import { Lightning } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalSkill, SkillBranch } from '../types';
	import { BRANCH_INFO, LEVEL_NAMES, xpProgress, xpForNextLevel } from '../types';

	let { params, goBack }: ViewProps = $props();
	let skillId = $derived(params.skillId as string);

	let editName = $state('');
	let editDescription = $state('');
	let editBranch = $state<SkillBranch>('custom');
	let editIcon = $state('');
	let editColor = $state('');

	// Add XP
	let addXpAmount = $state(10);
	let addXpDescription = $state('');
	let levelUpMessage = $state('');

	const detail = useDetailEntity<LocalSkill>({
		id: () => skillId,
		table: 'skills',
		onLoad: (val) => {
			editName = val.name;
			editDescription = val.description ?? '';
			editBranch = val.branch;
			editIcon = val.icon ?? '';
			editColor = val.color ?? '';
		},
	});

	// Reset level-up flash on skill change
	$effect(() => {
		skillId;
		levelUpMessage = '';
	});

	async function saveField() {
		detail.blur();
		await skillStore.updateSkill(skillId, {
			name: editName.trim() || detail.entity?.name || 'Unbenannt',
			description: editDescription.trim() || '',
			branch: editBranch,
			icon: editIcon.trim() || 'star',
			color: editColor.trim() || null,
		});
	}

	async function handleBranchChange() {
		await skillStore.updateSkill(skillId, { branch: editBranch });
	}

	async function handleAddXp() {
		if (addXpAmount <= 0) return;
		const result = await skillStore.addXp(
			skillId,
			addXpAmount,
			addXpDescription.trim() || 'Manuell hinzugefügt'
		);
		addXpDescription = '';
		if (result.leveledUp) {
			levelUpMessage = `Level Up! ${LEVEL_NAMES[result.newLevel] ?? 'Level ' + result.newLevel}`;
			setTimeout(() => (levelUpMessage = ''), 3000);
		}
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Skill nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Skill wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Skill gelöscht',
			delete: () => skillStore.deleteSkill(skillId),
			goBack,
		})}
>
	{#snippet body(skill)}
		<div class="title-row">
			<span class="title-icon">{skill.icon}</span>
			<input
				class="title-input"
				bind:value={editName}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Name..."
			/>
		</div>

		<div class="xp-section">
			<div class="xp-header">
				<span class="xp-level">Level {skill.level} — {LEVEL_NAMES[skill.level] ?? 'Unbekannt'}</span
				>
				<span class="xp-numbers"
					>{skill.currentXp} / {xpForNextLevel(skill.level) === Infinity
						? '∞'
						: xpForNextLevel(skill.level)} XP</span
				>
			</div>
			<div class="xp-bar">
				<div class="xp-fill" style="width: {xpProgress(skill.currentXp, skill.level)}%"></div>
			</div>
			<span class="xp-total">{skill.totalXp} XP gesamt</span>
		</div>

		{#if levelUpMessage}
			<div class="level-up">{levelUpMessage}</div>
		{/if}

		<div class="section">
			<span class="section-label">XP hinzufügen</span>
			<div class="add-xp-row">
				<input type="number" class="xp-input" bind:value={addXpAmount} min="1" placeholder="XP" />
				<input class="xp-desc-input" bind:value={addXpDescription} placeholder="Beschreibung..." />
				<button class="xp-btn" onclick={handleAddXp}>
					<Lightning size={14} /> Hinzufügen
				</button>
			</div>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Branch</span>
				<select class="prop-select" bind:value={editBranch} onchange={handleBranchChange}>
					{#each Object.entries(BRANCH_INFO) as [key, info]}
						<option value={key}>{info.name}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Icon</span>
				<input
					class="prop-input"
					bind:value={editIcon}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="z.B. ⭐"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Farbe</span>
				<input
					class="prop-input"
					bind:value={editColor}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="z.B. #D946EF"
				/>
			</div>
		</div>

		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			<span>Erstellt: {formatDate(new Date(skill.createdAt ?? ''))}</span>
			{#if skill.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(skill.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.xp-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.xp-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.xp-level {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.xp-numbers {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.xp-bar {
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}
	.xp-fill {
		height: 100%;
		border-radius: 3px;
		background: hsl(var(--color-primary));
		transition: width 0.3s ease;
	}
	.xp-total {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.level-up {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		text-align: center;
	}
	.add-xp-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}
	.xp-input {
		width: 4rem;
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.xp-desc-input {
		flex: 1;
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.xp-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.xp-btn:hover {
		opacity: 0.85;
	}
</style>
