<!--
  Context Overview — "Freundebuch" style profile cards.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { useUserContext } from './queries';
	import { userContextStore } from './stores/user-context.svelte';
	import { getProgress } from './questions';
	import type { UserProfile } from '$lib/api/profile';

	interface Props {
		user: UserProfile | null;
		onStartInterview: () => void;
	}

	let { user, onStartInterview }: Props = $props();

	let ctx$ = useUserContext();
	let ctx = $derived(ctx$.value);
	let progress = $derived(getProgress(ctx?.interview?.answeredIds ?? []));

	let editingField = $state<string | null>(null);
	let editValue = $state<string | string[]>('');
	let tagInput = $state('');

	onMount(() => {
		void userContextStore.ensureDoc();
	});

	function startEdit(field: string, current: unknown) {
		editingField = field;
		editValue = (current ?? '') as string | string[];
		tagInput = '';
	}
	async function saveEdit(field: string) {
		await userContextStore.setField(field, editValue);
		editingField = null;
	}
	function cancelEdit() {
		editingField = null;
	}
	function handleEditKeydown(e: KeyboardEvent, field: string) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEdit(field);
		} else if (e.key === 'Escape') cancelEdit();
	}
	function addEditTag() {
		const tag = tagInput.trim().replace(/,$/, '');
		if (!tag) return;
		const current = Array.isArray(editValue) ? editValue : [];
		if (!current.includes(tag)) editValue = [...current, tag];
		tagInput = '';
	}
	function removeEditTag(tag: string) {
		if (Array.isArray(editValue)) editValue = editValue.filter((t) => t !== tag);
	}

	const WEEKDAY_NAMES: Record<number, string> = {
		0: 'So',
		1: 'Mo',
		2: 'Di',
		3: 'Mi',
		4: 'Do',
		5: 'Fr',
		6: 'Sa',
	};
</script>

