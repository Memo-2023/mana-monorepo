<!--
  Recipes — ListView
  Card grid with search, tag filter, and inline creation.
-->
<script lang="ts">
	import {
		useAllRecipes,
		searchRecipes,
		filterByTag,
		filterByDifficulty,
		getAllTags,
		getTotalTime,
		formatTime,
	} from './queries';
	import { recipesStore } from './stores/recipes.svelte';
	import {
		DIFFICULTY_LABELS,
		DIFFICULTY_COLORS,
		DEFAULT_TAGS,
		UNIT_OPTIONS,
		type Difficulty,
		type Ingredient,
	} from './types';
	import type { Recipe } from './types';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { Trash, Heart, Copy, Star } from '@mana/shared-icons';
	import { VisibilityPicker } from '@mana/shared-privacy';

	let recipes$ = useAllRecipes();
	let recipes = $derived(recipes$.value);

	let searchQuery = $state('');
	let activeTag = $state<string | null>(null);
	let activeDifficulty = $state<Difficulty | null>(null);
	let showFavoritesOnly = $state(false);
	let showCreate = $state(false);
	let expandedId = $state<string | null>(null);

	// New recipe form
	let newTitle = $state('');
	let newDescription = $state('');
	let newDifficulty = $state<Difficulty>('medium');
	let newServings = $state(4);
	let newPrepTime = $state('');
	let newCookTime = $state('');
	let newTags = $state<string[]>([]);
	let newIngredients = $state<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
	let newSteps = $state<string[]>(['']);

	let allTags = $derived(getAllTags(recipes));
	let filtered = $derived.by(() => {
		let result = recipes;
		if (showFavoritesOnly) result = result.filter((r) => r.isFavorite);
		if (searchQuery) result = searchRecipes(result, searchQuery);
		if (activeTag) result = filterByTag(result, activeTag);
		if (activeDifficulty) result = filterByDifficulty(result, activeDifficulty);
		return result;
	});

	const ctxMenu = useItemContextMenu<Recipe>();
	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'favorite',
						label: ctxMenu.state.target.isFavorite ? 'Favorit entfernen' : 'Als Favorit',
						icon: Heart,
						action: () => {
							const t = ctxMenu.state.target;
							if (t) recipesStore.toggleFavorite(t.id);
						},
					},
					{
						id: 'duplicate',
						label: 'Duplizieren',
						icon: Copy,
						action: () => {
							const t = ctxMenu.state.target;
							if (t) recipesStore.duplicateRecipe(t.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const t = ctxMenu.state.target;
							if (t) recipesStore.deleteRecipe(t.id);
						},
					},
				]
			: []
	);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		await recipesStore.createRecipe({
			title: newTitle.trim(),
			description: newDescription.trim(),
			difficulty: newDifficulty,
			servings: newServings,
			prepTimeMin: newPrepTime ? parseInt(newPrepTime) : null,
			cookTimeMin: newCookTime ? parseInt(newCookTime) : null,
			tags: newTags,
			ingredients: newIngredients.filter((i) => i.name.trim()),
			steps: newSteps.filter((s) => s.trim()),
		});
		resetForm();
	}

	function resetForm() {
		newTitle = '';
		newDescription = '';
		newDifficulty = 'medium';
		newServings = 4;
		newPrepTime = '';
		newCookTime = '';
		newTags = [];
		newIngredients = [{ name: '', amount: '', unit: '' }];
		newSteps = [''];
		showCreate = false;
	}

	function addIngredientRow() {
		newIngredients = [...newIngredients, { name: '', amount: '', unit: '' }];
	}

	function removeIngredientRow(idx: number) {
		newIngredients = newIngredients.filter((_, i) => i !== idx);
	}

	function addStepRow() {
		newSteps = [...newSteps, ''];
	}

	function removeStepRow(idx: number) {
		newSteps = newSteps.filter((_, i) => i !== idx);
	}

	function toggleTag(tag: string) {
		if (newTags.includes(tag)) newTags = newTags.filter((t) => t !== tag);
		else newTags = [...newTags, tag];
	}

	function toggleExpanded(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') resetForm();
	}
</script>

