<!--
  SkillTree — DetailView (inline editable overlay)
  Skill details with XP display and quick add XP. Auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { skillStore } from '../stores/skills.svelte';
	import { Trash, Lightning } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/components/workbench/nav-stack';
	import type { LocalSkill, SkillBranch } from '../types';
	import { BRANCH_INFO, LEVEL_NAMES, xpProgress, xpForNextLevel } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let skillId = $derived(params.skillId as string);

	let skill = $state<LocalSkill | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');
	let editDescription = $state('');
	let editBranch = $state<SkillBranch>('custom');
	let editIcon = $state('');
	let editColor = $state('');

	// Add XP
	let addXpAmount = $state(10);
	let addXpDescription = $state('');
	let levelUpMessage = $state('');

	let focused = $state(false);

	$effect(() => {
		skillId;
		confirmDelete = false;
		focused = false;
		levelUpMessage = '';
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalSkill>('skills').get(skillId)).subscribe((val) => {
			skill = val ?? null;
			if (val && !focused) {
				editName = val.name;
				editDescription = val.description ?? '';
				editBranch = val.branch;
				editIcon = val.icon ?? '';
				editColor = val.color ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await skillStore.updateSkill(skillId, {
			name: editName.trim() || skill?.name || 'Unbenannt',
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
			addXpDescription.trim() || 'Manuell hinzugefuegt'
		);
		addXpDescription = '';
		if (result.leveledUp) {
			levelUpMessage = `Level Up! ${LEVEL_NAMES[result.newLevel] ?? 'Level ' + result.newLevel}`;
			setTimeout(() => (levelUpMessage = ''), 3000);
		}
	}

	async function deleteSkill() {
		await skillStore.deleteSkill(skillId);
		goBack();
	}
</script>

<div class="detail-view">
	{#if !skill}
		<p class="empty">Skill nicht gefunden</p>
	{:else}
		<!-- Icon + Title -->
		<div class="title-row">
			<span class="title-icon">{skill.icon}</span>
			<input
				class="title-input"
				bind:value={editName}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Name..."
			/>
		</div>

		<!-- XP Progress -->
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

		<!-- Quick Add XP -->
		<div class="section">
			<span class="section-label">XP hinzufuegen</span>
			<div class="add-xp-row">
				<input type="number" class="xp-input" bind:value={addXpAmount} min="1" placeholder="XP" />
				<input class="xp-desc-input" bind:value={addXpDescription} placeholder="Beschreibung..." />
				<button class="xp-btn" onclick={handleAddXp}>
					<Lightning size={14} /> Hinzufuegen
				</button>
			</div>
		</div>

		<!-- Properties -->
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
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="z.B. &#11088;"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Farbe</span>
				<input
					class="prop-input"
					bind:value={editColor}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="z.B. #D946EF"
				/>
			</div>
		</div>

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufuegen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(skill.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if skill.updatedAt}
				<span>Bearbeitet: {new Date(skill.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Skill wirklich loeschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteSkill}>Loeschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loeschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.title-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		padding-top: 0.125rem;
	}
	.title-input {
		flex: 1;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* XP Section */
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
		color: #374151;
	}
	:global(.dark) .xp-level {
		color: #e5e7eb;
	}
	.xp-numbers {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.xp-bar {
		height: 6px;
		border-radius: 3px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}
	:global(.dark) .xp-bar {
		background: rgba(255, 255, 255, 0.1);
	}
	.xp-fill {
		height: 100%;
		border-radius: 3px;
		background: #8b5cf6;
		transition: width 0.3s ease;
	}
	.xp-total {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.level-up {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: #8b5cf6;
		color: white;
		font-size: 0.8125rem;
		font-weight: 500;
		text-align: center;
	}

	/* Add XP */
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		color: #374151;
		outline: none;
	}
	:global(.dark) .xp-input {
		color: #e5e7eb;
		border-color: rgba(255, 255, 255, 0.1);
	}
	.xp-desc-input {
		flex: 1;
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		color: #374151;
		outline: none;
	}
	.xp-desc-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .xp-desc-input {
		color: #e5e7eb;
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .xp-desc-input::placeholder {
		color: #4b5563;
	}
	.xp-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		background: #8b5cf6;
		color: white;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.15s;
	}
	.xp-btn:hover {
		opacity: 0.85;
	}

	/* Properties */
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-select,
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-select:hover,
	.prop-input:hover,
	.prop-select:focus,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-select,
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-select:hover,
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-select:focus,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
		color: #4b5563;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}
</style>
