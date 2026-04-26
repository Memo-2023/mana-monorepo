<!--
  Context Overview — "Freundebuch" style profile cards.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
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

	onMount(() => {});

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

	const WEEKDAY_NAMES = $derived<Record<number, string>>({
		0: $_('profile.context.weekday_0'),
		1: $_('profile.context.weekday_1'),
		2: $_('profile.context.weekday_2'),
		3: $_('profile.context.weekday_3'),
		4: $_('profile.context.weekday_4'),
		5: $_('profile.context.weekday_5'),
		6: $_('profile.context.weekday_6'),
	});

	// Enter / Space on a non-button click-target counts as activation, same
	// as a button would. Used to make the "tap a section to edit" surfaces
	// keyboard-accessible without rewriting the whole card layout.
	function onActivate(handler: () => void) {
		return (e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handler();
			}
		};
	}
</script>

<div class="overview">
	<div class="identity-card">
		<div class="avatar-area">
			{#if user?.image}<img
					src={user.image}
					alt={$_('profile.context.avatar_alt')}
					class="avatar"
				/>
			{:else}<div class="avatar-placeholder">
					{(user?.name ?? '?').slice(0, 2).toUpperCase()}
				</div>{/if}
		</div>
		<div class="identity-info">
			<h2 class="user-name">{user?.name ?? $_('profile.context.unknown_user')}</h2>
			<p class="user-email">{user?.email ?? ''}</p>
			{#if ctx?.about?.occupation}<p class="user-meta">{ctx.about.occupation}</p>{/if}
			{#if ctx?.about?.location}<p class="user-meta">{ctx.about.location}</p>{/if}
		</div>
	</div>

	{#if progress.percent < 50}
		<button class="nudge-card" onclick={onStartInterview}>
			<div class="nudge-bar"><div class="nudge-fill" style:width="{progress.percent}%"></div></div>
			<p class="nudge-text">
				{$_('profile.context.nudge_pre', { values: { percent: progress.percent } })}<strong
					>{$_('profile.context.nudge_action')}</strong
				>
			</p>
		</button>
	{/if}

	<div class="sections">
		{#if ctx?.about?.bio || editingField === 'about.bio'}
			<section class="section-card">
				<h3 class="section-title">{$_('profile.context.section_about')}</h3>
				{#if editingField === 'about.bio'}
					<textarea
						class="edit-textarea"
						bind:value={editValue}
						onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
						rows="3"
					></textarea>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>{$_('profile.cancel')}</button>
						<button class="edit-btn primary" onclick={() => saveEdit('about.bio')}
							>{$_('profile.save')}</button
						>
					</div>
				{:else}<div
						class="section-text"
						role="button"
						tabindex="0"
						onclick={() => startEdit('about.bio', ctx?.about?.bio)}
						onkeydown={onActivate(() => startEdit('about.bio', ctx?.about?.bio))}
					>
						{ctx?.about?.bio}
					</div>{/if}
			</section>
		{/if}

		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_interests')}</h3>
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
						placeholder={$_('profile.context.ph_interest')}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								addEditTag();
							}
						}}
						onblur={addEditTag}
					/>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>{$_('profile.cancel')}</button>
						<button class="edit-btn primary" onclick={() => saveEdit('interests')}
							>{$_('profile.save')}</button
						>
					</div>
				</div>
			{:else if ctx?.interests?.length}
				<div
					class="tags-list"
					role="button"
					tabindex="0"
					onclick={() => startEdit('interests', ctx?.interests ?? [])}
					onkeydown={onActivate(() => startEdit('interests', ctx?.interests ?? []))}
				>
					{#each ctx.interests as tag (tag)}<span class="tag">{tag}</span>{/each}
				</div>
			{:else}
				<button
					class="empty-hint"
					onclick={() => {
						editValue = [];
						editingField = 'interests';
					}}>{$_('profile.context.add_interests')}</button
				>
			{/if}
		</section>

		<!-- Routine -->
		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_routine')}</h3>
			{#if ctx?.routine && (ctx.routine.wakeUp || ctx.routine.workStart || ctx.routine.bedtime)}
				<div
					class="routine-grid"
					role="button"
					tabindex="0"
					onclick={() => onStartInterview()}
					onkeydown={onActivate(() => onStartInterview())}
				>
					{#if ctx.routine.wakeUp}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.routine_wake')}</span><span
								class="routine-value">{ctx.routine.wakeUp}</span
							>
						</div>{/if}
					{#if ctx.routine.workStart && ctx.routine.workEnd}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.routine_work')}</span><span
								class="routine-value">{ctx.routine.workStart} – {ctx.routine.workEnd}</span
							>
						</div>{/if}
					{#if ctx.routine.bedtime}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.routine_bedtime')}</span><span
								class="routine-value">{ctx.routine.bedtime}</span
							>
						</div>{/if}
					{#if ctx.routine.workDays?.length}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.routine_workdays')}</span><span
								class="routine-value"
								>{ctx.routine.workDays.map((d: number) => WEEKDAY_NAMES[d]).join(', ')}</span
							>
						</div>{/if}
				</div>
			{:else}
				<button class="empty-hint" onclick={onStartInterview}
					>{$_('profile.context.empty_routine')}</button
				>
			{/if}
		</section>

		<!-- Nutrition -->
		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_nutrition')}</h3>
			{#if ctx?.nutrition && (ctx.nutrition.diet || ctx.nutrition.allergies?.length)}
				<div>
					{#if ctx.nutrition.diet}<div
							class="section-text"
							role="button"
							tabindex="0"
							onclick={() => onStartInterview()}
							onkeydown={onActivate(() => onStartInterview())}
						>
							{ctx.nutrition.diet}
						</div>{/if}
					{#if ctx.nutrition.allergies?.length}
						{#if editingField === 'nutrition.allergies'}
							<div class="tags-edit">
								<div class="tags-list">
									{#each editValue as string[] as tag (tag)}<span class="tag warning"
											>{tag}<button class="tag-remove" onclick={() => removeEditTag(tag)}
												>&times;</button
											></span
										>{/each}
								</div>
								<input
									type="text"
									class="edit-input"
									bind:value={tagInput}
									placeholder={$_('profile.context.ph_allergy')}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ',') {
											e.preventDefault();
											addEditTag();
										}
									}}
									onblur={addEditTag}
								/>
								<div class="edit-actions">
									<button class="edit-btn" onclick={cancelEdit}>{$_('profile.cancel')}</button>
									<button class="edit-btn primary" onclick={() => saveEdit('nutrition.allergies')}
										>{$_('profile.save')}</button
									>
								</div>
							</div>
						{:else}
							<div
								class="tags-list"
								role="button"
								tabindex="0"
								onclick={() => startEdit('nutrition.allergies', ctx?.nutrition?.allergies ?? [])}
								onkeydown={onActivate(() =>
									startEdit('nutrition.allergies', ctx?.nutrition?.allergies ?? [])
								)}
							>
								{#each ctx.nutrition.allergies as a (a)}<span class="tag warning">{a}</span>{/each}
							</div>
						{/if}
					{/if}
					{#if ctx.nutrition.preferences}<p class="section-detail">
							{ctx.nutrition.preferences}
						</p>{/if}
				</div>
			{:else}
				<button class="empty-hint" onclick={onStartInterview}
					>{$_('profile.context.empty_nutrition')}</button
				>
			{/if}
		</section>

		<!-- Leisure -->
		{#if ctx?.leisure && (ctx.leisure.media?.length || ctx.leisure.sports?.length || ctx.leisure.pets)}
			<section class="section-card">
				<h3 class="section-title">{$_('profile.context.section_leisure')}</h3>
				{#if ctx.leisure.sports?.length}
					<div class="sub-section">
						<span class="routine-label">{$_('profile.context.leisure_sports')}</span>
						<div
							class="tags-list"
							role="button"
							tabindex="0"
							onclick={() => startEdit('leisure.sports', ctx?.leisure?.sports ?? [])}
							onkeydown={onActivate(() => startEdit('leisure.sports', ctx?.leisure?.sports ?? []))}
						>
							{#each ctx.leisure.sports as s (s)}<span class="tag">{s}</span>{/each}
						</div>
					</div>
				{/if}
				{#if ctx.leisure.media?.length}
					<div class="sub-section">
						<span class="routine-label">{$_('profile.context.leisure_media')}</span>
						<div
							class="tags-list"
							role="button"
							tabindex="0"
							onclick={() => startEdit('leisure.media', ctx?.leisure?.media ?? [])}
							onkeydown={onActivate(() => startEdit('leisure.media', ctx?.leisure?.media ?? []))}
						>
							{#each ctx.leisure.media as m (m)}<span class="tag">{m}</span>{/each}
						</div>
					</div>
				{/if}
				{#if ctx.leisure.pets}
					<div class="sub-section">
						<span class="routine-label">{$_('profile.context.leisure_pets')}</span>
						<span
							class="section-text"
							role="button"
							tabindex="0"
							onclick={() => startEdit('leisure.pets', ctx?.leisure?.pets ?? '')}
							onkeydown={onActivate(() => startEdit('leisure.pets', ctx?.leisure?.pets ?? ''))}
							>{ctx.leisure.pets}</span
						>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Goals -->
		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_goals')}</h3>
			{#if editingField === 'goals'}
				<div class="tags-edit">
					<div class="tags-list">
						{#each editValue as string[] as tag (tag)}<span class="tag accent"
								>{tag}<button class="tag-remove" onclick={() => removeEditTag(tag)}>&times;</button
								></span
							>{/each}
					</div>
					<input
						type="text"
						class="edit-input"
						bind:value={tagInput}
						placeholder={$_('profile.context.ph_goal')}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								addEditTag();
							}
						}}
						onblur={addEditTag}
					/>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>{$_('profile.cancel')}</button>
						<button class="edit-btn primary" onclick={() => saveEdit('goals')}
							>{$_('profile.save')}</button
						>
					</div>
				</div>
			{:else if ctx?.goals?.length}
				<div
					class="tags-list"
					role="button"
					tabindex="0"
					onclick={() => startEdit('goals', ctx?.goals ?? [])}
					onkeydown={onActivate(() => startEdit('goals', ctx?.goals ?? []))}
				>
					{#each ctx.goals as goal (goal)}<span class="tag accent">{goal}</span>{/each}
				</div>
			{:else}
				<button
					class="empty-hint"
					onclick={() => {
						editValue = [];
						editingField = 'goals';
					}}>{$_('profile.context.add_goals')}</button
				>
			{/if}
		</section>

		<!-- Social / Work style -->
		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_work')}</h3>
			{#if ctx?.social && (ctx.social.workStyle || ctx.social.communication || ctx.social.livingSetup)}
				<div
					class="routine-grid"
					role="button"
					tabindex="0"
					onclick={() => onStartInterview()}
					onkeydown={onActivate(() => onStartInterview())}
				>
					{#if ctx.social.workStyle}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.social_workstyle')}</span><span
								class="routine-value">{ctx.social.workStyle}</span
							>
						</div>{/if}
					{#if ctx.social.communication}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.social_communication')}</span><span
								class="routine-value">{ctx.social.communication}</span
							>
						</div>{/if}
					{#if ctx.social.livingSetup}<div class="routine-item">
							<span class="routine-label">{$_('profile.context.social_living')}</span><span
								class="routine-value">{ctx.social.livingSetup}</span
							>
						</div>{/if}
				</div>
			{:else}
				<button class="empty-hint" onclick={onStartInterview}
					>{$_('profile.context.empty_work')}</button
				>
			{/if}
		</section>

		<!-- Languages -->
		<section class="section-card">
			<h3 class="section-title">{$_('profile.context.section_languages')}</h3>
			{#if editingField === 'about.languages'}
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
						placeholder={$_('profile.context.ph_language')}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								addEditTag();
							}
						}}
						onblur={addEditTag}
					/>
					<div class="edit-actions">
						<button class="edit-btn" onclick={cancelEdit}>{$_('profile.cancel')}</button>
						<button class="edit-btn primary" onclick={() => saveEdit('about.languages')}
							>{$_('profile.save')}</button
						>
					</div>
				</div>
			{:else if ctx?.about?.languages?.length}
				<div
					class="tags-list"
					role="button"
					tabindex="0"
					onclick={() => startEdit('about.languages', ctx?.about?.languages ?? [])}
					onkeydown={onActivate(() => startEdit('about.languages', ctx?.about?.languages ?? []))}
				>
					{#each ctx.about.languages as lang (lang)}<span class="tag">{lang}</span>{/each}
				</div>
			{:else}
				<button
					class="empty-hint"
					onclick={() => {
						editValue = [];
						editingField = 'about.languages';
					}}>{$_('profile.context.add_languages')}</button
				>
			{/if}
		</section>
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
	.sub-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.25rem 0;
	}
	.sub-section + .sub-section {
		border-top: 1px solid hsl(var(--color-border) / 0.5);
		padding-top: 0.5rem;
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