<div class="overview">
	<div class="identity-card">
		<div class="avatar-area">
			{#if user?.image}<img src={user.image} alt="Avatar" class="avatar" />
			{:else}<div class="avatar-placeholder">
					{(user?.name ?? 'U').slice(0, 2).toUpperCase()}
				</div>{/if}
		</div>
		<div class="identity-info">
			<h2 class="user-name">{user?.name ?? 'Unbekannt'}</h2>
			<p class="user-email">{user?.email ?? ''}</p>
			{#if ctx?.about?.occupation}<p class="user-meta">{ctx.about.occupation}</p>{/if}
			{#if ctx?.about?.location}<p class="user-meta">{ctx.about.location}</p>{/if}
		</div>
	</div>

	{#if progress.percent < 50}
		<button class="nudge-card" onclick={onStartInterview}>
			<div class="nudge-bar"><div class="nudge-fill" style:width="{progress.percent}%"></div></div>
			<p class="nudge-text">
				Profil zu {progress.percent}% ausgefüllt — <strong>Interview starten</strong>
			</p>
		</button>
	{/if}

	<div class="sections">
		{#if ctx?.about?.bio || editingField === 'about.bio'}
			<section class="section-card">
				<h3 class="section-title">Über mich</h3>
				{#if editingField === 'about.bio'}
					<textarea
						class="edit-textarea"
						bind:value={editValue}
						onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
						rows="3"
					></textarea>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>Abbrechen</button>
						<button class="edit-btn primary" onclick={() => saveEdit('about.bio')}>Speichern</button
						>
					</div>
				{:else}<p class="section-text" onclick={() => startEdit('about.bio', ctx?.about?.bio)}>
						{ctx?.about?.bio}
					</p>{/if}
			</section>
		{/if}

		<section class="section-card">
			<h3 class="section-title">Interessen</h3>
			{#if editingField === 'interests'}
				<div class="tags-edit">
					<div class="tags-list">
						{#each editValue as string[] as tag (tag)}<span class="tag"
								>{tag}<button class="tag-remove" onclick={() => removeEditTag(tag)}>&times;</button
								></span
							>{/each}
					</div>
					<input
						type="text"
						class="edit-input"
						bind:value={tagInput}
						placeholder="Neues Interesse + Enter"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								addEditTag();
							}
						}}
						onblur={addEditTag}
					/>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>Abbrechen</button>
						<button class="edit-btn primary" onclick={() => saveEdit('interests')}>Speichern</button
						>
					</div>
				</div>
			{:else if ctx?.interests?.length}
				<div class="tags-list" onclick={() => startEdit('interests', ctx?.interests ?? [])}>
					{#each ctx.interests as tag (tag)}<span class="tag">{tag}</span>{/each}
				</div>
			{:else}
				<button
					class="empty-hint"
					onclick={() => {
						editValue = [];
						editingField = 'interests';
					}}>Interessen hinzufügen</button
				>
			{/if}
		</section>

		{#if ctx?.routine && (ctx.routine.wakeUp || ctx.routine.workStart || ctx.routine.bedtime || ctx.routine.workDays?.length)}
			<section class="section-card">
				<h3 class="section-title">Tagesablauf</h3>
				<div class="routine-grid">
					{#if ctx.routine.wakeUp}<div class="routine-item">
							<span class="routine-label">Aufstehen</span><span class="routine-value"
								>{ctx.routine.wakeUp}</span
							>
						</div>{/if}
					{#if ctx.routine.workStart && ctx.routine.workEnd}<div class="routine-item">
							<span class="routine-label">Arbeit</span><span class="routine-value"
								>{ctx.routine.workStart} – {ctx.routine.workEnd}</span
							>
						</div>{/if}
					{#if ctx.routine.bedtime}<div class="routine-item">
							<span class="routine-label">Schlafenszeit</span><span class="routine-value"
								>{ctx.routine.bedtime}</span
							>
						</div>{/if}
					{#if ctx.routine.workDays?.length}<div class="routine-item">
							<span class="routine-label">Arbeitstage</span><span class="routine-value"
								>{ctx.routine.workDays.map((d: number) => WEEKDAY_NAMES[d]).join(', ')}</span
							>
						</div>{/if}
				</div>
			</section>
		{/if}

		{#if ctx?.nutrition && (ctx.nutrition.diet || ctx.nutrition.allergies?.length)}
			<section class="section-card">
				<h3 class="section-title">Ernährung</h3>
				{#if ctx.nutrition.diet}<p class="section-text">{ctx.nutrition.diet}</p>{/if}
				{#if ctx.nutrition.allergies?.length}<div class="tags-list">
						{#each ctx.nutrition.allergies as a (a)}<span class="tag warning">{a}</span>{/each}
					</div>{/if}
				{#if ctx.nutrition.preferences}<p class="section-detail">
						{ctx.nutrition.preferences}
					</p>{/if}
			</section>
		{/if}

		{#if ctx?.goals?.length}
			<section class="section-card">
				<h3 class="section-title">Ziele</h3>
				<div class="tags-list" onclick={() => startEdit('goals', ctx?.goals ?? [])}>
					{#each ctx.goals as goal (goal)}<span class="tag accent">{goal}</span>{/each}
				</div>
			</section>
		{/if}

		{#if ctx?.social && (ctx.social.workStyle || ctx.social.communication)}
			<section class="section-card">
				<h3 class="section-title">Arbeitsstil</h3>
				<div class="routine-grid">
					{#if ctx.social.workStyle}<div class="routine-item">
							<span class="routine-label">Arbeitsweise</span><span class="routine-value"
								>{ctx.social.workStyle}</span
							>
						</div>{/if}
					{#if ctx.social.communication}<div class="routine-item">
							<span class="routine-label">Kommunikation</span><span class="routine-value"
								>{ctx.social.communication}</span
							>
						</div>{/if}
				</div>
			</section>
		{/if}

		{#if ctx?.about?.languages?.length}
			<section class="section-card">
				<h3 class="section-title">Sprachen</h3>
				<div class="tags-list">
					{#each ctx.about.languages as lang (lang)}<span class="tag">{lang}</span>{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<style>
	.overview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.identity-card {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.avatar,
	.avatar-placeholder {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
	}
	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 1.25rem;
		font-weight: 600;
	}
	.identity-info {
		min-width: 0;
	}
	.user-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}
	.user-email,
	.user-meta {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.nudge-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px dashed hsl(var(--color-primary) / 0.4);
		border-radius: 0.75rem;
		background: hsl(var(--color-primary) / 0.04);
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s;
	}
	.nudge-card:hover {
		border-color: hsl(var(--color-primary));
	}
	.nudge-bar {
		height: 3px;
		background: hsl(var(--color-border));
		border-radius: 2px;
		overflow: hidden;
	}
	.nudge-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
	}
	.nudge-text {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.sections {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-card {
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.section-title {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.section-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		cursor: pointer;
		border-radius: 0.25rem;
		padding: 0.125rem 0;
	}
	.section-text:hover {
		background: hsl(var(--color-surface-hover));
	}
	.section-detail {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		cursor: pointer;
		border-radius: 0.25rem;
		padding: 0.125rem 0;
	}
	.tags-list:hover {
		background: hsl(var(--color-surface-hover));
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		border-radius: 999px;
		font-size: 0.75rem;
	}
	.tag.warning {
		background: hsl(var(--color-destructive, 0 84% 60%) / 0.1);
		color: hsl(var(--color-destructive, 0 84% 60%));
	}
	.tag.accent {
		background: hsl(142 71% 45% / 0.1);
		color: hsl(142 71% 45%);
	}
	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.875rem;
		height: 0.875rem;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		padding: 0;
		opacity: 0.7;
	}
	.tag-remove:hover {
		opacity: 1;
	}
	.routine-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}
	.routine-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.routine-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.routine-value {
		font-size: 0.875rem;
		font-weight: 500;
	}
	.empty-hint {
		display: block;
		width: 100%;
		padding: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		text-align: left;
	}
	.empty-hint:hover {
		border-color: hsl(var(--color-ring));
		color: hsl(var(--color-foreground));
	}
	.tags-edit {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.edit-input,
	.edit-textarea {
		width: 100%;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-ring));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-family: inherit;
		outline: none;
	}
	.edit-textarea {
		resize: vertical;
	}
	.edit-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}
	.edit-btn {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}
	.edit-btn.primary {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
</style>
