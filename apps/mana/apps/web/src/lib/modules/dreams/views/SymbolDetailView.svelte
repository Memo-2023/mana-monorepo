<!--
  Dreams — Symbol detail
  Editable name + meaning + color, mood distribution, co-occurring symbols, dream list.
-->
<script lang="ts">
	import {
		formatDreamDate,
		getCooccurringSymbols,
		getDreamsWithSymbol,
		getMoodDistribution,
		useAllDreams,
		useAllDreamSymbols,
	} from '../queries';
	import { dreamsStore } from '../stores/dreams.svelte';
	import { MOOD_COLORS, type Dream, type DreamMood } from '../types';
	import { _ } from 'svelte-i18n';

	let {
		symbolId,
		onBack,
		onSelectSymbol,
		onOpenDream,
	}: {
		symbolId: string;
		onBack: () => void;
		onSelectSymbol?: (id: string) => void;
		onOpenDream?: (dream: Dream) => void;
	} = $props();

	let symbols$ = useAllDreamSymbols();
	let dreams$ = useAllDreams();

	let symbols = $derived(symbols$.value);
	let dreams = $derived(dreams$.value);
	let symbol = $derived(symbols.find((s) => s.id === symbolId));

	// Local edit buffer
	let editName = $state('');
	let editMeaning = $state('');
	let editColor = $state<string>('#6366f1');
	let lastInitId = $state<string | null>(null);

	$effect(() => {
		if (symbol && lastInitId !== symbol.id) {
			editName = symbol.name;
			editMeaning = symbol.meaning ?? '';
			editColor = symbol.color ?? '#6366f1';
			lastInitId = symbol.id;
		}
	});

	let dirty = $derived(
		symbol !== undefined &&
			(editName !== symbol.name ||
				editMeaning !== (symbol.meaning ?? '') ||
				editColor !== (symbol.color ?? '#6366f1'))
	);

	let savedHint = $state(false);

	// Debounced auto-save
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// react to edit fields
		void editName;
		void editMeaning;
		void editColor;

		if (!dirty || !symbol) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			void save();
		}, 500);
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	let dreamsWithSymbol = $derived(symbol ? getDreamsWithSymbol(dreams, symbol.name) : []);
	let moodDist = $derived(symbol ? getMoodDistribution(dreams, symbol.name) : []);
	let cooccurring = $derived(symbol ? getCooccurringSymbols(dreams, symbol.name) : []);
	let totalForBars = $derived(moodDist.reduce((sum, m) => sum + m.count, 0) || 1);

	// Merge target candidates
	let mergeOpen = $state(false);
	let mergeTargetId = $state('');
	let mergeCandidates = $derived(
		symbol
			? symbols
					.filter((s) => s.id !== symbol.id && s.count > 0)
					.sort((a, b) => a.name.localeCompare(b.name, 'de'))
			: []
	);

	const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

	async function save() {
		if (!symbol || !dirty) return;
		await dreamsStore.updateSymbol(symbol.id, {
			name: editName.trim() || symbol.name,
			meaning: editMeaning.trim() || null,
			color: editColor,
		});
		savedHint = true;
		setTimeout(() => (savedHint = false), 1500);
	}

	async function handleDelete() {
		if (!symbol) return;
		const ok = confirm(
			$_('dreams.symbol_detail.confirm_delete', { values: { name: symbol.name } })
		);
		if (!ok) return;
		await dreamsStore.deleteSymbol(symbol.id);
		onBack();
	}

	async function handleMerge() {
		if (!symbol || !mergeTargetId) return;
		const target = symbols.find((s) => s.id === mergeTargetId);
		if (!target) return;
		const ok = confirm(
			$_('dreams.symbol_detail.confirm_merge', {
				values: { source: symbol.name, target: target.name },
			})
		);
		if (!ok) return;
		await dreamsStore.mergeSymbols(symbol.id, mergeTargetId);
		mergeOpen = false;
		mergeTargetId = '';
		onBack();
	}

	function navigateToCooccurring(name: string) {
		const target = symbols.find((s) => s.name === name);
		if (target && onSelectSymbol) onSelectSymbol(target.id);
	}

	function moodColor(mood: string): string {
		if (mood in MOOD_COLORS) return MOOD_COLORS[mood as DreamMood];
		return '#9ca3af';
	}

	function moodLabel(mood: string): string {
		const valid: DreamMood[] = ['angenehm', 'neutral', 'unangenehm', 'albtraum'];
		if (valid.includes(mood as DreamMood)) return $_('dreams.moods.' + mood);
		return $_('dreams.symbol_detail.mood_unknown');
	}