<div class="recipes-view">
	<!-- Search & Filters -->
	<div class="filters">
		<input
			class="search-input"
			type="text"
			placeholder="Rezept suchen..."
			bind:value={searchQuery}
		/>
		<div class="chip-row">
			<button
				class="chip"
				class:active={showFavoritesOnly}
				onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
			>
				<Star size={12} weight={showFavoritesOnly ? 'fill' : 'regular'} />
				Favoriten
			</button>
			{#each ['easy', 'medium', 'hard'] as const as d}
				<button
					class="chip"
					class:active={activeDifficulty === d}
					onclick={() => (activeDifficulty = activeDifficulty === d ? null : d)}
				>
					<span class="diff-dot" style:background={DIFFICULTY_COLORS[d]}></span>
					{DIFFICULTY_LABELS[d].de}
				</button>
			{/each}
		</div>
		{#if allTags.length > 0}
			<div class="chip-row">
				{#each allTags as tag}
					<button
						class="chip"
						class:active={activeTag === tag}
						onclick={() => (activeTag = activeTag === tag ? null : tag)}
					>
						{tag}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recipe Cards -->
	<div class="recipe-grid">
		{#each filtered as recipe (recipe.id)}
			{@const totalTime = getTotalTime(recipe)}
			<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
			<div
				class="recipe-card"
				role="button"
				tabindex="0"
				onclick={() => toggleExpanded(recipe.id)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggleExpanded(recipe.id);
					}
				}}
				oncontextmenu={(e) => ctxMenu.open(e, recipe)}
			>
				<div class="card-photo">
					{#if recipe.photoThumbnailUrl}
						<img src={recipe.photoThumbnailUrl} alt={recipe.title} loading="lazy" />
					{:else}
						<span class="photo-emoji"
							>{recipe.difficulty === 'easy'
								? '🥘'
								: recipe.difficulty === 'medium'
									? '👨‍🍳'
									: '🔥'}</span
						>
					{/if}
					{#if recipe.isFavorite}
						<span class="fav-badge"><Star size={14} weight="fill" /></span>
					{/if}
				</div>
				<div class="card-body">
					<span class="card-title">{recipe.title}</span>
					{#if recipe.description}
						<span class="card-desc">{recipe.description}</span>
					{/if}
					<div class="card-meta">
						<span
							class="diff-badge"
							style:background="{DIFFICULTY_COLORS[recipe.difficulty]}22"
							style:color={DIFFICULTY_COLORS[recipe.difficulty]}
						>
							{DIFFICULTY_LABELS[recipe.difficulty].de}
						</span>
						{#if totalTime}<span class="meta-pill">{formatTime(totalTime)}</span>{/if}
						<span class="meta-pill">{recipe.servings} Port.</span>
					</div>
					{#if recipe.tags.length > 0}
						<div class="card-tags">
							{#each recipe.tags.slice(0, 3) as tag}<span class="mini-tag">{tag}</span>{/each}
							{#if recipe.tags.length > 3}<span class="mini-tag">+{recipe.tags.length - 3}</span
								>{/if}
						</div>
					{/if}
				</div>
			</div>

			{#if expandedId === recipe.id}
				<div class="detail-panel">
					<div class="detail-section">
						<div class="detail-heading">Sichtbarkeit</div>
						<VisibilityPicker
							level={recipe.visibility ?? 'private'}
							onChange={(next) => recipesStore.setVisibility(recipe.id, next)}
						/>
					</div>
					{#if recipe.ingredients.length > 0}
						<div class="detail-section">
							<div class="detail-heading">
								Zutaten <span class="detail-sub">({recipe.servings} Portionen)</span>
							</div>
							{#each recipe.ingredients as ing}
								<div class="ing-row">
									<span class="ing-qty">{ing.amount} {ing.unit}</span>
									<span class="ing-name">{ing.name}</span>
								</div>
							{/each}
						</div>
					{/if}
					{#if recipe.steps.length > 0}
						<div class="detail-section">
							<div class="detail-heading">Zubereitung</div>
							{#each recipe.steps as step, i}
								<div class="step-row">
									<span class="step-num">{i + 1}</span>
									<span class="step-text">{step}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/each}

		{#if !showCreate}
			<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
			<div
				class="recipe-card add-card"
				role="button"
				tabindex="0"
				onclick={() => (showCreate = true)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						showCreate = true;
					}
				}}
			>
				<span class="add-icon">+</span>
				<span class="add-label">Neues Rezept</span>
			</div>
		{/if}
	</div>

	<!-- Create Form -->
	{#if showCreate}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form class="create-form" onsubmit={handleCreate} onkeydown={handleCreateKeydown}>
			<div class="form-heading">Neues Rezept</div>
			<!-- svelte-ignore a11y_autofocus -->
			<input class="form-input" type="text" placeholder="Titel *" bind:value={newTitle} autofocus />
			<textarea
				class="form-input"
				placeholder="Beschreibung (optional)"
				bind:value={newDescription}
				rows="2"
			></textarea>

			<div class="form-grid">
				<label class="form-field">
					<span class="form-label">Schwierigkeit</span>
					<select class="form-input" bind:value={newDifficulty}>
						{#each ['easy', 'medium', 'hard'] as const as d}<option value={d}
								>{DIFFICULTY_LABELS[d].de}</option
							>{/each}
					</select>
				</label>
				<label class="form-field">
					<span class="form-label">Portionen</span>
					<input class="form-input" type="number" min="1" bind:value={newServings} />
				</label>
				<label class="form-field">
					<span class="form-label">Vorb. (Min.)</span>
					<input class="form-input" type="number" min="0" bind:value={newPrepTime} />
				</label>
				<label class="form-field">
					<span class="form-label">Koch (Min.)</span>
					<input class="form-input" type="number" min="0" bind:value={newCookTime} />
				</label>
			</div>

			<div class="form-section">
				<span class="form-label">Tags</span>
				<div class="chip-row">
					{#each DEFAULT_TAGS as tag}
						<button
							type="button"
							class="chip"
							class:active={newTags.includes(tag)}
							onclick={() => toggleTag(tag)}>{tag}</button
						>
					{/each}
				</div>
			</div>

			<div class="form-section">
				<span class="form-label">Zutaten</span>
				{#each newIngredients as ing, i}
					<div class="ing-edit-row">
						<input
							class="form-input ing-qty-input"
							type="text"
							placeholder="Menge"
							bind:value={ing.amount}
						/>
						<select class="form-input ing-unit-input" bind:value={ing.unit}>
							{#each UNIT_OPTIONS as u}<option value={u}>{u || '—'}</option>{/each}
						</select>
						<input
							class="form-input"
							type="text"
							placeholder="Zutat"
							bind:value={ing.name}
							style="flex:1"
						/>
						{#if newIngredients.length > 1}<button
								type="button"
								class="remove-btn"
								onclick={() => removeIngredientRow(i)}>×</button
							>{/if}
					</div>
				{/each}
				<button type="button" class="add-row-btn" onclick={addIngredientRow}>+ Zutat</button>
			</div>

			<div class="form-section">
				<span class="form-label">Schritte</span>
				{#each newSteps as _, i}
					<div class="step-edit-row">
						<span class="step-edit-num">{i + 1}.</span>
						<input
							class="form-input"
							type="text"
							placeholder="Schritt beschreiben..."
							bind:value={newSteps[i]}
							style="flex:1"
						/>
						{#if newSteps.length > 1}<button
								type="button"
								class="remove-btn"
								onclick={() => removeStepRow(i)}>×</button
							>{/if}
					</div>
				{/each}
				<button type="button" class="add-row-btn" onclick={addStepRow}>+ Schritt</button>
			</div>

			<div class="form-actions">
				<button type="button" class="btn-cancel" onclick={resetForm}>Abbrechen</button>
				<button type="submit" class="btn-create" disabled={!newTitle.trim()}>Erstellen</button>
			</div>
		</form>
	{/if}

	{#if filtered.length === 0 && !showCreate}
		<div class="empty">
			{#if recipes.length === 0}
				<p>Noch keine Rezepte gespeichert.</p>
				<button class="btn-create" onclick={() => (showCreate = true)}>Erstes Rezept anlegen</button
				>
			{:else}
				<p>Keine Rezepte gefunden.</p>
			{/if}
		</div>
	{/if}

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.recipes-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	/* ── Filters ──────────────────────────────────── */
	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.chip-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}
	.chip.active {
		background: hsl(var(--color-primary));
		color: white;
		border-color: hsl(var(--color-primary));
	}
	.chip:hover:not(.active) {
		background: hsl(var(--color-muted));
		border-color: hsl(var(--color-muted-foreground));
	}

	.diff-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* ── Recipe Grid ─────────────────────────────── */
	.recipe-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.recipe-card {
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		overflow: hidden;
		cursor: pointer;
		user-select: none;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
		color: hsl(var(--color-foreground));
	}
	.recipe-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.card-photo {
		position: relative;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-muted));
		overflow: hidden;
	}
	.card-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.photo-emoji {
		font-size: 2.25rem;
		line-height: 1;
	}
	.fav-badge {
		position: absolute;
		top: 0.375rem;
		right: 0.375rem;
		color: #f59e0b;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
	}

	.card-body {
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
	}

	.card-title {
		font-size: 0.8125rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: hsl(var(--color-foreground));
	}

	.card-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin-top: 0.125rem;
	}

	.diff-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 0.0625rem 0.3125rem;
		border-radius: 0.25rem;
	}
	.meta-pill {
		font-size: 0.5625rem;
		font-weight: 600;
		padding: 0.0625rem 0.3125rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}

	.card-tags {
		display: flex;
		gap: 0.1875rem;
		flex-wrap: wrap;
		margin-top: 0.125rem;
	}
	.mini-tag {
		font-size: 0.5rem;
		padding: 0rem 0.25rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}

	/* Add card */
	.add-card {
		align-items: center;
		justify-content: center;
		min-height: 180px;
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
		gap: 0.5rem;
	}
	.add-card:hover {
		border-color: hsl(var(--color-primary));
		transform: none;
		box-shadow: none;
	}
	.add-icon {
		font-size: 1.5rem;
		font-weight: 300;
		line-height: 1;
		color: hsl(var(--color-muted-foreground));
	}
	.add-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.add-card:hover .add-icon,
	.add-card:hover .add-label {
		color: hsl(var(--color-primary));
	}

	/* ── Expanded Detail ─────────────────────────── */
	.detail-panel {
		grid-column: 1 / -1;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.detail-heading {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.375rem;
	}
	.detail-sub {
		font-weight: 400;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.ing-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		padding: 0.1875rem 0;
		border-bottom: 1px solid hsl(var(--color-border) / 0.4);
	}
	.ing-qty {
		font-weight: 600;
		min-width: 3.5rem;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}
	.ing-name {
		color: hsl(var(--color-muted-foreground));
	}
	.step-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		align-items: flex-start;
		margin-bottom: 0.375rem;
	}
	.step-num {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #f97316;
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.step-text {
		color: hsl(var(--color-foreground));
		line-height: 1.4;
	}

	/* ── Create Form ─────────────────────────────── */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}
	.form-heading {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.form-input {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
		font-family: inherit;
		resize: vertical;
		width: 100%;
	}
	.form-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.form-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.form-grid {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
		flex: 1;
		min-width: 5rem;
	}
	.form-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.ing-edit-row,
	.step-edit-row {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	.ing-qty-input {
		width: 3.5rem;
	}
	.ing-unit-input {
		width: 4rem;
	}
	.step-edit-num {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		width: 1.25rem;
		text-align: right;
		flex-shrink: 0;
	}
	.remove-btn {
		background: transparent;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.125rem;
		line-height: 1;
		flex-shrink: 0;
	}
	.remove-btn:hover {
		color: #ef4444;
	}

	.add-row-btn {
		align-self: flex-start;
		padding: 0.1875rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.add-row-btn:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.btn-cancel,
	.btn-create {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-cancel:hover {
		background: hsl(var(--color-muted));
	}
	.btn-create {
		background: hsl(var(--color-primary));
		color: white;
	}
	.btn-create:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Empty ────────────────────────────────────── */
	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.recipe-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		}
		.card-photo {
			height: 80px;
		}
		.form-grid {
			flex-direction: column;
		}
	}
</style>