</script>

<div class="detail-view">
	<div class="header">
		<button class="back-btn" onclick={onBack}>{$_('dreams.symbol_detail.back')}</button>
		<div class="header-actions">
			{#if savedHint}
				<span class="saved-hint">{$_('dreams.symbol_detail.saved')}</span>
			{/if}
			{#if symbol && mergeCandidates.length > 0}
				<button class="meta-btn" onclick={() => (mergeOpen = !mergeOpen)}
					>{$_('dreams.symbol_detail.action_merge')}</button
				>
			{/if}
			{#if symbol}
				<button class="del-btn" onclick={handleDelete}
					>{$_('dreams.symbol_detail.action_delete')}</button
				>
			{/if}
		</div>
	</div>

	{#if mergeOpen && symbol}
		<div class="merge-panel">
			<span class="merge-label"
				>{$_('dreams.symbol_detail.merge_label', { values: { name: symbol.name } })}</span
			>
			<select class="merge-select" bind:value={mergeTargetId}>
				<option value="">{$_('dreams.symbol_detail.merge_select_default')}</option>
				{#each mergeCandidates as c}
					<option value={c.id}>{c.name} ({c.count})</option>
				{/each}
			</select>
			<button class="merge-confirm" disabled={!mergeTargetId} onclick={handleMerge}
				>{$_('dreams.symbol_detail.merge_confirm')}</button
			>
			<button class="merge-cancel" onclick={() => ((mergeOpen = false), (mergeTargetId = ''))}
				>{$_('dreams.symbol_detail.merge_cancel')}</button
			>
		</div>
	{/if}

	{#if !symbol}
		<p class="empty">{$_('dreams.symbol_detail.empty_not_found')}</p>
	{:else}
		<!-- Editable header -->
		<div class="sym-header">
			<input
				class="name-input"
				type="text"
				bind:value={editName}
				placeholder={$_('dreams.symbol_detail.name_placeholder')}
				style="color: {editColor}"
			/>
			<span class="count-badge"
				>{symbol.count}
				{symbol.count === 1
					? $_('dreams.symbol_detail.count_singular')
					: $_('dreams.symbol_detail.count_plural')}</span
			>
		</div>

		<!-- Color picker -->
		<div class="palette">
			{#each PALETTE as color}
				<button
					class="palette-swatch"
					class:active={editColor === color}
					style="background: {color}"
					onclick={() => (editColor = color)}
					aria-label={$_('dreams.symbol_detail.color_aria', { values: { color } })}
				></button>
			{/each}
		</div>

		<!-- Meaning -->
		<div class="section">
			<span class="section-label">{$_('dreams.symbol_detail.label_meaning')}</span>
			<textarea
				class="meaning-input"
				bind:value={editMeaning}
				placeholder={$_('dreams.symbol_detail.meaning_placeholder')}
				rows="3"
			></textarea>
		</div>

		<!-- Mood distribution -->
		{#if moodDist.length > 0}
			<div class="section">
				<span class="section-label">{$_('dreams.symbol_detail.label_mood_dist')}</span>
				<div class="bars">
					{#each moodDist as m}
						<div class="bar-row">
							<span class="bar-label" style="color: {moodColor(m.mood)}">{moodLabel(m.mood)}</span>
							<div class="bar-track">
								<div
									class="bar-fill"
									style="width: {(m.count / totalForBars) * 100}%; background: {moodColor(m.mood)}"
								></div>
							</div>
							<span class="bar-count">{m.count}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Co-occurring -->
		{#if cooccurring.length > 0}
			<div class="section">
				<span class="section-label">{$_('dreams.symbol_detail.label_cooccurring')}</span>
				<div class="cooc-row">
					{#each cooccurring as c}
						<button
							class="cooc-chip"
							onclick={() => navigateToCooccurring(c.name)}
							title={$_('dreams.symbol_detail.cooccurring_title', { values: { name: c.name } })}
						>
							{c.name} <span class="cooc-count">{c.count}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Dream list -->
		{#if dreamsWithSymbol.length > 0}
			<div class="section">
				<span class="section-label">{$_('dreams.symbol_detail.label_dream_list')}</span>
				<div class="dream-refs">
					{#each dreamsWithSymbol as d (d.id)}
						<button class="dream-ref" onclick={() => onOpenDream?.(d)} disabled={!onOpenDream}>
							{#if d.mood}
								<span class="ref-dot" style="background: {MOOD_COLORS[d.mood]}"></span>
							{:else}
								<span class="ref-dot empty"></span>
							{/if}
							<div class="ref-content">
								<span class="ref-title">{d.title || $_('dreams.list_view.untitled')}</span>
								<span class="ref-date">{formatDreamDate(d.dreamDate)}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.back-btn {
		background: transparent;
		border: none;
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.back-btn:hover {
		text-decoration: underline;
	}

	.saved-hint {
		font-size: 0.625rem;
		color: hsl(var(--color-success));
		font-weight: 500;
		animation: fade-in 0.2s ease-out;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.meta-btn {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}
	.meta-btn:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.del-btn {
		background: transparent;
		border: 1px solid hsl(var(--color-error) / 0.3);
		color: hsl(var(--color-error));
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}
	.del-btn:hover {
		background: hsl(var(--color-error) / 0.08);
	}

	/* Merge panel */
	.merge-panel {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.05);
		border: 1px solid hsl(var(--color-primary) / 0.3);
	}
	.merge-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.merge-select {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.1875rem 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.merge-confirm {
		padding: 0.1875rem 0.625rem;
		border-radius: 0.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.merge-confirm:disabled {
		background: hsl(var(--color-primary) / 0.3);
		cursor: not-allowed;
	}
	.merge-cancel {
		padding: 0.1875rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.merge-cancel:hover {
		color: hsl(var(--color-foreground));
	}

	.sym-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.name-input {
		flex: 1;
		background: transparent;
		border: none;
		font-size: 1.125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}

	.count-badge {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-surface-hover));
	}
	.palette {
		display: flex;
		gap: 0.375rem;
	}

	.palette-swatch {
		width: 20px;
		height: 20px;
		border-radius: 9999px;
		border: 2px solid transparent;
		cursor: pointer;
		padding: 0;
	}
	.palette-swatch.active {
		border-color: hsl(var(--color-foreground));
		transform: scale(1.1);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.section-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.meaning-input {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}
	.meaning-input:focus {
		border-color: hsl(var(--color-primary));
	}
	/* Bars */
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.bar-row {
		display: grid;
		grid-template-columns: 80px 1fr 24px;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
	}
	.bar-label {
		font-weight: 500;
	}
	.bar-track {
		background: hsl(var(--color-surface-hover));
		border-radius: 9999px;
		height: 6px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.3s;
	}
	.bar-count {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-align: right;
	}

	/* Co-occurring */
	.cooc-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.cooc-chip {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
		border: 1px solid transparent;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s;
	}
	.cooc-chip:hover {
		background: hsl(var(--color-primary) / 0.18);
		border-color: hsl(var(--color-primary));
	}
	.cooc-count {
		font-size: 0.5625rem;
		opacity: 0.7;
		margin-left: 0.125rem;
	}

	/* Dream refs */
	.dream-refs {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.dream-ref {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.375rem;
		border-radius: 0.25rem;
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}
	.dream-ref:disabled {
		cursor: default;
	}
	.dream-ref:not(:disabled):hover {
		background: hsl(var(--color-surface-hover));
	}
	.ref-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.ref-dot.empty {
		background: hsl(var(--color-border));
	}
	.ref-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.ref-title {
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ref-date {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
		margin-left: 0.5rem;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
